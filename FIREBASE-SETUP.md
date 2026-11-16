# Turning on accounts (Firebase)

OjasFit's sign-in (email and password for now) and cloud backup run on
Google Firebase. Until the four values in `src/config.js → FIREBASE` are filled in, the app runs
without accounts, exactly as before. This takes about 15 minutes, all in the browser.

## 1. Create the project
1. Open https://console.firebase.google.com and sign in with the Google account that should own
   OjasFit (for example ojasfitindia@gmail.com).
2. **Create a project** → name it `ojasfit` → turn **off** Google Analytics (the app does not use it,
   and the privacy policy says so) → Create.

## 2. Turn on email sign-in
**Build → Authentication → Get started → Sign-in method → Email/Password** → turn on the first
switch only (not "Email link") → Save.

Then, still in Authentication:
- **Settings → Authorized domains → Add domain**: `ojasfit.co.in`, then add `www.ojasfit.co.in`.
- **Templates → Password reset → edit (pencil)**: set the sender name to `OjasFit` → Save.

Google and mobile-number sign-in can be added later: switch the provider on here and add
`'google'` or `'phone'` to `SIGN_IN` in `src/config.js`. Mobile-number sign-in sends SMS, which
Firebase charges for.

## 3. Create the database
**Build → Firestore Database → Create database**:
- Location: **asia-south1 (Mumbai)**. This cannot be changed later.
- Start in **production mode**.
- Open the **Rules** tab, replace everything with the contents of `firestore.rules` from this repo,
  and **Publish**. These rules let each person read and write only their own data.

## 4. Get the web config
**Project settings (gear icon) → General → Your apps → Web (`</>`)** → nickname `OjasFit web` →
Register (no Firebase Hosting). It shows a `firebaseConfig` block. Send me these four values:
`apiKey`, `authDomain`, `projectId`, `appId`. They are public by design (every visitor's browser
receives them); the database rules are what protect the data.

## 5. Lock the key to your site (recommended)
https://console.cloud.google.com → pick the `ojasfit` project → **APIs & Services → Credentials** →
open the **Browser key (auto created by Firebase)** → **Application restrictions: Websites** → add
`https://ojasfit.co.in/*`, `https://www.ojasfit.co.in/*` and `https://ojasfit.firebaseapp.com/*`
→ Save.

## Testing locally without a Firebase project
Run the emulators in one terminal and the app in another:

```
npm run emulators
npm run dev:emu
```

The app then signs in against the local emulators. SMS codes appear in the emulator's terminal
output instead of being sent.
