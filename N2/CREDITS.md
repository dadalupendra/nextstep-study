# Source, JLPT-level methodology and QA notes

## Source and reuse rights
This educational material is independently created by NextStep Study using N2-tagged excerpts from:
- [OpenJLPT](https://github.com/evanclan/OpenJLPT) (evanclan), licensed under **Creative Commons Attribution–ShareAlike 4.0 International (CC BY-SA 4.0)**.
- Exact original source files: [N2 Kanji JSON](https://github.com/evanclan/OpenJLPT/blob/main/data/json/kanji/n2.json), [N2 Vocabulary JSON](https://github.com/evanclan/OpenJLPT/blob/main/data/json/vocab/n2.json), [N2 Grammar JSON](https://github.com/evanclan/OpenJLPT/blob/main/data/json/grammar/n2.json).
- [OpenJLPT NOTICE](https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md), for its full source attributions (Jonathan Waller's JLPT lists, EDRDG/JMdict, KANJIDIC2, Tatoeba, and editorial metadata).
- [OpenJLPT LICENSE](https://github.com/evanclan/OpenJLPT/blob/main/LICENSE).

The kanji readings, source word meanings, most source example sentences and source grammar text are adapted from this dataset. Added Nepali grammar summaries, layout, extra tasks and four-choice question assembly are project contributions. Retain source attribution and meet applicable CC BY-SA conditions when redistributing the derived dataset.

## N2-only study target methodology
All target study entries were selected where **level = "N2"** in the source's explicit tag:
- **398** N2 kanji characters, with 2 additional revision pages to complete the **400-page kanji reader**.
- **1,778** N2 vocabulary entries across **300 pages**.
- **123** N2 grammar patterns across **300 pages** (two detail/practice pages each; remaining pages are chapter review).

**No target entries tagged N5, N4 or N3 were added from source datasets.** Nevertheless, every genuine N2 example necessarily contains prerequisite simpler particles, words and kanji, which are not the learning target.

These are community-curated level tags, **not officially guaranteed exhaustive N2 boundaries**. The JLPT organizing body stopped publishing item-specific lists for the revised test:
[JLPT Official FAQ](https://www.jlpt.jp/e/faq/index.html).
For authentic exam formats use [official sample questions/practice workbooks](https://www.jlpt.jp/e/samples/sampleindex.html).

## Chapter quiz question methodology
`quiz.js` assembles 50 four-choice problems for each of 10 chapters for Kanji, Vocabulary, and Grammar (1,500 per level book collection). Kanji includes readings and meaning recall; vocabulary includes readings, English gloss and sentence context; grammar includes meaning, formation, usage and contextual recognition. Each displayed item includes a source-supported worked explanation in English, an instructional explanation in Nepali, and a Japanese reference note. No claim is made that these match every official exam question type.

Automated QA verified:
- exactly 50 questions for every book/chapter pair;
- 1,500 unique question IDs;
- four distinct options and one marked answer per item;
- English, Nepali, Japanese explanation fields present;
- all 398 kanji, 1,778 vocabulary and 123 grammar pattern sources explicitly tagged N2.
Automated checks do **not** constitute professional human proofreading of every answer and explanation. Teachers should spot-check educational nuances, especially close distractors. The practice papers are not original JLPT past exams.
