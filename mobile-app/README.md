# NextStep Study — Mobile PWA
This is a static, installable study companion hosted in the existing GitHub Pages repository. The original N1–N5 study materials and exam papers are linked rather than replaced.

## Features
Home daily goal and JLPT level shortcuts, focus timer, spaced-review flashcards, local notes with search/folders/tags, quick sample JLPT quiz, to-do planner, exam date countdown, weekly study stats, English/Nepali toggle, light/dark mode, adjustable font size and local export/delete.

## Privacy and limitations
No backend, accounts, login, cloud sync or cross-device persistence. Data stays in the current browser's localStorage and can be erased. The quiz has clearly marked sample questions. Notifications need browser permission and are not guaranteed in the background. The app cannot block other apps. Google Fonts needs connectivity on first use. Install behavior on iPhone depends on Safari Add to Home Screen; SVG-only icons may not be supported by every install UI.

## Deploy
The site's existing GitHub Actions deployment workflow should include this folder as static assets. Site URL: https://dadalupendra.github.io/nextstep-study/mobile-app/

## Phase 2 multilingual translation
The unified JLPT library at `mobile-app/learn.html` exposes 93 selectable languages. Kanji, Vocabulary and Grammar cards include an opt-in `Translate here` action and a batch action for up to 12 currently visible cards. Those actions translate existing English explanations and examples inside the page through MyMemory's public translation API, displaying the target text separately while preserving the original Japanese. Translation responses are cached in localStorage in the same browser; only the study text and language pair are sent to that third-party service. No personal notes or passwords are sent.
If a language pair is unsupported, a request fails, or the anonymous quota is exhausted, the UI reports the failure and offers an external Google Translate link. MyMemory documents a 500-byte maximum per request and a free anonymous limit of 5000 characters per day, so this is not an unlimited or guaranteed full-site translation service. The old exam studio, reading/listening materials, and legacy book pages retain a separate link for external page translation. Selecting a language does not automatically replace the Japanese exam questions. See MyMemory usage terms before relying on external translations.
