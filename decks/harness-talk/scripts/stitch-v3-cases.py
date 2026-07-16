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

DROP = ("5.1 Client Project", "5.2 Client Project", "7.2 ", "7.3 ", "7.4 ")
STAR_NOTE = ('<div class="bp-thx-star">If you liked this presentation, remember to '
             'give a star at <b>StartMeUp</b>.</div>')

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

scoped += """
/* ===== L1-L3 restyled black: the loop-engineering chapter opener ===== */
.slide.bp.bp-dark {
  --board:#060607; --paper:#060607; --ink:#f1f2ec; --steel:#15161a; --steel-top:#1f2b2e;
  --steel-line:#2e2f2a; --line-strong:#e9ebe3; --green-deep:#bfd732; --cyan-deep:#bfd732;
  --orange:#bfd732; --panel:#121216; --panel-2:#1a1a1f; --panel-green:rgba(191,215,50,.13);
  --hatch:#1a1b17; --muted:#9a9c93; --muted-2:#6c6e66;
  background-image:
    linear-gradient(rgba(241,242,236,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(241,242,236,.045) 1px, transparent 1px);
  background-size: 44px 44px;
}
.bp-dark svg text[fill="#00292e"] { fill:#f1f2ec; }
.bp-dark svg :is(rect,path,polygon,circle,ellipse,line)[stroke="#00292e"] { stroke:#7d867f; }
.bp-dark svg :is(rect,polygon,circle,ellipse)[fill="#00292e"] { fill:#121216; }
.bp-dark svg [fill="#f4f7ef"] { fill:#15161a; }
.bp-dark svg text[fill="#1f7a3d"] { fill:#8fd460; }
.bp-dark svg [stroke="#1f7a3d"] { stroke:#8fd460; }
.bp-dark .bp-frame rect, .bp-dark .bp-frame path { stroke:#3f453a; }
.bp-dark .bp-take { border-color: rgba(191,215,50,.35); }

/* merged loop-engineering triptych */
.bp-loopmerge .bpx-grid { display: grid; grid-template-columns: 1fr 0.9fr 1.16fr; gap: 28px; align-items: start; margin-top: 18px; }
.bp-loopmerge .bpx-col { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.bp-loopmerge .bpx-cap { font-size: 11.5px; letter-spacing: .13em; font-weight: 700; color: var(--green); text-align: center; }
.bp-loopmerge .bpx-vis { height: 368px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.bp-loopmerge .bpx-vis svg.bp-dia { width: 100%; height: auto; max-height: 356px; }
.bp-loopmerge .bpx-media img { max-width: 100%; max-height: 300px; border-radius: 10px; }
.bp-loopmerge .bpx-chips { font-size: 10.5px; color: var(--muted); text-align: center; white-space: nowrap; }

/* the star CTA on the thanks slide */
.bp-thanks .bp-thx-star { margin-top: 20px; font-size: 21px; color: #9fb8a5; }
.bp-thanks .bp-thx-star b { color: var(--green); font-weight: 700; }
"""

# ---------- assemble ----------
sections = re.split(r'(?=<section class="slide)', v3)
head, main_slides = sections[0], sections[1:]
tail_m = re.search(r"(</main>.*)$", main_slides[-1], re.S)
main_slides[-1], tail = main_slides[-1][: tail_m.start()], tail_m.group(1)

label = lambda s: (re.search(r'aria-label="([^"]*)"', s) or [None, ""])[1]
kept = [s for s in main_slides if not label(s).startswith(DROP)]
assert len(kept) == len(main_slides) - len(DROP), "dropped-slide labels not all found"
main_slides = kept

# pull L1-L3 out: they become the dark loop-engineering chapter opener,
# placed after the two harness cases and before the symphony slides
loop_slides = [s for s in main_slides if label(s).startswith(("L1", "L2", "L3"))]
assert len(loop_slides) == 3
main_slides = [s for s in main_slides if s not in loop_slides]

def darken(s):
    s = s.replace('class="slide bp ', 'class="slide bp bp-dark ', 1)
    m = re.search(r'(<img class="bp-(?:band__)?logo" src="data:image/svg\+xml;base64,)([^"]+)', s)
    if m:  # navy wordmark -> light, for the black board
        import base64
        svg = base64.b64decode(m.group(2)).decode().replace("#00292e", "#f1f2ec")
        s = s.replace(m.group(2), base64.b64encode(svg.encode()).decode())
    return s
# fuse L1+L2+L3 into ONE dark chapter slide: a triptych of their three visuals
l1, l2, l3 = loop_slides
frame = re.search(r'<svg class="bp-frame".*?</svg>', l1, re.S).group(0)
logo = re.search(r'<img class="bp-logo"[^>]*>', l1).group(0)
hloop = re.search(r'<svg class="bp-dia bp-hloop".*?</svg>', l1, re.S).group(0)
aloop = re.search(r'<svg class="bp-dia bp-aloop".*?</svg>', l3, re.S).group(0)
l2img = re.search(r'<div class="bp-hero__media">(.*?)</div>', l2, re.S).group(1)
chips = " &rarr; ".join(re.findall(r"<span>([^<]+)</span>",
        re.search(r'<div class="bp-hero__cap">(.*?)</div>', l2, re.S).group(1)))

merged = f'''<section class="slide bp bp-card bp-loopmerge" aria-label="L1 Loop Engineering (merged L1+L2+L3)">
    {frame}{logo}
    <div class="bp-eyebrow">§4b · HARNESS AND LOOP</div><h1 class="bp-h">Harness engineering vs. loop engineering</h1><p class="bp-sub">The harness defines what the agent can do; the loop defines how it keeps doing it. A loop is a control system, and the spec is its control surface.</p>
    <div class="bpx-grid">
      <div class="bpx-col"><div class="bpx-cap">01 · THE BODY IN MOTION</div><div class="bpx-vis">{hloop}</div></div>
      <div class="bpx-col"><div class="bpx-cap">02 · A CONTROL SYSTEM, NOT A PROMPT</div><div class="bpx-vis"><div class="bpx-media">{l2img}</div><div class="bpx-chips">{chips}</div></div></div>
      <div class="bpx-col"><div class="bpx-cap">03 · THE SPEC IS THE CONTROL SURFACE</div><div class="bpx-vis">{aloop}</div></div>
    </div>
    <div class="bp-take"><span>▸</span> The harness is the body. The loop is the body in motion. The spec is its control surface.</div><div class="bp-credit">HARNESS ENGINEERING // LOOP</div><div class="bp-pageno"><b>22</b> / 30</div>
  </section>'''
loop_slides = [darken(merged)]

# the star CTA on the thanks slide
main_slides = [
    s.replace("</b></div>", "</b></div>" + STAR_NOTE, 1) if label(s) == "thanks" else s
    for s in main_slides
]

if len(sys.argv) > 1:
    INSERT_AFTER = int(sys.argv[1])
else:
    INSERT_AFTER = next(i for i, s in enumerate(main_slides, 1) if label(s).startswith("3.4"))
assert INSERT_AFTER < len(main_slides)

# ---------- renumber per slide, then assemble ----------
total = len(main_slides) + len(proof_slides) + len(vipp_slides) + len(loop_slides) + len(sy_slides)
ordered = (
    [("bp", s) for s in main_slides[:INSERT_AFTER]]
    + [("case", s) for s in proof_slides + vipp_slides]
    + [("bp", s) for s in loop_slides]
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
