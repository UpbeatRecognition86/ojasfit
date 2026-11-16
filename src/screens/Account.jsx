import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Mail, Smartphone, Check } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { useT, LANGS } from '../lib/i18n.js'
import { useAccount } from '../lib/account.jsx'
import * as cloud from '../lib/cloud.js'
import { APP } from '../config.js'

const GoogleG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

const tenDigits = (v) => v.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '').slice(0, 10)
const validMobile = (v) => /^[6-9]\d{9}$/.test(v)
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

function LangPills() {
  const { state, update } = useStore()
  const cur = state.lang || 'en'
  return (
    <div className="seg" style={{ width: 'auto', alignSelf: 'flex-end' }} role="group" aria-label="Language · भाषा">
      {LANGS.map((l) => <button key={l.code} className={cur === l.code ? 'on' : ''} style={{ padding: '6px 12px' }} onClick={() => update((s) => { s.lang = l.code })}>{l.label}</button>)}
    </div>
  )
}

export function Splash({ text, onRetry }) {
  return (
    <div className="screen plain center" style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <img src="./icon.svg" alt="" className="logo" style={{ margin: '0 auto' }} />
      {text && <p className="muted" role="status">{text}</p>}
      {onRetry && <RetryButton onRetry={onRetry} />}
    </div>
  )
}

function RetryButton({ onRetry }) {
  const { t } = useT()
  return <button className="btn ghost" style={{ maxWidth: 260, margin: '0 auto' }} onClick={onRetry}>{t('tryAgain')}</button>
}

export function SignIn() {
  const { state, update } = useStore()
  const { t } = useT()
  const [mode, setMode] = useState('pick') // pick | phone | code | email
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [wait, setWait] = useState(0)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [create, setCreate] = useState(true)
  const confirmRef = useRef(null)
  const sendBtn = useRef(null)

  useEffect(() => { if (!state.lang) update((s) => { s.lang = 'en' }) }, [state.lang, update])
  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const run = async (fn) => {
    setBusy(true); setErr(''); setInfo('')
    try { await fn() } catch (e) { const k = cloud.errorKey(e); if (k) setErr(t(k)) }
    setBusy(false)
  }
  const go = (m) => { setMode(m); setErr(''); setInfo('') }

  const sendCode = () => run(async () => {
    confirmRef.current = await cloud.sendPhoneCode('+91' + mobile, sendBtn.current)
    setCode(''); setWait(30); setMode('code')
  })
  const verify = () => run(async () => { await confirmRef.current.confirm(code) })
  const emailGo = () => run(() => cloud.emailSignIn(email.trim(), pw, create))
  const reset = () => {
    if (!validEmail(email)) return setErr(t('authErrEmail'))
    run(async () => { await cloud.emailReset(email.trim()); setInfo(t('resetSent', { e: email.trim() })) })
  }

  return (
    <div className="screen plain">
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        {mode !== 'pick'
          ? <button className="iconbtn" onClick={() => go(mode === 'code' ? 'phone' : 'pick')} aria-label={t('back')}><ArrowLeft size={20} /></button>
          : <span />}
        <LangPills />
      </div>

      {mode === 'pick' && (
        <>
          <div className="stack center" style={{ marginTop: '6vh', gap: 12 }}>
            <img src="./icon.svg" alt="" className="logo" style={{ margin: '0 auto' }} />
            <h1>{t('welcomeTo', { app: APP.name })}</h1>
            <p className="muted">{t('signInSub')}</p>
          </div>
          <div className="spacer" />
          <div className="stack">
            <button className="btn plain-case google" disabled={busy} onClick={() => run(cloud.signInGoogle)}><GoogleG /> {t('withGoogle')}</button>
            <button className="btn ghost plain-case" disabled={busy} onClick={() => go('phone')}><Smartphone size={20} /> {t('withPhone')}</button>
            <button className="btn ghost plain-case" disabled={busy} onClick={() => go('email')}><Mail size={20} /> {t('withEmail')}</button>
          </div>
        </>
      )}

      {mode === 'phone' && (
        <>
          <div><h1>{t('phoneTitle')}</h1><p className="muted">{t('phoneSub')}</p></div>
          <label className="field">{t('mobile')}
            <span className="input row" style={{ gap: 8 }}>
              <b className="muted">+91</b>
              <input style={{ flex: 1, minWidth: 0 }} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(tenDigits(e.target.value))} autoFocus />
            </span>
          </label>
          <div className="spacer" />
        </>
      )}
      {/* The invisible reCAPTCHA stays attached to this button for the life of the screen. */}
      <button ref={sendBtn} className="btn" style={mode === 'phone' ? undefined : { display: 'none' }} disabled={busy || !validMobile(mobile)} onClick={sendCode}>{busy ? t('sending') : t('sendCode')}</button>

      {mode === 'code' && (
        <>
          <div><h1>{t('codeTitle')}</h1><p className="muted">{t('codeSub', { n: '+91 ' + mobile.slice(0, 5) + ' ' + mobile.slice(5) })}</p></div>
          <input className="input otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus aria-label={t('codeTitle')} />
          <button className="link small" style={{ alignSelf: 'flex-start', padding: '8px 0' }} disabled={wait > 0 || busy} onClick={() => go('phone')}>
            {wait > 0 ? t('resendIn', { n: wait }) : t('resend')}
          </button>
          <div className="spacer" />
          <button className="btn" disabled={busy || code.length !== 6} onClick={verify}>{t('verify')}</button>
        </>
      )}

      {mode === 'email' && (
        <>
          <div><h1>{create ? t('emailCreate') : t('emailSignIn')}</h1></div>
          <label className="field">{t('email')}<input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></label>
          <label className="field">{t('password')}<input className="input" type="password" autoComplete={create ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} />
            {create && <span className="muted small">{t('pwRule')}</span>}
          </label>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button className="link small" style={{ padding: '8px 0' }} onClick={() => { setCreate(!create); setErr('') }}>{create ? t('haveAccount') : t('newHere')}</button>
            {!create && <button className="link small" style={{ padding: '8px 0' }} onClick={reset}>{t('forgotPw')}</button>}
          </div>
          <div className="spacer" />
          <button className="btn" disabled={busy || !validEmail(email) || pw.length < 6} onClick={emailGo}>{create ? t('createAccount') : t('signIn')}</button>
        </>
      )}

      {err && <p className="note warn" role="alert">{err}</p>}
      {info && <p className="note ok" role="status">{info}</p>}
      <p className="muted small center">{t('agreePrivacy')} <a className="link" href="./privacy.html" target="_blank" rel="noopener">{t('privacy')}</a></p>
    </div>
  )
}

