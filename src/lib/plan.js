import { EX } from '../data/exercises.js'

const LEVEL_F = { beginner: 0.75, inter: 1, advanced: 1.3 }

// Swap a move the person should not do for its easier alternative.
// `quiet` (no jumping, for flats and late nights) is a per-session choice.
export function substitute(id, profile, quiet = false) {
  const limits = profile.limits || []
  for (let n = 0; n < 4 && id; n++) {
    const e = EX[id]
    if (!e) return null
    const bad =
      e.avoid.some((a) => limits.includes(a)) ||
      (e.floor && limits.includes('floor')) ||
      (e.impact === 'high' && (quiet || limits.includes('knee') || limits.includes('impact')))
    if (!bad) return id
    id = e.alt
  }
  return null
}

function amount(e, factor) {
  const v = e.base * Math.min(2.4, Math.max(0.5, factor))
  if (e.type === 'time') return Math.max(10, Math.round(v / 5) * 5)
  return Math.max(e.base <= 4 ? 2 : 4, Math.round(v))
}

export function stepSeconds(s) {
  return s.type === 'time' ? s.amount : s.amount * EX[s.ex].spr
}

// Build a playable session from a journey/quick/peak template for this person.
// opts.short drops a round (or trims a single-round session); opts.quiet removes jumping.
export function buildSession(tpl, index, profile, opts = {}) {
  const perWeek = daysPerWeek(tpl, profile)
  const week = Math.floor(index / perWeek)
  const s = tpl.sessions ? tpl.sessions[index % tpl.sessions.length] : tpl
  const short = !!opts.short && !tpl.fixed
  const factor = tpl.fixed ? 1 : (LEVEL_F[profile.level] || 1) * (1 + (tpl.ramp ?? 0.05) * week) * (profile.difficulty || 1)
  const steps = []
  const add = (item, section, f, rest, round, rounds) => {
    const [id, fixedAmount] = Array.isArray(item) ? item : [item]
    const sid = substitute(id, profile, opts.quiet)
    if (!sid) return
    const prev = steps[steps.length - 1]
    if (prev && prev.ex === sid && prev.section === section && prev.round === round) return
    const e = EX[sid]
    const amt = fixedAmount && sid === id ? fixedAmount : fixedAmount ? amount(e, fixedAmount / EX[id].base) : amount(e, f)
    steps.push({ ex: sid, type: e.type, amount: amt, section, rest, round, rounds, swapped: sid !== id ? id : null })
  }
  const baseRounds = tpl.rounds || 1
  const rounds = short && baseRounds > 1 ? baseRounds - 1 : baseRounds
  const mainF = short && baseRounds === 1 ? factor * 0.7 : factor
  const warm = short ? (tpl.warm || []).slice(0, 2) : tpl.warm || []
  const cool = short ? (tpl.cool || []).slice(-1) : tpl.cool || []
  for (const id of warm) add(id, 'warm', 1, 5)
  for (let r = 1; r <= rounds; r++) for (const id of s.items) add(id, 'main', mainF, tpl.rest ?? 20, r, rounds)
  for (const id of cool) add(id, 'cool', 1, 5)
  if (steps.length) steps[steps.length - 1].rest = 0

  const kg = profile.kg || 65
  let seconds = 5
  let kcal = 0
  for (const st of steps) {
    const sec = stepSeconds(st)
    seconds += sec + st.rest
    kcal += (sec / 60) * EX[st.ex].met * 3.5 * kg / 200
  }
  return {
    title: s.name, forTime: !!tpl.fixed, week: week + 1, day: (index % perWeek) + 1, steps, seconds,
    hasJumps: s.items.some((it) => EX[Array.isArray(it) ? it[0] : it]?.impact === 'high'),
    minutes: Math.max(1, Math.round(seconds / 60)), kcal: Math.round(kcal), kcalPerSec: kcal / Math.max(1, seconds),
  }
}

// The coach plans each week around the number of days the person chose.
export function daysPerWeek(tpl, profile) {
  if (!tpl.sessions) return 1
  return Math.min(6, Math.max(2, profile?.days || tpl.perWeek || 3))
}
export const totalSessions = (j, profile) => j.weeks * daysPerWeek(j, profile)
