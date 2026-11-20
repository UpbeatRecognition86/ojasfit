// The training gate: generates every session for every kind of athlete and checks it against
// docs/TRAINING-STANDARDS.md. Exits non-zero on any violation. Usage: node scripts/check-programs.mjs
import { JOURNEYS, PEAKS, SPLITS, DRILLS, splitRounds, phaseOf, recommend, JMAP } from '../src/data/journeys.js'
import { EX, EXERCISES, TREES, LADDER_CLEAN } from '../src/data/exercises.js'
import { buildSession, totalSessions, applyFeedback } from '../src/lib/plan.js'

const fails = new Map()
const fail = (rule, where) => { if (!fails.has(rule)) fails.set(rule, []); fails.get(rule).push(where) }
let n = 0

// Data integrity
for (const e of EXERCISES) for (const k of ['quiet', 'tight', 'sub']) if (e[k] && !EX[e[k]]) fail('exercise reference exists', `${e.id}.${k}`)
for (const t of Object.values(TREES)) {
  for (const id of t.steps) if (!EX[id]) fail('ladder move exists', id)
  if (t.goals.length !== t.steps.length) fail('every rung has a goal', t.name.en)
  t.steps.forEach((id, k) => { if (EX[id] && !(t.goals[k] > EX[id].base)) fail('a rung goal is above its starting amount', id) })
}
for (const p of PEAKS) { for (const [id] of p.items) if (!EX[id]) fail('peak move exists', `${p.id}:${id}`); const r = SPLITS.map((s) => splitRounds(p, s)); if (!(r[0] < r[1] && r[1] < r[2])) fail('splits increase', `${p.id} ${r}`) }
for (const [id, d] of Object.entries(DRILLS)) if (d.levels.length !== 3) fail('drill has 3 levels', id)
for (const j of JOURNEYS) { const ph = Array.from({ length: j.weeks }, (_, w) => phaseOf(w, j.weeks).key); if (ph[0] !== 'calibrate' || ph[j.weeks - 2] !== 'deload' || ph[j.weeks - 1] !== 'peak') fail('phases: calibrate first, deload before peak', j.id) }

const RANGE = { 30: [20, 34], 45: [32, 49], 60: [39, 65] }
const ADAPTS = [{}, { quiet: true }, { tight: true }, { time: 20 }, { time: 15 }, { sore: ['knees'] }, { sore: ['wrists', 'shoulders'] }, { sore: ['back'] }, { quiet: true, tight: true, time: 15, sore: ['knees', 'back', 'shoulders', 'wrists'] }]
const long60 = []
for (const j of JOURNEYS) for (const level of ['beginner', 'inter', 'advanced']) for (const length of [30, 45, 60]) for (const days of [2, 4, 6]) {
  const p = { level, days, limits: [], volume: 1, length }
  const total = totalSessions(j, p)
  for (const adapt of ADAPTS) for (let i = 0; i < total; i++) {
    const s = buildSession(j, i, p, adapt); n++
    const at = `${j.id} ${level} L${length} d${days} ${JSON.stringify(adapt)} #${i}`
    const sec = (name) => s.steps.filter((x) => x.section === name)
    const main = s.steps.filter((x) => x.section === 'core' && (x.block || 1) === 1)
    const bench = i === 0 || i === total - 1
    if (bench !== !!s.benchmark) fail('first and last session are the benchmark', at)
    if (new Set(main.map((x) => x.ex)).size < 3 && s.format !== 'emom') fail('main workout has 3+ moves', at)
    if (sec('warm').length < (adapt.time ? 1 : 3)) fail('warm-up present', at)
    if (sec('cool').length < (adapt.time ? 1 : 3)) fail('cool-down present', at)
    if (adapt.quiet && s.steps.some((x) => EX[x.ex].jump)) fail('quiet mode has no jumps', at)
    if (adapt.tight && s.steps.some((x) => EX[x.ex].wide)) fail('small space has no wide moves', at)
    if (adapt.sore && s.steps.some((x) => EX[x.ex].stress.some((t) => adapt.sore.includes(t)))) fail('sore part is not loaded', at)
    if (s.steps.some((x) => (x.type === 'reps' && x.amount > 60) || (x.type === 'time' && x.amount > 90 && x.ex !== 'breathing'))) fail('no set over 60 reps or 90s', at)
    if (!Number.isFinite(s.kcal) || s.week > j.weeks) fail('estimates are valid', at)
    if (adapt.time === 15 && !bench && (s.minutes < 13 || s.minutes > 17)) fail('15-minute day runs 13–17 min', `${at} = ${s.minutes}`)
    if (adapt.time === 20 && !bench && s.minutes > 26) fail('20-minute day runs at most 26 min', `${at} = ${s.minutes}`)
    if (!Object.keys(adapt).length && !bench) {
      const [lo, hi] = RANGE[length]
      if (s.minutes < lo || s.minutes > hi) fail(`${length}-minute session runs ${lo}–${hi} min`, `${at} = ${s.minutes}`)
      if (!s.drill && !s.skill) fail('full session has a drill or skill practice', at)
      // "When time allows": a session already filled by skill practice, a drill and the main workout needs none.
      if (length >= 45 && !s.accessory && s.minutes < length * 0.8) fail('45+ minute session has an accessory block unless already full', `${at} = ${s.minutes}`)
      if (length === 60 && level !== 'beginner') long60.push(s.minutes)
    }
  }
}
const share = long60.filter((m) => m >= 50).length / long60.length
if (share < 0.5) fail('half of 60-minute sessions run 50+ min', `${Math.round(share * 100)}%`)

