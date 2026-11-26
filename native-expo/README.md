# NextStep Study — Native iPhone & Android app (Expo SDK 58)

This is the **new React Native / Expo codebase**, kept in the **existing** GitHub repository `dadalupendra/nextstep-study/native-expo`. It replaces the old native-app design; the original JLPT N5–N1 learning content is **not deleted**, and opens through the new level-based library inside a restricted WebView.

## Run on a development machine

Requires Node.js 22+, npm, and an Android/iPhone emulator or Expo Go.

```bash
git clone https://github.com/dadalupendra/nextstep-study.git
cd nextstep-study/native-expo
npm install
npx expo install --fix
npx expo start
```

Use the QR code in Expo Go or run `npm run android` / `npm run ios`. To prepare real store builds, configure your app identifiers, icons, signing accounts, and EAS CLI; then run `npx eas-cli build --platform android --profile preview` for an internal Android build. Store distribution requires additional setup, assets and independent review.

## New visual design

Designed mobile-first for approximately 390×844 px: Poppins 400/600/700; cream #FFF8EE; ink #1B1740; indigo #4338CA; timer deep indigo #2A2370; yellow #FFC93C, mint #7EE0B5, sky #8FD3FA, coral #FF9B85. Round 20–28 px cards; 44+ px touch targets; five-tab navigation.

**Screens:** Home (goal/streak, Timer/Cards/Notes/Quiz, Physics/Math/Chemistry cards, upcoming tasks); Study (N5–N1 unified in-app library + tools); focus timer (25/5/15, ring, dots, controls); Planner (seven-day calendar strip, tasks, exam countdown); Stats (weekly bars, progress, badges); Profile (dark mode, English/Nepali, font size, privacy, local deletion, optional cloud account); spaced-review flashcards; notes with folders/tags/search; five original, sample timed MCQs with immediate explanations.

Study values start at **zero** until actual sessions are completed. The example '12-day streak' and '14h 20m' are not fabricated. Notifications are only a saved preference unless a notification service is added. Distraction-blocking is labeled unavailable because the app cannot silently block other apps.

Notes, cards, tasks, progress and preferences persist **locally** via AsyncStorage (unencrypted, **never** for auth tokens). Study pages and exam papers load from the existing NextStep GitHub Pages site and require internet. New study data does not migrate automatically from a browser's localStorage into this native app.

## Optional cloud authentication: safe activation steps

Cloud login is **OFF** by default. To enable it in your own Supabase project:

1. Run `supabase/migrations/0001_study_backups.sql` on the project database (each user can access only their own records via RLS).
2. In Supabase Auth, **require verified email addresses**, enable TOTP MFA, configure CAPTCHA and rate limits, strong password rules, approved redirects and HTTPS. Test sign-up, sign-in and password reset; ensure your email SMTP is deliverable.
3. Deploy the `supabase/functions/delete-account` Edge Function with JWT verification. Keep `SUPABASE_SERVICE_ROLE_KEY` **only** in backend environment secrets and never in the mobile build. Test deletion for authorized and unauthorized users.
4. Copy `.env.example` to `.env` and set your project's **public** HTTPS URL and publishable key. Never place backend secrets or passwords in files committed to GitHub.
5. Test account privacy, RLS authorization against another user's ID, rate limits, expired JWTs, refresh-token rotation, 2FA, verification links, password resets, underage policy, and cloud backup and deletion.

`src/cloud.ts` delegates password hashing, short-lived JWT and refresh rotation, email verification and rate limits to the configured Supabase Auth service. Access/refresh sessions are stored in Expo SecureStore (iOS Keychain / Android Keystore-backed secure store), not AsyncStorage. The optional TOTP challenge is supported; enabling TOTP still requires testing of authenticator-assurance requirements.

**Important:** There is currently **no verified parental consent service**. Cloud registration for under-18 users is blocked until one is implemented. Birthdate is self-reported: identity/age verification needs production review. This is not a claim of complete regulatory compliance. Do not enable public signup or advertise secure cloud features until the actual backend is audited and the policies are verified.

## Privacy policy

Public privacy page: https://dadalupendra.github.io/nextstep-study/native-privacy/

In-app Privacy Policy and Delete my local data work offline. Cloud account deletion works only once the backend and Edge Function above are deployed.

## Project status

This is native **source code**, not an APK/IPA or Play Store/App Store listing. GitHub Pages hosts the existing **web** companion; GitHub Pages does **not** host or automatically compile an Expo native app. GitHub Actions validates TypeScript and Expo dependency compatibility. Passing those checks is not equivalent to testing on physical Android/iOS devices or certifying security and accessibility.

The existing original JLPT pages and licensed datasets remain untouched; only navigation and styling were refreshed.
