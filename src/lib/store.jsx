import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { APP, PLANS, FREE_PROFILES, PAYMENTS } from '../config.js'
import { JMAP, PMAP, recommend, defaultLength } from '../data/journeys.js'
import { START_TIERS } from '../data/exercises.js'

// While the app is free, everyone gets full access and no paywall is shown anywhere.
export const FREE_LAUNCH = PAYMENTS.mode === 'free'

const blank = () => ({ v: 2, lang: null, profiles: [], activeId: null, premium: null, settings: { voice: true, sound: true, bigText: false } })

function load() {
  try {
    const raw = localStorage.getItem(APP.storageKey)
    if (raw) return migrate({ ...blank(), ...JSON.parse(raw) })
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return blank()
}

// Bring data saved by earlier versions up to the current shape.
const OLD_LIMITS = { knee: 'knees', shoulder: 'shoulders', back: 'back', knees: 'knees', shoulders: 'shoulders', wrists: 'wrists' }
export function migrate(s) {
  for (const p of s.profiles || []) {
    if ((p.limits || []).includes('impact')) p.quiet = true
    p.limits = [...new Set((p.limits || []).map((l) => OLD_LIMITS[l]).filter(Boolean))]
    if (!['lose', 'strong', 'active'].includes(p.goal)) p.goal = 'active'
    // Ladders v2 (six ladders, reordered legs and core): keep each person on the same move.
    if ((p.ladders || 1) < 2 && p.tiers) {
      const oldCore = ['crunch', 'leg_raise', 'plank', 'jackknife', 'hollow_hold', 'v_up']
      const newCore = ['crunch', 'plank', 'leg_raise', 'hollow_hold', 'jackknife', 'v_up']
      if (p.tiers.core != null) p.tiers.core = newCore.indexOf(oldCore[p.tiers.core] ?? 'crunch')
      p.mastery = {}
    }
    p.ladders = 2
    p.tiers = { ...START_TIERS[p.level || 'beginner'], ...(p.tiers || {}) }
    p.volume = p.volume || p.difficulty || 1
    p.rest = p.rest || 45
    p.streaks = p.streaks || {}
    p.pbs = Object.fromEntries(Object.entries(p.pbs || {}).map(([k, v]) => [PMAP[k] ? `${k}:summit` : k, v]))
    p.length = p.length || defaultLength(p.level)
    p.completed = p.completed || []
    p.progress = p.progress || {}
    if (!JMAP[p.journeyId]) p.journeyId = recommend(p)
  }
  s.v = 2
  return s
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  useEffect(() => {
    try { localStorage.setItem(APP.storageKey, JSON.stringify(state)) } catch { /* ignore quota errors */ }
  }, [state])
  const update = useCallback((fn) => setState((prev) => { const next = structuredClone(prev); fn(next); return next }), [])
  const replace = useCallback((s) => setState(migrate({ ...blank(), ...s })), [])
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
  return FREE_LAUNCH || !!(s.premium && s.premium.until >= dayStr())
}
export function maxProfiles(s) {
  if (FREE_LAUNCH) return Math.max(...PLANS.map((p) => p.profiles))
  if (!isPlus(s)) return FREE_PROFILES
  return PLANS.find((p) => p.id === s.premium.plan)?.profiles || 3
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
  { at: 0, en: 'Rookie', hi: 'नया खिलाड़ी' },
  { at: 300, en: 'Contender', hi: 'जोशीला' },
  { at: 1000, en: 'Athlete', hi: 'दमदार' },
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
  const p = {
    id: Math.random().toString(36).slice(2, 10),
    name: '', goal: 'active', level: 'beginner', limits: [], quiet: false, kg: null, cm: null, days: 3,
    journeyId: null, progress: {}, completed: [], history: [], weights: [], pbs: {}, points: 0,
    volume: 1, rest: 45, streaks: {}, mastery: {}, best: {}, ladders: 2, adapt: null,
    ...data,
  }
  p.tiers = { ...START_TIERS[p.level], ...(data.tiers || {}) }
  p.length = data.length || defaultLength(p.level)
  return p
}
