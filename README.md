# NextStep Study — JLPT N5–N1

Japanese self-study website, served as static HTML/CSS/JavaScript from GitHub Pages.

## Study levels

| Level | URL path | Materials |
| --- | --- | --- |
| JLPT N5 | `N5/` | Standalone interactive beginner study reader |
| JLPT N4 | `N4/` | Standalone interactive study notebook |
| JLPT N3 | `N3/` | Interactive reader and three downloadable PDF study books |
| JLPT N2 | `N2/` | Interactive 400-page kanji notebook (398 distinct N2-tagged kanji + 2 reviews), 300-page vocabulary notebook (1,778 tagged words), 300-page grammar notebook (123 tagged patterns), and detailed Japanese-language quizzes |
| JLPT N1 | `N1/` | Advanced reader with 700 kanji study entries, 1,000 vocabulary study items, 123 grammar patterns, interactive questions and furigana controls |

**N2 quizzes:** `N2/quiz.html` offers Japanese prompts and options, furigana show/hide, immediate right/wrong feedback, and explanations in Japanese, English and Nepali, plus additional unofficial BJT/JPT/J.TEST/NAT-inspired revision modes.

**N1 source:** `N1/` matches the files supplied in the uploaded `NextStep_Study.zip`. N1 source data is supplied in `N1/data/{kanji,grammar,vocab}.json` using the independently curated OpenJLPT N1-labeled collection (CC BY-SA 4.0). See `N1/THIRD-PARTY-NOTICE.txt`.

## Publish on GitHub Pages

For the prepared automated deployment, the repository owner must **enable GitHub Pages once**:
1. Open **Settings → Pages → Build and deployment**.
2. Set **Source = GitHub Actions** (not Deploy from a branch).
3. Open **Actions → Publish NextStep Study (N5–N1) → Run workflow → main → Run workflow**.
4. When the Pages deployment run succeeds, the public reader is available at the address below. Subsequent changes to N1–N5 or the homepage deploy automatically.

The website's visitor mode is read-only (visitors cannot change the upstream repository). However, **no publicly readable HTML/JS/PDF/data can be made impossible to copy**. Because this repository is public, its source code is also viewable; a separate private repository or a backend-only architecture would be needed to keep unshipped source logic confidential. Third-party study datasets have independent CC BY-SA attribution and reuse rights.

After deployment the address is:
`https://dadalupendra.github.io/nextstep-study/`

The GitHub repository contains all five JLPT level folders. No PHP or WordPress server is required. Browser-stored notes/progress remain local to each device/browser.

This is an **independent educational collection**, not an official JLPT syllabus or source of official previous examination papers. JLPT-level label lists are unofficial; the official tests do not supply exhaustive modern kanji/grammar/vocabulary lists.
