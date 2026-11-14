import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Pause, Play, SkipForward, SkipBack, X, Check, Clock, Flame, Timer, VolumeX, Repeat } from 'lucide-react'
import { useStore, activeProfile } from '../lib/store.jsx'
import { useT } from '../lib/i18n.js'
import { EX } from '../data/exercises.js'
import { buildSession } from '../lib/plan.js'
import { beep, sayClips, stopSpeaking, keepAwake, buzz } from '../lib/media.js'
import Figure from '../components/Figure.jsx'
import Sheet from '../components/Sheet.jsx'

export function Amount({ step }) {
  const { t } = useT()
  if (step.type === 'reps') return <>{step.amount} {t('times')}</>
  return step.amount >= 120 ? <>{Math.round(step.amount / 60)} {t('min')}</> : <>{step.amount} {t('sec')}</>
}

export function ExerciseSheet({ ex, onClose }) {
  const { t, L } = useT()
  return (
    <Sheet onClose={onClose}>
        <div className="figbox xl" style={{ alignSelf: 'center' }}><Figure pose={ex.pose} animate size={190} /></div>
        <h2>{L(ex.name)}</h2>
        <span className="chip plain" style={{ alignSelf: 'flex-start' }}>{t('area_' + ex.area)}</span>
        <div><h3 className="muted">{t('howTo')}</h3><p>{L(ex.cue)}</p></div>
        <button className="btn ghost" onClick={onClose}>{t('close')}</button>
    </Sheet>
  )
}

