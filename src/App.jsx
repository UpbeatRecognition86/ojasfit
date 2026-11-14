import { useEffect, useState, useCallback } from 'react'
import { Home as HomeIcon, Map as MapIcon, Compass, BarChart3, User } from 'lucide-react'
import { useStore, activeProfile, stats, dayStr } from './lib/store.jsx'
import { useT } from './lib/i18n.js'
import { JMAP, QMAP, PMAP } from './data/journeys.js'
import { totalSessions, daysPerWeek } from './lib/plan.js'
import Onboarding from './screens/Onboarding.jsx'
import Session from './screens/Session.jsx'
import { Home, Journeys, JourneyDetail, Explore, Done } from './screens/Main.jsx'
import { Progress, Profile, Paywall } from './screens/Me.jsx'

const TABS = [['home', HomeIcon], ["journeys", MapIcon], ['explore', Compass], ['progress', BarChart3], ['profile', User]]
const isTab = (n) => TABS.some(([t]) => t === n)

export default function App() {
  const { state, update } = useStore()
  const { t, lang } = useT()
  const [route, setRoute] = useState({ name: 'home' })
  const [onboarded, setOnboarded] = useState(() => state.profiles.length > 0)
  const profile = activeProfile(state)

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
  useEffect(() => { if (!profile) setOnboarded(false) }, [profile])

  const go = useCallback((name, params = {}) => { const r = { name, ...params }; history.pushState(r, ''); setRoute(r) }, [])
  const swap = useCallback((name, params = {}) => { const r = { name, ...params }; history.replaceState(r, ''); setRoute(r) }, [])
  const nav = { go, back: () => history.back(), tab: (name) => (isTab(route.name) ? swap(name) : go(name)) }

  if (!onboarded || !profile) return <div className="app"><Onboarding onDone={() => { setOnboarded(true); swap('home') }} /></div>

  const finish = (tpl, index, kind) => ({ seconds, session }) => {
    const isJourney = kind === 'j'
    const minutes = Math.max(1, Math.round(seconds / 60))
    const kcal = Math.round(session.kcalPerSec * seconds)
    const hid = Date.now()
    update((s) => {
      const p = activeProfile(s)
      const st = stats(p)
      const first = !st.days.has(dayStr())
      p.pbs = p.pbs || {}
      const pb = kind === 'p' && (!p.pbs[tpl.id] || seconds < p.pbs[tpl.id])
      if (pb) p.pbs[tpl.id] = seconds
      const points = minutes * 10 + (first ? 20 + Math.min(st.streak, 7) * 5 : 0) + (pb ? 50 : 0)
      p.history.push({ id: hid, date: dayStr(), title: session.title, jid: isJourney ? tpl.id : null, qid: kind === 'q' ? tpl.id : null, pid: kind === 'p' ? tpl.id : null, minutes, seconds, kcal, points, pb })
      p.points += points
      if (isJourney && (p.progress[tpl.id] || 0) === index) {
        p.progress[tpl.id] = index + 1
        const dpw = daysPerWeek(tpl, p)
        if ((index + 1) % dpw === 0) p.history[p.history.length - 1].weekDone = (index + 1) / dpw
        if (index + 1 >= totalSessions(tpl, p) && !p.completed.includes(tpl.id)) p.completed.push(tpl.id)
      }
    })
    swap('done', { hid })
  }

  let body
  switch (route.name) {
    case 'journeys': body = <Journeys nav={nav} />; break
    case 'journey': body = <JourneyDetail jid={route.jid} nav={nav} />; break
    case 'explore': body = <Explore nav={nav} />; break
    case 'progress': body = <Progress />; break
    case 'profile': body = <Profile nav={nav} />; break
    case 'paywall': body = <Paywall nav={nav} />; break
    case 'done': body = <Done hid={route.hid} nav={nav} />; break
    case 'addProfile': body = <Onboarding add onDone={nav.back} />; break
    case 'session': {
      const tpl = route.jid ? JMAP[route.jid] : route.pid ? PMAP[route.pid] : QMAP[route.qid]
      const kind = route.jid ? 'j' : route.pid ? 'p' : 'q'
      body = tpl
        ? <Session tpl={tpl} index={route.idx || 0} onBack={nav.back} onFinish={finish(tpl, route.idx || 0, kind)} />
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
