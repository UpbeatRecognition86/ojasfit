# OjasFit — your home fitness coach

A guided home-workout app for the Indian mass market: an adaptive coach, multi-week **journeys**,
no equipment, Hindi + English, several family members on one phone.

Live at **https://ojasfit.co.in**.

## What is in it

- **One adaptive Coach** — not age-specific. You pick a goal, level and how many days a week you
  train; the Coach plans each week around that and scales it to your "too easy / too hard" feedback
- **10 journeys** (multi-week programs): first steps, walking, Surya Namaskar, fat loss,
  dand-baithak strength, easy-on-joints, chair fit, women's strength, desk detox, wedding prep
- **Peaks** — the Freeletics "God/Hell" idea: fixed, named workouts (Nilgiri, Aravalli, Sahyadri,
  Vindhya, Nanda Devi, Kanchenjunga) done **for time**. The work never changes, so a faster time is
  real, measurable progress. Personal best stored per peak.
- Moves are swapped automatically for knee, back, shoulder pain, "no jumping", or difficulty
  getting on the floor
- **Guided player** — animated figure, ring timer, halfway and switch-sides cues, vibration, rest
  screens, spoken coaching in Hindi or English
- **Session options** — "Short on time" trims any session; "Quiet mode" removes jumping for flats
  and late nights. Swapped moves are labelled so the adaptation is visible
- **Coach messages** — the Coach explains what it changed and why (after feedback, a gap, a streak)
- **Family profiles**, streaks, points and ranks, badges, weight log, BMI with Indian cut-offs,
  water tracker, WhatsApp sharing
- **Freemium paywall** — 3 free journeys, free Peaks, week 1 of every other journey free, Plus at ₹99/month,
  ₹599/year, ₹999/year family
- Installable PWA that works offline; all data stays on the phone

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm run build
```

Every push to `main` builds the app and publishes it to GitHub Pages (`.github/workflows/deploy.yml`), served at ojasfit.co.in.

## Where things are

| What | File |
| --- | --- |
| Name, prices, payment mode | `src/config.js` |
| Exercises (names, cues, swaps) | `src/data/exercises.js` |
| Journeys, quick workouts, Peaks | `src/data/journeys.js` |
| Session generator and progression | `src/lib/plan.js` |
| All UI text, both languages | `src/lib/i18n.js` |
| Stick-figure poses | `src/components/Figure.jsx` |

## Before charging real money

Payments run in **demo mode**: the Plus button unlocks on the device and charges nothing.
To go live you still need:

1. **Accounts + backend** (e.g. Firebase or Supabase) with phone-OTP login, so purchases and
   history survive a phone change.
2. **Razorpay subscriptions** (UPI AutoPay) with server-side order creation and signature
   verification — see `src/lib/payments.js`. Play Store distribution requires Google Play Billing
   for digital subscriptions instead.
3. **Play Store build** — wrap this PWA with Capacitor or a Trusted Web Activity.
4. **Legal** — privacy policy and terms; verifiable parental consent for under-18 profiles under
   the DPDP Act once any data leaves the device.
5. **Content review** — have a certified trainer or physiotherapist review the senior, kids and
   pain-related programs, and replace the stick figures with filmed demonstrations.
