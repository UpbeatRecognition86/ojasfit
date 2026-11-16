import { EX, TREES, START_TIERS } from '../data/exercises.js'
import { JMAP, PMAP, PEAKS, DRILLS, SPLITS, splitRounds, phaseOf } from '../data/journeys.js'

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

const LEVEL_N = { beginner: 1, inter: 2, advanced: 3 }
// How much of a Peak the Coach assigns in each training phase.
const PHASE_SPLIT = { calibrate: 'base', base: 'ridge', intensity: 'summit', deload: 'base', peak: 'summit' }

// The Peak a journey's "peak day" uses: right type, at or below the athlete's level, rotating by week.
function pickPeak(type, profile, week) {
  const lvl = LEVEL_N[profile.level] || 1
  let pool = PEAKS.filter((p) => p.type === type && p.lvl <= lvl)
  if (!pool.length) pool = PEAKS.filter((p) => p.type === 'full' && p.lvl <= lvl)
  const top = pool.filter((p) => p.lvl === Math.max(...pool.map((x) => x.lvl)))
  const pick = week % 3 === 2 && pool.length > top.length ? pool.filter((p) => !top.includes(p)) : top
  return pick[week % pick.length]
}

// Build a playable session. `tpl` is a journey or a Peak. opts.split picks the split of a standalone Peak.
export function buildSession(tpl, index, profile, adapt = {}, opts = {}) {
  const ctx = contextFor(profile, adapt, tpl)
  const tiers = tiersOf(profile)
  const isJourney = !!tpl.pool
  const dpw = daysPerWeek(tpl, profile)
  const week = Math.floor(index / dpw)
  const day = index % dpw
  const total = isJourney ? totalSessions(tpl, profile) : 1
  const phase = isJourney ? phaseOf(week, tpl.weeks) : null
  const restBetween = profile.rest || 45
  const lvlN = LEVEL_N[profile.level] || 1

  // What is today's main workout?
  const isBench = isJourney && (index === 0 || index === total - 1)
  const entry = isJourney && !isBench ? tpl.pool[(index - 1) % tpl.pool.length] : null
  let peak = null
  let split = 'summit'
  if (!isJourney) { peak = tpl; split = SPLITS.includes(opts.split) ? opts.split : 'summit' }
  else if (isBench) peak = PMAP[tpl.benchmark]
  else if (entry.peak) { peak = pickPeak(entry.peak, profile, week); split = PHASE_SPLIT[phase.key] }
  let src = peak || entry
  if (ctx.time && entry?.peak) { src = { name: peak.name, format: 'intervals', rounds: 3, items: peak.items.map((it) => it[0]) }; peak = null }
  // Full session = the athlete's chosen length. "Adapt session" time overrides it for the day.
  const target = ctx.time || (isJourney ? profile.length || 45 : 0)
  const full = isJourney && !ctx.time
  const express = ctx.time === 15 && !peak
  let format = peak ? 'fortime' : express ? 'amrap' : src.format
  const factor = (LEVEL_N[profile.level] ? { 1: 0.7, 2: 1, 3: 1.25 }[lvlN] : 1) * (phase ? phase.mult : 1) * (profile.volume || 1)

  const steps = []
  const trees = new Set()
  const push = (item, section, extra = {}) => {
    const [raw, fixedAmt] = Array.isArray(item) ? item : [item]
    const { id: wanted, tree } = slot(raw, tiers)
    const id = resolve(wanted, ctx)
    if (!id) return null
    const e = EX[id]
    const prev = steps[steps.length - 1]
    if (prev && prev.ex === id && prev.section === section && prev.round === extra.round && prev.block === extra.block && !extra.keep) return null
    if (tree && id === wanted) trees.add(tree)
    let amt = extra.amount
    if (amt == null) amt = fixedAmt ? (id === wanted ? fixedAmt : amount(e, fixedAmt / EX[wanted].base)) : amount(e, section === 'core' ? factor : 1)
    else if (id !== wanted) amt = amount(e, (extra.amount / EX[wanted].base))
    const st = { ex: id, type: e.type, section, rest: 0, swapped: id !== wanted ? wanted : null, ...extra, amount: amt }
    delete st.keep
    steps.push(st)
    return st
  }
  const secOf = (list, f) => list.reduce((a, it) => {
    const id = resolve(slot(Array.isArray(it) ? it[0] : it, tiers).id, ctx)
    if (!id) return a
    const amt = amount(EX[id], f)
    return a + (EX[id].type === 'reps' ? amt * EX[id].spr : amt)
  }, 0)
  const fitRounds = (list, seconds, lo, hi) => clamp(Math.round(seconds / Math.max(30, secOf(list, factor) + restBetween)), lo, hi)
  const used = () => steps.reduce((a, st) => a + (st.type === 'emom' ? 60 : stepSeconds(st)) + st.rest, 0)

  // 1. Warm-up
  const warm = ctx.time ? tpl.warm.slice(0, 2) : full && target >= 45 ? [...tpl.warm, 'knee_drive', 'side_bend'] : tpl.warm
  for (const id of warm) { const st = push(id, 'warm'); if (st) st.rest = 5 }

  // 2. Skill practice (once a week: try the next rung of a ladder) or a Tatva drill.
  let skill = null
  let drill = null
  if (full && !isBench) {
    const tree = ['push', 'legs', 'core'][week % 3]
    const nextId = TREES[tree].steps[tiers[tree] + 1]
    if (day === 0 && week >= 1 && phase.key !== 'deload' && nextId && resolve(nextId, ctx) === nextId) {
      const e = EX[nextId]
      const amt = e.type === 'time' ? Math.max(10, Math.round((e.base * 0.5) / 5) * 5) : Math.max(3, Math.round(e.base * 0.35))
      const sets = target >= 45 ? 4 : 3
      for (let set = 1; set <= sets; set++) push(nextId, 'skill', { amount: amt, round: set, rounds: sets, rest: set < sets ? 45 : 20, keep: true })
      skill = { tree, ex: nextId }
    }
    if (!skill || target >= 45) {
      const id = tpl.drills[index % tpl.drills.length]
      // Level follows the athlete, rises in the second half of the journey, and steps down for short sessions.
      const lv = clamp(lvlN + (week >= tpl.weeks / 2 ? 1 : 0) - (phase.key === 'deload' ? 1 : 0) - (skill ? 1 : 0), 1, target <= 30 ? 1 : 3)
      const def = DRILLS[id].levels[lv - 1]
      const before = steps.length
      if (def.ladder) {
        for (let n = 1; n <= def.top; n++) {
          def.ladder.forEach((mv, k) => push(mv, 'drill', { amount: n * def.mult[k], round: n, rounds: def.top, keep: true }))
          steps[steps.length - 1].rest = n < def.top ? def.rest : 30
        }
      } else {
        for (let r = 1; r <= def.x; r++) for (const [mv, amt, rest] of def.steps) { const st = push(mv, 'drill', { amount: amt, round: r, rounds: def.x, keep: true }); if (st) st.rest = rest }
        if (steps.length > before) steps[steps.length - 1].rest = 30
      }
      if (steps.length > before) drill = { id, level: lv }
    }
  }

  // 3. Main workout. If exclusions leave too few moves, top up with ones that load nothing sore.
  const raw = peak ? peak.items : src.items
  const kept = new Set(raw.map((it) => resolve(slot(Array.isArray(it) ? it[0] : it, tiers).id, ctx)).filter(Boolean))
  const items = [...raw]
  for (const f of ['knee_drive', 'glute_bridge', 'calf_raise', 'march']) {
    if (kept.size >= 3) break
    if (!kept.has(f)) { items.push(f); kept.add(f) }
  }
  const block = (list, n, blockNo, rest, timed) => {
    for (let r = 1; r <= n; r++) {
      let last = null
      for (const it of list) last = push(it, 'core', { round: r, rounds: n, block: blockNo, timed }) || last
      if (last && rest && r < n) last.rest = rest
    }
  }
  const coolList = ctx.time ? tpl.cool.slice(-2) : full && target >= 45 ? ['overhead_stretch', 'downdog', ...tpl.cool] : tpl.cool
  const coolEst = coolList.length * 38
  const room = () => target * 60 - used() - coolEst - 45 // seconds still free before the cool-down
  // A Peak is fixed, so on a day it would overrun, the Coach assigns a smaller split instead.
  if (peak && isJourney && !isBench) {
    const peakSec = (sp) => splitRounds(peak, sp) * peak.items.reduce((a, [id, n]) => a + n * EX[id].spr, 0)
    while (split !== 'base' && peakSec(split) > room() - (target >= 45 ? 300 : 0)) split = SPLITS[SPLITS.indexOf(split) - 1]
  }
  let rounds = peak ? splitRounds(peak, split) : src.rounds || 1
  let cap = 0
  const mainBudget = Math.min(target * 60 * (target >= 45 ? 0.36 : 0.45), room() - (full && target >= 45 ? 300 : 0))
  if (format === 'amrap') {
    cap = (express ? 11 : ctx.time === 20 ? Math.min(src.cap || 12, 10) : Math.round(clamp(mainBudget / 60, 8, 22))) * 60
    for (const it of items) push(it, 'core', { loop: true, round: 1, block: 1 })
  } else if (format === 'emom') {
    const minutes = ctx.time === 20 ? Math.min(src.cap, 10) : Math.round(clamp(mainBudget / 60, 8, 20) / 2) * 2
    cap = minutes * 60
    const moves = [...new Set(items.map((it) => resolve(slot(it, tiers).id, ctx)).filter(Boolean))].slice(0, 2)
    for (let m = 0; m < minutes && moves.length; m++) {
      const e = EX[moves[m % moves.length]]
      // Aim for about 35 seconds of work inside each minute.
      const reps = e.type === 'time' ? null : clamp(Math.round(amount(e, factor) * 0.8), 3, Math.floor(40 / e.spr))
      steps.push({ ex: e.id, type: 'emom', amount: 60, reps, hold: e.type === 'time' ? clamp(amount(e, factor), 15, 40) : null, section: 'core', block: 1, rest: 0, round: m + 1, rounds: minutes, swapped: null })
    }
  } else if (format === 'fortime') {
    block(items, rounds, 1, 0, true)
  } else {
    if (full) rounds = fitRounds(items, mainBudget, 2, 6)
    else if (ctx.time === 20) rounds = fitRounds(items, room(), 2, 4)
    block(items, rounds, 1, restBetween, false)
  }

  // 4. Accessory blocks: fill the rest of the session, preferring moves not used yet.
  let accessory = 0
  if (full && !isBench) {
    const cands = tpl.pool.filter((x) => x.items && x !== src)
    for (let b = 2; b <= 5; b++) {
      const left = room() - (format === 'amrap' ? cap : 0)
      const done = new Set(steps.filter((x) => x.section === 'core').map((x) => x.ex))
      const pick = cands[(index + b - 1) % cands.length]
      const fresh = pick.items.filter((it) => { const id = resolve(slot(it, tiers).id, ctx); return id && !done.has(id) })
      let accItems = (fresh.length >= 2 ? fresh : pick.items.filter((it) => resolve(slot(it, tiers).id, ctx))).slice(0, 4)
      const fit = (list) => (list.length >= 2 ? clamp(Math.floor(left / Math.max(30, secOf(list, factor) + restBetween)), 0, 4) : 0)
      let n = fit(accItems)
      // Not enough time for two rounds of four moves: use a two-move superset instead.
      if (n < 2 && accItems.length > 2) { accItems = accItems.slice(0, 2); n = fit(accItems) }
      if (n < 2) break
      const last = steps[steps.length - 1]
      if (last && last.section === 'core') last.rest = 60
      block(accItems, n, b, restBetween, false)
      accessory = b - 1
    }
  }
  const coreSteps = steps.filter((x) => x.section === 'core')
  if (coreSteps.length) { const last = coreSteps[coreSteps.length - 1]; if (!last.loop) last.rest = 15 }

  // 5. Cool-down
  for (const id of coolList) { const st = push(id, 'cool'); if (st) st.rest = 5 }
  for (const id of ['overhead_stretch', 'side_bend', 'breathing']) {
    const have = steps.filter((x) => x.section === 'cool')
    if (have.length >= (ctx.time ? 2 : 3)) break
    if (!have.some((x) => x.ex === id)) { const st = push(id, 'cool'); if (st) st.rest = 5 }
  }
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
    const loop = steps.filter((x) => x.loop)
    seconds += cap
    kcal += kc(cap * 0.85, loop.reduce((a, x) => a + EX[x.ex].met, 0) / Math.max(1, loop.length))
  }
  return {
    title: peak ? peak.name : src.name, format, cap, rounds, steps, skill, drill, accessory, target, phase: phase?.key || null,
    benchmark: isBench ? peak.id : null, peakId: peak ? peak.id : null, split: peak ? split : null,
    forTime: format === 'fortime', week: week + 1, day: day + 1, trees: [...trees], seconds,
    canShorten: isJourney, hasJumps: steps.some((x) => EX[x.ex].jump || (x.swapped && EX[x.swapped].jump)),
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
