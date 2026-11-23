#!/usr/bin/env python3
"""Prepare N3 level-only vocabulary for the GitHub Pages publishing folder.
An optional build-time download: JS still has an online fallback if unavailable.
Public study data source: OpenJLPT, CC BY-SA 4.0.
"""
import json
import pathlib
import sys
import urllib.request

destination = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "public-site/N3/data/vocab.json")
urls = (
    "https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/n3.json",
    "https://cdn.jsdelivr.net/gh/evanclan/OpenJLPT@main/data/json/vocab/n3.json",
)
for url in urls:
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "NextStepStudy-OpenJLPT-Attribution/1.0"})
        with urllib.request.urlopen(request, timeout=35) as response:
            raw = response.read()
        data = json.loads(raw)
        if not isinstance(data, list) or len(data) < 50:
            raise ValueError("Unexpectedly small / malformed N3 vocabulary source")
        if any(not isinstance(item, dict) or str(item.get("level", "")).upper() != "N3" for item in data):
            raise ValueError("Source contains non-N3 entries")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"Published {len(data)} separately tagged N3 vocabulary entries from {url}")
        sys.exit(0)
    except Exception as error:
        print(f"N3 data mirror unavailable ({url}): {error}", file=sys.stderr)
print("N3 local packaging unavailable; browser will use its level-specific online fallback.", file=sys.stderr)
