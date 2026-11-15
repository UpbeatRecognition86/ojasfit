# Play Console answers

Answers for the forms under **Policy → App content** and **Store presence**, for version 1
(free, no accounts, all data on the device). If the app later adds accounts, online backup,
analytics or purchases, several answers change — update them before that release.

## Files to upload (store presence → main store listing)

| Field | File |
|---|---|
| App icon (512×512) | `store/play-icon-512.png` |
| Feature graphic (1024×500) | `store/feature-graphic.png` |
| Phone screenshots, English | `store/screenshots/en/1.jpg` … `6.jpg` |
| Phone screenshots, Hindi translation | `store/screenshots/hi/1.jpg` … `6.jpg` |
| Text | `store/listing.md` |

Regenerate the screenshots after design changes: run `npx vite preview --port 4174` in one
terminal, then `node scripts/store-shots.cjs`.

## App details

- **App category:** Health & Fitness
- **Tags:** pick the closest to Home workout, Fitness coach, Yoga, Weight loss
- **Contact email:** required and shown publicly; use the same address as the privacy policy
- **Website:** https://ojasfit.co.in
- **Privacy policy URL:** https://ojasfit.co.in/privacy.html
- **Price:** Free. Note: Google never lets a free app become a paid download later.
  Subscriptions inside the app are still allowed, which is the plan for Plus.
- **Countries:** India to start (add more any time)

## App content forms

**Privacy policy:** https://ojasfit.co.in/privacy.html

**Ads:** No, the app does not contain ads.

**App access:** All functionality is available without special access (no login).

**Content rating (IARC questionnaire):**
- Category: *All other app types*
- Violence, sexual content, profanity, drugs, gambling: **No** to all
- Users can interact or exchange content with each other: **No** (WhatsApp sharing just opens
  WhatsApp with a message; there is no in-app communication)
- Shares the user's current location: **No**
- Digital purchases: **No**
- Expected result: rated for everyone (3+ / Everyone)

**Target audience and content:**
- Age groups: **13–15, 16–17, 18 and over**. Do **not** select any under-13 group: that puts the
  app under Google's Families policy, with much stricter rules.
- Could the app appeal to children unintentionally: **No**

**Data safety:**
- Does the app collect or share any required user data types? **No.**
  Google counts data as "collected" only when it leaves the device. OjasFit keeps everything in
  the phone's storage and has no server, so nothing is collected or shared.
- The form then skips the encryption and deletion questions.

**Health apps declaration:**
- Features: **Activity and fitness** only
- Not a medical device, does not diagnose or treat any condition

**Government app:** No · **Financial features:** None · **News app:** No

## Testing before production (new personal developer accounts)

Google requires a **closed test with at least 12 testers who stay opted in for 14 days in a
row** before you can apply for production. Create the closed test track, add testers by email
(or a Google Group), share the opt-in link, and keep at least 12 installed for the full 14 days.
