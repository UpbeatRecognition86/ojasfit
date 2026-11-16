import { useState } from 'react'
import { ArrowLeft, Play, Check, Flame, Clock, ChevronRight, Search, Share2, Sparkles, SlidersHorizontal, Trophy, TrendingUp, TrendingDown, Dumbbell, Lock } from 'lucide-react'
import { useStore, activeProfile, stats, dayStr, addDays, weekStart, rank } from '../lib/store.jsx'
import { useT } from '../lib/i18n.js'
import { JOURNEYS, JMAP, PEAKS, DRILLS, SPLITS, pbKey, phaseOf, recommend } from '../data/journeys.js'
import { EXERCISES, EX, TREES } from '../data/exercises.js'
import { buildSession, totalSessions, daysPerWeek, tiersOf, applyFeedback } from '../lib/plan.js'
import { coachMessage } from '../lib/coach.js'
import { shareRecap } from '../lib/share.js'
import { APP } from '../config.js'
import Glyph from '../components/Glyph.jsx'
import Confetti from '../components/Confetti.jsx'
import { ExerciseSheet, AdaptSheet, Demo, sessionSummary, todayAdapt, adaptCount, clock } from './Session.jsx'

const DOW = { en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], hi: ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'] }

function PhaseBar({ j, week }) {
  return <div className="phases">{Array.from({ length: j.weeks }, (_, w) => <i key={w} className={w < week ? 'done' : w === week ? 'now' : ''} />)}</div>
}

