# OjasFit — your home fitness coach

A guided home-workout app for the Indian mass market: an adaptive coach, multi-week **journeys**,
no equipment, Hindi + English, several family members on one phone.

Live at **https://ojasfit.co.in**.

## What is in it

- **Adaptive Coach** — after each session the athlete rates effort (1–5) and technique (1–3).
  That sets the next session's volume and rest, and moves them up or down the skill ladders
- **Three journeys** (Bodyweight Shred, Desi Strength, Living Room Express), each periodised:
  calibration → base → intensity → deload → peak week, opening and closing with a benchmark test
- **Full-length sessions** — the athlete picks 30, 45 or 60 minutes (suggested from their level).
  Each session runs warm-up, a Tatva drill or skill practice, the main workout, accessory blocks
  and cool-down. The main workout is intervals, for time, AMRAP, EMOM, or a Peak
- **Tatva drills** — five named drills (Agni, Vayu, Prithvi, Jal, Akash), three levels each
- **Skill ladders** for push, legs and core, six rungs each
- **Peaks** — 15 signature for-time workouts in three types, each climbable in three splits
  (Base Camp, Ridge, Summit) with a personal best per split. Journeys schedule them by phase
- **Adapt session** — quiet mode, small space, 20 or 15 minutes, sore body parts; saved for the day
- **Guided player** — video slot (falls back to an animated figure), giant rep counter, timers,
  voice coaching from recorded clips or the phone's text-to-speech
- **Recap** — result card shared as an image through the phone's share sheet
- Hindi + English, several profiles per phone, offline PWA; all data stays on the device

## The training gate

`npm test` (`scripts/check-programs.mjs`) generates every session for every kind of athlete and
checks it against `docs/TRAINING-STANDARDS.md`: session length, structure, safety of each
adaptation, progression limits. The publishing workflow runs it before every build.

## Adding real content

- **Exercise videos:** put a looping clip at `public/video/<exercise id>.mp4` and add the id to
  `public/video/manifest.json`. The player and exercise sheets use it instead of the figure.
- **Coach voice:** see `VOICE-SCRIPT.md` and `scripts/split-voice.mjs`.

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
| Exercises, substitutions, skill ladders | `src/data/exercises.js` |
| Journeys, training phases, Peaks | `src/data/journeys.js` |
| Coach engine: session builder, adaptation, feedback | `src/lib/plan.js` |
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
