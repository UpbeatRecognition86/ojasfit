import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Pause, Play, SkipForward, SkipBack, X, Check, Clock, Flame, Timer, Volume2, VolumeX, Repeat, SlidersHorizontal, Maximize2, Zap } from 'lucide-react'
import { useStore, activeProfile, dayStr } from '../lib/store.jsx'
import { useT } from '../lib/i18n.js'
import { EX } from '../data/exercises.js'
import { buildSession } from '../lib/plan.js'
import { beep, sayClips, stopSpeaking, keepAwake, buzz, hasVideo } from '../lib/media.js'
import Figure from '../components/Figure.jsx'
import Sheet from '../components/Sheet.jsx'

export const clock = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
export const todayAdapt = (p) => (p.adapt && p.adapt.date === dayStr() ? p.adapt : {})
export const adaptCount = (a) => (a.quiet ? 1 : 0) + (a.tight ? 1 : 0) + (a.time ? 1 : 0) + (a.sore?.length ? 1 : 0)

export function Amount({ step }) {
  const { t } = useT()
  if (step.type === 'emom') return <>{step.reps ? `${step.reps} ${t('times')}` : `${step.hold} ${t('sec')}`}</>
  if (step.type === 'reps') return <>{step.amount} {t('times')}</>
  return step.amount >= 120 ? <>{Math.round(step.amount / 60)} {t('min')}</> : <>{step.amount} {t('sec')}</>
}

// The demonstration: a looping video when one exists for the move, otherwise the drawn figure.
export function Demo({ ex, size, animate = true }) {
  if (hasVideo(ex.id)) return <video src={`./video/${ex.id}.mp4`} autoPlay loop muted playsInline />
  return <Figure pose={ex.pose} animate={animate} size={size} />
}

export function ExerciseSheet({ ex, onClose }) {
  const { t, L } = useT()
  return (
    <Sheet onClose={onClose}>
        <div className="vid" style={{ height: 210, flex: 'none' }}><Demo ex={ex} size={190} /></div>
        <h2>{L(ex.name)}</h2>
        <span className="chip plain" style={{ alignSelf: 'flex-start' }}>{t('area_' + ex.area)}</span>
        <div><h3 className="eyebrow">{t('howTo')}</h3><p>{L(ex.cue)}</p></div>
        <button className="btn ghost" onClick={onClose}>{t('close')}</button>
    </Sheet>
  )
}

const PARTS = ['knees', 'back', 'shoulders', 'wrists']

// "Adapt session": today's real-world constraints. Saved for today only.
export function AdaptSheet({ canShorten = true, onClose }) {
  const { state, update } = useStore()
  const { t } = useT()
  const p = activeProfile(state)
  const [a, setA] = useState(() => ({ quiet: false, tight: false, time: 0, sore: [], ...todayAdapt(p) }))
  const set = (patch) => setA((x) => ({ ...x, ...patch }))
  const apply = () => { update((s) => { activeProfile(s).adapt = { ...a, date: dayStr() } }); onClose() }
  const Toggle = ({ k, icon, title, sub }) => (
    <button className={`opt ${a[k] ? 'on' : ''}`} onClick={() => set({ [k]: !a[k] })} role="switch" aria-checked={a[k]}>
      <span className="opt-icon">{icon}</span>
      <span className="grow"><b>{title}</b><span className="muted small">{sub}</span></span>
      <span className={`switch ${a[k] ? 'on' : ''}`} />
    </button>
  )
  return (
    <Sheet onClose={onClose}>
      <div><h2>{t('adaptTitle')}</h2><p className="muted small">{t('adaptSub')}</p></div>
      <Toggle k="quiet" icon={<VolumeX size={20} />} title={t('optQuiet')} sub={t('optQuietD')} />
      <Toggle k="tight" icon={<Maximize2 size={20} />} title={t('optTight')} sub={t('optTightD')} />
      {canShorten && (
        <div className="stack" style={{ gap: 6 }}>
          <h3 className="eyebrow">{t('optTime')}</h3>
          <div className="seg">{[0, 20, 15].map((m) => <button key={m} className={a.time === m ? 'on' : ''} onClick={() => set({ time: m })}>{t('time_' + m)}</button>)}</div>
        </div>
      )}
      <div className="stack" style={{ gap: 6 }}>
        <h3 className="eyebrow">{t('optSore')}</h3>
        <div className="pills">
          {PARTS.map((part) => (
            <button key={part} className={`pill ${a.sore.includes(part) ? 'on' : ''}`} onClick={() => set({ sore: a.sore.includes(part) ? a.sore.filter((x) => x !== part) : [...a.sore, part] })}>{t('part_' + part)}</button>
          ))}
        </div>
      </div>
      <button className="btn" onClick={apply}>{t('applyAdapt')}</button>
    </Sheet>
  )
}

