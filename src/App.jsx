import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Map as MapIcon, Dumbbell, BarChart3, User } from 'lucide-react'
import { useStore, activeProfile, stats, dayStr } from './lib/store.jsx'
import { useT } from './lib/i18n.js'
import { JMAP, PMAP, pbKey } from './data/journeys.js'
import { totalSessions, daysPerWeek } from './lib/plan.js'
import Onboarding from './screens/Onboarding.jsx'
import { SignIn, Details, Splash } from './screens/Account.jsx'
import { useAccount } from './lib/account.jsx'
import Session from './screens/Session.jsx'
import { Home, Journeys, JourneyDetail, Explore, Calibrate, Recap } from './screens/Main.jsx'
import { Progress, Profile, Paywall } from './screens/Me.jsx'

const TABS = [['home', Sparkles], ["journeys", MapIcon], ['explore', Dumbbell], ['progress', BarChart3], ['profile', User]]
const isTab = (n) => TABS.some(([t]) => t === n)

export default function App() {
  const { state, update } = useStore()
  const { t, lang } = useT()
  const [route, setRoute] = useState({ name: 'home' })
  const [onboarded, setOnboarded] = useState(() => state.profiles.length > 0)
  const profile = activeProfile(state)
  const acct = useAccount()

  // Browser history drives navigation so the Android back button works.
  useEffect(() => {
    history.replaceState({ name: 'home' }, '')
    const onPop = (e) => setRoute(e.state || { name: 'home' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [route])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.classList.toggle('big', !!state.settings.bigText)
  }, [lang, state.settings.bigText])
  useEffect(() => { setOnboarded(!!profile) }, [profile])
  useEffect(() => { if (acct.status !== 'in') { history.replaceState({ name: 'home' }, ''); setRoute({ name: 'home' }) } }, [acct.status])

  const go = useCallback((name, params = {}) => { const r = { name, ...params }; history.pushState(r, ''); setRoute(r) }, [])
  const swap = useCallback((name, params = {}) => { const r = { name, ...params }; history.replaceState(r, ''); setRoute(r) }, [])
  const nav = { go, swap, back: () => history.back(), tab: (name) => (isTab(route.name) ? swap(name) : go(name)) }

  // With accounts on, nobody trains without signing in; the first sign-in also asks for contact details.
  if (acct.status === 'loading') return <div className="app"><Splash /></div>
  if (acct.status === 'out') return <div className="app"><SignIn /></div>
  if (acct.status === 'syncing') return <div className="app"><Splash text={t('loadingProgress')} /></div>
  if (acct.status === 'offline') return <div className="app"><Splash text={t('authErrNetwork')} onRetry={acct.retry} /></div>
  if (acct.status === 'in' && !acct.account?.created) return <div className="app"><Details /></div>
  if (!onboarded || !profile) return <div className="app"><Onboarding name={acct.account?.name} onDone={() => { setOnboarded(true); swap('home') }} /></div>

  const finish = (tpl, index, isJourney) => ({ seconds, coreSeconds, session, reps, loops }) => {
    const minutes = Math.max(1, Math.round(seconds / 60))
    const kcal = Math.round(session.kcalPerSec * seconds)
    const hid = Date.now()
    update((s) => {
      const p = activeProfile(s)
      const st = stats(p)
      const first = !st.days.has(dayStr())
      p.pbs = p.pbs || {}
      // Any for-time session on a Peak (a benchmark inside a journey, or a Peak on its own) can set a record.
      const pid = session.forTime ? session.peakId : null
      const key = pid ? pbKey(pid, session.split) : null
      const time = pid ? Math.max(1, coreSeconds) : null
      const pb = !!pid && (!p.pbs[key] || time < p.pbs[key])
      if (pb) p.pbs[key] = time
      const points = minutes * 10 + (first ? 20 + Math.min(st.streak, 7) * 5 : 0) + (pb ? 50 : 0)
      const entry = { id: hid, date: dayStr(), title: session.title, jid: isJourney ? tpl.id : null, pid, split: pid ? session.split : null, format: session.format, minutes, seconds, time, kcal, points, pb, reps, trees: session.trees }
      if (session.format === 'amrap') entry.loops = loops
      p.history.push(entry)
      p.points += points
      if (isJourney && (p.progress[tpl.id] || 0) === index) {
        p.progress[tpl.id] = index + 1
        const dpw = daysPerWeek(tpl, p)
        if ((index + 1) % dpw === 0) entry.weekDone = (index + 1) / dpw
        if (index + 1 >= totalSessions(tpl, p) && !p.completed.includes(tpl.id)) p.completed.push(tpl.id)
      }
    })
    swap('calibrate', { hid })
  }

  let body
  switch (route.name) {
    case 'journeys': body = <Journeys nav={nav} />; break
    case 'journey': body = <JourneyDetail jid={route.jid} nav={nav} />; break
    case 'explore': body = <Explore nav={nav} />; break
    case 'progress': body = <Progress />; break
    case 'profile': body = <Profile nav={nav} />; break
    case 'paywall': body = <Paywall nav={nav} />; break
    case 'calibrate': body = <Calibrate hid={route.hid} nav={nav} />; break
    case 'recap': body = <Recap hid={route.hid} nav={nav} />; break
    case 'addProfile': body = <Onboarding add onDone={nav.back} />; break
    case 'session': {
      const tpl = route.jid ? JMAP[route.jid] : PMAP[route.pid]
      body = tpl
        ? <Session tpl={tpl} index={route.idx || 0} split={route.split} onBack={nav.back} onFinish={finish(tpl, route.idx || 0, !!route.jid)} />
        : <Home nav={nav} />
      break
    }
    default: body = <Home nav={nav} />
  }

  return (
    <div className="app">
      {body}
      {isTab(route.name) && (
        <nav className="tabbar">
          {TABS.map(([name, Icon]) => (
            <button key={name} className={route.name === name ? 'on' : ''} onClick={() => nav.tab(name)}>
              <Icon size={22} />{t('tab_' + name)}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
