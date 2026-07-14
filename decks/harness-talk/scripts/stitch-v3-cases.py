#!/usr/bin/env python3
"""Stitch the two client case decks (eval-harness proof + VIPP) into the v3 talk deck.

Reads:  build/harness-v3.html   (render first: node scripts/build-blueprint-deck.mjs cards-v3 --all --out build/harness-v3.html)
        proof/harness-proof-slides.html
        proof/vipp-slides.html
Writes: build/harness-v3-stitched.html

The case decks keep their own design. Their shared stylesheet (the VIPP one is a
verified superset of the proof one) is wrapped in a `.cs-scope { ... }` block with
CSS nesting, so none of its bare element rules (body, .deck, *) can leak into the
main deck; the wrapper div uses display:contents so the main .deck grid still
lays the inserted slides out like any other slide. Main CSS only targets
.slide.bp, so it cannot leak into the case slides either.

Usage: python3 scripts/stitch-v3-cases.py [insert_after]   (default 21)
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
P = lambda *p: os.path.join(ROOT, *p)

INSERT_AFTER = int(sys.argv[1]) if len(sys.argv) > 1 else 21

v3 = open(P("build", "harness-v3.html")).read()
proof = open(P("proof", "harness-proof-slides.html")).read()
vipp = open(P("proof", "vipp-slides.html")).read()

# ---------- extract the case slides (balanced <div class="slide ..."> blocks) ----------
def slides_of(doc):
    out, i = [], 0
    while True:
        m = re.compile(r'<div class="slide[ "]').search(doc, i)
        if not m: break
        start = m.start(); depth = 0; j = start
        for t in re.compile(r"<div\b|</div>").finditer(doc, start):
            depth += 1 if t.group(0) == "<div" else -1
            if depth == 0:
                j = t.end(); break
        out.append(doc[start:j]); i = j
    return out

proof_slides = slides_of(proof)
vipp_slides = slides_of(vipp)
assert len(proof_slides) == 5 and len(vipp_slides) == 5, (len(proof_slides), len(vipp_slides))

# ---------- scope the case stylesheet ----------
pcss = re.search(r"<style>(.*?)</style>", proof, re.S).group(1)
vcss = re.search(r"<style>(.*?)</style>", vipp, re.S).group(1)
assert vcss.startswith(pcss), "vipp stylesheet is no longer a superset of the proof one"

css = vcss
# :root variable blocks -> the scope element (wrapper carries data-theme="light")
css = css.replace(':root[data-theme="light"]', '&[data-theme="light"]')
css = css.replace(':root[data-theme="dark"]', '&[data-theme="dark"]')
css = re.sub(r":root\b", "&", css)
# document-level selectors -> the scope element
css = re.sub(r"(?m)^(\s*)html,\s*body\s*{", r"\1& {", css)
css = re.sub(r"(?m)^(\s*)body\s*{", r"\1& {", css)

scoped = (
    "\n/* ===== stitched case decks (proof + VIPP), scoped ===== */\n"
    ".cs-scope { display: contents; }\n"
    "@media print { .cs-scope .slide { break-after: page; page-break-after: always; box-shadow: none; } }\n"
    ".cs-scope {\n" + css + "\n}\n"
)

# ---------- assemble ----------
sections = re.split(r'(?=<section class="slide)', v3)
head, main_slides = sections[0], sections[1:]
tail_m = re.search(r"(</main>.*)$", main_slides[-1], re.S)
main_slides[-1], tail = main_slides[-1][: tail_m.start()], tail_m.group(1)
assert INSERT_AFTER < len(main_slides)

# ---------- renumber per slide, then assemble ----------
total = len(main_slides) + len(proof_slides) + len(vipp_slides)
ordered = (
    [("bp", s) for s in main_slides[:INSERT_AFTER]]
    + [("case", s) for s in proof_slides + vipp_slides]
    + [("bp", s) for s in main_slides[INSERT_AFTER:]]
)
renumbered = []
for i, (kind, s) in enumerate(ordered, 1):
    if kind == "bp":
        s, k = re.subn(
            r'<div class="bp-pageno"><b>\d+</b> / \d+</div>',
            f'<div class="bp-pageno"><b>{i:02d}</b> / {total}</div>', s)
    else:
        s, k = re.subn(
            r'(<div class="foot"><span>[^<]*</span>)<span>\d+ / \d+</span>',
            rf"\g<1><span>{i} / {total}</span>", s)
    assert k == 1, (i, kind, k)
    renumbered.append((kind, s))

body_parts, in_case = [], False
for kind, s in renumbered:
    if kind == "case" and not in_case:
        body_parts.append('<div class="cs-scope" data-theme="light">\n'); in_case = True
    elif kind == "bp" and in_case:
        body_parts.append("\n</div>\n"); in_case = False
    body_parts.append(s)
doc = head.replace("</style>", scoped + "</style>") + "".join(body_parts) + tail
# no em dashes in anything that renders (CSS comments before </style> don't)
assert "—" not in doc[doc.index("</style>"):] and "—" not in doc[: doc.index("<style>")]

out = P("build", "harness-v3-stitched.html")
open(out, "w").write(doc)
print(f"wrote {out}  slides: {total}  (cases inserted after slide {INSERT_AFTER})")
