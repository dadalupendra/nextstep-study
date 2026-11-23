#!/usr/bin/env python3
"""Build-time verification of Open Graph sharing metadata & images."""
from html.parser import HTMLParser
from pathlib import Path
from PIL import Image
import os
import sys

BASE = "https://dadalupendra.github.io/nextstep-study/"
site = Path(sys.argv[1] if len(sys.argv) > 1 else "public-site")


class OGReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.head = False
        self.meta = {}
        self.links = {}

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "head":
            self.head = True
        if not self.head:
            return
        attrs = dict(attrs)
        if tag.lower() == "meta":
            key = attrs.get("property") or attrs.get("name")
            if key:
                self.meta[key] = attrs.get("content")
        elif tag.lower() == "link":
            self.links[attrs.get("rel")] = attrs.get("href")

    def handle_endtag(self, tag):
        if tag.lower() == "head":
            self.head = False


paths = ["index.html"] + [f"N{x}/index.html" for x in "12345"] + ["N2/quiz.html"]
for rel in paths:
    f = site / rel
    assert f.exists(), rel
    reader = OGReader()
    reader.feed(f.read_text("utf-8"))
    tag = reader.meta
    target = BASE + (rel.removesuffix("index.html") if rel.endswith("index.html") else rel)
    assert tag.get("og:url") == target, (rel, "og:url", tag.get("og:url"))
    assert reader.links.get("canonical") == target, (rel, "canonical")
    assert tag.get("og:type") == "website"
    assert tag.get("og:title", "").startswith("NextStep ")
    assert len(tag.get("og:description", "")) > 45
    assert tag.get("og:image:type") == "image/jpeg"
    assert tag.get("og:image:width") == "1200"
    assert tag.get("og:image:height") == "630"
    assert tag.get("twitter:card") == "summary_large_image"
    assert tag.get("twitter:image") == tag.get("og:image")
    assert tag.get("og:image", "").startswith(BASE + "assets/")
    filename = tag["og:image"].removeprefix(BASE)
    img = site / filename
    assert img.is_file(), (rel, filename)
    with Image.open(img) as picture:
        assert picture.format == "JPEG" and picture.size == (1200, 630)
    assert img.stat().st_size < 8_000_000
    print("PASS:", rel, "→", filename)

assert (site / "robots.txt").is_file()
assert (site / "sitemap.xml").is_file()
assert (site / "assets/favicon.svg").is_file()
assert len(list((site / "assets").glob("*.jpg"))) == 6
print("PASS: all seven social link cards, cover JPEGs, favicon, robots and sitemap.")
