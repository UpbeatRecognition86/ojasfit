import { useState, useRef, useMemo } from 'react'
import { ArrowLeft, Play, Check, Flame, Clock, ChevronRight, Search, Share2, Sparkles, SlidersHorizontal, Trophy, TrendingUp, TrendingDown, Dumbbell, Lock, Repeat, Moon, CheckCircle2 } from 'lucide-react'
import { useStore, activeProfile, stats, dayStr, addDays, weekStart, rank } from '../lib/store.jsx'
import { useT, TIPS } from '../lib/i18n.js'
import { JOURNEYS, JMAP, PEAKS, DRILLS, SPLITS, pbKey, phaseOf, recommend } from '../data/journeys.js'
import { EXERCISES, EX, TREES, LADDER_CLEAN } from '../data/exercises.js'
import { buildSession, totalSessions, daysPerWeek, tiersOf, applyFeedback, mainMoves, TRAIN_DAYS, ladderStatus } from '../lib/plan.js'
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

const LOCALE = { en: 'en-IN', hi: 'hi-IN' }
const asDate = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d) }
const weekday = (str, lang, style = 'long') => new Intl.DateTimeFormat(LOCALE[lang] || 'en-IN', { weekday: style }).format(asDate(str))
const dowOf = (str) => (asDate(str).getDay() + 6) % 7

// The next seven days: today (its summary once trained), then each day's planned session or rest.
function planWeek(p, j, idx, total, today) {
  const pattern = TRAIN_DAYS[daysPerWeek(j, p)]
  const doneToday = p.history.filter((h) => h.date === today)
  const days = []
  let next = idx
  for (let k = 0; k < 7; k++) {
    const date = addDays(today, k)
    if (k === 0 && doneToday.length) { days.push({ date, kind: 'done', entries: doneToday }); continue }
    if (next >= total) { days.push({ date, kind: 'end' }); break }
    if (k === 0 || pattern.includes(dowOf(date))) days.push({ date, kind: 'session', idx: next++ })
    else days.push({ date, kind: 'rest' })
  }
  return days
}

function MoveStrip({ moves }) {
  return (
    <div className="move-strip">
      {moves.slice(0, 6).map((m) => <div className="figbox" key={m.ex}><Demo ex={EX[m.ex]} size={56} animate={false} thumb /></div>)}
    </div>
  )
}

