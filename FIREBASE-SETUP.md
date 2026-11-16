# Turning on accounts (Firebase)

OjasFit's sign-in (Google, mobile number with SMS code, email and password) and cloud backup run on
Google Firebase. Until the four values in `src/config.js → FIREBASE` are filled in, the app runs
without accounts, exactly as before. This takes about 15 minutes, all in the browser.

## 1. Create the project
1. Open https://console.firebase.google.com and sign in with the Google account that should own
   OjasFit (for example ojasfitindia@gmail.com).
2. **Create a project** → name it `ojasfit` → turn **off** Google Analytics (the app does not use it,
   and the privacy policy says so) → Create.

## 2. Turn on the sign-in methods
**Build → Authentication → Get started → Sign-in method**, then enable:
- **Google**: set the support email to ojasfitindia@gmail.com → Save.
- **Email/Password**: turn on the first switch only (not "Email link") → Save.
- **Phone** → Save.

Then, still in Authentication:
- **Settings → Authorized domains → Add domain**: `ojasfit.co.in` and `www.ojasfit.co.in`.
- **Settings → SMS region policy → Allow** only **India**. This stops people abusing your SMS quota
  with foreign numbers.
- **Templates**: set the sender name to OjasFit for the password-reset email.

About SMS cost: Firebase may ask you to move to the **Blaze** (pay-as-you-go) plan before it sends
real SMS codes, and SMS are charged per message. If it does, also set a budget alert in
Google Cloud Billing (for example ₹500) so a surprise bill cannot happen. Google and email
sign-in stay free.

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
