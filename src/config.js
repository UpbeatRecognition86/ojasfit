// Change the brand, prices and payment mode here.
export const APP = { name: 'OjasFit', storageKey: 'kasrat_v1', url: 'https://ojasfit.co.in/' }

export const PLANS = [
  { id: 'monthly', price: 99, months: 1, profiles: 3 },
  { id: 'yearly', price: 599, months: 12, profiles: 3, best: true },
  { id: 'family', price: 999, months: 12, profiles: 6 },
]

export const FREE_PROFILES = 2

// 'demo' unlocks Plus on this device without charging anything.
// Switch to 'razorpay' only after a backend creates and verifies orders (see README).
export const PAYMENTS = { mode: 'demo', razorpayKey: '' }
