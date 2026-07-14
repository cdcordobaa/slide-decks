#!/usr/bin/env python3
"""trim.py — crop a generated image down to its content.

Nano Banana often centers the illustration inside a big empty margin. This
finds the bounding box of everything that differs from the corner background
colour and crops to it (plus small padding), so hero images fill their frame.

    python3 scripts/trim.py image.png [padding]
"""
import sys
from PIL import Image, ImageChops

path = sys.argv[1]
pad = int(sys.argv[2]) if len(sys.argv) > 2 else 18

thresh = 42  # ignore the faint background grid; keep only real illustration ink
im = Image.open(path).convert("RGB")
bg = Image.new("RGB", im.size, im.getpixel((2, 2)))
# Threshold the difference so low-contrast grid lines don't count as content.
mask = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > thresh else 0)
bbox = mask.getbbox()
if not bbox:
    print("nothing to trim")
    sys.exit(0)
l, t, r, b = bbox
l, t = max(0, l - pad), max(0, t - pad)
r, b = min(im.width, r + pad), min(im.height, b + pad)
im.crop((l, t, r, b)).save(path)
print(f"trimmed {path} → {r - l}x{b - t}")
