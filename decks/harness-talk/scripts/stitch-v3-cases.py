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
STAR_NOTE = (
    '<div class="bp-thx-quote">&ldquo;We shape our tools, and thereafter our tools shape us.&rdquo;'
    '<span>MARSHALL McLUHAN</span></div>'
    '<div class="bp-thx-star">Feedback is a control signal: close the loop with a '
    '<b>&#11088; on StarMeUp</b>.</div>')

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

/* from-scratch loop-engineering diagram slides */
.bpx-slide .bpx-stage { display: flex; justify-content: center; margin-top: 10px; }
.bpx-slide .bpx-stage svg { width: 100%; max-width: 1096px; height: auto; }

/* quote + star CTA on the thanks slide */
.bp-thanks .bp-thx-quote { margin-top: 30px; font-size: 24px; font-weight: 300; color: #d9e4da; max-width: 880px; line-height: 1.45; }
.bp-thanks .bp-thx-quote span { display: block; margin-top: 10px; font-size: 13px; letter-spacing: .16em; color: #7f9a86; }
.bp-thanks .bp-thx-star { margin-top: 26px; font-size: 20px; color: #9fb8a5; }
.bp-thanks .bp-thx-star b { color: var(--green); font-weight: 700; }

/* speaker slide */
.bpm-grid { display: grid; grid-template-columns: 290px 1fr; gap: 44px; align-items: center; margin-top: 26px; min-height: 430px; }
.bpm-mono { height: 290px; border: 1.4px solid var(--line-strong); border-radius: 14px; background: var(--panel); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 84px; font-weight: 800; color: var(--ink); letter-spacing: -2px; }
.bpm-mono span { font-size: 12px; font-weight: 400; color: var(--muted-2); margin-top: 10px; letter-spacing: .08em; }
.bpm-facts { display: flex; flex-direction: column; gap: 17px; }
.bpm-fact b { display: block; font-size: 18px; color: var(--ink); }
.bpm-fact span { font-size: 14px; color: var(--muted); line-height: 1.4; }
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
# replace L1+L2+L3 with two from-scratch dark slides drawn as one big diagram
# each: (A) the agentic loop as a classical control-system block diagram
# (setpoint -> comparator -> controller -> plant -> sensor -> feedback), and
# (B) the spec as the control surface feeding one loop iteration.
l1 = loop_slides[0]
frame = re.search(r'<svg class="bp-frame".*?</svg>', l1, re.S).group(0)
logo = re.search(r'<img class="bp-logo"[^>]*>', l1).group(0)

INK, MUT, GRN, SFT, AMB, CYA = "#f1f2ec", "#9a9c93", "#bfd732", "#8fd460", "#eba23e", "#5bc5de"
PNL, PST = "#121216", "#3a3b35"

def zone(x, y, w, h, title, sub, stroke, extra=""):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{PNL}" stroke="{stroke}" stroke-width="1.4"/>'
            f'<text x="{x+16}" y="{y+27}" font-size="15" font-weight="700" fill="{stroke}">{title}</text>'
            f'<text x="{x+16}" y="{y+46}" font-size="11.5" fill="{MUT}">{sub}</text>' + extra)

def chip(x, y, w, label, color=INK):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="26" rx="6" fill="#1a1a1f" stroke="{PST}"/>'
            f'<text x="{x+w/2}" y="{y+17}" font-size="11.5" fill="{color}" text-anchor="middle">{label}</text>')

def num(x, y, n):
    return (f'<circle cx="{x}" cy="{y}" r="11" fill="#060607" stroke="{AMB}" stroke-width="1.3"/>'
            f'<text x="{x}" y="{y+4}" font-size="11" font-weight="700" fill="{AMB}" text-anchor="middle">{n}</text>')

def arrow(d, color=GRN, dash="", marker="arG"):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.6" {dash} marker-end="url(#{marker})"/>'

DEFS = (f'<defs><marker id="arG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{GRN}"/></marker>'
        f'<marker id="arA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{AMB}"/></marker></defs>')

svgA = f'''<svg class="bp-dia bpx-ctrl" viewBox="0 0 1160 452" style="font-family: var(--mono)">{DEFS}
  <text x="1140" y="24" font-size="11.5" fill="{MUT}" text-anchor="end"><tspan fill="{INK}">boxes = the harness</tspan>&#160;&#160;&#160;<tspan fill="{GRN}">arrows = the loop</tspan></text>
  {zone(14, 130, 186, 170, "SPEC", "the setpoint", GRN,
        chip(30, 188, 154, "intent &amp; scope fence") + chip(30, 222, 154, "acceptance criteria") + chip(30, 256, 154, "test plan"))}
  <circle cx="266" cy="215" r="24" fill="{PNL}" stroke="{INK}" stroke-width="1.4"/>
  <text x="266" y="222" font-size="18" fill="{INK}" text-anchor="middle">&#931;</text>
  <text x="266" y="146" font-size="11" fill="{MUT}" text-anchor="middle">the gap:</text>
  <text x="266" y="160" font-size="11" fill="{MUT}" text-anchor="middle">spec minus reality</text>
  {zone(330, 108, 290, 214, "HARNESS &#183; the controller", "decides the next step", CYA,
        f'<polygon points="508,156 535,171 535,201 508,216 481,201 481,171" fill="#060607" stroke="{GRN}" stroke-width="1.5"/>'
        f'<text x="508" y="191" font-size="11.5" font-weight="700" fill="{GRN}" text-anchor="middle">MODEL</text>'
        + chip(348, 226, 122, "context &amp; memory") + chip(482, 226, 122, "tools &amp; skills")
        + chip(348, 260, 122, "permissions") + chip(482, 260, 122, "retries &amp; routing"))}
  {zone(680, 130, 210, 170, "AGENT RUN &#183; the plant", "acts on the workspace", INK,
        chip(698, 196, 174, "edits &#183; commands &#183; diffs") + chip(698, 232, 174, "isolated workspace"))}
  {zone(950, 148, 196, 134, "CHANGE", "the output", SFT,
        chip(966, 206, 164, "PR + evidence"))}
  {zone(560, 366, 330, 72, "VERIFICATION &#183; the sensor", "tests &#183; evals &#183; CI &#183; human review", AMB)}
  {arrow("M 200 215 L 236 215")}{num(218, 197, "1")}
  {arrow("M 290 215 L 324 215")}{num(307, 197, "2")}
  {arrow("M 620 215 L 674 215")}{num(647, 197, "3")}
  {arrow("M 890 215 L 944 215")}{num(917, 197, "4")}
  {arrow("M 1048 282 C 1048 350, 990 402, 896 402", AMB, "", "arA")}{num(1006, 372, "5")}
  {arrow("M 560 402 C 380 402, 266 330, 266 245", AMB, 'stroke-dasharray="7 5"', "arA")}{num(370, 390, "6")}
  <text x="392" y="352" font-size="11.5" fill="{AMB}" text-anchor="middle">state update: the result changes what the next step sees</text>
</svg>'''

slideA = f'''<section class="slide bp bp-card bpx-slide" aria-label="L1 A Loop Is a Control System">
    {frame}{logo}
    <div class="bp-eyebrow">§4b &#183; LOOP ENGINEERING</div><h1 class="bp-h">A loop is a control system, not a prompt</h1><p class="bp-sub">Measure, compare, correct: the same closed loop that runs a thermostat runs an agent. The harness is the boxes; the loop is the arrows between them.</p>
    <div class="bpx-stage">{svgA}</div>
    <div class="bp-take"><span>&#9656;</span> Do not prompt each step. Design the system that generates, checks, and routes the next step.</div><div class="bp-credit">HARNESS ENGINEERING // LOOP</div><div class="bp-pageno"><b>22</b> / 30</div>
  </section>'''

spec_rows = [("INTENT", "what done means, in one paragraph", GRN),
             ("ACCEPTANCE CRITERIA", "each one testable, each one a gate", GRN),
             ("TEST PLAN / VALIDATION", "how the loop proves the work", GRN),
             ("CONSTRAINTS &amp; NON-GOALS", "the fence the agent cannot cross", GRN),
             ("STATUS LOG", "written back by the loop itself", AMB)]
rows_svg = "".join(
    f'<rect x="52" y="{118+i*56}" width="286" height="46" rx="7" fill="#1a1a1f" stroke="{PST}"/>'
    f'<text x="68" y="{137+i*56}" font-size="12" font-weight="700" fill="{c}">{t}</text>'
    f'<text x="68" y="{154+i*56}" font-size="11" fill="{MUT}">{s}</text>'
    for i, (t, s, c) in enumerate(spec_rows))

LOOPN = [("read the spec", 0), ("plan the step", 1), ("act", 2), ("verify against the spec", 3), ("route: pass / fail", 4)]
import math
def loop_nodes(cx, cy, r):
    out, widths = "", []
    for label, i in LOOPN:
        a = -90 + i * 72
        x, y = cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))
        w = 9.2 * len(label) + 22
        widths.append(w)
        out += (f'<rect x="{x-w/2:.0f}" y="{y-16:.0f}" width="{w:.0f}" height="32" rx="8" fill="{PNL}" stroke="{GRN if i==3 else PST}" stroke-width="1.4"/>'
                f'<text x="{x:.0f}" y="{y+4:.0f}" font-size="12" fill="{INK}" text-anchor="middle">{label}</text>')
    # directed edge-to-edge arrows between consecutive nodes: the LOOP itself
    cent = [(cx + r * math.cos(math.radians(-90 + i * 72)),
             cy + r * math.sin(math.radians(-90 + i * 72))) for _, i in LOOPN]
    for i in range(5):
        (x1, y1), (x2, y2) = cent[i], cent[(i + 1) % 5]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy); ux, uy = dx / L, dy / L
        c1 = math.hypot(widths[i] / 2 * ux, 19 * uy) + 10
        c2 = math.hypot(widths[(i + 1) % 5] / 2 * ux, 19 * uy) + 10
        out += arrow(f"M {x1+ux*c1:.0f} {y1+uy*c1:.0f} L {x2-ux*c2:.0f} {y2-uy*c2:.0f}")
    return out

