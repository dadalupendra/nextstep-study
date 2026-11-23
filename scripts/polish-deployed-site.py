#!/usr/bin/env python3
"""Enhance published N3/N4/N5 pages without modifying source lesson data."""
from pathlib import Path
import html
import json
import sys
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else "public-site")
SRC=Path(__file__).resolve().parent
ASSETS=ROOT/"assets"
ASSETS.mkdir(parents=True,exist_ok=True)

for file in ["legacy-responsive.css","legacy-responsive.js"]:
    (ASSETS/file).write_bytes((SRC/file).read_bytes())

N3_CSS=(SRC/"n3-responsive.css").read_text("utf-8")
description={
"N5":"Free JLPT N5 Japanese reading lessons, kana, kanji and vocabulary with Nepali and English help. Read and practise on phone or computer.",
"N4":"Interactive JLPT N4 Japanese lessons, grammar, vocabulary, kanji and reading practice with Nepali and English study support.",
"N3":"JLPT N3 interactive Japanese study collection: 500 notebook pages covering kanji, grammar and vocabulary, with practice and PDF books."
}

def inject_meta(text,desc):
    assert "<head>" in text and "</head>" in text
    if 'name="description"' not in text[:text.index("</head>")]:
        text=text.replace("</head>",'<meta name="description" content="'+html.escape(desc,quote=True)+'">\n</head>',1)
    return text

def inject_compound_link(text, level):
    # Keep the existing handwritten books; add a visible route to the
    # interactive Kanji -> compound word explorer in the new master reader.
    if 'id="ns-legacy-kanji-link"' in text:
        return text
    link = (
        '<a id="ns-legacy-kanji-link" href="master.html?section=kanji" '
        'style="position:relative;z-index:5;display:inline-flex;min-height:52px;'
        'align-items:center;max-width:100%;margin:10px 12px;padding:12px 18px;'
        'border-radius:12px;background:#06786c;color:white;border:2px solid #7af4df;'
        'font:800 16px system-ui,sans-serif;text-decoration:none" '
        'title="Open clickable Kanji with compound words">🔎 '
        + level + ' Kanji क्लिक गर्नुहोस् → 熟語・関連語</a>'
    )
    assert "<body>" in text
    return text.replace("<body>", "<body>" + link, 1)

def inject_backlink(text,level):
    link=('<a class="nextstep-home-link" href="../" '
          'aria-label="Return to all NextStep Study JLPT books">'
          '← NextStep Study / All JLPT levels</a>')
    if 'class="nextstep-home-link"' not in text:
        assert "<body>" in text
        text=text.replace("<body>","<body>"+link,1)
    return text

for level in ("N4","N5"):
    filepath=ROOT/level/"index.html"
    s=filepath.read_text(encoding="utf-8")
    before=len(s)
    s=inject_meta(s,description[level])
    s=s.replace("</head>",'<link rel="stylesheet" href="../assets/legacy-responsive.css">\n</head>',1)
    s=inject_backlink(s,level)
    s=inject_compound_link(s,level)
    assert "</body>" in s
    s=s[:s.rfind("</body>")]+'<script src="../assets/legacy-responsive.js" defer></script>\n'+s[s.rfind("</body>"):]
    assert "const D=" in s and "function render" in s
    filepath.write_text(s,encoding="utf-8")
    print(f"Enhanced {level}: {before:,} → {len(s):,} characters; original embedded lessons untouched.")

level="N3"
filepath=ROOT/level/"index.html"
s=filepath.read_text("utf-8")
before=len(s)
s=inject_meta(s,description[level])
extra_css='<style>.nextstep-home-link{display:inline-flex;min-height:44px;align-items:center;'+(
    'padding:10px 16px;background:#112e49;color:#e0f6ff;text-decoration:none;'
    'font:700 14px system-ui,sans-serif}.nextstep-home-link:hover{text-decoration:underline}'
    '.nextstep-n3-root{min-width:0;max-width:100%}'
    '@media print{.nextstep-home-link{display:none}}</style>')
s=s.replace("</head>",extra_css+"</head>",1)
s=inject_backlink(s,level)
s=inject_compound_link(s,level)
needle='root.innerHTML=`<style>${D.css}</style>'
assert needle in s, "N3 shadow HTML template changed; refusing to modify"
replacement='const NEXTSTEP_N3_RESPONSIVE_CSS='+json.dumps(N3_CSS,ensure_ascii=False)+';\n'+(
    'root.innerHTML=`<style>${D.css}</style><style>${NEXTSTEP_N3_RESPONSIVE_CSS}</style>')
assert s.count(needle)==1
s=s.replace(needle,replacement,1)
assert "window.NEXTSTEP_N3_DATA=" in s and "<style>${NEXTSTEP_N3_RESPONSIVE_CSS}</style>" in s
filepath.write_text(s,encoding="utf-8")
print(f"Enhanced N3: {before:,} → {len(s):,} characters; shadow-root CSS only, 500 pages preserved.")
