# NextStep N2 — Japanese Questions, Instant Answers & Furigana

## 📚 Three N2 study books
- **漢字 / Kanji:** 400 study pages: **398 separately N2-tagged kanji** + 2 revision pages.
- **語彙 / Vocabulary:** 300 study pages: **1,778 N2-tagged words**.
- **文法 / Grammar:** 300 study pages: **123 N2-tagged grammar items**, including formation, source examples and review.
- Every book has **10 learning chapters**, with its own 50-question JLPT-style original review paper.

## 📝 Updated quiz — `quiz.html`

### Japanese questions and choices
All question instructions, prompts and four multiple-choice answers are **in Japanese**. Vocabulary questions now focus on readings and sentence cloze; grammar covers example interpretation and formations; kanji asks for reading or the missing character.

### Choose → immediately get feedback
Selecting any of four answer buttons instantly:
1. Shows **✓ 正解 / ✗ 不正解** in green/red.
2. Identifies the correct Japanese answer.
3. Reveals the Japanese explanation, English explanation, and Nepali explanation.
4. Explains the four choices individually in **Japanese, English, and Nepali** (expand the other incorrect choices if needed).
5. Updates the score. An answered question is locked; Reset restarts the paper.

### Furigana show/hide
Use **ふりがな ON / OFF**. Source-supported furigana appears over Japanese words and example sentences where available. The project uses furigana stored in the source dataset:
- Many Japanese vocabulary examples (not every sentence).
- N2 grammar examples with verified furigana metadata.
- Certain answer choices and the final correct answer where readings exist.

**Reading questions do not reveal the target reading before the student answers**, even with ON, to prevent giving away the answer. Missing source readings are not guessed. The setting and answers persist during toggling; furigana preference is saved locally where the browser permits.

### Practice modes
| Mode | Content per 50-question chapter | Important limitation |
|---|---|---|
| **JLPT N2** | Choose Kanji, Vocabulary, Grammar; 10 × 50 questions in each book = **30 papers (1,500 question records)** | Original JLPT-style study questions, not official/past papers |
| **BJT ビジネス日本語** | 20 original workplace situations (phone, email, honorifics) + 30 N2 contextual/vocabulary/grammar exercises | Not official BJT format or scoring; workplace situations may recur between chapters |
| **JPT 日本語練習** | Mixed N2 kanji/vocabulary/grammar: 50 questions × 10 chapters | Unofficial review, not a reproduction of JPT |
| **J.TEST 実用日本語** | Mixed N2 kanji/vocabulary/grammar: 50 questions × 10 chapters | Unofficial review, not a reproduction of J.TEST |
| **NAT-TEST N2復習** | Mixed N2 kanji/vocabulary/grammar: 50 questions × 10 chapters | Unofficial review, not a reproduction of NAT-TEST |

These are **adapted practice modes** sharing the N2 study bank; they are **not 3,500 entirely new, independently hand-written examination items**. Listening, timed sections and official score conversion are not included.

## How to open
- Open **`N2/index.html`** for the books, then click **Chapter test · 50 Questions**.
- Open **`N2/quiz.html`** for the exam practice selector.
- GitHub Pages: `https://dadalupendra.github.io/nextstep-study/N2/quiz.html`.

The ZIP can be extracted and opened on Windows, Android or other browsers. For offline access, keep every `.js` file and the CSS beside `index.html` and `quiz.html`.

## Provenance, quality, and limitations
OpenJLPT's community-curated N2 level tags, data, examples and furigana are used under **CC BY-SA 4.0**, with additional original learning copy and business scenarios. All target entries are tagged N2 in the independent source, but the JLPT has no official exhaustive kanji/vocabulary/grammar list. Example sentences can contain foundational Japanese from earlier levels.

The source provides **English vocabulary glosses**; complete Nepali translations for every one of the 1,778 word meanings are not yet supplied. Nepalese explanations are included for grammar and quiz feedback, sometimes using the English gloss when the source lacks a verified Nepali dictionary translation.

Automated tests check page/question counts, answer choices, explanation fields, non-repeating questions within an individual paper, and the absence of missing files. They do **not** replace independent review by a qualified Japanese-language teacher, especially for contextual distractors, business etiquette, and nuanced grammar equivalences.

For full credits and terms, see [CREDITS.md](CREDITS.md). All exams named in this package are registered/associated with their respective organizing bodies; NextStep is independent and not affiliated with them.
