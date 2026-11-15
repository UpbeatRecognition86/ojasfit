import { stats, dayStr, addDays, weekStart } from './store.jsx'

// What the Coach says on Home. Rule-based: it reads the person's recent history
// and explains what it is doing, so the adaptation is visible rather than hidden.
export function coachMessage(p, ctx) {
  const st = stats(p)
  const today = dayStr()
  const last = p.history[p.history.length - 1]
  const name = p.name.split(' ')[0]
  if (!last) return { key: 'c_welcome', vars: { name } }
  if (ctx.finished) return { key: 'c_journeyDone', vars: { name } }
  if (ctx.weekDone) return { key: 'c_weekDone', vars: { n: ctx.dpw } }
  const doneToday = st.days.has(today)
  if (doneToday && last.pb) return { key: 'c_pb', vars: { name } }
  if (last.rpe && last.rpe <= 2) return { key: 'c_easy', vars: {} }
  if (last.rpe && last.rpe >= 4) return { key: 'c_hard', vars: {} }
  if (doneToday) return { key: st.streak >= 3 ? 'c_streak' : 'c_doneToday', vars: { n: st.streak } }
  let gap = 0
  let d = addDays(today, -1)
  while (!st.days.has(d) && gap < 30) { gap++; d = addDays(d, -1) }
  if (gap >= 5) return { key: 'c_longGap', vars: { name } }
  if (gap >= 2) return { key: 'c_gap', vars: { n: gap } }
  if (st.streak >= 3) return { key: 'c_keepStreak', vars: { n: st.streak } }
  if (ctx.left === 1) return { key: 'c_lastOfWeek', vars: {} }
  return { key: 'c_ready', vars: { n: ctx.left } }
}

// Minutes trained in each of the last `n` calendar weeks (oldest first).
export function weeklyMinutes(p, n = 8) {
  const ws = weekStart()
  return Array.from({ length: n }, (_, i) => {
    const start = addDays(ws, -7 * (n - 1 - i))
    const end = addDays(start, 7)
    const items = p.history.filter((h) => h.date >= start && h.date < end)
    return { start, minutes: items.reduce((a, h) => a + h.minutes, 0), sessions: items.length }
  })
}
