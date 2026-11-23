#!/usr/bin/env python3
"""Build NextStep social share artwork and static Open Graph metadata.

Outputs are generated only in the GitHub Pages deployment folder.
Uses Python + Pillow (server-side build). No JavaScript crawler dependency.
Never edits the original N1–N5 interactive books.
"""
from __future__ import annotations

import html
import math
import os
from pathlib import Path
import random
import sys
import textwrap
from xml.sax.saxutils import escape as xml_escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = "https://dadalupendra.github.io/nextstep-study/"
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else "public-site")
ASSET = SITE / "assets"
W, H = 1200, 630

COVERS = {
    "home": {"title": "NextStep Study — Learn Japanese N5 to N1",
             "description": "Free interactive JLPT N5–N1 Japanese study books. Learn Kanji, Vocabulary and Grammar with quizzes, furigana and Japanese, English and Nepali support.",
             "url": BASE, "file": "nextstep-facebook-cover.jpg",
             "accent": "#4AF0D0"},
    "N5": {"title": "NextStep Study — JLPT N5 Beginner Book",
           "description": "Start learning Japanese with the free NextStep JLPT N5 interactive study reader: kana, basic vocabulary, kanji and lessons.",
           "url": BASE + "N5/", "file": "nextstep-N5-cover.jpg", "accent": "#48E6BD"},
    "N4": {"title": "NextStep Study — JLPT N4 Study Book",
           "description": "Learn Japanese with the NextStep JLPT N4 free interactive textbook and study lessons.",
           "url": BASE + "N4/", "file": "nextstep-N4-cover.jpg", "accent": "#7CB4FF"},
    "N3": {"title": "NextStep Study — JLPT N3 Study Books",
           "description": "Study JLPT N3 Kanji, Vocabulary and Grammar with interactive books and downloadable study PDFs.",
           "url": BASE + "N3/", "file": "nextstep-N3-cover.jpg", "accent": "#BCA5FF"},
    "N2": {"title": "NextStep Study — JLPT N2 Study & Practice",
           "description": "Interactive N2 Kanji, Vocabulary and Grammar books, chapter quizzes, furigana toggle and instant Japanese, English and Nepali explanations.",
           "url": BASE + "N2/", "file": "nextstep-N2-cover.jpg", "accent": "#FFC77A"},
    "N1": {"title": "NextStep Study — JLPT N1 Advanced Book",
           "description": "JLPT N1 advanced Japanese study: kanji, vocabulary, grammar, quizzes, furigana and daily practice.",
           "url": BASE + "N1/", "file": "nextstep-N1-cover.jpg", "accent": "#FF91C0"},
    "quiz": {"title": "NextStep JLPT N2 — Japanese Practice Questions",
             "description": "JLPT N2 learning practice: 50 Japanese questions per chapter, furigana ON/OFF, instant answers, and explanations in Japanese, English and Nepali.",
             "url": BASE + "N2/quiz.html", "file": "nextstep-N2-cover.jpg", "accent": "#FFC77A"},
}

FONT_BOLD = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_REG = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
FONT_CJK = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
]
def font(size: int, bold=False, cjk=False):
    choices = (FONT_CJK if cjk else []) + (FONT_BOLD if bold else FONT_REG)
    for f in choices:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def col(hexstr: str):
    return tuple(int(hexstr[i:i+2], 16) for i in (1, 3, 5))


