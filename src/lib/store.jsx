import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { APP, PLANS, FREE_PROFILES } from '../config.js'

const blank = () => ({ v: 1, lang: null, profiles: [], activeId: null, premium: null, settings: { voice: true, sound: true, bigText: false } })

function load() {
  try {
    const raw = localStorage.getItem(APP.storageKey)
    if (raw) return { ...blank(), ...JSON.parse(raw) }
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return blank()
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  useEffect(() => {
    try { localStorage.setItem(APP.storageKey, JSON.stringify(state)) } catch { /* ignore quota errors */ }
  }, [state])
  const update = useCallback((fn) => setState((prev) => { const next = structuredClone(prev); fn(next); return next }), [])
  const replace = useCallback((s) => setState({ ...blank(), ...s }), [])
  return <Ctx.Provider value={{ state, update, replace }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

// ---------- dates ----------
export function dayStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export function addDays(str, n) {
  const [y, m, d] = str.split('-').map(Number)
  return dayStr(new Date(y, m - 1, d + n))
}
export function weekStart(str = dayStr()) {
  const [y, m, d] = str.split('-').map(Number)
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7 // Monday = 0
  return addDays(str, -dow)
}

// ---------- selectors ----------
export const activeProfile = (s) => s.profiles.find((p) => p.id === s.activeId) || s.profiles[0] || null

export function isPlus(s) {
  return !!(s.premium && s.premium.until >= dayStr())
}
export function maxProfiles(s) {
  if (!isPlus(s)) return FREE_PROFILES
  return PLANS.find((p) => p.id === s.premium.plan)?.profiles || 3
}
// Week 1 of every Plus journey is free to try.
export function canPlay(s, journey, index) {
  const days = Math.min(6, Math.max(2, activeProfile(s)?.days || journey.perWeek || 3))
  return !journey.premium || isPlus(s) || index < days
}

export function stats(p) {
  const days = new Set(p.history.map((h) => h.date))
  const today = dayStr()
  let streak = 0
  let d = days.has(today) ? today : addDays(today, -1)
  while (days.has(d)) { streak++; d = addDays(d, -1) }
  let best = 0, run = 0, prev = null
  for (const day of [...days].sort()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  const ws = weekStart()
  const weekDays = new Set(p.history.filter((h) => h.date >= ws).map((h) => h.date))
  return {
    workouts: p.history.length,
    minutes: p.history.reduce((a, h) => a + h.minutes, 0),
    kcal: p.history.reduce((a, h) => a + h.kcal, 0),
    streak, best, weekCount: weekDays.size, days,
  }
}

export const RANKS = [
  { at: 0, en: 'Naya Khiladi', hi: 'नया खिलाड़ी' },
  { at: 300, en: 'Josheela', hi: 'जोशीला' },
  { at: 1000, en: 'Dumdaar', hi: 'दमदार' },
  { at: 2500, en: 'Pehlwan', hi: 'पहलवान' },
  { at: 6000, en: 'Ustaad', hi: 'उस्ताद' },
]
export function rank(points) {
  let i = 0
  while (i + 1 < RANKS.length && points >= RANKS[i + 1].at) i++
  return { ...RANKS[i], index: i, next: RANKS[i + 1] || null }
}

export function badges(p) {
  const st = stats(p)
  return [
    { id: 'first', icon: 'target', en: 'First workout', hi: 'पहली कसरत', got: st.workouts >= 1 },
    { id: 's3', icon: 'flame', en: '3-day streak', hi: '3 दिन लगातार', got: st.best >= 3 },
    { id: 's7', icon: 'medal', en: '7-day streak', hi: '7 दिन लगातार', got: st.best >= 7 },
    { id: 'w10', icon: 'dumbbell', en: '10 workouts', hi: '10 कसरतें', got: st.workouts >= 10 },
    { id: 'w25', icon: 'trophy', en: '25 workouts', hi: '25 कसरतें', got: st.workouts >= 25 },
    { id: 'm100', icon: 'timer', en: '100 minutes', hi: '100 मिनट', got: st.minutes >= 100 },
    { id: 'pb', icon: 'mountain', en: 'First peak climbed', hi: 'पहली चोटी फ़तह', got: Object.keys(p.pbs || {}).length >= 1 },
    { id: 'j1', icon: 'crown', en: 'Journey complete', hi: 'यात्रा पूरी', got: (p.completed || []).length >= 1 },
  ]
}

export function newProfile(data) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: '', age: 'adult', goal: 'active', level: 'beginner', limits: [], kg: null, cm: null, days: 3,
    journeyId: null, progress: {}, completed: [], difficulty: 1, history: [], weights: [], water: {}, pbs: {}, points: 0,
    ...data,
  }
}
