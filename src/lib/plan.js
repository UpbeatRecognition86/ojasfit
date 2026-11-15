import { EX, TREES, START_TIERS } from '../data/exercises.js'
import { JMAP, PMAP, phaseOf } from '../data/journeys.js'

const LEVEL_F = { beginner: 0.7, inter: 1, advanced: 1.25 }
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const tiersOf = (p) => ({ ...START_TIERS[p.level || 'beginner'], ...(p.tiers || {}) })
export const daysPerWeek = (tpl, profile) => clamp(profile?.days || 3, 2, 6)
export const totalSessions = (j, profile) => j.weeks * daysPerWeek(j, profile)

// Today's adaptations plus the athlete's standing settings.
export function contextFor(profile, adapt = {}, tpl = {}) {
  return {
    quiet: !!(adapt.quiet || profile.quiet || tpl.quiet),
    tight: !!adapt.tight,
    time: adapt.time || 0, // 0 = full session, 20 or 15 = minutes
    avoid: [...new Set([...(profile.limits || []), ...(adapt.sore || [])])],
  }
}

// '@push-1' -> the exercise one rung below the athlete's current push rung.
function slot(item, tiers) {
  const m = /^@(\w+)([+-]\d+)?$/.exec(item)
  if (!m) return { id: item, tree: null }
  const steps = TREES[m[1]].steps
  return { id: steps[clamp(tiers[m[1]] + Number(m[2] || 0), 0, steps.length - 1)], tree: m[1] }
}

// Follow quiet / small-space / sore substitutions until a move fits, or drop it.
export function resolve(id, ctx) {
  for (let n = 0; n < 6 && id; n++) {
    const e = EX[id]
    if (!e) return null
    if (ctx.quiet && e.jump) id = e.quiet || e.sub
    else if (ctx.tight && e.wide) id = e.tight || e.sub
    else if (e.stress.some((s) => ctx.avoid.includes(s))) id = e.sub
    else return id
  }
  return null
}

function amount(e, factor) {
  const v = e.base * clamp(factor, 0.4, 2.4)
  if (e.type === 'time') return Math.max(15, Math.round(v / 5) * 5)
  return Math.max(3, Math.round(v))
}
export const stepSeconds = (s) => (s.type === 'reps' ? s.amount * EX[s.ex].spr : s.amount)

