#!/usr/bin/env python3
"""Render deterministic installable-app PNG icons from the NextStep palette."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "icons"
DEST.mkdir(parents=True, exist_ok=True)

for size in (180, 192, 512):
    image = Image.new("RGBA", (size, size), "#081524")
    draw = ImageDraw.Draw(image)
    unit = size / 512.0
    def box(coords):
        return tuple(round(value * unit) for value in coords)
    draw.rounded_rectangle(box((80, 94, 432, 418)), radius=round(40*unit),
                           fill="#0f3454", outline="#5ee9d5", width=max(2,round(14*unit)))
    draw.line([box((128,160))[:2],box((183,152))[:2],box((223,159))[:2],box((256,171))[:2]],
              fill="#5ee9d5", width=max(2,round(20*unit)), joint="curve")
    draw.line([box((256,171))[:2],box((298,157))[:2],box((340,152))[:2],box((384,160))[:2]],
              fill="#5ee9d5", width=max(2,round(20*unit)), joint="curve")
    for line in [((128,160),(128,336)), ((384,160),(384,336)),
                 ((128,336),(182,329)), ((182,329),(256,355)),
                 ((256,355),(328,329)), ((328,329),(384,336)),
                 ((256,171),(256,355))]:
        draw.line([box(line[0])[:2],box(line[1])[:2]],
                  fill="#5ee9d5", width=max(2,round(15*unit)), joint="curve")
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",round(70*unit))
    except OSError:
        font=ImageFont.load_default()
    draw.text(box((256,276))[:2], "N", anchor="mm", font=font, fill="#ffffff")
    image.save(DEST / f"icon-{size}.png", optimize=True)
    print(f"Generated icons/icon-{size}.png")
