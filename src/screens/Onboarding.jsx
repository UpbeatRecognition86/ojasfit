import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useStore, newProfile, dayStr, FREE_LAUNCH } from '../lib/store.jsx'
import { useT, LANGS } from '../lib/i18n.js'
import { JOURNEYS, JMAP, recommend } from '../data/journeys.js'
import { APP } from '../config.js'
import Glyph from '../components/Glyph.jsx'

const GOALS = [['lose', 'flame'], ['strong', 'dumbbell'], ['active', 'activity']]
const LEVELS = [['beginner', 'sprout'], ['inter', 'leaf'], ['advanced', 'tree']]
export const LIMITS = ['knees', 'back', 'shoulders', 'wrists']

export function JourneyOption({ j, on, onClick, badge }) {
  const { t, L } = useT()
  return (
    <button className={`opt ${on ? 'on' : ''}`} onClick={onClick}>
      <span className="jbadge" style={{ background: j.color + '1c', color: j.color }}><Glyph id={j.icon} size={26} /></span>
      <span className="grow">
        <b>{L(j.name)}</b>
        <span className="muted small">{L(j.tag)}</span>
        <span className="row wrap" style={{ gap: 6, marginTop: 6 }}>
          {badge && <span className="chip ok">{badge}</span>}
          <span className="chip plain">{t('weeksN', { n: j.weeks })}</span>
          {!FREE_LAUNCH && <span className={`chip ${j.premium ? 'gold' : 'ok'}`}>{j.premium ? t('week1Free') : t('free')}</span>}
        </span>
      </span>
    </button>
  )
}