// One-line description of the core block, e.g. "4 rounds: Burpees, Squats, Plank".
export function coreSummary(session, t, L) {
  const core = session.steps.filter((s) => s.section === 'core')
  const names = [...new Set(core.map((s) => L(EX[s.ex].name)))].join(', ')
  if (session.format === 'amrap') return t('sum_amrap', { m: Math.round(session.cap / 60), x: names })
  if (session.format === 'emom') return t('sum_emom', { m: Math.round(session.cap / 60), x: names })
  if (session.format === 'fortime') return t('sum_fortime', { n: core[0]?.rounds || session.rounds, x: names })
  return t('sum_intervals', { n: session.rounds, x: names })
}
const secMin = (steps) => Math.max(1, Math.round(steps.reduce((a, s) => a + (s.type === 'reps' ? s.amount * EX[s.ex].spr : s.amount) + s.rest, 0) / 60))
export function sessionSummary(session, t, L) {
  const by = (sec) => session.steps.filter((s) => s.section === sec)
  const out = []
  if (by('warm').length) out.push(t('sum_warm', { m: secMin(by('warm')) }))
  if (session.skill) out.push(t('sum_skill', { x: L(EX[session.skill.ex].name) }))
  out.push(coreSummary(session, t, L))
  if (by('cool').length) out.push(t('sum_cool', { m: secMin(by('cool')) }))
  return out
}

