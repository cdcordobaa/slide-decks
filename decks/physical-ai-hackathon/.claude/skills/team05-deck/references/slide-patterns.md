# Slide patterns (copy, then change)

Stage: 1280 × 720. The HUD takes the top 56 px and the timeline the bottom ~60 px, so content lives between
**y 96 and y ~650**, **x 56 to 1224** (1168 wide). Everything is positioned with `class="abs"` + inline
`left/top/width`. Colours and fonts come from the deck's CSS; don't add new ones.

## Standard slide (kicker + headline)

```html
  <!-- ================= NN · CPn · short name ================= -->
  <section class="slide panel" data-cp="5" data-dd="architecture">
    <div class="scanline"></div>
    <div class="abs" style="left:56px;top:96px;width:1168px">
      <div class="k">Checkpoint 5 · MCC room · One Thor</div>
      <h2 style="margin-top:16px;font-size:38px">The point of the slide, as one sentence.</h2>
    </div>
    <!-- body here -->
    <aside class="notes">What the speaker says, as spoken sentences. No em dashes.</aside>
  </section>
```

- `data-cp` = the act's checkpoint (1-7). Slides of one act sit together, in order.
- `data-dd` (optional) = diagrams/charts in `assets/dd/` that **D** opens, comma-separated, without `.png`.
- Headline sizes in use: 36-40 px (one line, two at most).

## Numbers (the receipt boxes)

```html
    <div class="abs" style="left:56px;top:548px;width:1168px;display:grid;grid-template-columns:repeat(3,1fr);gap:36px">
      <div class="stat sm det measured" data-tag="measured" style="--i:0"><div class="n">1.0×</div><div class="u">real time, with every feature on</div></div>
      <div class="stat sm det sourced" data-tag="sourced" style="--i:1"><div class="n">$13.9B</div><div class="u">inspection robots by 2030, all industries</div></div>
      <div class="stat sm det estimate" data-tag="estimate" style="--i:2"><div class="n">~25 mo</div><div class="u">payback at a bottling plant</div></div>
    </div>
```

- Class and tag must match the fact's status: `measured` / `sourced` / `estimate` (or `claim` for a plain statement).
  The tag is the status word only: never an audit id or source name.
- `--i` staggers the scan-in animation (0, 1, 2…).
- Stacked vertically? Leave ≥ 44 px gap, or the next tag covers the box above.
- Bigger numbers: drop `sm`.

## Infographic (Gemini) with HTML labels

```html
    <div class="genbox" style="left:56px;top:182px;width:760px;height:434px">
      <img src="assets/gen/G1.png" alt="What the picture shows, for the backup and screen readers">
      <span class="hl lit" style="left:20%;top:33%">PERCEIVE</span>
      <span class="hl" style="left:49.6%;top:95%">REPORT</span>
    </div>
```

- Labels are positioned in % of the box (centre of the label). `hl lit` = lime (the step this slide is about).
- Wide strip from a 16:9 image: `<div class="genbox band" style="...;height:270px;background-image:url('assets/gen/G14.png')" role="img" aria-label="..."></div>`.

## Real screenshot

```html
    <div class="shot" style="position:absolute;left:664px;top:410px;width:260px;height:195px">
      <img src="assets/img/autolabel_qa_bottling.jpg" alt="..." style="object-position:50% 0"><span>CAPTION IN CAPS</span>
    </div>
```

## Honest line (a limit, said plainly)

```html
    <div class="honest abs" style="left:56px;top:572px;width:890px">It learned cardboard people: on the new 3D workers it finds <b>4 of 42</b>.</div>
```

## Full-bleed frame (act openers, Night Shift style)

```html
  <section class="slide panel bleedf" data-cp="2">
    <img class="bg" src="assets/img/bottling_stairs.jpg" alt="..." style="object-position:30% 50%">
    <div class="shade"></div>                       <!-- shade r = text on the right; shade b = text at the bottom -->
    <span class="cap">CAMERA · PLACE</span>
    <div class="abs" style="left:56px;top:96px;width:640px">
      <div class="clock"><span class="t lime">CP 2</span><span>How it learned to climb</span></div>
      <h2 class="serif" style="margin-top:40px;font-size:48px">A plain sentence. <em>The lime part.</em></h2>
    </div>
    <!-- numbers under a <div class="rule"></div> -->
  </section>
```

## Video

```html
    <div class="vidbox" style="right:56px;top:140px;width:420px;height:373px">
      <video src="assets/video/clip.mp4" poster="assets/video/clip_poster.jpg" muted loop playsinline preload="metadata"></video>
      <span>WHAT IT SHOWS</span>
    </div>
```

It plays when the slide opens and pauses when it closes. Captions inside the video must be in English and must
match the registered facts.

## Approval gate (only two in the talk: imagine, act)

`data-gate="fire"` or `"hands"` on the section, a `.proposal` card with Approve/Reject buttons, and the content that
appears after approval inside `<div class="after-ok">`. Copy slide 07 or 08; don't add a third gate.

## Hidden D slide

`data-hidden="1"` on a section placed right after the slide it belongs to: → skips it, **D** on the parent opens it,
Esc returns. Kicker starts with `D ·`.
