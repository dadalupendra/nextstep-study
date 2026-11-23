# NextStep JLPT N2 — study collection

Three original, browser-based, printable study notebooks:

| Notebook | Pages | Content model |
|---|---:|---|
| Kanji | 400 | 400 distinct kanji characters occurring in the N2-oriented word collection. Each page lists real vocabulary examples, readings of whole words, English glosses, writing grids, and recall activities. |
| Vocabulary | 300 | 1,777 Japanese words/expressions distributed across 300 distinct pages (generally 5–6 entries per page), with Japanese forms, readings, English glosses, and recall practice. |
| Grammar | 300 | 100 selected patterns, **three different learning pages per pattern**: explanation, comprehension, and writing practice, with original Japanese model sentences and English interpretations. |

**Important distinction:** 300 grammar pages do **not** mean 300 different grammar points. The grammar section presents 100 points in three stages. The selection is not an exhaustive or official N2 syllabus. The 400 kanji were selected by frequency from words in an N2-oriented third-party list, so they include foundation-review characters.

## Japanese / Nepali / English
- Japanese reading examples and bilingual Japanese–English language data.
- Nepali instructions for study activities and navigation support.
- Full per-item Nepali dictionary translations, stroke animations, and professionally recorded audio are **not** included.
- On devices with Japanese text-to-speech, tap the speaker button to hear sample words/sentences.
- Adjustable text size; English and Nepali study-guidance toggles; search, page navigation, local notes and bookmarks.
- Data and content are served as static files. No WordPress PHP or API key is needed.

## Sources, license, and acknowledgments
**Word data:** Jonathan Waller's educational JLPT vocabulary material (CC BY), with kanji spelling alignment and JMdict-linked dictionary glosses via stephenmk's `yomitan-jlpt-vocab` project:
https://github.com/stephenmk/yomitan-jlpt-vocab
Original list: https://raw.githubusercontent.com/stephenmk/yomitan-jlpt-vocab/main/original_data/n2.csv
Attribution README: https://github.com/stephenmk/yomitan-jlpt-vocab/blob/main/README.md

**Dictionary:** JMdict project by the Electronic Dictionary Research and Development Group (EDRDG), led by Jim Breen; license CC BY-SA 4.0:
https://www.edrdg.org/edrdg/licence.html
https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html

The editorial writing activities, layout, grammar model sentences and code in this specific N2 collection were prepared for NextStep Study. Editorial text is not an official JLPT resource. Any redistributed derivative dataset needs to retain source attribution and comply with applicable share-alike license conditions.

**Official JLPT:** JLPT organizers do not publish a comprehensive official list of kanji, vocabulary, and grammar:
https://www.jlpt.jp/e/faq/index.html

## Online use
Open `N2/index.html` or the GitHub Pages route `/nextstep-study/N2/`. Keep `data.js`, `grammar-data.js`, `reader.js`, and `style.css` beside `index.html`.

## Save as PDF
Inside the reader choose a book → **Print / Save PDF**. The print view offers all pages or a smaller page range. In Chrome print destination choose **Save as PDF**. Actual PDF page count can vary with browser print settings; the interactive books themselves always contain exactly 400 + 300 + 300 numbered study pages. For very large sections print in 20–50 page ranges if the browser cannot print all at once.

## Privacy
Personal notes, progress, and bookmarks are stored in this device/browser using localStorage. They do not sync between devices, and clearing browser storage will delete them.
