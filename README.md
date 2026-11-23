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

## Facebook / WhatsApp / Messenger social previews

This repository's GitHub Pages build creates **six branded 1200 × 630 JPEG cover pictures** every time the website is published. A small Python+Pillow script (`scripts/build-social-preview.py`) prepares artwork, then injects static **Open Graph** and **Twitter Card** metadata into the published HTML. This approach works for social crawlers that do not execute page JavaScript.

The following seven URLs receive link-preview metadata (N2 quizzes reuse the N2 cover): the home page, five N1–N5 book home pages, and N2 quiz page.

- **Home share photo**: https://dadalupendra.github.io/nextstep-study/assets/nextstep-facebook-cover.jpg
- **Book cover**: substitute `N5`, `N4`, `N3`, `N2` or `N1` in `assets/nextstep-N2-cover.jpg`.
- **Shareable main page**: https://dadalupendra.github.io/nextstep-study/
- **Meta Sharing Debugger**: https://developers.facebook.com/tools/debug/

**How to share:** Open the main website or use the “Share on Facebook” button. Facebook normally generates a clickable photo card, title and description from the link metadata. If it shows the old version, use the Sharing Debugger, paste the **page URL**, and select **Scrape Again**. Facebook controls how and whether the card is ultimately displayed; it may still show the link or domain underneath the image. To create an **image-only photo post**, save the social JPEG and upload it as a Facebook photo, then include your website link in the caption.

**Technology used:** HTML Open Graph tags, Python + Pillow for static photo generation, GitHub Actions YAML for publishing, JavaScript/CSS for the existing reader functionality. No Java, SQL server, PHP, TypeScript or paid hosting is necessary to make a GitHub Pages link preview.

## Automatic Updates (already configured)

**Content-source refresh:** The workflow `.github/workflows/auto-update-content.yml` checks the licensed OpenJLPT N1 and N2 datasets **every day at approximately 09:23 Japan time (00:23 UTC)**. GitHub may delay a scheduled run. If existing N1/N2 entries change safely, `scripts/update-content.cjs` validates their level tags, identities, counts and the size of the change, preserves custom Nepali grammar explanations and lesson order, and commits only genuine data updates. The educational test suite runs before any commit.

**Automatic publishing:** Any changed N1–N5 or homepage file on `main` launches `.github/workflows/deploy-site.yml` to test and publish the updated site. Nothing needs to be uploaded again when a validated source update is committed.

**Automatic display refresh:** N1 has a network-first service worker (with offline fallback), so online readers check for the newest version of HTML/JS/CSS and learning data rather than staying on an old cached copy. N1's daily practice changes each day based on the Japan local date. Normal browser/GitHub Pages caching can still introduce a short delay.

**Scope:** N1 and N2 existing source entries may refresh automatically. N5/N4/N3 books and their PDFs do not gain newly authored lessons automatically; they require editorial content updates in this repository. New or deleted N1/N2 target entries are deliberately not inserted without review, so the 400/300/300 study page and chapter structures remain consistent. If source verification fails, the workflow stops rather than publishing unsafe data.

**Check or manually trigger:** Visit **Actions → Automatically update JLPT N1 and N2 study data → Run workflow → main**. Successful runs can show `No upstream changes ... Nothing to publish`; that is expected and means the content is already up to date with the tracked source entries.

GitHub can suspend scheduled workflows after **60 days of inactivity in public repositories**. If automatic checks stop, review Actions, enable the workflow and push a regular update.

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