nodes_svg = loop_nodes(790, 210, 148)
svgB = f'''<svg class="bp-dia bpx-spec" viewBox="0 0 1160 420" style="font-family: var(--mono)">{DEFS}
  <rect x="34" y="52" width="322" height="332" rx="12" fill="{PNL}" stroke="{GRN}" stroke-width="1.4"/>
  <text x="52" y="84" font-size="14" font-weight="700" fill="{GRN}">spec.md</text>
  <text x="122" y="84" font-size="11.5" fill="{MUT}">&#183; versioned in git</text>
  <text x="52" y="102" font-size="11" fill="{MUT}">THE CONTROL SURFACE</text>
  {rows_svg}
  <text x="790" y="206" font-size="11.5" fill="{MUT}" text-anchor="middle">one iteration,</text>
  <text x="790" y="222" font-size="11.5" fill="{MUT}" text-anchor="middle">as many as it takes</text>
  {nodes_svg}
  {arrow("M 360 128 C 480 96, 560 78, 706 60")}
  <text x="520" y="66" font-size="11.5" fill="{GRN}" text-anchor="middle">the loop reads it, every step</text>
  {arrow("M 652 330 C 540 384, 460 372, 364 348", AMB, 'stroke-dasharray="7 5"', "arA")}
  <text x="440" y="392" font-size="11.5" fill="{AMB}">results are written back into it</text>
</svg>'''

