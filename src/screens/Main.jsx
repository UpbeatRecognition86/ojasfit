import { useState } from 'react'
import { ArrowLeft, Play, Lock, Check, Flame, Star, Clock, ChevronRight, Search, Share2, Crown, Sparkles, TrendingUp, Droplet, Lightbulb } from 'lucide-react'
import { useStore, activeProfile, stats, canPlay, isPlus, dayStr, addDays, weekStart, rank, FREE_LAUNCH } from '../lib/store.jsx'
import { useT, TIPS } from '../lib/i18n.js'
import { JOURNEYS, JMAP, QUICK, PEAKS, recommend } from '../data/journeys.js'
import { EXERCISES } from '../data/exercises.js'
import { buildSession, totalSessions, daysPerWeek } from '../lib/plan.js'
import { clock } from './Me.jsx'
import { APP } from '../config.js'
import Figure from '../components/Figure.jsx'
import Glyph from '../components/Glyph.jsx'
import Confetti from '../components/Confetti.jsx'
import { ExerciseSheet } from './Session.jsx'
import { coachMessage, weeklyMinutes } from '../lib/coach.js'

const DOW = { en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], hi: ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'] }

export function QuickCard({ q, nav, wide }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const s = buildSession(q, 0, p)
  const locked = q.premium && !isPlus(state)
  return (
    <button className="card tap" style={wide ? null : { width: 168 }} onClick={() => (locked ? nav.go('paywall') : nav.go('session', { qid: q.id }))}>
      <div className="row between"><span className="jbadge sm"><Glyph id={q.icon} size={20} /></span>{locked && <span className="chip gold"><Lock size={12} /> {t('plus')}</span>}</div>
      <b style={{ display: 'block', margin: '6px 0 2px' }}>{L(q.name)}</b>
      <span className="muted small">{s.minutes} {t('min')} · ~{s.kcal} {t('kcal')}</span>
    </button>
  )
}

