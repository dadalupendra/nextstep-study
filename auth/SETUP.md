# NextStep Study: private accounts and onboarding

## What already works without configuration
- First public visit (normal browsers): Welcome / Namaste → Language → JLPT N5–N1 + selected study goals → account choices → Start as Guest → customized home page.
- Preferences are kept on the user's own device in localStorage. Guests do **not** have a verified identity, synchronized profile, or an administrator activity record.
- Existing direct JLPT learning/book/exam URLs continue to work without an account. E2E automation skips first-run redirect to prevent regression tests from being blocked; `/?welcome=1` exercises it.
- Profile page: `/account/`; admin dashboard: `/admin-users/` (cannot list users until correctly connected and authorized).

## Activate REAL email + Google sign-in (owner action required)
1. Open [Firebase Console](https://console.firebase.google.com/) and create a project and a **Web App**. Firebase Authentication supports Google and Email/Password.
2. In Authentication → Sign-in method, turn on **Google** and **Email/Password**. Add `dadalupendra.github.io` under Authentication → Settings → Authorized domains. Confirm your custom domain too if you use one.
3. Create a Cloud Firestore database. Install the security rules in `auth/firestore.rules` under Firestore Database → Rules and **Publish**. Do not use insecure test mode for production.
4. Edit `auth/firebase-config.js` and replace `null` with the **public web app config** copied from Firebase. It includes `apiKey`, `authDomain`, `projectId`, and `appId`. These public identifiers are not Admin SDK secrets; NEVER commit Admin SDK service account JSON or Cloud API private keys.
5. GitHub Pages will republish when the configuration is committed. Use a real test Google account to confirm sign-in and a private `profiles/{uid}` Firestore document are created. Confirm another ordinary user cannot fetch it.
6. Obtain **your own** Firebase Auth UID from Firebase Console → Authentication → Users. In Firestore Console, manually create a document at `admins/<your-uid>` with field `enabled` (boolean) `true`. No client can self-grant admin status using the supplied rules.
7. Sign in as the administrator and open `/admin-users/`. Only authorized admin accounts can list registered users and their recorded login/last-use dates. Guest activity is neither collected nor visible.

## Facebook login
1. Register your own Meta Developer App with Facebook Login; configure the required permissions, OAuth domains, privacy policy and Facebook Login redirect URL as instructed by [Firebase](https://firebase.google.com/docs/auth/web/facebook-login).
2. Enable Facebook in Firebase Authentication and provide the required Meta App ID and App Secret in the **Firebase Console**, not this repository.
3. After successfully configuring and testing this provider, set `window.NEXTSTEP_FACEBOOK_LOGIN_READY = true` in `auth/firebase-config.js`. The Facebook button otherwise remains disabled.
4. If popup restrictions prevent login on mobile, add a proper redirect flow and test with your actual provider/domain; do not claim it works before testing.

## Phone number login (SMS)
Firebase phone authentication **requires a Cloud Billing account** for SMS service; it is not unlimited no-card-free on Spark. This repository intentionally leaves Phone OTP disabled rather than simulating a verified phone sign-in.
- Official: https://firebase.google.com/docs/auth/faq-and-troubleshooting
- Consider adding it later only when billing limits, reCAPTCHA/abuse defense, privacy notice and owner approval are configured.

## Privacy, usage and limits
- `auth/firestore.rules`: each verified user can read their **own** profile; other users cannot list or read it; only a manually authorized administrator can list all profiles.
- The user must actively check the consent box before online login; guests do not generate usage records.
- Last-use dates are client-reported, synced at most every 12 hours when the person visits the homepage while authenticated and consented. They are not tamper-proof attendance/audit logs; accurate trusted analytics require backend-validated events and a clearly disclosed privacy policy.
- Public pages do not contain private profile names or emails. Never store a password in Firestore, localStorage or the GitHub repo.
- A Firebase project must be connected before any Google/Email/Facebook button becomes active. Showing this interface does not create accounts by itself.
- If you expand user tracking, have a legal privacy and deletion procedure appropriate for the users' jurisdictions and age. Avoid collecting more personal data than necessary.
- Stored study preferences are browser-local and not yet synchronized to the Firebase profile. Multi-device study-progress synchronization is a separate authenticated feature.

## JLPT preparation quality roadmap
1. Validate each question against the JLPT level and item type; label original mock questions accurately.
2. Track Reading, Listening, Vocabulary and Grammar accuracy **separately** with answer-by-answer rationales; show which skills need revision.
3. Add reliable native Japanese audio and picture-based Listening questions with accessible transcripts shown **after** answering.
4. Run exam-time simulations aligned with [JLPT official section timing](https://www.jlpt.jp/e/guideline/testsections.html). Do not advertise raw practice percentage as an official scaled score.
5. Implement spaced-repetition queues, goals and realistic weekly reviews, preserving privacy and offline access. Passing the official test is never guaranteed.

This setup must be performed by the site owner. The repository alone cannot provision the Firebase project, approve Meta OAuth, configure SMS billing or claim production sign-ins.
