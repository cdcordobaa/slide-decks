#!/usr/bin/env python3
"""cutout.py — make a generated illustration's background transparent.

Gemini/Nano Banana returns opaque images, so we knock out the background
ourselves. The subject has a solid dark outline, so we flood-fill inward from
the four corners (the background is one connected region) and turn those pixels
transparent. Interior light areas are protected by the outline.

    python3 scripts/cutout.py in.png out.png [threshold]
"""
import sys
from PIL import Image, ImageDraw

inp = sys.argv[1]
outp = sys.argv[2]
thresh = int(sys.argv[3]) if len(sys.argv) > 3 else 40

im = Image.open(inp).convert("RGBA")
w, h = im.size
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    ImageDraw.floodfill(im, seed, (0, 0, 0, 0), thresh=thresh)

# Report how much became transparent so we can sanity-check the cutout.
alpha = im.getchannel("A")
transparent = sum(1 for p in alpha.getdata() if p == 0)
print(f"wrote {outp} — {transparent * 100 // (w * h)}% transparent")
im.save(outp)
