import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from './store.jsx'
import * as cloud from './cloud.js'
import { tr as T } from './i18n.js'

// Who is signed in, their account details, and keeping their progress backed up.
// status: 'off' (accounts not configured) | 'loading' | 'out' | 'syncing' | 'in'
const Ctx = createContext(null)

const KEY = 'ojasfit_account'
const readCachedAccount = (uid) => { try { const a = JSON.parse(localStorage.getItem(KEY)); return a?.uid === uid ? a.account : null } catch { return null } }
const cacheAccount = (uid, account) => { try { localStorage.setItem(KEY, JSON.stringify({ uid, account })) } catch { /* storage full or blocked */ } }
const forgetAccount = () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

const workouts = (s) => (s?.profiles || []).reduce((n, p) => n + (p.history?.length || 0), 0)

export function AccountProvider({ children }) {
  const { state, replace } = useStore()
  const [status, setStatus] = useState(cloud.ACCOUNTS_ON ? 'loading' : 'off')
  const [user, setUser] = useState(null)
  const [account, setAccountState] = useState(null)
  const latest = useRef(state)
  latest.current = state

  // Brings this phone in line with the signed-in account. Called on sign-in and on "Try again".
  const sync = useCallback(async (u) => {
    const local = latest.current
    const cached = readCachedAccount(u.uid)
    // This phone already holds this account's progress (it is backed up as it changes),
    // so open straight away and refresh the account details in the background.
    if (local.owner === u.uid && cached) {
      setAccountState(cached); setStatus('in')
      cloud.loadUser(u.uid).then((saved) => { if (saved?.account) { setAccountState(saved.account); cacheAccount(u.uid, saved.account) } }).catch(() => {})
      return
    }
    setStatus('syncing')
    let saved
    try { saved = await cloud.loadUser(u.uid) } catch {
      // Without the saved copy we cannot tell what to keep, so wait for a connection rather than guess.
      setStatus('offline'); return
    }
    // Progress on this phone that belongs to someone else is never mixed into this account.
    const localMine = !local.owner || local.owner === u.uid
    const remote = saved?.data
    if (remote?.profiles?.length && (!localMine || workouts(remote) >= workouts(local) || !local.profiles.length)) {
      replace({ ...remote, owner: u.uid, lang: local.lang || remote.lang })
    } else if (!localMine) {
      replace({ lang: local.lang, settings: local.settings, owner: u.uid })
    } else {
      replace({ ...local, owner: u.uid })
    }
    const acc = saved?.account || { name: u.name, email: u.email, phone: u.phone, via: u.via }
    setAccountState(acc)
    if (acc.created) cacheAccount(u.uid, acc)
    setStatus('in')
  }, [replace])

  useEffect(() => {
    if (!cloud.ACCOUNTS_ON) return
    let stop = () => {}
    let alive = true
    cloud.watchUser((u) => {
      if (!alive) return
      setUser(u)
      if (!u) { setAccountState(null); setStatus('out'); return }
      sync(u)
    }).then((fn) => { if (alive) stop = fn; else fn() }).catch(() => setStatus('out'))
    return () => { alive = false; stop() }
  }, [sync])
  const retry = useCallback(() => { if (user) sync(user) }, [user, sync])

  // Back up a few seconds after each change, and right away when the app goes to the background.
  const timer = useRef(null)
  useEffect(() => {
    if (status !== 'in' || !user || state.owner !== user.uid) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => cloud.saveData(user.uid, latest.current).catch(() => {}), 2500)
  }, [state, status, user])
  useEffect(() => {
    if (status !== 'in' || !user) return
    const flush = () => { if (document.visibilityState === 'hidden') cloud.saveData(user.uid, latest.current).catch(() => {}) }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [status, user])

  const setAccount = useCallback(async (a) => {
    const next = { ...a, via: user.via, created: a.created || new Date().toISOString() }
    setAccountState(next)
    cacheAccount(user.uid, next)
    await cloud.saveAccount(user.uid, next)
  }, [user])

  const signOut = useCallback(async () => {
    clearTimeout(timer.current)
    try { await cloud.saveData(user.uid, latest.current) } catch { /* saved later by the offline queue */ }
    await cloud.signOut()
    forgetAccount()
    // Clear this phone so the next person starts fresh; their progress stays in their account.
    replace({ lang: latest.current.lang, settings: latest.current.settings })
  }, [user, replace])

  const deleteAccount = useCallback(async () => {
    clearTimeout(timer.current)
    const keep = { lang: latest.current.lang, settings: latest.current.settings }
    try {
      await cloud.deleteAccount()
    } catch (e) {
      if (e?.code !== 'auth/requires-recent-login') throw e
      // The progress is already gone; Google wants a fresh sign-in before removing the login itself.
      await cloud.signOut()
      forgetAccount()
      replace(keep)
      alert(T(keep.lang, 'deleteRelogin'))
      return
    }
    forgetAccount()
    replace(keep)
  }, [replace])

  return <Ctx.Provider value={{ status, user, account, setAccount, signOut, deleteAccount, retry }}>{children}</Ctx.Provider>
}

export const useAccount = () => useContext(Ctx)