slideB = f'''<section class="slide bp bp-card bpx-slide" aria-label="L3 The Spec Is the Control Surface">
    {frame}{logo}
    <div class="bp-eyebrow">§4b &#183; LOOP ENGINEERING</div><h1 class="bp-h">The spec is the control surface</h1><p class="bp-sub">In an agentic workflow the spec is not just input. It is the setpoint the loop steers toward, and the log it reports back to.</p>
    <div class="bpx-stage">{svgB}</div>
    <div class="bp-take"><span>&#9656;</span> You steer by editing the artifact, not by prompting the run. The spec is the new keyboard.</div><div class="bp-credit">HARNESS ENGINEERING // LOOP</div><div class="bp-pageno"><b>23</b> / 30</div>
  </section>'''

loop_slides = [darken(slideA), darken(slideB)]

# speaker slide, inserted right after the cover (light blueprint style)
about = f'''<section class="slide bp bp-card" aria-label="0.0 About the speaker">
    {frame}{logo}
    <div class="bp-eyebrow">§0 &#183; WHO IS TALKING</div><h1 class="bp-h">Cristian C&oacute;rdoba</h1><p class="bp-sub">AI engineering at Globant. I build and operate the systems this talk is about.</p>
    <div class="bpm-grid">
      <div class="bpm-mono">CC<span>swap me for a photo</span></div>
      <div class="bpm-facts">
        <div class="bpm-fact"><b>Operator, not author</b><span>specified the MIP evaluation harness into existence: spec-driven, zero hand-written harness code</span></div>
        <div class="bpm-fact"><b>Harness builder</b><span>VIPP agentic search harness: six retrieval skills commanded over MCP, model pluggable</span></div>
        <div class="bpm-fact"><b>Fleet operator</b><span>Symphony &#215; Claude Code in production: specs in, reviewed PRs out</span></div>
        <div class="bpm-fact"><b>Find me</b><span>github.com/cdcordobaa &#183; Arkatechie</span></div>
      </div>
    </div>
    <div class="bp-take"><span>&#9656;</span> Everything in this talk shipped in client work. Nothing here is hypothetical.</div><div class="bp-credit">HARNESS ENGINEERING // 0.0</div><div class="bp-pageno"><b>02</b> / 30</div>
  </section>'''
main_slides.insert(1, about)

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