// Preview of a session, then the guided player.
export default function Session({ tpl, index, onBack, onFinish }) {
  const { state } = useStore()
  const { t, L } = useT()
  const profile = activeProfile(state)
  const adapt = todayAdapt(profile)
  const [open, setOpen] = useState(null)
  const [adapting, setAdapting] = useState(false)
  const session = useMemo(() => buildSession(tpl, index, profile, adapt), [tpl, index, profile, adapt])
  const [playing, setPlaying] = useState(false)

  if (playing) return <Player session={session} onExit={() => setPlaying(false)} onFinish={onFinish} />

  const firstOf = (sec) => session.steps.filter((s) => s.section === sec && (s.type === 'emom' ? s.round <= 2 : (s.round || 1) === 1))
  const sections = ['warm', 'skill', 'core', 'cool'].map((sec) => [sec, firstOf(sec)]).filter(([, l]) => l.length)
  const n = adaptCount(adapt)
  const coreLabel = session.format === 'intervals' || session.format === 'fortime' ? t('roundsN', { n: session.steps.find((s) => s.section === 'core')?.rounds || 1 }) : `${Math.round(session.cap / 60)} ${t('min')}`
  return (
    <div className="screen plain">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label={t('back')}><ArrowLeft size={20} /></button>
        <div className="grow">
          {tpl.pool && <div className="muted small">{L(tpl.name)} · {t('weekDay', { w: session.week, d: session.day })}</div>}
          <h2>{L(session.title)}</h2>
        </div>
        <span className={`chip ${session.benchmark ? 'gold' : ''}`}>{t('fmt_' + session.format)}</span>
      </div>
      <div className="statline">
        <div><b>{session.minutes}</b><span>{t('min')}</span></div>
        <div><b>~{session.kcal}</b><span>{t('kcal')}</span></div>
        <div><b>{new Set(session.steps.map((s) => s.ex)).size}</b><span>{t('movesWord')}</span></div>
      </div>
      {session.benchmark && <p className="note warn">{t('benchNote')}</p>}
      {session.forTime && !session.benchmark && <p className="note">{t('warmFirst')}</p>}
      <button className="btn ghost plain-case" onClick={() => setAdapting(true)}>
        <SlidersHorizontal size={17} /> {n ? `${t('adapted')} (${n})` : `${t('adaptBtn')} (${t('adaptHint')})`}
      </button>
      {sections.map(([sec, steps]) => (
        <div className="card" key={sec}>
          <div className="row between"><h3 className="eyebrow">{t(sec)}</h3>{sec === 'core' && <span className="chip plain">{t('fmt_' + session.format)} · {coreLabel}</span>}{sec === 'skill' && <span className="chip blue">3 ×</span>}</div>
          <div className="list">
            {(sec === 'skill' ? steps.slice(0, 1) : steps).map((s, k) => (
              <button className="li" key={k} onClick={() => setOpen(EX[s.ex])}>
                <div className="figbox" style={{ width: 54, height: 54, position: 'relative' }}><Demo ex={EX[s.ex]} size={54} animate={false} /></div>
                <div className="grow">
                  <b>{L(EX[s.ex].name)}</b>
                  <div className="muted small"><Amount step={s} />{s.type === 'emom' ? ` / ${t('min')}` : ''}</div>
                  {s.swapped && <span className="chip plain" style={{ marginTop: 4, textTransform: 'none', letterSpacing: 0 }}><Repeat size={11} /> {t('swappedFor', { x: L(EX[s.swapped].name) })}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="muted small center">{t('stopNote')}</p>
      <div className="sticky-cta">
        <button className="btn lg" onClick={() => { beep(660, 80); setPlaying(true) }}><Play size={20} fill="currentColor" /> {t('startWorkout')}</button>
      </div>
      {open && <ExerciseSheet ex={open} onClose={() => setOpen(null)} />}
      {adapting && <AdaptSheet canShorten={session.canShorten} onClose={() => setAdapting(false)} />}
    </div>
  )
}

function Player({ session, onExit, onFinish }) {
  const { state, update } = useStore()
  const { t, L, lang } = useT()
  const { voice, sound } = state.settings
  const steps = session.steps
  const amrap = session.format === 'amrap'
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | work | rest
  const [left, setLeft] = useState(5)
  const [total, setTotal] = useState(5)
  const [capLeft, setCapLeft] = useState(session.cap)
  const [loops, setLoops] = useState(0)
  const [emomDone, setEmomDone] = useState(false)
  const [paused, setPaused] = useState(false)
  const [asking, setAsking] = useState(false)
  const [flash, setFlash] = useState('')
  const elapsed = useRef(0)
  const coreTime = useRef(0) // seconds spent in the core block: what a for-time result measures
  const reps = useRef(0)
  const finished = useRef(false)
  const live = useRef({})
  const step = steps[i]
  const ex = EX[step.ex]
  live.current = { phase, loop: !!step.loop, core: step.section === 'core' }
  const timed = phase !== 'work' || step.type !== 'reps'
  const upcoming = phase === 'ready' ? steps[i] : steps[i + 1] || (step.loop ? steps.find((s) => s.loop) : null)

  const say = (ids, text) => { if (voice) sayClips(ids, lang, text) }
  const announce = (n) => {
    const s = steps[n]
    const amt = s.type === 'emom' ? (s.reps ? `${s.reps} ${t('times')}` : `${s.hold} ${t('sec')}`) : s.type === 'reps' ? `${s.amount} ${t('times')}` : `${s.amount} ${t('sec')}`
    const newRound = s.section === 'core' && s.type !== 'emom' && s.round > 1 && steps[n - 1]?.round !== s.round
    const lead = newRound ? [s.round === s.rounds ? 'round_final' : s.round % 2 ? 'round_b' : 'round_a'] : []
    const tail = n === steps.length - 1 && steps.length > 1 ? ['last_one'] : []
    say([...lead, 'ex_' + s.ex, ...tail], `${L(EX[s.ex].name)}. ${amt}.`)
  }
  const count = (n) => { setLeft(n); setTotal(n) }
  const startWork = (n) => {
    setI(n); setPhase('work'); setEmomDone(false); setFlash('')
    count(steps[n].type === 'reps' ? 0 : steps[n].amount)
    if (sound) buzz(60)
    announce(n)
  }
  const finish = () => {
    finished.current = true
    stopSpeaking(); say(['done'], '')
    if (sound) buzz([80, 60, 160])
    onFinish({ seconds: elapsed.current, coreSeconds: coreTime.current, session, reps: reps.current, loops })
  }
  // completed=false when the athlete skipped the move
  const advance = (completed = true) => {
    if (phase === 'ready') return startWork(i)
    if (phase === 'rest') return startWork(i + 1)
    if (completed && step.type === 'reps') reps.current += step.amount
    if (completed && step.type === 'emom' && step.reps && !emomDone) reps.current += step.reps
    if (step.loop && !steps[i + 1]?.loop && capLeft > 0) { setLoops((x) => x + 1); return startWork(steps.findIndex((s) => s.loop)) }
    if (i >= steps.length - 1) return finish()
    if (step.rest > 0) {
      setPhase('rest'); count(step.rest); setFlash('')
      if (sound) buzz(30)
      say(['rest_next', 'ex_' + steps[i + 1].ex], `${t('rest')}. ${t('next')}: ${L(EX[steps[i + 1].ex].name)}`)
      return
    }
    startWork(i + 1)
  }
  const prev = () => { if (i > 0 || phase !== 'ready') startWork(Math.max(0, phase === 'work' ? i - 1 : i)) }
  const emomTap = () => { if (!emomDone) { setEmomDone(true); if (step.reps) reps.current += step.reps; if (sound) buzz(40) } }

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
      if (live.current.phase !== 'ready') elapsed.current += 1
      if (live.current.core && live.current.phase !== 'ready') coreTime.current += 1
      if (live.current.loop && live.current.phase === 'work') setCapLeft((c) => c - 1)
      setLeft((l) => l - 1)
    }, 1000)
    return () => clearInterval(id)
  }, [paused, asking])

  useEffect(() => {
    if (!timed) return
    if (left <= 0) return advance(true)
    if (left <= 3) { if (sound) beep(left === 1 ? 1100 : 800, 110) }
    else if (phase === 'work' && step.type === 'time' && total >= 20 && left === Math.floor(total / 2)) {
      const msg = ex.sides ? t('switchSides') : total >= 40 ? t('halfway') : ''
      if (msg) { setFlash(msg); if (sound) { beep(600, 90); buzz(40) } say([ex.sides ? 'switch_sides' : 'halfway'], msg); setTimeout(() => setFlash(''), 3500) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  // AMRAP: when the clock runs out, leave the loop for the cool-down.
  useEffect(() => {
    if (!amrap || capLeft > 0 || !step.loop || phase === 'ready') return
    if (sound) { beep(1100, 300); buzz([120, 60, 120]) }
    const nxt = steps.findIndex((s, n) => n > i && !s.loop)
    if (nxt < 0) finish()
    else startWork(nxt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capLeft])

  const label = step.type === 'emom' ? t('minuteN', { n: step.round, t: step.rounds })
    : step.section === 'skill' ? `${t('skill')} · ${t('setN', { n: step.round, t: step.rounds })}`
    : step.loop ? `${t('fmt_amrap')} · ${t('roundsLbl')} ${loops}`
    : step.section === 'core' && step.rounds > 1 ? t('roundN', { n: step.round, t: step.rounds })
    : t(step.section)
  const progress = step.loop ? 1 - capLeft / session.cap : (i + (phase === 'ready' ? 0 : 1)) / steps.length
  const isLast = i === steps.length - 1
  return (
    <div className={`player ${phase}`}>
      <div className="player-in">
        <div className="hud">
          <button className="iconbtn" onClick={() => setAsking(true)} aria-label={t('close')}><X size={20} /></button>
          <span className="grow">{label}</span>
          {session.forTime && step.section === 'core' && <span className="clock accent"><Timer size={15} /> {clock(coreTime.current)}</span>}
          {step.loop && phase !== 'ready' && <span className="clock accent"><Timer size={15} /> {clock(capLeft)}</span>}
          <button className="row" style={{ gap: 4, color: voice ? 'var(--brand)' : 'var(--muted)', fontWeight: 700 }} onClick={() => { if (voice) stopSpeaking(); update((s) => { s.settings.voice = !voice }) }}>
            {voice ? <Volume2 size={16} /> : <VolumeX size={16} />}<span className="small">{voice ? t('voiceOn') : t('voiceOff')}</span>
          </button>
        </div>
        <div className={`pbar ${step.loop ? 'tick' : ''}`}><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>

        {phase === 'work' ? (
          <>
            <div className="vid">
              <Demo ex={ex} size={230} animate={!paused} />
              {step.section === 'skill' && <span className="chip blue tagline"><Zap size={11} /> {t('skill')}</span>}
            </div>
            <div className="stage" key={`${i}-${loops}`}>
              {step.type === 'reps' && <div className="repnum">{step.amount}</div>}
              {step.type === 'time' && <div className="repnum">{left >= 60 ? clock(left) : Math.max(0, left)}<small>{left < 60 ? t('sec') : ''}</small></div>}
              {step.type === 'emom' && <div className="repnum" style={emomDone ? { color: 'var(--muted)' } : null}>{step.reps || step.hold}<small>{step.reps ? '' : t('sec')}</small></div>}
              <div className="ex-name">{L(ex.name)}</div>
              {step.type === 'emom'
                ? <div className="cue">{emomDone ? t('emomRest') : step.reps ? t('emomDo', { n: step.reps }) : t('emomHold', { n: step.hold })} · <b className="num-font" style={{ color: 'var(--ink)' }}>{clock(left)}</b></div>
                : <div className="cue">{L(ex.cue)}</div>}
              {flash ? <span className="chip flash">{flash}</span>
                : paused ? <span className="chip gold">{t('paused')}</span>
                : isLast ? <span className="chip gold">{t('lastOne')}</span>
                : step.loop ? <span className="muted small">{t('amrapGo')}</span>
                : upcoming && <span className="muted small">{t('next')}: {L(EX[upcoming.ex].name)}</span>}
            </div>
          </>
        ) : (
          <div className="stage" key={`${phase}-${i}`}>
            <h2 className="eyebrow">{phase === 'ready' ? t('getReady') : t('rest')}</h2>
            <div className="restnum" style={phase === 'rest' ? { color: 'var(--brand)' } : null}>{Math.max(0, left)}</div>
            {upcoming && (
              <div className="card row nextcard">
                <div className="figbox" style={{ width: 84, height: 84, position: 'relative' }}><Demo ex={EX[upcoming.ex]} size={84} /></div>
                <div className="grow">
                  <div className="eyebrow">{t('nextUp')}</div>
                  <b>{L(EX[upcoming.ex].name)}</b>
                  <div className="muted small"><Amount step={upcoming} /></div>
                </div>
              </div>
            )}
            {phase === 'rest' && <button className="btn sm ghost" onClick={() => { setLeft((l) => l + 15); setTotal((x) => x + 15) }}>{t('more15')}</button>}
          </div>
        )}

        <div className="dock">
          <button className="btn-circle" onClick={prev} aria-label={t('back')}><SkipBack size={22} /></button>
          {phase !== 'work' ? (
            <button className="btn-circle go" onClick={() => advance()} aria-label={phase === 'ready' ? t('start') : t('skip')}><Play size={30} fill="currentColor" /></button>
          ) : step.type === 'reps' ? (
            <button className="btn-circle go" onClick={() => advance(true)} aria-label={t('done')}><Check size={34} strokeWidth={3} /></button>
          ) : step.type === 'emom' ? (
            <button className="btn-circle go" onClick={emomTap} disabled={emomDone} style={emomDone ? { opacity: 0.35 } : null} aria-label={t('done')}><Check size={34} strokeWidth={3} /></button>
          ) : (
            <button className="btn-circle go" onClick={() => setPaused(!paused)} aria-label={paused ? t('resume') : t('pause')}>{paused ? <Play size={30} fill="currentColor" /> : <Pause size={30} fill="currentColor" />}</button>
          )}
          <button className="btn-circle" onClick={() => advance(false)} aria-label={t('skip')}><SkipForward size={22} /></button>
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