function Option({ icon, title, sub, on, onChange }) {
  return (
    <button className={`opt ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="opt-icon">{icon}</span>
      <span className="grow"><b>{title}</b><span className="muted small">{sub}</span></span>
      <span className={`switch ${on ? 'on' : ''}`} />
    </button>
  )
}

// Preview of a session, then the guided player.
export default function Session({ tpl, index, onBack, onFinish }) {
  const { state } = useStore()
  const { t, L } = useT()
  const profile = activeProfile(state)
  const [short, setShort] = useState(false)
  const [quiet, setQuiet] = useState(false)
  const [open, setOpen] = useState(null)
  const session = useMemo(() => buildSession(tpl, index, profile, { short, quiet }), [tpl, index, profile, short, quiet])
  const [playing, setPlaying] = useState(false)

  if (playing) return <Player session={session} onExit={() => setPlaying(false)} onFinish={onFinish} />

  const sections = ['warm', 'main', 'cool'].map((sec) => [sec, session.steps.filter((s) => s.section === sec && (s.round || 1) === 1)]).filter(([, l]) => l.length)
  const rounds = session.steps.find((s) => s.section === 'main')?.rounds || 1
  return (
    <div className="screen plain">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label={t('back')}><ArrowLeft size={20} /></button>
        <div className="grow">
          {tpl.sessions && <div className="muted small">{L(tpl.name)} · {t('weekDay', { w: session.week, d: session.day })}</div>}
          <h2>{L(session.title)}</h2>
        </div>
      </div>
      <div className="statline">
        <div><b>{session.minutes}</b><span>{t('min')}</span></div>
        <div><b>~{session.kcal}</b><span>{t('kcal')}</span></div>
        <div><b>{rounds}</b><span>{t('roundsWord')}</span></div>
        <div><b>{new Set(session.steps.map((s) => s.ex)).size}</b><span>{t('movesWord')}</span></div>
      </div>
      {session.forTime && <p className="note"><b><Timer size={15} style={{ verticalAlign: '-2px' }} /> {t('forTime')}</b> · {t('warmFirst')}</p>}
      {!session.forTime && (
        <div className="stack">
          <Option icon={<Clock size={20} />} title={t('optShort')} sub={t('optShortD')} on={short} onChange={setShort} />
          {session.hasJumps && <Option icon={<VolumeX size={20} />} title={t('optQuiet')} sub={t('optQuietD')} on={quiet} onChange={setQuiet} />}
        </div>
      )}
      {sections.map(([sec, steps]) => (
        <div className="card" key={sec}>
          <h3 className="eyebrow">{t(sec)}{sec === 'main' && rounds > 1 ? ` · ${t('roundsN', { n: rounds })}` : ''}</h3>
          <div className="list">
            {steps.map((s, n) => (
              <button className="li" key={n} onClick={() => setOpen(EX[s.ex])}>
                <div className="figbox"><Figure pose={EX[s.ex].pose} size={54} /></div>
                <div className="grow">
                  <b>{L(EX[s.ex].name)}</b>
                  <div className="muted small"><Amount step={s} /></div>
                  {s.swapped && <span className="chip ok" style={{ marginTop: 4 }}><Repeat size={11} /> {t('swappedFor', { x: L(EX[s.swapped].name) })}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="muted small center">{t('stopNote')}</p>
      <div className="sticky-cta">
        <button className="btn lg" onClick={() => { beep(660, 80); setPlaying(true) }}><Play size={20} fill="currentColor" /> {t('start')}</button>
      </div>
      {open && <ExerciseSheet ex={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Ring({ value, total, children, tone }) {
  const r = 54
  const c = 2 * Math.PI * r
  const frac = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0
  return (
    <div className={`ring ${tone || ''}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="ring-track" />
        <circle cx="60" cy="60" r={r} className="ring-bar" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 60 60)" />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

function Player({ session, onExit, onFinish }) {
  const { state } = useStore()
  const { t, L, lang } = useT()
  const { voice, sound } = state.settings
  const steps = session.steps
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | work | rest
  const [left, setLeft] = useState(5)
  const [total, setTotal] = useState(5)
  const [paused, setPaused] = useState(false)
  const [asking, setAsking] = useState(false)
  const [flash, setFlash] = useState('')
  const elapsed = useRef(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const step = steps[i]
  const ex = EX[step.ex]
  const timed = phase !== 'work' || step.type === 'time'
  const upcoming = phase === 'ready' ? steps[i] : steps[i + 1]

  // Each line names the recorded clips to play, with the sentence for the built-in voice as a fallback.
  const say = (ids, text) => { if (voice) sayClips(ids, lang, text) }
  const finished = useRef(false)
  const announce = (s) => {
    const amt = s.type === 'reps' ? `${s.amount} ${t('times')}` : s.amount >= 120 ? `${Math.round(s.amount / 60)} ${t('min')}` : `${s.amount} ${t('sec')}`
    const n = steps.indexOf(s)
    const newRound = s.section === 'main' && s.round > 1 && steps[n - 1]?.round !== s.round
    const lead = n === steps.length - 1 && steps.length > 1 ? [] : newRound ? [s.round === s.rounds ? 'round_final' : s.round % 2 ? 'round_b' : 'round_a'] : []
    const tail = n === steps.length - 1 && steps.length > 1 ? ['last_one'] : []
    say([...lead, 'ex_' + s.ex, ...tail], `${L(EX[s.ex].name)}. ${amt}.`)
  }
  const count = (n) => { setLeft(n); setTotal(n) }
  const startWork = (n) => {
    setI(n); setPhase('work'); count(steps[n].type === 'time' ? steps[n].amount : 0); setFlash('')
    if (sound) buzz(60)
    announce(steps[n])
  }
  const advance = () => {
    if (phase === 'ready') return startWork(i)
    if (phase === 'work') {
      if (i >= steps.length - 1) {
        finished.current = true
        stopSpeaking(); say(['done'], '')
        if (sound) buzz([80, 60, 160])
        return onFinish({ seconds: elapsed.current, session })
      }
      if (step.rest > 0) {
        setPhase('rest'); count(step.rest); setFlash('')
        if (sound) buzz(30)
        say(['rest_next', 'ex_' + steps[i + 1].ex], `${t('rest')}. ${t('next')}: ${L(EX[steps[i + 1].ex].name)}`)
        return
      }
      return startWork(i + 1)
    }
    startWork(i + 1)
  }
  const prev = () => { if (i > 0 || phase !== 'ready') startWork(Math.max(0, phase === 'work' ? i - 1 : i)) }

  useEffect(() => {
    let lock
    keepAwake().then((l) => { lock = l })
    say(['get_ready', 'ex_' + steps[0].ex], `${t('getReady')}. ${L(EX[steps[0].ex].name)}`)
    return () => { lock?.release?.(); if (!finished.current) stopSpeaking() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (paused || asking) return
    const id = setInterval(() => {
      if (phaseRef.current !== 'ready') elapsed.current += 1
      setLeft((l) => l - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [paused, asking])

  useEffect(() => {
    if (!timed) return
    if (left <= 0) return advance()
    if (left <= 3) { if (sound) beep(left === 1 ? 1100 : 800, 110) }
    else if (phase === 'work' && total >= 20 && left === Math.floor(total / 2)) {
      const msg = ex.sides ? t('switchSides') : total >= 40 ? t('halfway') : ''
      if (msg) { setFlash(msg); if (sound) { beep(600, 90); buzz(40) } say([ex.sides ? 'switch_sides' : 'halfway'], msg); setTimeout(() => setFlash(''), 3500) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  const mainRound = step.section === 'main' && step.rounds > 1 ? ` · ${t('roundN', { n: step.round, t: step.rounds })}` : ''
  const isLast = i === steps.length - 1
  return (
    <div className={`player ${phase}`}>
      <div className="player-in">
        <div className="row">
          <button className="iconbtn" onClick={() => setAsking(true)} aria-label={t('close')}><X size={20} /></button>
          <div className="grow">
            <div className="segs">{steps.map((_, n) => <i key={n} className={n < i || (n === i && phase !== 'ready') ? 'on' : ''} />)}</div>
            <div className="muted small" style={{ marginTop: 5 }}>{t(step.section)}{mainRound} · {i + 1}/{steps.length}</div>
          </div>
          {session.forTime && <span className="stopwatch"><Timer size={15} /> {fmt(elapsed.current)}</span>}
        </div>

        <div className="stage" key={`${phase}-${i}`}>
          {phase === 'work' ? (
            <>
              <div className="figbox hero-fig"><Figure pose={ex.pose} animate={!paused} size={200} /></div>
              <h1 className="ex-name">{L(ex.name)}</h1>
              <p className="muted cue">{L(ex.cue)}</p>
              {step.type === 'time' ? (
                <Ring value={left} total={total}><span className="count">{left >= 60 ? fmt(left) : left}</span></Ring>
              ) : (
                <div className="reps"><span className="count">{step.amount}</span><span className="reps-x">× {t('times')}</span></div>
              )}
              {flash ? <span className="chip flash">{flash}</span> : isLast ? <span className="chip gold">{t('lastOne')}</span> : upcoming && <span className="muted small">{t('next')}: {L(EX[upcoming.ex].name)}</span>}
            </>
          ) : (
            <>
              <h2 className="eyebrow">{phase === 'ready' ? t('getReady') : t('rest')}</h2>
              <Ring value={left} total={total} tone={phase === 'rest' ? 'ok' : ''}><span className="count">{Math.max(0, left)}</span></Ring>
              {upcoming && (
                <div className="card row nextcard">
                  <div className="figbox"><Figure pose={EX[upcoming.ex].pose} animate size={84} /></div>
                  <div className="grow">
                    <div className="eyebrow">{t('nextUp')}</div>
                    <b>{L(EX[upcoming.ex].name)}</b>
                    <div className="muted small"><Amount step={upcoming} /></div>
                  </div>
                </div>
              )}
              {phase === 'rest' && <button className="btn sm ghost" onClick={() => { setLeft((l) => l + 15); setTotal((x) => x + 15) }}>{t('more15')}</button>}
            </>
          )}
          {paused && <span className="chip">{t('paused')}</span>}
        </div>

        <div className="controls">
          <button className="iconbtn lg" onClick={prev} aria-label={t('back')}><SkipBack size={22} /></button>
          {phase === 'work' && step.type === 'reps' ? (
            <button className="btn ok lg" onClick={advance}><Check size={22} /> {t('done')}</button>
          ) : phase === 'work' ? (
            <button className="btn ghost lg" onClick={() => setPaused(!paused)}>{paused ? <><Play size={22} /> {t('resume')}</> : <><Pause size={22} /> {t('pause')}</>}</button>
          ) : (
            <button className="btn lg" onClick={advance}>{phase === 'ready' ? t('start') : t('skip')}</button>
          )}
          <button className="iconbtn lg" onClick={advance} aria-label={t('skip')}><SkipForward size={22} /></button>
        </div>
      </div>

      {asking && (
        <Sheet onClose={() => setAsking(false)}>
            <h2>{t('quit')}</h2>
            <p className="muted">{t('quitSub')}</p>
            <button className="btn" onClick={() => setAsking(false)}>{t('keepGoing')}</button>
            <button className="btn ghost" onClick={() => { stopSpeaking(); onExit() }}>{t('endIt')}</button>
        </Sheet>
      )}
    </div>
  )
}

function fmt(s) {
  s = Math.max(0, s)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