// Standalone Peaks: every split, timed block only
for (const pk of PEAKS) for (const sp of SPLITS) {
  const s = buildSession(pk, 0, { level: 'inter', days: 3, limits: [], volume: 1 }, {}, { split: sp }); n++
  const timed = s.steps.filter((x) => x.timed)
  if (!s.forTime || timed.length !== splitRounds(pk, sp) * pk.items.length) fail('peak split has the right rounds', `${pk.id}:${sp}`)
  if (s.steps.some((x) => x.timed && x.section !== 'core')) fail('only the peak is timed', `${pk.id}:${sp}`)
}

// Feedback rules
{ const p = { level: 'inter', volume: 1 }; let prev = 1
  for (const [r, t] of [[1, 1], [1, 1], [5, 3], [5, 3], [5, 3], [5, 3], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]) { applyFeedback(p, { trees: ['push'] }, r, t); const d = p.volume / prev; if (d > 1.3001 || d < 0.6999 || p.volume < 0.5 || p.volume > 2) fail('volume change within limits', `${r}/${t} → ${p.volume.toFixed(2)}`); prev = p.volume }
  // inter starts on push-ups (goal 12): below the goal never counts; at the goal, LADDER_CLEAN clean workouts move up.
  const q = { level: 'inter', volume: 1 }
  const below = [1, 2, 3].map(() => applyFeedback(q, { trees: ['push'] }, 3, 1, [], { pushup: 10 }).promoted.length)
  if (below.join() !== '0,0,0') fail('no promotion below the rung goal', below.join())
  const sloppy = applyFeedback(q, { trees: ['push'] }, 3, 2, [], { pushup: 12 }).promoted.length
  const up = Array.from({ length: LADDER_CLEAN }, () => applyFeedback(q, { trees: ['push'] }, 3, 1, [], { pushup: 12 }).promoted.length)
  if (sloppy || up.join() !== [...Array(LADDER_CLEAN - 1).fill(0), 1].join()) fail('promotion after exactly LADDER_CLEAN clean workouts at the goal', `${sloppy} ${up}`)
  if (!applyFeedback(q, { trees: ['push'] }, 3, 3).regressed.length) fail('broken form moves down a rung', 'no regression')
  const r = { level: 'inter', volume: 1 }
  if (!applyFeedback(r, { trees: [] }, 3, 1, [{ ex: 'pushup', how: 'hard' }]).regressed.length) fail('a move marked too hard moves its ladder down', 'pushup') }
for (const goal of ['lose', 'strong', 'active']) for (const level of ['beginner', 'inter', 'advanced']) if (!JMAP[recommend({ goal, level })]) fail('recommendation exists', `${goal}/${level}`)

if (fails.size) {
  console.error(`Training standards: ${fails.size} rule(s) broken across ${n} sessions\n`)
  for (const [rule, where] of fails) console.error(`✗ ${rule} (${where.length})\n    ${where.slice(0, 3).join('\n    ')}${where.length > 3 ? '\n    …' : ''}`)
  process.exit(1)
}
console.log(`Training standards: all rules hold across ${n} generated sessions.`)