def gradient():
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        f = y / H
        rgb = (
            int(8 + 10*f),
            int(20 + 19*f),
            int(40 + 31*f),
        )
        draw.line((0, y, W, y), fill=rgb)
    # Soft atmospheric color from blurred circles; no remote imagery/tracking.
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((680, -255, 1490, 560), fill=(34, 200, 204, 68))
    g.ellipse((-420, 340, 540, 980), fill=(36, 95, 202, 64))
    g.ellipse((390, -470, 1110, 150), fill=(75, 66, 165, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(95))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def book(layer, left, top, width, height, title, accent, angle=0, subtitle="JAPANESE"):
    """Render an illustrated book card as a decorative visual; no stock assets."""
    book_img = Image.new("RGBA", (width+35, height+35), (0, 0, 0, 0))
    pen = ImageDraw.Draw(book_img)
    ax = col(accent)
    pen.rounded_rectangle((19, 16, width+26, height+28), 22, fill=(0, 0, 0, 88))
    pen.rounded_rectangle((6, 3, width+6, height+3), 22, fill=(20, 45, 69, 255),
                          outline=(*ax, 230), width=4)
    pen.rounded_rectangle((10, 7, 26, height-1), 9, fill=(*ax, 210))
    pen.rounded_rectangle((44, 33, width-17, 43), 4, fill=(*ax, 240))
    pen.text((43, 60), "JLPT", font=font(19, True), fill=(190, 214, 227, 255))
    pen.text((41, 98), title, font=font(77 if len(title) <= 2 else 40, True),
             fill=(255, 255, 255, 255))
    pen.rounded_rectangle((44, height-88, width-22, height-83), 2, fill=(*ax, 220))
    pen.text((44, height-72), subtitle, font=font(14, True), fill=(219, 237, 240, 255))
    if angle:
        book_img = book_img.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    layer.alpha_composite(book_img, (left, top))


def artwork(level, config):
    img = gradient()
    d = ImageDraw.Draw(img)
    accent = config["accent"]
    rgb = col(accent)
    rnd = random.Random(1800 + sum(map(ord, level)))

    # Decorative constellation and connecting lines on the right.
    for i in range(38):
        x, y = rnd.randint(730, 1188), rnd.randint(15, 612)
        d.ellipse((x, y, x+2, y+2), fill=(195, 232, 241, 140))
    for j in range(6):
        y = 100 + j*83
        d.line([(760, y), (1195, y-125)], fill=(76, 153, 181, 33), width=1)

    # Brand mark and top capsule
    d.rounded_rectangle((68, 46, 107, 86), 10, fill=(*rgb, 255))
    d.text((77, 50), "N", font=font(28, True), fill=(8, 32, 50, 255))
    d.text((124, 46), "NEXTSTEP", font=font(32, True), fill=(250, 255, 255, 255))
    d.text((126, 83), "STUDY  /  JAPANESE LEARNING", font=font(13, True),
           fill=(175, 214, 225, 255))
    d.rounded_rectangle((69, 145, 295, 186), 20,
                        fill=(29, 82, 98, 180), outline=(*rgb, 190), width=2)
    d.text((91, 155), "100% FREE TO READ", font=font(15, True), fill=(223, 249, 249, 255))

    if level == "home":
        d.text((65, 232), "Learn Japanese.", font=font(67, True), fill=(255,255,255,255))
        d.text((65, 327), "N5  TO  N1", font=font(83, True), fill=(*rgb, 255))
        d.text((72, 440), "Kanji  •  Vocabulary  •  Grammar", font=font(23, True),
               fill=(224, 242, 247, 255))
        d.text((72, 488), "Quizzes  /  Furigana  /  Study Notes",
               font=font(20), fill=(181, 207, 220, 255))
        # Stacked illustrated textbooks, responsive to social crops.
        book(img, 765, 205, 183, 275, "N5", "#48E6BD", -15)
        book(img, 890, 176, 194, 294, "N3", "#8AC0FF", 4)
        book(img, 1000, 150, 190, 307, "N1", "#FF91C0", 14)
    else:
        d.text((64, 220), "JAPANESE STUDY", font=font(44, True),
               fill=(245, 250, 252, 255))
        d.text((62, 300), "JLPT " + level, font=font(103, True), fill=(*rgb, 255))
        d.text((69, 447), "KANJI  •  VOCABULARY  •  GRAMMAR", font=font(19, True),
               fill=(219, 239, 244, 255))
        d.text((70, 485), "Learn  /  Practice  /  Improve", font=font(21),
               fill=(172, 212, 224, 255))
        book(img, 802, 150, 285, 385, level, accent, -8, "STUDY NOTEBOOK")
        d.rounded_rectangle((1004, 440, 1147, 485), 18, fill=(15, 49, 69, 220),
                            outline=(*rgb, 210), width=2)
        d.text((1016, 453), "READ ONLINE", font=font(12, True), fill=(*rgb, 255))

    d.line((68, 560, 1131, 560), fill=(113, 165, 185, 100), width=2)
    d.text((69, 574), "N5   /   N4   /   N3   /   N2   /   N1",
           font=font(17, True), fill=(230, 239, 246, 255))
    d.text((900, 574), "NEXTSTEP STUDY", font=font(18, True),
           fill=(194, 223, 231, 255))

    return img.convert("RGB")


def og_tags(config):
    title = html.escape(config["title"], quote=True)
    desc = html.escape(config["description"], quote=True)
    url = html.escape(config["url"], quote=True)
    image = html.escape(BASE + "assets/" + config["file"], quote=True)
    alt = html.escape("NextStep Study — free Japanese learning books from JLPT N5 to N1",
                      quote=True)
    lines = [
        '<!-- Static Facebook / WhatsApp / Messenger / X share preview metadata -->',
        '<link rel="canonical" href="' + url + '">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="NextStep Study">',
        '<meta property="og:title" content="' + title + '">',
        '<meta property="og:description" content="' + desc + '">',
        '<meta property="og:url" content="' + url + '">',
        '<meta property="og:locale" content="en_US">',
        '<meta property="og:image" content="' + image + '">',
        '<meta property="og:image:secure_url" content="' + image + '">',
        '<meta property="og:image:type" content="image/jpeg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="' + alt + '">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="' + title + '">',
        '<meta name="twitter:description" content="' + desc + '">',
        '<meta name="twitter:image" content="' + image + '">',
        '<meta name="theme-color" content="#081524">',
        '<link rel="icon" type="image/svg+xml" href="' + BASE + 'assets/favicon.svg">',
    ]
    return "\n".join(lines) + "\n"


def inject(page: Path, config):
    assert page.is_file(), "Page missing: " + str(page)
    content = page.read_text("utf-8")
    head_end = content.lower().find("</head>")
    assert head_end >= 0, "No closing head in " + str(page)
    assert 'property="og:image"' not in content, "Unexpected duplicate OG tags in " + str(page)
    content = content[:head_end] + og_tags(config) + content[head_end:]
    page.write_text(content, "utf-8")
    print("OG metadata:", page)


def main():
    assert SITE.is_dir(), "Missing site output directory " + str(SITE)
    ASSET.mkdir(parents=True, exist_ok=True)
    for level, config in COVERS.items():
        if level == "quiz":
            continue
        target = ASSET / config["file"]
        artwork(level, config).save(target, "JPEG", quality=89, optimize=True,
                                     subsampling=0, progressive=True)
        with Image.open(target) as check:
            assert check.size == (W, H) and check.format == "JPEG"
        assert target.stat().st_size < 8_000_000, "Share image exceeds 8MB"
        print("Cover:", target, target.stat().st_size, "bytes")

    inject(SITE / "index.html", COVERS["home"])
    for level in ("N1", "N2", "N3", "N4", "N5"):
        inject(SITE / level / "index.html", COVERS[level])
    inject(SITE / "N2" / "quiz.html", COVERS["quiz"])

    (ASSET / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">'
        '<rect width="128" height="128" rx="26" fill="#0D263D"/>'
        '<rect x="10" y="10" width="108" height="108" rx="20" '
        'fill="#143B50" stroke="#4AF0D0" stroke-width="4"/>'
        '<text x="64" y="88" text-anchor="middle" fill="#4AF0D0" '
        'font-size="74" font-weight="800" font-family="sans-serif">N</text>'
        '</svg>', encoding="utf-8")

    urls = [BASE] + [BASE + f"N{i}/" for i in range(1, 6)] + [BASE + "N2/quiz.html"]
    sitemap = ('<?xml version="1.0" encoding="utf-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + ''.join('  <url><loc>' + xml_escape(u) + '</loc></url>\n' for u in urls)
               + '</urlset>\n')
    (SITE / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (SITE / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: " + BASE + "sitemap.xml\n",
        encoding="utf-8")
    print("Built", len(COVERS)-1, "distinct social share covers; HTTPS Open Graph tags for 7 pages.")


if __name__ == "__main__":
    main()