// Asked once after the first sign-in: name and both ways to reach the person.
export function Details() {
  const { t } = useT()
  const { user, account, setAccount } = useAccount()
  const [name, setName] = useState(account?.name || user.name || '')
  const [mobile, setMobile] = useState(tenDigits(account?.phone || user.phone || ''))
  const [email, setEmail] = useState(account?.email || user.email || '')
  const [updates, setUpdates] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const phoneFixed = !!user.phone
  const emailFixed = !!user.email
  const ok = name.trim() && validMobile(mobile) && (!email.trim() || validEmail(email))

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await setAccount({ name: name.trim(), phone: '+91' + mobile, email: email.trim().toLowerCase(), updates })
    } catch (e) { setErr(t(cloud.errorKey(e) || 'authErrGeneric')); setBusy(false) }
  }

  return (
    <div className="screen plain">
      <div style={{ marginTop: 24 }}><h1>{t('detailsTitle')}</h1><p className="muted">{t('detailsSub')}</p></div>
      <label className="field">{t('fullName')}<input className="input" autoComplete="name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field">{t('mobile')}
        <span className="input row" style={{ gap: 8, opacity: phoneFixed ? 0.7 : 1 }}>
          <b className="muted">+91</b>
          <input style={{ flex: 1, minWidth: 0 }} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={mobile} readOnly={phoneFixed} onChange={(e) => setMobile(tenDigits(e.target.value))} />
          {phoneFixed && <Check size={18} color="var(--ok)" aria-label={t('verified')} />}
        </span>
      </label>
      <label className="field">{emailFixed ? t('email') : <span>{t('email')} <span className="muted small">({t('optional')})</span></span>}
        <span className="input row" style={{ gap: 8, opacity: emailFixed ? 0.7 : 1 }}>
          <input style={{ flex: 1, minWidth: 0 }} type="email" inputMode="email" autoComplete="email" value={email} readOnly={emailFixed} onChange={(e) => setEmail(e.target.value)} />
          {emailFixed && <Check size={18} color="var(--ok)" aria-label={t('verified')} />}
        </span>
      </label>
      <button className={`opt ${updates ? 'on' : ''}`} onClick={() => setUpdates(!updates)} role="checkbox" aria-checked={updates}>
        <span className="grow"><b>{t('updatesTitle')}</b><span className="muted small">{t('updatesSub')}</span></span>
        <span className={`switch ${updates ? 'on' : ''}`} />
      </button>
      {err && <p className="note warn" role="alert">{err}</p>}
      <div className="spacer" />
      <button className="btn" disabled={busy || !ok} onClick={save}>{t('continue')}</button>
    </div>
  )
}
