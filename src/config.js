// Change the brand, prices and payment mode here.
export const APP = { name: 'OjasFit', storageKey: 'kasrat_v1', url: 'https://ojasfit.co.in/' }

export const PLANS = [
  { id: 'monthly', price: 99, months: 1, profiles: 3 },
  { id: 'yearly', price: 599, months: 12, profiles: 3, best: true },
  { id: 'family', price: 999, months: 12, profiles: 6 },
]

export const FREE_PROFILES = 2

// Payment mode:
//   'free'  — launch mode: everything is unlocked and no paywall, prices or Plus labels are shown.
//   'demo'  — shows the Plus paywall, but "Subscribe" unlocks Plus on this device without charging.
//   Real payments ('play' / 'razorpay') need a backend that verifies purchases first (see SHIP.md).
export const PAYMENTS = { mode: 'free', razorpayKey: '' }

// Accounts and cloud backup (Firebase). Paste the web app config from
// Firebase console → Project settings → Your apps. These values are public by design;
// access is protected by the rules in firestore.rules. While apiKey is empty the app
// runs without accounts, exactly as before.
export const FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
}
