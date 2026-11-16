import { useRef, useState } from 'react'
import { ArrowLeft, Check, Crown, Plus, Trash2, Share2, Download, Upload, Pencil } from 'lucide-react'
import { useStore, activeProfile, stats, isPlus, maxProfiles, dayStr, addDays, weekStart, badges, rank, FREE_LAUNCH } from '../lib/store.jsx'
import { useT, LANGS } from '../lib/i18n.js'
import { JMAP, PMAP } from '../data/journeys.js'
import { APP, PLANS, PAYMENTS } from '../config.js'
import { purchase } from '../lib/payments.js'
import { LIMITS } from './Onboarding.jsx'
import Glyph from '../components/Glyph.jsx'
import Sheet from '../components/Sheet.jsx'
import { weeklyMinutes } from '../lib/coach.js'
import { PEAKS, SPLITS, LENGTHS, pbKey } from '../data/journeys.js'

import { clock } from './Session.jsx'

function bmiInfo(kg, cm) {
  if (!kg || !cm) return null
  const v = kg / (cm / 100) ** 2
  return { v: v.toFixed(1), key: v < 18.5 ? 'under' : v < 23 ? 'normal' : v < 25 ? 'over' : 'obese' }
}

function WeightChart({ points }) {
  if (points.length < 2) return null
  const pts = points.slice(-12)
  const min = Math.min(...pts.map((p) => p.kg)) - 1
  const max = Math.max(...pts.map((p) => p.kg)) + 1
  const xy = pts.map((p, i) => [8 + (i / (pts.length - 1)) * 284, 8 + (1 - (p.kg - min) / (max - min)) * 74])
  return (
    <svg viewBox="0 0 300 90" width="100%" role="img" aria-label="weight trend">
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--brand)" />)}
    </svg>
  )
}