// Build a playable session. `tpl` is a journey or a Peak.
export function buildSession(tpl, index, profile, adapt = {}) {
  const ctx = contextFor(profile, adapt, tpl)
  const tiers = tiersOf(profile)
  const isJourney = !!tpl.pool
  const dpw = daysPerWeek(tpl, profile)
  const week = Math.floor(index / dpw)
  const day = index % dpw
  const total = isJourney ? totalSessions(tpl, profile) : 1
  const phase = isJourney ? phaseOf(week, tpl.weeks) : null
  // First and last session of a journey are the benchmark Peak: a before/after test.
  const benchmark = isJourney && (index === 0 || index === total - 1) ? PMAP[tpl.benchmark] : null
  const src = benchmark || (isJourney ? tpl.pool[(index - 1 + tpl.pool.length) % tpl.pool.length] : tpl)
  const fixed = !!src.fixed
  let format = src.format
  const express = ctx.time === 15 && !fixed
  if (express) format = 'amrap'
  const restBetween = profile.rest || 45
  const factor = fixed ? 1 : (LEVEL_F[profile.level] || 1) * (phase ? phase.mult : 1) * (profile.volume || 1)

  const steps = []
  const trees = new Set()
  const push = (item, section, extra = {}) => {
    const [raw, fixedAmt] = Array.isArray(item) ? item : [item]
    const { id: wanted, tree } = slot(raw, tiers)
    const id = resolve(wanted, ctx)
    if (!id) return null
    const e = EX[id]
    const prev = steps[steps.length - 1]
    if (prev && prev.ex === id && prev.section === section && prev.round === extra.round) return null
    if (tree && id === wanted) trees.add(tree)
    const amt = extra.amount ?? (fixedAmt ? (id === wanted ? fixedAmt : amount(e, fixedAmt / EX[wanted].base)) : amount(e, section === 'core' ? factor : 1))
    const st = { ex: id, type: e.type, amount: amt, section, rest: 0, swapped: id !== wanted ? wanted : null, ...extra }
    steps.push(st)
    return st
  }

  // 1. Warm-up
  const warm = ctx.time ? tpl.warm.slice(0, 2) : tpl.warm
  for (const id of warm) { const st = push(id, 'warm'); if (st) st.rest = 5 }

  // 2. Skill practice: once a week, try the next rung of one ladder with low reps and long rests.
  let skill = null
  if (isJourney && !benchmark && !ctx.time && day === 0 && week >= 1 && phase.key !== 'deload') {
    const tree = ['push', 'legs', 'core'][week % 3]
    const nextId = TREES[tree].steps[tiers[tree] + 1]
    const id = nextId && resolve(nextId, ctx)
    if (id === nextId) {
      const e = EX[id]
      const amt = e.type === 'time' ? Math.max(10, Math.round((e.base * 0.5) / 5) * 5) : Math.max(3, Math.round(e.base * 0.35))
      for (let set = 1; set <= 3; set++) push(id, 'skill', { amount: amt, round: set, rounds: 3, rest: set < 3 ? 40 : 15 })
      skill = { tree, ex: id }
    }
  }

  // 3. Core workout. If exclusions leave too few moves, top up with ones that load nothing sore.
  const kept = new Set(src.items.map((it) => resolve(slot(Array.isArray(it) ? it[0] : it, tiers).id, ctx)).filter(Boolean))
  const items = [...src.items]
  for (const f of ['knee_drive', 'glute_bridge', 'calf_raise', 'march']) {
    if (kept.size >= 3) break
    if (!kept.has(f)) { items.push(f); kept.add(f) }
  }
  let rounds = src.rounds || 1
  if (ctx.time === 20 && !fixed && format === 'intervals') rounds = Math.max(2, rounds - 1)
  let cap = 0
  if (format === 'amrap') {
    cap = (express ? 11 : ctx.time === 20 ? Math.min(src.cap || 12, 10) : src.cap || 12) * 60
    for (const it of items) push(it, 'core', { loop: true, round: 1 })
  } else if (format === 'emom') {
    const minutes = ctx.time === 20 ? Math.min(src.cap, 10) : src.cap
    cap = minutes * 60
    const moves = [...new Set(items.map((it) => resolve(slot(it, tiers).id, ctx)).filter(Boolean))].slice(0, 2)
    for (let m = 0; m < minutes && moves.length; m++) {
      const e = EX[moves[m % moves.length]]
      // Aim for about 35 seconds of work inside each minute.
      const reps = e.type === 'time' ? null : clamp(Math.round(amount(e, factor) * 0.8), 3, Math.floor(40 / e.spr))
      steps.push({ ex: e.id, type: 'emom', amount: 60, reps, hold: e.type === 'time' ? clamp(amount(e, factor), 15, 40) : null, section: 'core', rest: 0, round: m + 1, rounds: minutes, swapped: null })
    }
  } else {
    for (let r = 1; r <= rounds; r++) {
      let last = null
      for (const it of items) last = push(it, 'core', { round: r, rounds }) || last
      if (last && format === 'intervals' && r < rounds) last.rest = restBetween
    }
  }
  const coreSteps = steps.filter((s) => s.section === 'core')
  if (coreSteps.length) coreSteps[coreSteps.length - 1].rest = format === 'amrap' ? 0 : 10

  // 4. Cool-down
  const cool = ctx.time ? tpl.cool.slice(-2) : tpl.cool
  for (const id of cool) { const st = push(id, 'cool'); if (st) st.rest = 5 }
  if (steps.length) steps[steps.length - 1].rest = 0

  // Estimates
  const kg = profile.kg || 65
  const kc = (sec, met) => (sec / 60) * met * 3.5 * kg / 200
  let seconds = 5
  let kcal = 0
  for (const st of steps) {
    if (st.loop) continue
    const work = st.type === 'emom' ? (st.reps ? st.reps * EX[st.ex].spr : st.hold) : stepSeconds(st)
    seconds += (st.type === 'emom' ? 60 : work) + st.rest
    kcal += kc(work, EX[st.ex].met)
  }
  if (format === 'amrap') {
    const loop = steps.filter((s) => s.loop)
    seconds += cap
    kcal += kc(cap * 0.85, loop.reduce((a, s) => a + EX[s.ex].met, 0) / Math.max(1, loop.length))
  }
  return {
    title: benchmark ? benchmark.name : src.name, format, cap, rounds, steps, skill, phase: phase?.key || null,
    benchmark: benchmark ? benchmark.id : null, peakId: benchmark ? benchmark.id : !isJourney ? tpl.id : null,
    forTime: format === 'fortime', week: week + 1, day: day + 1, trees: [...trees], seconds,
    canShorten: !fixed, hasJumps: steps.some((s) => s.swapped && EX[s.swapped].jump) || steps.some((s) => EX[s.ex].jump),
    minutes: Math.max(1, Math.round(seconds / 60)), kcal: Math.round(kcal), kcalPerSec: kcal / Math.max(1, seconds),
  }
}

const RPE_DELTA = { 1: 1.15, 2: 1.08, 3: 1.02, 4: 0.95, 5: 0.85 }
const TECH_DELTA = { 1: 1, 2: 0.95, 3: 0.8 }

// Post-workout calibration. Mutates the profile and returns what changed, for the recap.
export function applyFeedback(profile, session, rpe, tech) {
  const delta = clamp((RPE_DELTA[rpe] || 1) * (TECH_DELTA[tech] || 1), 0.7, 1.3)
  profile.volume = clamp((profile.volume || 1) * delta, 0.5, 2)
  profile.rest = rpe >= 4 ? 60 : rpe <= 2 ? 30 : 45
  const tiers = tiersOf(profile)
  const streaks = { ...(profile.streaks || {}) }
  const promoted = []
  const regressed = []
  const regress = tech === 3 || rpe === 5
  for (const tree of session.trees || []) {
    const steps = TREES[tree].steps
    if (regress) {
      streaks[tree] = 0
      if (tiers[tree] > 0) { tiers[tree] -= 1; regressed.push({ tree, ex: steps[tiers[tree]] }) }
    } else if (tech === 1 && rpe <= 3) {
      streaks[tree] = (streaks[tree] || 0) + 1
      if (streaks[tree] >= 3 && tiers[tree] < steps.length - 1) { tiers[tree] += 1; streaks[tree] = 0; promoted.push({ tree, ex: steps[tiers[tree]] }) }
    } else streaks[tree] = 0
  }
  profile.tiers = tiers
  profile.streaks = streaks
  const msg = regress ? 'fb_regress' : rpe <= 2 ? 'fb_up' : rpe === 3 && tech === 1 ? 'fb_sweet' : rpe >= 4 || tech >= 2 ? 'fb_down' : 'fb_ok'
  return { delta, msg, promoted, regressed, rest: profile.rest }
}

export { JMAP }
