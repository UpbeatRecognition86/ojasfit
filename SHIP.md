# Shipping OjasFit: Play Store + freemium paywall

This is the real path from the current PWA to a paid app on the Play Store. It is ordered
by effort-to-value. Steps 1–2 you can do this week; 3–5 are the real launch.

> **Licensing note on the five reference repos.** wger, Ryot and SparkyFitness are copyleft
> (GPL / AGPL). Copying their **code** into OjasFit would legally oblige you to open-source all
> of OjasFit and give the source to your users — incompatible with a paid, closed app. Do not
> paste their code in. Two things are safe: (a) **ideas** — feature concepts aren't
> copyrightable; (b) **openly-licensed data** — e.g. wger's exercise database is CC-BY-SA 4.0,
> usable *with attribution* and *share-alike on that data*. Check each repo's `LICENSE` before
> using anything concrete, and keep a credits screen.

---

## 1. Launch as a PWA first (days, not weeks)

The app is already an installable PWA. Before any store, put it on a real URL and get 20–30
real users. This is the cheapest way to learn what to build.

- Every push to `main` deploys it to **https://ojasfit.co.in** (GitHub Pages + GoDaddy DNS).
- Share the link on WhatsApp. "Add to Home screen" already makes it full-screen.
- **Payments work on the open web immediately** via Razorpay (step 4) — you do *not* need the
  Play Store to start charging. Many Indian fitness apps run web-first for exactly this reason
  (no 15–30% store cut, UPI works great in the browser).

## 2. Wrap for the Play Store with Capacitor

Capacitor turns this exact web app into a native Android (and iOS) project without a rewrite.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init OjasFit in.co.ojasfit.app --web-dir dist
npm run build && npx cap add android && npx cap sync
npx cap open android      # opens Android Studio (needs YOUR machine)
```

What has to happen on **your** computer (not here): install Android Studio + JDK, generate a
signing key, build a signed **AAB**, and upload it in the Google Play Console ($25 one-time).
A Trusted Web Activity (via Bubblewrap) is a lighter alternative if you keep it web-first.

Checklist the Play Console will demand: app icon set, feature graphic, screenshots, a privacy
policy URL, a data-safety form, and a content rating.

## 3. Accounts + cloud sync (the real gap)

Today all data lives in the phone's `localStorage` (see `src/lib/store.jsx`). That means a new
phone = lost history **and lost purchase**. Before charging money you need accounts.

Recommended: **Supabase** (Postgres + auth + row-level security, generous free tier, phone-OTP
login which suits India). Firebase is the alternative.

- Add phone-OTP sign-in. Keep the app fully usable **logged-out** (guest), then sync on login —
  do not force signup at the door; it kills Indian retention.
- Mirror the `store.jsx` shape to a `profiles` table keyed by user id. Keep local-first: write
  locally, sync in the background, so the app still works with no signal.
- `premium` status must live **server-side** and be verified there — never trust the client for
  entitlement once real money is involved.

## 4. Payments

Two different worlds — you will likely use both:

- **Inside the Play Store**, Google *requires* Google Play Billing for digital subscriptions
  (you cannot use Razorpay for in-app digital goods there). Use the `@capacitor-community/in-app-purchases`
  plugin (or RevenueCat to manage it). Play takes 15% up to $1M/yr.
- **On the open web / PWA**, use **Razorpay Subscriptions** (UPI AutoPay, cards). This is where
  `src/lib/payments.js` and `src/config.js` already have the seams. Flow:
  1. your server creates a subscription with your Razorpay **secret** key,
  2. the app opens Razorpay Checkout with the **public** key,
  3. your server verifies the payment signature (webhook) and flips `premium` in the database.

Never unlock Plus from the client alone once payments are real. The current "demo mode"
(`PAYMENTS.mode = 'demo'` in `src/config.js`) is for testing only — it unlocks locally and
charges nothing.

Pricing is already structured in `src/config.js` (₹99/mo, ₹599/yr, ₹999/yr family). Validate
these against real users; Indian willingness-to-pay is lower than the West, so the **annual**
and **family** plans and WhatsApp-driven referrals matter more than the monthly.

## 5. Legal before you take money

- Privacy policy + terms (you're collecting phone numbers and health-adjacent data).
- **DPDP Act (India)**: once data leaves the device you're a data fiduciary; under-18 profiles
  need verifiable parental consent.
- A medical disclaimer is already shown in-app; keep it.
- Google Play "Health" policies: no overstated medical claims.

---

## What is already done

One adaptive Coach, 10 journeys, for-time Peaks with personal bests, short/quiet session
options, Hindi + English, family profiles, streaks/points/ranks, progress charts, offline PWA,
and a freemium paywall UI. The engine, data and copy are all original.

## Honest state

Front-end: strong. Backend, real payments, native build and real exercise media: not started —
those are steps 2–5 above and need your accounts, your machine, and a content decision.