// ---------------------------------------------------------------- Coach dashboard
export function Home({ nav }) {
  const { state } = useStore()
  const { t, L, lang } = useT()
  const [adapting, setAdapting] = useState(false)
  const p = activeProfile(state)
  const st = stats(p)
  const today = dayStr()
  const ws = weekStart()
  const j = JMAP[p.journeyId] || JOURNEYS[0]
  const total = totalSessions(j, p)
  const idx = Math.min(p.progress[j.id] || 0, total)
  const finished = idx >= total
  const dpw = daysPerWeek(j, p)
  const adapt = todayAdapt(p)
  const session = finished ? null : buildSession(j, idx, p, adapt)
  const week = Math.min(j.weeks - 1, Math.floor(idx / dpw))
  const phase = phaseOf(week, j.weeks)
  const pct = Math.round((idx / total) * 100)
  const lastH = p.history[p.history.length - 1]
  const weekDone = !!(!finished && idx > 0 && idx % dpw === 0 && lastH?.weekDone && lastH.date >= ws)
  const msg = coachMessage(p, { finished, weekDone, dpw, left: dpw - (idx % dpw) })
  const n = adaptCount(adapt)

  return (
    <div className="screen">
      <div className="topbar">
        <div className="grow">
          <div className="muted small">{t('namaste')},</div>
          <h1>{p.name}</h1>
        </div>
        <span className="chip plain">{L(rank(p.points))}</span>
        <button className="avatar" onClick={() => nav.tab('profile')} aria-label={t('tab_profile')}>{p.name[0]?.toUpperCase()}</button>
      </div>

      <div className="streak-card">
        <div>
          <div className="eyebrow">{t('weeklyGoal')}</div>
          <b>{t('daysOf', { n: Math.min(st.weekCount, p.days), g: p.days })}</b>
        </div>
        <div className="day-pills">
          {DOW[lang].map((d, k) => {
            const day = addDays(ws, k)
            return <div key={k} className={`day-pill ${st.days.has(day) ? 'done' : ''} ${day === today ? 'today' : ''}`}>{d}</div>
          })}
        </div>
      </div>

      <div className="coach">
        <span className="coach-face"><Sparkles size={18} /></span>
        <div className="coach-bubble">{t(msg.key, msg.vars)}</div>
      </div>

      {session ? (
        <div className="hero-card">
          <span className="glyph-bg"><Glyph id={j.icon} size={190} /></span>
          <span className={`chip ${session.benchmark ? 'gold' : ''}`} style={{ alignSelf: 'flex-start' }}>
            {session.benchmark ? t('badge_bench') : st.days.has(today) ? t('badge_next') : t('badge_today')}
          </span>
          <h2>{L(session.title)}{session.peakId && !session.benchmark ? ` · ${t('split_' + session.split)}` : ''}</h2>
          <div className="meta">
            <span><Clock size={14} /> {session.minutes} {t('min')}</span>
            <span><Flame size={14} /> ~{session.kcal} {t('kcal')}</span>
            <span><Dumbbell size={14} /> {t('noEquip')}</span>
          </div>
          <ul className="summary">{sessionSummary(session, t, L).map((line) => <li key={line}>{line}</li>)}</ul>
          <button className="btn lg" onClick={() => nav.go('session', { jid: j.id, idx })}><Play size={18} fill="currentColor" /> {t('startWorkout')}</button>
          <button className="btn ghost plain-case" onClick={() => setAdapting(true)}>
            <SlidersHorizontal size={16} /> {n ? `${t('adapted')} (${n})` : `${t('adaptBtn')} (${t('adaptHint')})`}
          </button>
        </div>
      ) : (
        <div className="hero-card">
          <span className="chip gold" style={{ alignSelf: 'flex-start' }}><Trophy size={12} /> {L(j.name)}</span>
          <h2>{t('journeyDone')}</h2>
          <button className="btn lg" onClick={() => nav.tab('journeys')}>{t('chooseJourney')}</button>
        </div>
      )}

      <button className="card tap" onClick={() => nav.go('journey', { jid: j.id })}>
        <div className="row between"><span className="eyebrow">{t('journey')}</span><ChevronRight size={18} className="muted" /></div>
        <b style={{ display: 'block', margin: '2px 0 2px', fontSize: '1.05rem' }}>{L(j.name)}</b>
        <div className="muted small" style={{ marginBottom: 10 }}>{t('weekOf', { w: week + 1, t: j.weeks })} · {t('phase_' + phase.key)} · {t('pctDone', { n: pct })}</div>
        <PhaseBar j={j} week={finished ? j.weeks : week} />
      </button>

      {adapting && <AdaptSheet canShorten={!session || session.canShorten} onClose={() => setAdapting(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------- Journeys
export function Journeys({ nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const rec = recommend(p)
  return (
    <div className="screen">
      <h1>{t('tab_journeys')}</h1>
      {JOURNEYS.map((j) => {
        const total = totalSessions(j, p)
        const done = Math.min(p.progress[j.id] || 0, total)
        return (
          <button className="card tap" key={j.id} onClick={() => nav.go('journey', { jid: j.id })}>
            <div className="jcard">
              <span className="jbadge" style={{ background: j.color + '22', color: j.color }}><Glyph id={j.icon} size={26} /></span>
              <div className="grow">
                <b style={{ fontSize: '1.05rem' }}>{L(j.name)}</b>
                <div className="muted small">{L(j.tag)}</div>
                <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                  {p.journeyId === j.id && <span className="chip">{t('current')}</span>}
                  {p.journeyId !== j.id && rec === j.id && <span className="chip blue">{t('recommended')}</span>}
                  <span className="chip plain">{t('weeksN', { n: j.weeks })}</span>
                  {j.quiet && <span className="chip plain">{t('optQuiet')}</span>}
                </div>
              </div>
              <ChevronRight size={20} className="muted" />
            </div>
            {done > 0 && <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${(done / total) * 100}%`, background: j.color }} /></div>}
          </button>
        )
      })}
    </div>
  )
}

export function JourneyDetail({ jid, nav }) {
  const { state, update } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const j = JMAP[jid]
  const dpw = daysPerWeek(j, p)
  const total = totalSessions(j, p)
  const done = Math.min(p.progress[j.id] || 0, total)
  const isCurrent = p.journeyId === j.id
  const curWeek = Math.min(j.weeks - 1, Math.floor(done / dpw))
  const [hint, setHint] = useState(false)
  const open = (n) => (n > done ? setHint(true) : nav.go('session', { jid: j.id, idx: n }))
  return (
    <div className="screen plain">
      <div className="topbar"><button className="iconbtn" onClick={nav.back} aria-label={t('back')}><ArrowLeft size={20} /></button></div>
      <div className="hero-card" style={{ borderColor: j.color + '55' }}>
        <span className="glyph-bg" style={{ color: j.color }}><Glyph id={j.icon} size={190} /></span>
        <h2>{L(j.name)}</h2>
        <div className="meta"><span>{t('weeksN', { n: j.weeks })}</span><span>{t('perWeekN', { n: dpw })}</span><span>{t('sessionsDone', { n: done, t: total })}</span></div>
        <p className="muted">{L(j.about)}</p>
        <PhaseBar j={j} week={done >= total ? j.weeks : curWeek} />
        {isCurrent
          ? <div className="small accent"><Check size={15} style={{ verticalAlign: '-2px' }} /> {t('currentJourney')}</div>
          : <button className="btn" onClick={() => update((s) => { activeProfile(s).journeyId = j.id })}>{t('switchJourney')}</button>}
      </div>
      {hint && <p className="note warn">{t('finishPrev')}</p>}
      {Array.from({ length: j.weeks }, (_, w) => {
        const ph = phaseOf(w, j.weeks)
        return (
          <div className="card" key={w} style={w > curWeek ? { opacity: 0.6 } : null}>
            <div className="row between">
              <h3>{t('weekOf', { w: w + 1, t: j.weeks })}</h3>
              <span className={`chip ${ph.key === 'peak' ? 'gold' : ph.key === 'deload' ? 'blue' : 'plain'}`}>{t('phase_' + ph.key)}</span>
            </div>
            <div className="muted small">{t('phaseD_' + ph.key)}</div>
            {w <= curWeek + 1 && (
              <div className="list" style={{ marginTop: 4 }}>
                {Array.from({ length: dpw }, (_, d) => {
                  const n = w * dpw + d
                  const s = buildSession(j, n, p)
                  return (
                    <button className={`li ${n > done ? 'off' : ''}`} key={d} onClick={() => open(n)}>
                      <span className={`num ${n < done ? 'done' : n === done ? 'next' : ''}`}>{n < done ? <Check size={16} /> : n === done ? <Play size={14} fill="currentColor" /> : d + 1}</span>
                      <span className="grow"><b>{L(s.title)}{s.peakId ? ` · ${t('split_' + s.split)}` : ''}</b><span className="muted small" style={{ display: 'block' }}>{t('fmt_' + s.format)} · {s.minutes} {t('min')}{s.drill ? ` · ${L(DRILLS[s.drill.id].name)}` : ''}{s.skill ? ` · ${t('skill')}` : ''}</span></span>
                      {n > done ? <Lock size={15} className="muted" /> : <ChevronRight size={18} className="muted" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- Train (peaks, skills, library)
const AREAS = ['cardio', 'legs', 'push', 'core', 'back', 'mobility']

export function Explore({ nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const tiers = tiersOf(p)
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const [open, setOpen] = useState(null)
  const [tree, setTree] = useState(null)
  const needle = q.trim().toLowerCase()
  const list = EXERCISES.filter((e) => (area === 'all' || e.area === area) && (!needle || e.name.en.toLowerCase().includes(needle) || e.name.hi.includes(needle)))
  return (
    <div className="screen">
      <h1>{t('tab_explore')}</h1>

      <div><h2>{t('skills')}</h2><p className="muted small">{t('skillsSub')}</p></div>
      {Object.entries(TREES).map(([id, tr]) => (
        <button className="card tap" key={id} onClick={() => setTree(tree === id ? null : id)}>
          <div className="row between">
            <span><span className="eyebrow">{L(tr.name)}</span><b style={{ display: 'block' }}>{L(EX[tr.steps[tiers[id]]].name)}</b></span>
            <span className="chip blue">{tiers[id] + 1} / {tr.steps.length}</span>
          </div>
          <div className="ladder">{tr.steps.map((s, k) => <i key={s} className={k <= tiers[id] ? 'on' : ''} />)}</div>
          {tree === id && (
            <div style={{ marginTop: 10 }}>
              {tr.steps.map((s, k) => (
                <div key={s} className={`rung ${k < tiers[id] ? 'done' : k === tiers[id] ? 'now' : ''}`}>
                  <span className="dot" /><span className="grow">{L(EX[s].name)}</span>{k === tiers[id] && <span className="chip blue">{t('youAreHere')}</span>}
                </div>
              ))}
            </div>
          )}
        </button>
      ))}

      <div><h2>{t('peaks')}</h2><p className="muted small">{t('peaksSub')}</p></div>
      {['full', 'upper', 'legs'].map((type) => (
        <div className="card" key={type}>
          <h3 className="eyebrow">{t('ptype_' + type)}</h3>
          <div className="list">
            {PEAKS.filter((pk) => pk.type === type).map((pk) => {
              const bests = SPLITS.map((sp) => [sp, (p.pbs || {})[pbKey(pk.id, sp)]]).filter(([, v]) => v)
              return (
                <button className="li" key={pk.id} onClick={() => nav.go('session', { pid: pk.id })}>
                  <span className="jbadge sm"><Glyph id="mountain" size={20} /></span>
                  <span className="grow">
                    <b>{L(pk.name)}</b> <span className="chip plain">{t('lvl_' + pk.lvl)}</span>
                    <span className="muted small" style={{ display: 'block' }}>
                      {bests.length ? bests.map(([sp, v]) => <span key={sp} style={{ marginRight: 10 }}>{t('split_' + sp)} <b className="accent num-font">{clock(v)}</b></span>) : `${t('roundsN', { n: pk.rounds })} · ${t('noBest')}`}
                    </span>
                  </span>
                  <ChevronRight size={18} className="muted" />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div><h2>{t('drills')}</h2><p className="muted small">{t('drillsSub')}</p></div>
      <div className="card"><div className="list">
        {Object.entries(DRILLS).map(([id, d]) => (
          <div className="li" key={id}>
            <span className="jbadge sm" style={{ color: 'var(--blue)' }}><Glyph id={d.icon} size={20} /></span>
            <span className="grow"><b>{L(d.name)}</b> <span className="chip blue">{L(d.means)}</span><span className="muted small" style={{ display: 'block' }}>{L(d.about)}</span></span>
          </div>
        ))}
      </div></div>

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
            <div className="figbox" style={{ width: 52, height: 52 }}><Demo ex={e} size={52} animate={false} /></div>
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

// ---------------------------------------------------------------- Post-workout calibration
export function Calibrate({ hid, nav }) {
  const { state, update } = useStore()
  const { t } = useT()
  const p = activeProfile(state)
  const h = p.history.find((x) => x.id === hid)
  const [rpe, setRpe] = useState(3)
  const [tech, setTech] = useState(1)
  if (!h) return null
  const save = () => {
    update((s) => {
      const pp = activeProfile(s)
      const hh = pp.history.find((x) => x.id === hid)
      if (!hh || hh.rpe) return
      hh.rpe = rpe; hh.tech = tech
      hh.fb = applyFeedback(pp, { trees: hh.trees || [] }, rpe, tech)
    })
    nav.swap('recap', { hid })
  }
  return (
    <div className="screen plain">
      <h1 style={{ marginTop: 8 }}>{t('shabash')}</h1>
      <div className="stack">
        <h2 className="h3">{t('rpeQ')}</h2>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={`opt ${rpe === n ? 'on' : ''}`} onClick={() => setRpe(n)} style={{ minHeight: 52, padding: '8px 14px' }}>
            <span className="opt-icon" style={{ fontWeight: 800 }}>{n}</span>
            <span className="grow"><b>{t('rpe_' + n)}</b><span className="muted small">{t(`rpe_${n}d`)}</span></span>
          </button>
        ))}
      </div>
      <div className="stack">
        <h2 className="h3">{t('techQ')}</h2>
        <div className="seg">{[1, 2, 3].map((n) => <button key={n} className={tech === n ? 'on' : ''} onClick={() => setTech(n)}>{t('tech_' + n)}</button>)}</div>
      </div>
      <div className="spacer" />
      <button className="btn lg" onClick={save}>{t('saveRecap')}</button>
    </div>
  )
}

// ---------------------------------------------------------------- Recap & share
export function Recap({ hid, nav }) {
  const { state } = useStore()
  const { t, L } = useT()
  const [busy, setBusy] = useState(false)
  const p = activeProfile(state)
  const h = p.history.find((x) => x.id === hid) || p.history[p.history.length - 1]
  const st = stats(p)
  if (!h) return null
  const title = L(h.title) + (h.split ? ` · ${t('split_' + h.split)}` : '')
  const fb = h.fb
  const metrics = [
    h.time ? [clock(h.time), t('time')] : [clock(h.seconds ?? h.minutes * 60), t('duration')],
    [h.kcal, t('calories')],
    h.loops != null ? [h.loops, t('roundsLbl')] : [h.reps || 0, t('totalReps')],
    [t('dayN', { n: st.streak }), t('streakLbl')],
  ]
  const banner = h.pb ? t('pbBanner', { w: title, t: clock(h.time) }) : ''
  const share = async () => {
    setBusy(true)
    try {
      await shareRecap({ head: t('recapHead'), title: t('crushed', { w: title }), sub: h.date, metrics, banner: banner ? `🏆 ${banner}` : '' },
        t('shareCaption', { w: title, app: APP.name, url: APP.url }))
    } finally { setBusy(false) }
  }
  return (
    <div className="screen plain">
      <Confetti />
      <div className="poster">
        <div className="eyebrow accent">{APP.name} • {t('recapHead')}</div>
        <h1>{t('crushed', { w: title })}</h1>
        <div className="muted small">{h.date}</div>
        <div className="metrics">{metrics.map(([v, l]) => <div className="metric" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
        {banner && <div className="banner"><Trophy size={15} color="var(--gold)" /> {banner}</div>}
      </div>
      {fb && (
        <div className="coach">
          <span className="coach-face"><Sparkles size={18} /></span>
          <div className="coach-bubble stack" style={{ gap: 8 }}>
            <span>{t(fb.msg)}</span>
            {fb.promoted.map((x) => <span className="banner blue" key={x.ex} style={{ justifyContent: 'flex-start' }}><TrendingUp size={15} /> {t('promotedTo', { x: L(EX[x.ex].name) })}</span>)}
            {fb.regressed.map((x) => <span className="banner blue" key={x.ex} style={{ justifyContent: 'flex-start' }}><TrendingDown size={15} /> {t('movedTo', { x: L(EX[x.ex].name) })}</span>)}
          </div>
        </div>
      )}
      <div className="spacer" />
      <button className="btn wa" disabled={busy} onClick={share}><Share2 size={18} /> {t('shareStatus')}</button>
      <button className="btn ghost" onClick={nav.back}>{t('done')}</button>
    </div>
  )
}
