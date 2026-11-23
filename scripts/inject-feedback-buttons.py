#!/usr/bin/env python3
"""Add two accessible feedback shortcuts to published HTML only; never edit lesson sources."""
from pathlib import Path
import sys
root = Path(sys.argv[1] if len(sys.argv) > 1 else "public-site")
paths = [root / "index.html", root / "exams/index.html"]
for level in ("N1", "N2", "N3", "N4", "N5"):
    paths += list((root / level).glob("*.html"))
for path in paths:
    if not path.exists():
        raise SystemExit(f"Missing study page: {path}")
    html = path.read_text(encoding="utf-8")
    if "feedback/feedback-buttons.js" in html:
        continue
    relative = path.relative_to(root)
    prefix = "../" * (len(relative.parts) - 1)
    snippet = '<script defer src="' + prefix + 'feedback/feedback-buttons.js?v=20261123"></script>'
    if "</body>" not in html:
        raise SystemExit(f"No body closing tag in {relative}, aborting injection")
    html = html.replace("</body>", snippet + "</body>", 1)
    path.write_text(html, encoding="utf-8")
    print("Feedback actions added:", relative)