function DayPager({ days, render }) {
  const { t, lang } = useT()
  const ref = useRef(null)
  const [at, setAt] = useState(0)
  const onScroll = () => { const el = ref.current; if (el) setAt(Math.round(el.scrollLeft / el.clientWidth)) }
  const go = (k) => ref.current?.scrollTo({ left: k * ref.current.clientWidth, behavior: 'smooth' })
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="daystrip" role="tablist">
        {days.map((d, k) => (
          <button key={d.date} role="tab" aria-selected={k === at} className={`daychip ${k === at ? 'on' : ''} ${d.kind}`} onClick={() => go(k)}>
            <span>{k === 0 ? t('todayShort') : weekday(d.date, lang, 'short')}</span>
            <b>{asDate(d.date).getDate()}</b>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="pager" ref={ref} onScroll={onScroll}>
        {days.map((d, k) => <div className="page" key={d.date} aria-hidden={k !== at}>{render(d, k)}</div>)}
      </div>
    </div>
  )
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
  const days = planWeek(p, j, idx, total, today)
  const sessionsByIdx = useMemo(() => Object.fromEntries(days.filter((d) => d.kind === 'session').map((d, k) => [d.idx, k === 0 && d.date === today ? session : buildSession(j, d.idx, p, d.date === today ? adapt : {})])), [p, j, idx, adapt, session, today]) // eslint-disable-line react-hooks/exhaustive-deps
  const lastFb = !!(lastH?.fb && lastH.jid === j.id)

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

      <DayPager days={days} render={(d, k) => {
        const dayLabel = k === 0 ? t('todayLong', { d: weekday(d.date, lang) }) : weekday(d.date, lang)
        if (d.kind === 'done') return (
          <div className="hero-card done-card">
            <span className="chip ok" style={{ alignSelf: 'flex-start' }}><CheckCircle2 size={12} /> {dayLabel} · {t('doneChip')}</span>
            {d.entries.map((h) => (
              <div className="stack" key={h.id} style={{ gap: 10 }}>
                <h2>{L(h.title)}{h.split ? ` · ${t('split_' + h.split)}` : ''}</h2>
                <div className="metrics small-metrics">
                  <div className="metric"><b>{clock(h.time || h.seconds || h.minutes * 60)}</b><span>{h.time ? t('time') : t('duration')}</span></div>
                  <div className="metric"><b>{h.kcal}</b><span>{t('calories')}</span></div>
                  <div className="metric"><b>{h.loops != null ? h.loops : h.reps || 0}</b><span>{h.loops != null ? t('roundsLbl') : t('totalReps')}</span></div>
                  <div className="metric"><b>{h.rpe ? h.rpe + '/5' : '–'}</b><span>{t('effortLbl')}</span></div>
                </div>
                {h.moves?.length > 0 && <><h3 className="eyebrow">{t('whatYouDid')}</h3><MoveStrip moves={h.moves} /></>}
                {h.fb ? <><h3 className="eyebrow">{t('nextTitle')}</h3><NextChanges fb={h.fb} /></> : null}
                {h.rpe
                  ? <button className="btn ghost plain-case" onClick={() => nav.go('recap', { hid: h.id })}>{t('seeRecap')}</button>
                  : <button className="btn" onClick={() => nav.go('calibrate', { hid: h.id })}>{t('rateNow')}</button>}
              </div>
            ))}
          </div>
        )
        if (d.kind === 'rest') return (
          <div className="hero-card rest-card">
            <span className="chip plain" style={{ alignSelf: 'flex-start' }}><Moon size={12} /> {dayLabel}</span>
            <h2>{t('restDay')}</h2>
            <p className="muted">{t('restSub')}</p>
            <div className="note">{L(TIPS[asDate(d.date).getDate() % TIPS.length])}</div>
          </div>
        )
        if (d.kind === 'end') return (
          <div className="hero-card">
            <span className="chip gold" style={{ alignSelf: 'flex-start' }}><Trophy size={12} /> {L(j.name)}</span>
            <h2>{k === 0 ? t('journeyDone') : t('journeyEnds')}</h2>
            {k === 0 && <button className="btn lg" onClick={() => nav.tab('journeys')}>{t('chooseJourney')}</button>}
          </div>
        )
        const ses = sessionsByIdx[d.idx]
        const isNext = d.idx === idx
        return (
          <div className="hero-card">
            {k === 0 && <span className="glyph-bg"><Glyph id={j.icon} size={190} /></span>}
            <div className="row wrap" style={{ gap: 6 }}>
              <span className={`chip ${ses.benchmark ? 'gold' : ''}`}>{k === 0 ? (ses.benchmark ? t('badge_bench') : t('badge_today')) : dayLabel}</span>
              <span className="chip plain">{t('sessionOf', { n: d.idx + 1, t: total })}</span>
            </div>
            <h2>{L(ses.title)}{ses.peakId && !ses.benchmark ? ` · ${t('split_' + ses.split)}` : ''}</h2>
            <div className="meta">
              <span><Clock size={14} /> {ses.minutes} {t('min')}</span>
              <span><Flame size={14} /> ~{ses.kcal} {t('kcal')}</span>
              <span><Dumbbell size={14} /> {t('noEquip')}</span>
            </div>
            {isNext && lastFb && <div className="note ok small">{t('adjustedNote')}</div>}
            <ul className="summary">{sessionSummary(ses, t, L).map((line) => <li key={line}>{line}</li>)}</ul>
            <MoveStrip moves={mainMoves(ses)} />
            {k === 0 && <>
              <button className="btn lg" onClick={() => nav.go('session', { jid: j.id, idx })}><Play size={18} fill="currentColor" /> {t('startWorkout')}</button>
              <button className="btn ghost plain-case" onClick={() => setAdapting(true)}>
                <SlidersHorizontal size={16} /> {n ? `${t('adapted')} (${n})` : `${t('adaptBtn')} (${t('adaptHint')})`}
              </button>
            </>}
            {k > 0 && isNext && <button className="btn ghost plain-case" onClick={() => nav.go('session', { jid: j.id, idx })}><Play size={16} /> {t('startEarly')}</button>}
          </div>
        )
      }} />

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
  const ladders = ladderStatus(p)
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
      {Object.entries(TREES).map(([id, tr]) => {
        const st = ladders[id]
        const unit = (ex, n) => (EX[ex].type === 'time' ? t('goalSec', { n }) : t('goalReps', { n }))
        return (
          <div className="card ladder-card" key={id}>
            <button className="row" style={{ gap: 12, width: '100%', textAlign: 'left' }} onClick={() => setTree(tree === id ? null : id)} aria-expanded={tree === id}>
              <div className="figbox" style={{ width: 56, height: 56 }}><Demo ex={EX[st.ex]} size={56} animate={false} thumb /></div>
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="eyebrow">{L(tr.name)}</span>
                <b style={{ display: 'block' }}>{L(EX[st.ex].name)}</b>
              </span>
              <span className="chip blue">{st.tier + 1} / {tr.steps.length}</span>
            </button>
            <div className="ladder">{tr.steps.map((s, k) => <i key={s} className={k <= st.tier ? 'on' : ''} />)}</div>
            {st.next ? (
              <div className="ladder-goal">
                <div className="row between small"><span>{t('ladderGoal', { x: unit(st.ex, st.goal) })}</span><b>{st.best ? t('ladderBest', { x: unit(st.ex, st.best) }) : t('ladderNoBest')}</b></div>
                <div className="meter"><i style={{ width: `${Math.min(100, Math.round((st.best / st.goal) * 100))}%` }} /></div>
                <div className="row between small">
                  <span className="row" style={{ gap: 6 }}>{Array.from({ length: LADDER_CLEAN }, (_, k) => <span key={k} className={`pip ${k < st.clean ? 'on' : ''}`} />)} {t('ladderClean', { c: st.clean, n: LADDER_CLEAN })}</span>
                  <span className="muted">{t('ladderNext', { x: L(EX[st.next].name) })}</span>
                </div>
              </div>
            ) : <p className="note ok small">{t('ladderTop')}</p>}
            {tree === id && (
              <div style={{ marginTop: 6 }}>
                {tr.steps.map((s, k) => (
                  <button key={s} className={`rung ${k < st.tier ? 'done' : k === st.tier ? 'now' : ''}`} onClick={() => setOpen(EX[s])}>
                    <div className="figbox" style={{ width: 40, height: 40 }}><Demo ex={EX[s]} size={40} animate={false} thumb /></div>
                    <span className="grow">{L(EX[s].name)}<span className="muted small" style={{ display: 'block' }}>{t('ladderGoal', { x: unit(s, tr.goals[k]) })}</span></span>
                    {k === st.tier && <span className="chip blue">{t('youAreHere')}</span>}
                    {k < st.tier && <Check size={16} color="var(--ok)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

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
            <div className="figbox" style={{ width: 52, height: 52 }}><Demo ex={e} size={52} animate={false} thumb /></div>
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
  const { t, L } = useT()
  const p = activeProfile(state)
  const h = p.history.find((x) => x.id === hid)
  const [rpe, setRpe] = useState(3)
  const [tech, setTech] = useState(1)
  const [flags, setFlags] = useState({})
  if (!h) return null
  const moves = (h.moves || []).slice(0, 10)
  const save = () => {
    update((s) => {
      const pp = activeProfile(s)
      const hh = pp.history.find((x) => x.id === hid)
      if (!hh || hh.rpe) return
      hh.rpe = rpe; hh.tech = tech
      const flagged = moves.filter((m) => flags[m.ex]).map((m) => ({ ...m, how: flags[m.ex] }))
      hh.flags = flagged.map((m) => ({ ex: m.ex, how: m.how }))
      hh.fb = applyFeedback(pp, { trees: hh.trees || [] }, rpe, tech, flagged, hh.done || {})
    })
    nav.swap('recap', { hid })
  }
  return (
    <div className="screen plain">
      <div><h1 style={{ marginTop: 8 }}>{t('shabash')}</h1><p className="muted">{t('fbIntro')}</p></div>
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
      {moves.length > 0 && (
        <div className="stack">
          <div><h2 className="h3">{t('movesQ')}</h2><p className="muted small">{t('movesSub')}</p></div>
          <div className="list">
            {moves.map((m) => (
              <div className="li" key={m.ex} style={{ gap: 10 }}>
                <div className="figbox" style={{ width: 44, height: 44, flex: 'none' }}><Demo ex={EX[m.ex]} size={44} animate={false} thumb /></div>
                <b className="grow small" style={{ minWidth: 0 }}>{L(EX[m.ex].name)}</b>
                <div className="seg mini">
                  {[['', 'move_ok'], ['hard', 'move_hard'], ['pain', 'move_pain']].map(([how, key]) => (
                    <button key={key} className={(flags[m.ex] || '') === how ? 'on' : ''} onClick={() => setFlags({ ...flags, [m.ex]: how })}>{t(key)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="spacer" />
      <button className="btn lg" onClick={save}>{t('saveRecap')}</button>
    </div>
  )
}

// What the coach changed for the next workout, in plain words.
export function NextChanges({ fb }) {
  const { t, L } = useT()
  if (!fb) return null
  const lines = []
  if (fb.change > 0) lines.push([TrendingUp, t('next_more', { n: fb.change })])
  else if (fb.change < 0) lines.push([TrendingDown, t('next_less', { n: -fb.change })])
  else lines.push([Check, t('next_same')])
  if (fb.rest != null && fb.rest !== fb.restBefore) lines.push([Clock, t('next_rest', { n: fb.rest })])
  for (const x of fb.promoted || []) lines.push([TrendingUp, t('promotedTo', { x: L(EX[x.ex].name) })])
  for (const x of fb.regressed || []) lines.push([TrendingDown, t('movedTo', { x: L(EX[x.ex].name) })])
  for (const x of fb.progress || []) lines.push([Trophy, t('ladderStep', { x: L(EX[x.ex].name), c: x.clean, n: x.need })])
  for (const x of fb.swapped || []) lines.push([Repeat, x.to ? t('next_swap', { x: L(EX[x.ex].name), y: L(EX[x.to].name), w: x.weeks }) : t('next_drop', { x: L(EX[x.ex].name), w: x.weeks })])
  return (
    <div className="stack" style={{ gap: 6 }}>
      {lines.map(([Icon, text]) => <span className="banner blue" key={text} style={{ justifyContent: 'flex-start', textAlign: 'left' }}><Icon size={15} style={{ flex: 'none' }} /> {text}</span>)}
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
            <b className="small">{t('nextTitle')}</b>
            <NextChanges fb={fb} />
          </div>
        </div>
      )}
      <div className="spacer" />
      <button className="btn wa" disabled={busy} onClick={share}><Share2 size={18} /> {t('shareStatus')}</button>
      <button className="btn ghost" onClick={nav.back}>{t('done')}</button>
    </div>
  )
}