export default function Onboarding({ add = false, onDone }) {
  const { state, update } = useStore()
  const { t } = useT()
  const steps = add ? ['who', 'goal', 'level', 'health', 'body', 'plan'] : ['lang', 'who', 'goal', 'level', 'health', 'body', 'plan']
  const [i, setI] = useState(0)
  const [d, setD] = useState({ name: '', goal: 'active', level: 'beginner', days: 3, limits: [], quiet: false, kg: '', cm: '' })
  const [jid, setJid] = useState(null)
  const set = (patch) => setD((x) => ({ ...x, ...patch }))
  const step = steps[i]

  const rec = recommend(d)
  const others = JOURNEYS.filter((j) => j.id !== rec).slice(0, 3)
  const chosen = jid && (jid === rec || others.some((j) => j.id === jid)) ? jid : rec

  const next = () => {
    if (i < steps.length - 1) return setI(i + 1)
    const p = newProfile({
      name: d.name.trim(), goal: d.goal, level: d.level, days: d.days, limits: d.limits, quiet: d.quiet,
      kg: Number(d.kg) || null, cm: Number(d.cm) || null, journeyId: chosen,
    })
    if (p.kg) p.weights.push({ date: dayStr(), kg: p.kg })
    update((s) => { s.profiles.push(p); s.activeId = p.id })
    onDone?.()
  }
  const back = () => (i > 0 ? setI(i - 1) : onDone?.())
  const toggleLimit = (id) => set({ limits: d.limits.includes(id) ? d.limits.filter((x) => x !== id) : [...d.limits, id] })
  const canNext = step !== 'who' || d.name.trim().length > 0

  return (
    <div className="screen plain">
      {step !== 'lang' && (
        <div className="topbar">
          {(i > 0 || add) && <button className="iconbtn" onClick={back} aria-label={t('back')}><ArrowLeft size={20} /></button>}
          <div className="progress-steps">{steps.map((s, n) => <i key={s} className={n <= i ? 'on' : ''} />)}</div>
        </div>
      )}

      {step === 'lang' && (
        <div className="stack center" style={{ marginTop: '12vh', gap: 16 }}>
          <img src="./icon.svg" alt="" className="logo" style={{ margin: '0 auto' }} />
          <h1>{APP.name}</h1>
          <p className="muted">Your home fitness coach<br />घर पर फ़िटनेस, आपके कोच के साथ</p>
          <h2 style={{ marginTop: 16 }}>Choose your language · अपनी भाषा चुनें</h2>
          {LANGS.map((l) => (
            <button key={l.code} className={`opt ${state.lang === l.code ? 'on' : ''}`} onClick={() => update((s) => { s.lang = l.code })}>
              <span className="grow"><b style={{ fontSize: '1.15rem' }}>{l.label}</b></span>
              {state.lang === l.code && <Check size={20} />}
            </button>
          ))}
        </div>
      )}

      {step === 'who' && (
        <>
          <div><h1>{t('whoTitle')}</h1><p className="muted">{t('whoSub')}</p></div>
          <input className="input" placeholder={t('namePh')} value={d.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} autoComplete="given-name" />
        </>
      )}

      {step === 'goal' && (
        <>
          <h1>{t('goalTitle')}</h1>
          <div className="stack">
            {GOALS.map(([id, emoji]) => (
              <button key={id} className={`opt ${d.goal === id ? 'on' : ''}`} onClick={() => set({ goal: id })}>
                <span className="opt-icon"><Glyph id={emoji} size={20} /></span>
                <span className="grow"><b>{t('goal_' + id)}</b><span className="muted small">{t(`goal_${id}_d`)}</span></span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'level' && (
        <>
          <h1>{t('levelTitle')}</h1>
          <div className="stack">
            {LEVELS.map(([id, emoji]) => (
              <button key={id} className={`opt ${d.level === id ? 'on' : ''}`} onClick={() => set({ level: id })}>
                <span className="opt-icon"><Glyph id={emoji} size={20} /></span>
                <span className="grow"><b>{t('level_' + id)}</b><span className="muted small">{t(`level_${id}_d`)}</span></span>
              </button>
            ))}
          </div>
          <div><h2 className="h3">{t('daysTitle')}</h2><p className="muted small">{t('daysSub')}</p></div>
          <div className="pills">
            {[2, 3, 4, 5, 6].map((n) => <button key={n} className={`pill ${d.days === n ? 'on' : ''}`} onClick={() => set({ days: n })}>{n}</button>)}
          </div>
        </>
      )}

      {step === 'health' && (
        <>
          <div><h1>{t('healthTitle')}</h1><p className="muted">{t('healthSub')}</p></div>
          <div className="stack">
            {LIMITS.map((id) => (
              <button key={id} className={`opt ${d.limits.includes(id) ? 'on' : ''}`} onClick={() => toggleLimit(id)}>
                <span className="grow"><b>{t('limit_' + id)}</b></span>{d.limits.includes(id) && <Check size={20} />}
              </button>
            ))}
            <button className={`opt ${d.limits.length === 0 ? 'on' : ''}`} onClick={() => set({ limits: [] })}>
              <span className="grow"><b>{t('limit_none')}</b></span>{d.limits.length === 0 && <Check size={20} />}
            </button>
          </div>
          <button className={`opt ${d.quiet ? 'on' : ''}`} onClick={() => set({ quiet: !d.quiet })} role="switch" aria-checked={d.quiet}>
            <span className="grow"><b>{t('quietHome')}</b><span className="muted small">{t('quietHomeD')}</span></span>
            <span className={`switch ${d.quiet ? 'on' : ''}`} />
          </button>
          <p className="note warn">{t('doctorNote')}</p>
        </>
      )}

      {step === 'body' && (
        <>
          <div><h1>{t('bodyTitle')} <span className="muted small">({t('optional')})</span></h1><p className="muted">{t('bodySub')}</p></div>
          <label className="field">{t('kg')}<input className="input" inputMode="decimal" value={d.kg} onChange={(e) => set({ kg: e.target.value.replace(/[^\d.]/g, '').slice(0, 5) })} /></label>
          <label className="field">{t('cm')}<input className="input" inputMode="numeric" value={d.cm} onChange={(e) => set({ cm: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></label>
        </>
      )}

      {step === 'plan' && (
        <>
          <div><h1>{t('planTitle')}</h1><p className="muted">{t('planSub')}</p></div>
          <JourneyOption j={JMAP[rec]} on={chosen === rec} onClick={() => setJid(rec)} badge={t('recommended')} />
          {others.length > 0 && <h2 className="h3">{t('otherOptions')}</h2>}
          {others.map((j) => <JourneyOption key={j.id} j={j} on={chosen === j.id} onClick={() => setJid(j.id)} />)}
        </>
      )}

      <div className="spacer" />
      <button className="btn" disabled={!canNext || (step === 'lang' && !state.lang)} onClick={next}>
        {step === 'plan' ? t('letsGo') : step === 'lang' ? 'Continue · आगे बढ़ें' : t('continue')}
      </button>
    </div>
  )
}
