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

The one-slide client summaries 5.1 and 5.2 are dropped: the inserted case
decks ARE those two products in full.

Also inserts a tight 4-slide cut of the Symphony x Claude Code deck
(../symphony/symphony-claude-slides.html, slides 2/4/8/9) right after the
VIPP deck, kept in its dark theme, as the loop-engineering case. Its CSS is
scoped under .sy-scope the same way (keyframes hoisted, @page dropped), and
its copy is swept of em dashes on the way in.

Usage: python3 scripts/stitch-v3-cases.py [insert_after]
       (default: right after L3 "From Spec to Loop", so the theory trio
        L1-L3 leads into the two case studies)
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
P = lambda *p: os.path.join(ROOT, *p)

DROP = ("5.1 Client Project", "5.2 Client Project")

v3 = open(P("build", "harness-v3.html")).read()
proof = open(P("proof", "harness-proof-slides.html")).read()
vipp = open(P("proof", "vipp-slides.html")).read()
symphony = open(P("..", "symphony", "symphony-claude-slides.html")).read()
SY_KEEP = (2, 4, 8, 9)  # whole map, eight steps, spec->ticket->execution, closer

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

# ---------- symphony: extract slides, sweep em dashes, scope its stylesheet ----------
sy_all = re.findall(r'<section class="slide.*?</section>', symphony, re.S)
assert len(sy_all) == 9, len(sy_all)
def sweep(s):
    for old, new in ((" — ", " · "), ("—", "–"), (" &mdash; ", " · "), ("&mdash;", "&ndash;")):
        s = s.replace(old, new)
    return s
sy_slides = [sweep(sy_all[i - 1]) for i in SY_KEEP]

sycss = re.search(r"<style>(.*?)</style>", symphony, re.S).group(1)

def hoist_blocks(css, at_rule):
    """Cut every top-level `at_rule` block (balanced braces) out of css."""
    blocks = []
    while True:
        m = re.search(at_rule + r"[^{]*{", css)
        if not m: break
        depth, j = 1, m.end()
        while depth: depth += {"{": 1, "}": -1}.get(css[j], 0); j += 1
        blocks.append(css[m.start():j]); css = css[:m.start()] + css[j:]
    return css, blocks

sycss, sy_keyframes = hoist_blocks(sycss, r"@keyframes")
sycss, _ = hoist_blocks(sycss, r"@page")  # main deck already defines @page
sycss = re.sub(r":root\b", "&", sycss)
sycss = re.sub(r"(?m)^(\s*)html,\s*body\s*{", r"\1& {", sycss)
sycss = re.sub(r"(?m)^(\s*)body\s*{", r"\1& {", sycss)

scoped += (
    "\n/* ===== stitched symphony deck (loop engineering), scoped, dark ===== */\n"
    ".sy-scope { display: contents; }\n"
    "@media print { .sy-scope .slide { break-after: page; page-break-after: always; box-shadow: none; } }\n"
    ".sy-scope {\n" + sycss + "\n}\n"
    + "\n".join(sy_keyframes) + "\n"
)

# ---------- assemble ----------
sections = re.split(r'(?=<section class="slide)', v3)
head, main_slides = sections[0], sections[1:]
tail_m = re.search(r"(</main>.*)$", main_slides[-1], re.S)
main_slides[-1], tail = main_slides[-1][: tail_m.start()], tail_m.group(1)

label = lambda s: (re.search(r'aria-label="([^"]*)"', s) or [None, ""])[1]
kept = [s for s in main_slides if not label(s).startswith(DROP)]
assert len(kept) == len(main_slides) - len(DROP), "5.1/5.2 not found to drop"
main_slides = kept

if len(sys.argv) > 1:
    INSERT_AFTER = int(sys.argv[1])
else:
    INSERT_AFTER = next(i for i, s in enumerate(main_slides, 1) if label(s).startswith("L3"))
assert INSERT_AFTER < len(main_slides)

# ---------- renumber per slide, then assemble ----------
total = len(main_slides) + len(proof_slides) + len(vipp_slides) + len(sy_slides)
ordered = (
    [("bp", s) for s in main_slides[:INSERT_AFTER]]
    + [("case", s) for s in proof_slides + vipp_slides]
    + [("sy", s) for s in sy_slides]
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

WRAP = {"case": '<div class="cs-scope" data-theme="light">\n', "sy": '<div class="sy-scope">\n'}
body_parts, open_kind = [], None
for kind, s in renumbered:
    if kind != open_kind:
        if open_kind in WRAP: body_parts.append("\n</div>\n")
        if kind in WRAP: body_parts.append(WRAP[kind])
        open_kind = kind
    body_parts.append(s)
if open_kind in WRAP: body_parts.append("\n</div>\n")
doc = head.replace("</style>", scoped + "</style>") + "".join(body_parts) + tail
# no em dashes in anything that renders (CSS comments before </style> don't)
body_out = doc[doc.index("</style>"):]
assert "—" not in body_out and "&mdash;" not in body_out
assert "—" not in doc[: doc.index("<style>")]

out = P("build", "harness-v3-stitched.html")
open(out, "w").write(doc)
print(f"wrote {out}  slides: {total}  (cases inserted after slide {INSERT_AFTER})")
