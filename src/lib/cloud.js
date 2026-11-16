// Accounts and cloud backup on Firebase (Auth + Firestore).
// The SDK is loaded only when accounts are switched on in config.js, and only after the first paint.
import { FIREBASE } from '../config.js'

const EMU = import.meta.env.VITE_FIREBASE_EMULATOR // e.g. "localhost" for local testing
const CONFIG = EMU ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-ojasfit', appId: 'demo' } : FIREBASE

export const ACCOUNTS_ON = !!CONFIG.apiKey

// One shared start-up, even when several callers ask at once.
let sdk = null
const fb = () => (sdk ||= start())
async function start() {
  const [{ initializeApp }, auth, store] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
  const app = initializeApp(CONFIG)
  const a = auth.initializeAuth(app, {
    persistence: [auth.indexedDBLocalPersistence, auth.browserLocalPersistence],
    popupRedirectResolver: auth.browserPopupRedirectResolver,
  })
  // Keeps a local copy so reads work offline and writes made offline are sent later.
  const db = store.initializeFirestore(app, { localCache: store.persistentLocalCache() })
  if (EMU) {
    auth.connectAuthEmulator(a, `http://${EMU}:9099`, { disableWarnings: true })
    store.connectFirestoreEmulator(db, EMU, 8080)
  }
  return { auth, store, a, db }
}

// Calls back with the signed-in user (or null) whenever it changes.
export async function watchUser(cb) {
  const { auth, a } = await fb()
  return auth.onAuthStateChanged(a, (u) => cb(u ? describe(u) : null))
}

function describe(u) {
  const via = u.providerData[0]?.providerId || 'password'
  return { uid: u.uid, name: u.displayName || '', email: u.email || '', phone: u.phoneNumber || '', via }
}

// ---------- sign-in methods ----------
export async function signInGoogle() {
  const { auth, a } = await fb()
  const provider = new auth.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await auth.signInWithPopup(a, provider)
  } catch (e) {
    // Some in-app browsers block popups; a full-page redirect works everywhere.
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return auth.signInWithRedirect(a, provider)
    throw e
  }
}

let verifier = null, verifierEl = null
// Sends an SMS code. `button` is the element the invisible reCAPTCHA attaches to.
export async function sendPhoneCode(number, button) {
  const { auth, a } = await fb()
  a.languageCode = document.documentElement.lang || 'en'
  // A new sign-in screen (after signing out) has a new button, so the old widget is stale.
  if (verifier && verifierEl !== button) { verifier.clear(); verifier = null }
  if (!verifier) { verifier = new auth.RecaptchaVerifier(a, button, { size: 'invisible' }); verifierEl = button }
  try {
    return await auth.signInWithPhoneNumber(a, number, verifier)
  } catch (e) {
    verifier.clear(); verifier = null
    throw e
  }
}

export async function emailSignIn(email, password, create) {
  const { auth, a } = await fb()
  return create ? auth.createUserWithEmailAndPassword(a, email, password) : auth.signInWithEmailAndPassword(a, email, password)
}

export async function emailReset(email) {
  const { auth, a } = await fb()
  a.languageCode = document.documentElement.lang || 'en'
  return auth.sendPasswordResetEmail(a, email)
}

export async function signOut() {
  const { auth, a } = await fb()
  return auth.signOut(a)
}

// ---------- the user's document: users/{uid} ----------
// { account: { name, email, phone, updates, created }, data: "<app state as JSON>", savedAt }
async function ref(uid) {
  const { store, db } = await fb()
  return store.doc(db, 'users', uid)
}

export async function loadUser(uid) {
  const { store } = await fb()
  const snap = await store.getDoc(await ref(uid))
  if (!snap.exists()) return null
  const d = snap.data()
  let data = null
  try { data = d.data ? JSON.parse(d.data) : null } catch { /* unreadable backup: treat as none */ }
  return { account: d.account || null, data }
}

export async function saveAccount(uid, account) {
  const { store } = await fb()
  return store.setDoc(await ref(uid), { account }, { merge: true })
}

export async function saveData(uid, state) {
  const { store } = await fb()
  return store.setDoc(await ref(uid), { data: JSON.stringify(state), savedAt: store.serverTimestamp() }, { merge: true })
}

// Deletes the backup and the sign-in. Google requires a recent sign-in for this;
// the caller handles 'auth/requires-recent-login' by asking the user to sign in again.
export async function deleteAccount() {
  const { store, a } = await fb()
  const u = a.currentUser
  if (!u) return
  await store.deleteDoc(await ref(u.uid))
  await u.delete()
}

// Turns Firebase error codes into the i18n key of a message people can act on.
export function errorKey(e) {
  const c = e?.code || ''
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return null
  if (c.includes('network')) return 'authErrNetwork'
  if (c.includes('invalid-phone')) return 'authErrPhone'
  if (c.includes('invalid-verification-code') || c.includes('code-expired')) return 'authErrCode'
  if (c.includes('too-many-requests') || c.includes('quota')) return 'authErrMany'
  if (c.includes('email-already-in-use')) return 'authErrEmailUsed'
  if (c.includes('invalid-email')) return 'authErrEmail'
  if (c.includes('weak-password')) return 'authErrWeak'
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'authErrLogin'
  if (c.includes('account-exists-with-different-credential')) return 'authErrOther'
  return 'authErrGeneric'
}