function CoachWeek({ j, idx, nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const dpw = daysPerWeek(j, p)
  const w = Math.floor(idx / dpw)
  const rows = Array.from({ length: dpw }, (_, d) => {
    const n = w * dpw + d
    if (n >= totalSessions(j, p)) return null
    const s = buildSession(j, n, p)
    const done = n < idx
    const todayOne = n === idx
    const locked = !canPlay(state, j, n)
    return { n, s, done, todayOne, locked, d }
  }).filter(Boolean)
  const open = (row) => {
    if (row.n > idx) return
    if (row.locked) return nav.go('paywall')
    nav.go('session', { jid: j.id, idx: row.n })
  }
  return (
    <div className="card">
      <div className="row between"><h3>{t('coachThisWeek')}</h3><span className="chip plain">{t('coachWeek', { w: w + 1 })}</span></div>
      <div className="list">
        {rows.map((row) => (
          <button className={`li ${row.n > idx && !row.todayOne ? 'off' : ''}`} key={row.n} onClick={() => open(row)}>
            <span className={`num ${row.done ? 'done' : row.todayOne ? 'next' : ''}`}>
              {row.done ? <Check size={16} /> : row.locked ? <Lock size={14} /> : row.todayOne ? <Play size={14} /> : row.d + 1}
            </span>
            <span className="grow"><b>{L(row.s.title)}</b><span className="muted small" style={{ display: 'block' }}>{row.s.minutes} {t('min')} · ~{row.s.kcal} {t('kcal')}{row.todayOne ? ` · ${t('todayTag')}` : ''}</span></span>
            {row.n <= idx && <ChevronRight size={18} className="muted" />}
          </button>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>{t('coachRest')}</p>
    </div>
  )
}

export function Home({ nav }) {
  const { state, update } = useStore()
  const { t, L, lang } = useT()
  const p = activeProfile(state)
  const st = stats(p)
  const today = dayStr()
  const j = JMAP[p.journeyId]
  const idx = j ? p.progress[j.id] || 0 : 0
  const finished = j && idx >= totalSessions(j, p)
  const left = j && !finished ? daysPerWeek(j, p) - (idx % daysPerWeek(j, p)) : 0
  const locked = j && !finished && !canPlay(state, j, idx)
  const session = j && !finished ? buildSession(j, idx, p) : null
  const ws = weekStart()
  const water = p.water[today] || 0
  const r = rank(p.points)
  const tip = TIPS[Math.floor(Date.now() / 864e5) % TIPS.length]
  const setWater = (n) => update((s) => { activeProfile(s).water[today] = water === n ? n - 1 : n })
  const dpw = j ? daysPerWeek(j, p) : 3
  const lastH = p.history[p.history.length - 1]
  const weekDone = !!(j && !finished && idx > 0 && idx % dpw === 0 && lastH?.weekDone && lastH.date >= ws)
  const msg = coachMessage(p, { finished, weekDone, dpw, left })
  const pct = j ? Math.round((Math.min(idx, totalSessions(j, p)) / totalSessions(j, p)) * 100) : 0

  return (
    <div className="screen">
      <div className="topbar">
        <div className="grow">
          <div className="muted small">{t('namaste')}</div>
          <h1>{p.name}</h1>
        </div>
        <span className="chip"><Star size={12} /> {L(r)}</span>
        <button className="avatar" onClick={() => nav.tab('profile')} aria-label={t('tab_profile')}>{p.name[0]?.toUpperCase()}</button>
      </div>

      <div className="coach">
        <span className="coach-face"><Sparkles size={20} /></span>
        <div className="coach-bubble"><div className="eyebrow">{t('coach')}</div>{t(msg.key, msg.vars)}</div>
      </div>

      {j && (
        <div className="hero" style={{ background: j.color, '--hero-shadow': j.color }}>
          <span className="big-emoji"><Glyph id={j.icon} size={150} /></span>
          <div>
            <div className="eyebrow">{finished ? L(j.name) : `${st.days.has(today) ? t('nextUp') : t('today')} · ${L(j.name)}`}</div>
            {session && <h2>{L(session.title)}</h2>}
            {session && <div className="hero-meta"><span><Clock size={15} /> {session.minutes} {t('min')}</span><span><Flame size={15} /> ~{session.kcal} {t('kcal')}</span><span>{t('coachWeek', { w: session.week })}</span></div>}
            {finished && <h2>{t('journeyDone')}</h2>}
          </div>
          {session && <div><div className="bar"><i style={{ width: `${Math.max(3, pct)}%` }} /></div><div className="muted small" style={{ marginTop: 5 }}>{t('journeyProgress', { n: pct })}</div></div>}
          {locked && <div className="small">{t('week1Done')}</div>}
          {finished ? (
            <button className="btn" onClick={() => nav.tab('journeys')}>{t('chooseJourney')}</button>
          ) : locked ? (
            <button className="btn" onClick={() => nav.go('paywall')}><Crown size={18} /> {t('unlockPlus')}</button>
          ) : (
            <button className="btn lg" onClick={() => nav.go('session', { jid: j.id, idx })}><Play size={20} fill="currentColor" /> {t('startWorkout')}</button>
          )}
        </div>
      )}

      {j && !finished && <CoachWeek j={j} idx={idx} nav={nav} />}

      <div className="card stack">
        <div className="row between"><h3>{t('thisWeek')}</h3><span className="muted small">{t('weekGoal', { n: Math.min(st.weekCount, p.days), g: p.days })}</span></div>
        <div className="dots">
          {DOW[lang].map((d, n) => {
            const day = addDays(ws, n)
            return <div key={n} className={`dot ${st.days.has(day) ? 'done' : ''} ${day === today ? 'today' : ''}`}><i><Check size={18} /></i>{d}</div>
          })}
        </div>
      </div>

      <div className="tiles">
        <div className="tile"><Flame size={18} color="var(--brand)" /><b>{st.streak}</b><span className="muted small">{t('streak')}</span></div>
        <div className="tile"><Star size={18} color="var(--gold)" /><b>{p.points}</b><span className="muted small">{r.next ? t('rankNext', { n: r.next.at - p.points, r: L(r.next) }) : t('points')}</span></div>
      </div>

      <div className="card stack">
        <div className="row between"><h3 className="row" style={{ gap: 6 }}><Droplet size={18} color="#3b9eea" /> {t('water')}</h3><span className="muted small">{t('glasses', { n: water })}</span></div>
        <div className="glasses">
          {Array.from({ length: 8 }, (_, n) => <button key={n} className={`glass ${n < water ? 'on' : ''}`} onClick={() => setWater(n + 1)} aria-label={`${n + 1}`} />)}
        </div>
      </div>

      <div className="row between"><h2>{t('quick')}</h2><button className="link small" onClick={() => nav.tab('explore')}>{t('seeAll')}</button></div>
      <div className="hscroll">{QUICK.slice(0, 5).map((q) => <QuickCard key={q.id} q={q} nav={nav} />)}</div>

      <div className="note"><b><Lightbulb size={15} style={{ verticalAlign: '-2px' }} /> {t('tip')}</b><br />{L(tip)}</div>
    </div>
  )
}

function JourneyCard({ j, nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const done = p.progress[j.id] || 0
  const total = totalSessions(j, p)
  return (
    <button className="card tap" onClick={() => nav.go('journey', { jid: j.id })}>
      <div className="jcard">
        <span className="jbadge" style={{ background: j.color + '1c', color: j.color }}><Glyph id={j.icon} size={26} /></span>
        <div className="grow">
          <b>{L(j.name)}</b>
          <div className="muted small">{L(j.tag)}</div>
          <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
            {p.journeyId === j.id && <span className="chip">{t('current')}</span>}
            <span className="chip plain">{t('weeksN', { n: j.weeks })}</span>
            {FREE_LAUNCH ? null : j.premium ? (isPlus(state) ? null : <span className="chip gold"><Crown size={12} /> {t('week1Free')}</span>) : <span className="chip ok">{t('free')}</span>}
          </div>
        </div>
        <ChevronRight size={20} className="muted" />
      </div>
      {done > 0 && <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${Math.min(100, (done / total) * 100)}%`, background: j.color }} /></div>}
    </button>
  )
}

export function Journeys({ nav }) {
  const { state } = useStore()
  const { t } = useT()
  const p = activeProfile(state)
  const picks = [p.journeyId, recommend(p)]
  const mine = JOURNEYS.filter((j) => picks.includes(j.id))
  const rest = JOURNEYS.filter((j) => !picks.includes(j.id))
  return (
    <div className="screen">
      <h1>{t('tab_journeys')}</h1>
      <h2>{t('forYou')}</h2>
      {mine.map((j) => <JourneyCard key={j.id} j={j} nav={nav} />)}
      {rest.length > 0 && <h2>{t('moreJourneys')}</h2>}
      {rest.map((j) => <JourneyCard key={j.id} j={j} nav={nav} />)}
    </div>
  )
}

export function JourneyDetail({ jid, nav }) {
  const { state, update } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const j = JMAP[jid]
  const done = p.progress[j.id] || 0
  const perWeek = daysPerWeek(j, p)
  const total = totalSessions(j, p)
  const isCurrent = p.journeyId === j.id
  const [hint, setHint] = useState(false)
  const open = (n) => {
    if (n > done) return setHint(true)
    if (!canPlay(state, j, n)) return nav.go('paywall')
    nav.go('session', { jid: j.id, idx: n })
  }
  return (
    <div className="screen plain">
      <div className="topbar"><button className="iconbtn" onClick={nav.back} aria-label={t('back')}><ArrowLeft size={20} /></button></div>
      <div className="hero" style={{ background: j.color }}>
        <span className="big-emoji"><Glyph id={j.icon} size={150} /></span>
        <h1>{L(j.name)}</h1>
        <div className="muted small">{t('weeksN', { n: j.weeks })} · {t('perWeekN', { n: perWeek })} · {t('sessionsDone', { n: Math.min(done, total), t: total })}</div>
        <p>{L(j.about)}</p>
        {isCurrent ? <div className="small"><Check size={15} style={{ verticalAlign: '-2px' }} /> {t('currentJourney')}</div> : (
          <button className="btn" onClick={() => update((s) => { activeProfile(s).journeyId = j.id })}>{t('startJourney')}</button>
        )}
      </div>
      {j.premium && !isPlus(state) && (
        <button className="note row" onClick={() => nav.go('paywall')}><Crown size={18} /><span className="grow"><b>{t('week1Free')}</b> · {t('unlockPlus')}</span><ChevronRight size={18} /></button>
      )}
      {hint && <p className="note warn">{t('finishPrev')}</p>}
      {Array.from({ length: j.weeks }, (_, w) => (
        <div className="card" key={w}>
          <h3 className="muted">{t('coachWeek', { w: w + 1 })}</h3>
          <div className="list">
            {Array.from({ length: perWeek }, (_, d) => {
              const n = w * perWeek + d
              const s = buildSession(j, n, p)
              const paid = !canPlay(state, j, n)
              const cls = n < done ? 'done' : n === done ? 'next' : ''
              return (
                <button className={`li ${n > done ? 'off' : ''}`} key={d} onClick={() => open(n)}>
                  <span className={`num ${cls}`}>{n < done ? <Check size={16} /> : paid ? <Lock size={14} /> : n === done ? <Play size={14} /> : d + 1}</span>
                  <span className="grow"><b>{L(s.title)}</b><span className="muted small" style={{ display: 'block' }}>{t('day')} {d + 1} · {s.minutes} {t('min')}</span></span>
                  <ChevronRight size={18} className="muted" />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PeakRow({ peak, nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const best = (p.pbs || {})[peak.id]
  const locked = peak.premium && !isPlus(state)
  return (
    <button className="li" onClick={() => (locked ? nav.go('paywall') : nav.go('session', { pid: peak.id }))}>
      <span className="jbadge sm"><Glyph id="mountain" size={20} /></span>
      <span className="grow">
        <b>{L(peak.name)}</b> <span className="chip plain">{t('lvl_' + peak.lvl)}</span>
        <span className="muted small" style={{ display: 'block' }}>{t('roundsN', { n: peak.rounds })} · {best ? `${t('best')} ${clock(best)}` : t('noBest')}</span>
      </span>
      {locked ? <span className="chip gold"><Lock size={12} /> {t('plus')}</span> : <ChevronRight size={18} className="muted" />}
    </button>
  )
}

const AREAS = ['cardio', 'legs', 'push', 'back', 'core', 'yoga', 'balance', 'mobility']

export function Explore({ nav }) {
  const { t, L } = useT()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [open, setOpen] = useState(null)
  const needle = q.trim().toLowerCase()
  const list = EXERCISES.filter((e) => (area === 'all' || e.area === area) && (!needle || e.name.en.toLowerCase().includes(needle) || e.name.hi.includes(needle)))
  return (
    <div className="screen">
      <h1>{t('tab_explore')}</h1>
      <div><h2>{t('peaks')}</h2><p className="muted small">{t('peaksSub')}</p></div>
      <div className="card"><div className="list">{PEAKS.map((x) => <PeakRow key={x.id} peak={x} nav={nav} />)}</div></div>
      <h2>{t('quick')}</h2>
      <div className="tiles">{QUICK.map((x) => <QuickCard key={x.id} q={x} nav={nav} wide />)}</div>

      <h2>{t('library')}</h2>
      <div className="row input" style={{ padding: '0 14px' }}>
        <Search size={18} className="muted" />
        <input style={{ border: 0, background: 'none', outline: 'none', flex: 1, minHeight: 48, minWidth: 0 }} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="hscroll">
        {['all', ...AREAS].map((a) => <button key={a} className={`pill ${area === a ? 'on' : ''}`} onClick={() => setArea(a)}>{a === 'all' ? t('all') : t('area_' + a)}</button>)}
      </div>
      <div className="card"><div className="list">
        {list.map((e) => (
          <button className="li" key={e.id} onClick={() => setOpen(e)}>
            <div className="figbox"><Figure pose={e.pose} size={52} /></div>
            <span className="grow"><b>{L(e.name)}</b><span className="muted small" style={{ display: 'block' }}>{t('area_' + e.area)}</span></span>
            <ChevronRight size={18} className="muted" />
          </button>
        ))}
        {list.length === 0 && <p className="muted center" style={{ padding: 16 }}>—</p>}
      </div></div>

      {open && <ExerciseSheet ex={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

export function Done({ hid, nav }) {
  const { state, update } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const h = p.history.find((x) => x.id === hid) || p.history[p.history.length - 1]
  const st = stats(p)
  if (!h) return null
  const feel = (f) => update((s) => {
    const pp = activeProfile(s)
    const hh = pp.history.find((x) => x.id === h.id)
    if (!hh || hh.felt) return
    hh.felt = f
    const mult = f === 'easy' ? 1.1 : f === 'hard' ? 0.88 : 1
    pp.difficulty = Math.min(1.6, Math.max(0.6, (pp.difficulty || 1) * mult))
  })
  const text = t('shareText', { w: L(h.title), app: APP.name, m: h.minutes, k: h.kcal })
  const r = rank(p.points)
  const rankUp = r.index > rank(p.points - h.points).index
  const wk = weeklyMinutes(p, 2)
  return (
    <div className="screen plain center">
      <Confetti />
      <div className="trophy" style={{ marginTop: '3vh' }}><Glyph id={h.pb ? 'trophy' : h.weekDone ? 'medal' : 'party'} size={44} /></div>
      <h1>{t('shabash')}</h1>
      <p className="muted">{t('workoutDone')} · {L(h.title)}</p>
      <div className="tiles" style={{ gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'left' }}>
        <div className="tile"><Clock size={18} /><b>{h.pid ? clock(h.seconds) : h.minutes}</b><span className="muted small">{h.pid ? t('time') : t('min')}</span></div>
        <div className="tile"><Flame size={18} color="var(--brand)" /><b>{h.kcal}</b><span className="muted small">{t('kcal')}</span></div>
        <div className="tile"><Star size={18} color="var(--gold)" /><b>+{h.points}</b><span className="muted small">{t('points')}</span></div>
      </div>
      {h.pb && <div className="chip gold" style={{ alignSelf: 'center', fontSize: '0.95rem', padding: '6px 14px' }}><Glyph id="trophy" size={15} /> {t('newPb')}</div>}
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <span className="chip"><Flame size={13} /> {st.streak} · {t('streak')}</span>
        {rankUp && <span className="chip gold"><Star size={13} /> {t('rankUp', { r: L(r) })}</span>}
      </div>
      {h.weekDone && (
        <div className="note ok" style={{ textAlign: 'left' }}>
          <b><TrendingUp size={15} style={{ verticalAlign: '-2px' }} /> {t('weekRecap', { w: h.weekDone })}</b><br />
          {t('weekRecapSub', { s: wk[1].sessions, m: wk[1].minutes })}{wk[1].minutes > wk[0].minutes && wk[0].minutes > 0 ? ` · ${t('vsLast', { n: wk[1].minutes - wk[0].minutes })}` : ''}
        </div>
      )}
      <div className="card stack">
        <h3>{t('howFelt')}</h3>
        <div className="row">
          {[['easy', 'smile'], ['ok', 'thumb'], ['hard', 'flame']].map(([f, e]) => (
            <button key={f} className={`opt ${h.felt === f ? 'on' : ''}`} style={{ flexDirection: 'column', gap: 4, padding: 10 }} disabled={!!h.felt} onClick={() => feel(f)}>
              <span className="opt-icon"><Glyph id={e} size={20} /></span><span className="small"><b>{t('felt_' + f)}</b></span>
            </button>
          ))}
        </div>
        <p className="muted small">{h.felt ? t(h.felt === 'easy' ? 'nextHarder' : h.felt === 'hard' ? 'nextEasier' : 'nextSame') : t('feltNote')}</p>
      </div>
      <div className="spacer" />
      <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><Share2 size={18} /> {t('share')}</a>
      <button className="btn" onClick={nav.back}>{t('continue')}</button>
    </div>
  )
}