export function Progress() {
  const { state, update } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const st = stats(p)
  const today = dayStr()
  const [kg, setKg] = useState('')
  const start = addDays(weekStart(), -77)
  const cells = Array.from({ length: 84 }, (_, n) => addDays(start, n))
  const latest = p.weights.length ? p.weights[p.weights.length - 1].kg : p.kg
  const bmi = bmiInfo(latest, p.cm)
  const r = rank(p.points)
  const wk = weeklyMinutes(p, 8)
  const wkMax = Math.max(30, ...wk.map((w) => w.minutes))
  const bests = PEAKS.flatMap((x) => SPLITS.map((sp) => ({ ...x, sp, time: (p.pbs || {})[pbKey(x.id, sp)] }))).filter((x) => x.time)
  const logWeight = () => {
    const v = Number(kg)
    if (!(v >= 10 && v <= 300)) return
    update((s) => {
      const pp = activeProfile(s)
      pp.weights = pp.weights.filter((w) => w.date !== today)
      pp.weights.push({ date: today, kg: v })
      pp.kg = v
    })
    setKg('')
  }
  return (
    <div className="screen">
      <div className="row between"><h1>{t('tab_progress')}</h1><span className="chip">{L(r)} · {p.points}</span></div>
      <div className="tiles">
        <div className="tile"><b>{st.workouts}</b><span className="muted small">{t('workouts')}</span></div>
        <div className="tile"><b>{st.minutes}</b><span className="muted small">{t('minutes')}</span></div>
        <div className="tile"><b>{st.kcal}</b><span className="muted small">{t('calories')}</span></div>
        <div className="tile"><b>{st.best}</b><span className="muted small">{t('bestStreak')}</span></div>
      </div>

      <div className="card stack">
        <div className="row between"><h2 className="h3">{t('weeklyMin')}</h2>{wk[7].minutes > wk[6].minutes && wk[6].minutes > 0 && <span className="chip ok">+{wk[7].minutes - wk[6].minutes} {t('min')}</span>}</div>
        <div className="bars">
          {wk.map((w, n) => (
            <div key={w.start} className={`${n === 7 ? 'now' : ''} ${w.minutes ? 'has' : ''}`}>
              <span>{w.minutes || ''}</span>
              <i style={{ height: `${(w.minutes / wkMax) * 78}%` }} />
              <span>{w.start.slice(8)}/{w.start.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </div>

      {bests.length > 0 && (
        <div className="card">
          <h2 className="h3">{t('yourBests')}</h2>
          <div className="list">
            {bests.map((x) => <div className="li" key={x.id + x.sp}><span className="grow"><b>{L(x.name)}</b> <span className="chip plain">{t('split_' + x.sp)}</span></span><b className="num-font">{clock(x.time)}</b></div>)}
          </div>
        </div>
      )}

      <div className="card stack">
        <h2 className="h3">{t('last12')}</h2>
        <div className="heat">{cells.map((d) => <i key={d} className={`${st.days.has(d) ? 'on' : ''} ${d > today ? 'future' : ''}`} />)}</div>
      </div>

      <div className="card stack">
        <div className="row between"><h2 className="h3">{t('weight')}</h2>{latest && <b>{latest} kg</b>}</div>
        <WeightChart points={p.weights} />
        {p.weights.length < 2 && <p className="muted small">{t('noWeight')}</p>}
        <div className="row">
          <input className="input grow" inputMode="decimal" placeholder={t('kg')} value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))} />
          <button className="btn sm" style={{ minHeight: 52 }} onClick={logWeight}>{t('logWeight')}</button>
        </div>
        {bmi && (
          <div className="note">
            <b>{t('bmi')} {bmi.v}</b> · {t('bmi_' + bmi.key)}
            <div className="muted small">{t('bmiNote')}</div>
          </div>
        )}
      </div>

      <div className="card stack">
        <h2 className="h3">{t('badges')}</h2>
        <div className="badges">{badges(p).map((b) => <div key={b.id} className={`badge ${b.got ? 'got' : ''}`}><span><Glyph id={b.icon} size={24} /></span>{L(b)}</div>)}</div>
      </div>

      <div className="card">
        <h2 className="h3">{t('history')}</h2>
        {p.history.length === 0 && <p className="muted small" style={{ marginTop: 8 }}>{t('noHistory')}</p>}
        <div className="list">
          {p.history.slice(-10).reverse().map((h) => {
            const src = JMAP[h.jid] || PMAP[h.pid]
            return (
              <div className="li" key={h.id}>
                <span className="jbadge sm" style={src?.color ? { background: src.color + '1c', color: src.color } : null}><Glyph id={src?.icon || 'activity'} size={20} /></span>
                <span className="grow"><b>{L(h.title)}</b><span className="muted small" style={{ display: 'block' }}>{h.date} · {h.pid ? clock(h.time ?? h.seconds) : `${h.minutes} ${t('min')}`} · {h.kcal} {t('kcal')}{h.pb ? ' · 🏆' : ''}</span></span>
                <span className="chip gold">+{h.points}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange }) {
  return (
    <button className="li" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="grow">{label}</span><span className={`switch ${on ? 'on' : ''}`} />
    </button>
  )
}

function EditSheet({ onClose }) {
  const { state, update } = useStore()
  const { t } = useT()
  const p = activeProfile(state)
  const [d, setD] = useState({ name: p.name, level: p.level, days: p.days, limits: p.limits, quiet: !!p.quiet, length: p.length || 45, kg: p.kg || '', cm: p.cm || '' })
  const set = (patch) => setD((x) => ({ ...x, ...patch }))
  const save = () => {
    update((s) => {
      const pp = activeProfile(s)
      Object.assign(pp, { name: d.name.trim() || pp.name, level: d.level, days: d.days, limits: d.limits, quiet: d.quiet, length: d.length, kg: Number(d.kg) || null, cm: Number(d.cm) || null })
    })
    onClose()
  }
  return (
    <Sheet onClose={onClose}>
        <input className="input" value={d.name} maxLength={24} placeholder={t('namePh')} onChange={(e) => set({ name: e.target.value })} />
        <h2 className="h3">{t('levelTitle')}</h2>
        <div className="pills">{['beginner', 'inter', 'advanced'].map((l) => <button key={l} className={`pill ${d.level === l ? 'on' : ''}`} onClick={() => set({ level: l })}>{t('level_' + l)}</button>)}</div>
        <h2 className="h3">{t('daysTitle')}</h2>
        <div className="pills">{[2, 3, 4, 5, 6].map((n) => <button key={n} className={`pill ${d.days === n ? 'on' : ''}`} onClick={() => set({ days: n })}>{n}</button>)}</div>
        <h2 className="h3">{t('lengthTitle')}</h2>
        <div className="seg">{LENGTHS.map((n) => <button key={n} className={d.length === n ? 'on' : ''} onClick={() => set({ length: n })}>{t('lengthN', { n })}</button>)}</div>
        <h2 className="h3">{t('healthTitle')}</h2>
        <div className="pills">
          {LIMITS.map((id) => (
            <button key={id} className={`pill ${d.limits.includes(id) ? 'on' : ''}`} onClick={() => set({ limits: d.limits.includes(id) ? d.limits.filter((x) => x !== id) : [...d.limits, id] })}>{t('limit_' + id)}</button>
          ))}
        </div>
        <button className={`opt ${d.quiet ? 'on' : ''}`} onClick={() => set({ quiet: !d.quiet })} role="switch" aria-checked={d.quiet}>
          <span className="grow"><b>{t('quietHome')}</b><span className="muted small">{t('quietHomeD')}</span></span>
          <span className={`switch ${d.quiet ? 'on' : ''}`} />
        </button>
        <div className="row">
          <label className="field grow">{t('kg')}<input className="input" inputMode="decimal" value={d.kg} onChange={(e) => set({ kg: e.target.value.replace(/[^\d.]/g, '').slice(0, 5) })} /></label>
          <label className="field grow">{t('cm')}<input className="input" inputMode="numeric" value={d.cm} onChange={(e) => set({ cm: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></label>
        </div>
        <button className="btn" onClick={save}>{t('save')}</button>
        <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
    </Sheet>
  )
}

export function Profile({ nav }) {
  const { state, update, replace } = useStore()
  const { t, L } = useT()
  const p = activeProfile(state)
  const plus = isPlus(state)
  const limit = maxProfiles(state)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')
  const file = useRef(null)
  const setting = (k) => (v) => update((s) => { s.settings[k] = v })
  const url = APP.url || location.origin + location.pathname
  const invite = t('inviteText', { app: APP.name, url })

  const remove = (m) => {
    if (!confirm(t('removeAsk', { n: m.name }))) return
    update((s) => {
      s.profiles = s.profiles.filter((x) => x.id !== m.id)
      if (s.activeId === m.id) s.activeId = s.profiles[0]?.id || null
    })
  }
  const exportData = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }))
    a.download = `${APP.name.toLowerCase()}-backup-${dayStr()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importData = async (e) => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (!Array.isArray(data.profiles) || !data.profiles.length || !data.profiles.every((x) => x.id && Array.isArray(x.history))) throw new Error('bad')
      replace(data)
      setMsg('')
    } catch { setMsg(t('importBad')) }
  }

  return (
    <div className="screen">
      <h1>{t('tab_profile')}</h1>

      <div className="card">
        <h2 className="h3">{t('family')}</h2>
        <div className="list">
          {state.profiles.map((m) => (
            <div className="li" key={m.id}>
              <button className="row grow" onClick={() => update((s) => { s.activeId = m.id })}>
                <span className="avatar sm">{m.name[0]?.toUpperCase()}</span>
                <span className="grow"><b>{m.name}</b><span className="muted small" style={{ display: 'block' }}>{t('level_' + m.level)}{JMAP[m.journeyId] ? ` · ${L(JMAP[m.journeyId].name)}` : ''}</span></span>
                {m.id === p.id && <span className="chip ok"><Check size={12} /> {t('active')}</span>}
              </button>
              {m.id === p.id
                ? <button className="iconbtn" onClick={() => setEditing(true)} aria-label="edit"><Pencil size={18} /></button>
                : <button className="iconbtn" onClick={() => remove(m)} aria-label={t('remove')}><Trash2 size={18} /></button>}
            </div>
          ))}
        </div>
        {state.profiles.length < limit ? (
          <button className="btn soft" style={{ marginTop: 10 }} onClick={() => nav.go('addProfile')}><Plus size={18} /> {t('addMember')}</button>
        ) : (
          FREE_LAUNCH
            ? <p className="note" style={{ marginTop: 10 }}>{t('memberMax', { n: limit })}</p>
            : <button className="note" style={{ marginTop: 10, width: '100%' }} onClick={() => nav.go('paywall')}>{t('memberLimit', { n: limit })}</button>
        )}
      </div>

      {!FREE_LAUNCH && <button className="card tap" style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => nav.go("paywall")}>
        <Crown size={24} color="var(--gold)" />
        <span className="grow"><b>{t('membership')}</b><span className="muted small" style={{ display: 'block' }}>{plus ? t('plusUntil', { d: state.premium.until }) : t('freePlan')}</span></span>
        <span className="chip gold">{plus ? t('manage') : t('upgrade')}</span>
      </button>}

      <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(invite)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><Share2 size={18} /> {t('inviteTitle')}</a>

      <div className="card">
        <h2 className="h3">{t('settings')}</h2>
        <div className="list">
          <div className="li">
            <span className="grow">{t('language')}</span>
            <div className="pills">{LANGS.map((l) => <button key={l.code} className={`pill ${state.lang === l.code ? 'on' : ''}`} onClick={() => update((s) => { s.lang = l.code })}>{l.label}</button>)}</div>
          </div>
          <Toggle label={t('voice')} on={state.settings.voice} onChange={setting('voice')} />
          <Toggle label={t('sound')} on={state.settings.sound} onChange={setting('sound')} />
          <Toggle label={t('bigText')} on={state.settings.bigText} onChange={setting('bigText')} />
        </div>
      </div>

      <div className="card stack">
        <h2 className="h3">{t('data')}</h2>
        <p className="muted small">{t('dataNote')}</p>
        <button className="btn ghost" onClick={exportData}><Download size={18} /> {t('export')}</button>
        <button className="btn ghost" onClick={() => file.current.click()}><Upload size={18} /> {t('import')}</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={importData} />
        {msg && <p className="note warn">{msg}</p>}
        <button className="link small" style={{ alignSelf: 'center', padding: 10 }} onClick={() => { if (confirm(t('resetAsk'))) replace({}) }}>{t('reset')}</button>
      </div>

      <p className="muted small center">{t('disclaimer')}</p>
      <a className="link small center" href="./privacy.html" target="_blank" rel="noopener" style={{ padding: 8 }}>{t('privacy')}</a>
      {editing && <EditSheet onClose={() => setEditing(false)} />}
    </div>
  )
}

export function Paywall({ nav }) {
  const { state, update } = useStore()
  const { t } = useT()
  const plus = isPlus(state)
  const [pick, setPick] = useState('yearly')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const plan = PLANS.find((x) => x.id === pick)
  const buy = async () => {
    setBusy(true); setErr('')
    try {
      await purchase(plan)
      update((s) => { s.premium = { plan: plan.id, since: dayStr(), until: addDays(dayStr(), Math.round(plan.months * 30.5)) } })
    } catch { setErr(t('payFail')) }
    setBusy(false)
  }
  return (
    <div className="screen plain">
      <div className="topbar"><button className="iconbtn" onClick={nav.back} aria-label={t('back')}><ArrowLeft size={20} /></button></div>
      <div className="center stack">
        <Crown size={44} color="var(--gold)" style={{ margin: '0 auto' }} />
        <h1>{t('pwTitle', { app: APP.name })}</h1>
        <p className="muted">{t('pwSub')}</p>
      </div>
      <div className="card stack">
        {['pw1', 'pw2', 'pw3', 'pw4'].map((k) => <div className="row" key={k}><Check size={18} color="var(--ok)" style={{ flex: 'none' }} /><span>{t(k)}</span></div>)}
      </div>

      {plus ? (
        <>
          <div className="note center"><b>{t('plusOn')}</b><br />{t('plusUntil', { d: state.premium.until })}</div>
          <div className="spacer" />
          {PAYMENTS.mode === 'demo' && <button className="btn ghost" onClick={() => update((s) => { s.premium = null })}>{t('cancelPlus')}</button>}
        </>
      ) : (
        <>
          {PLANS.map((pl) => (
            <button key={pl.id} className={`plan ${pick === pl.id ? 'on' : ''}`} onClick={() => setPick(pl.id)}>
              <span className="radio" />
              <span className="grow">
                <b>{t('plan_' + pl.id)}</b> {pl.best && <span className="chip ok">{t('bestValue')}</span>}
                <span className="muted small" style={{ display: 'block' }}>
                  {t('profilesN', { n: pl.profiles })}{pl.months > 1 ? ` · ${t('onlyPerMonth', { n: Math.round(pl.price / pl.months) })}` : ''}
                </span>
              </span>
              <span style={{ textAlign: 'right' }}><span className="price">₹{pl.price}</span><span className="muted small" style={{ display: 'block' }}>{pl.months > 1 ? t('perYear') : t('perMonth')}</span></span>
            </button>
          ))}
          {err && <p className="note warn">{err}</p>}
          <div className="spacer" />
          {PAYMENTS.mode === 'demo' && <p className="note warn small">{t('demoNote')}</p>}
          <button className="btn" disabled={busy} onClick={buy}>{t('subscribe', { n: plan.price })}</button>
        </>
      )}
    </div>
  )
}
