# Harness Talk Deck — spec-driven pipeline

Turns **designer-ready YAML slide specs** (the format defined in the Notion
_"Designer-Ready Slide Spec Architecture"_ page) into an **editable HTML deck**,
then renders it to PDF using the [`create-slide-deck`](../create-slide-deck)
skill. The skill is the "designer agent"; this repo is the spec → deck bridge.

```
Notion spec  ──pull──►  specs/*.yaml  ──build-deck.mjs──►  build/harness-talk.html
(architecture)          (status-gated)   (theme + motifs)   (editable, one slide/section)
                                                │
                                                └── render-pdf.mjs (skill) ──► PDF + screenshots
```

## Layout

```
specs/                     designer-ready slide specs (source of truth)
  deck.yaml                deck metadata + status gate (min_status)
  section-0-the-mirror.yaml
  section-1-agent-model-harness.yaml
  section-2-operators-journey.yaml
  _examples/proof-example.yaml   demonstrates the bar_chart path
theme/harness-theme.css    dark mission-control theme + motif components
scripts/
  build-deck.mjs           spec → HTML compiler (+ status gate)
  notion-sync.mjs          headless Notion read/write (CI path)
build/                     generated HTML, PDF, screenshots (gitignored)
```

## Quick start

```bash
npm install                 # yaml (+ playwright for rendering)
npm run build               # specs/ → build/harness-talk.html
npx playwright install chromium
npm run render              # HTML → build/harness-talk.pdf + build/shots/*.png
# or both:
npm run deck
```

Open `build/harness-talk.html` in a browser: click any slide text to edit,
then save with **File → Save Page As… → Webpage, Complete**. Speaker/production
notes render on screen under each slide and are hidden in print/PDF.

## The status gate

Every slide has a `status` (`draft` → `needs data` → `ready for design` →
`designed` → `reviewed`). The build only renders slides at or above
`deck.yaml`'s `min_status` (default `ready for design`). Override per build:

```bash
node scripts/build-deck.mjs specs --out build/draft.html --min-status draft
```

## Motif vocabulary

A slide's `chart_or_diagram` names a motif the generator renders from
`data_required` (so the designer never guesses):

| `chart_or_diagram`     | data_required keys                        | used by |
|------------------------|-------------------------------------------|---------|
| `equation`             | `terms[]` (headline is the equation)      | 1.2 |
| `formula`              | headline is the formula; body[0] = note   | 1.8 |
| `two_boxes`            | `boxes[] {label, arrow, result}`          | 1.1 |
| `responsibility_ring`  | `center`, `held_by`, `items[]`            | 1.3 |
| `capability_layer`     | `layers[]`                                | 1.6 |
| `mapping_table`        | `rows[] {metaphor, technical}`            | 1.4, 1.5, 1.7 |
| `ladder`               | `rungs[]`, `current`, `caption`           | 2.1–2.6 |
| `checklist`            | `items[]`, `state: missing?`             | 0.2, 0.3 |
| `arrow_flow`           | `steps[]`                                 | 0.5 |
| `bar_chart`            | `chart: {claim, data[], axes, source}`    | proof slides |
| `none`                 | —                                         | 0.1, 0.4 |

Add a motif by writing a `renderX()` in `build-deck.mjs` and a matching class
block in `theme/harness-theme.css`.

## Notion sync

**Interactive (recommended):** ask Claude to sync via the Notion MCP — no token.
It pulls the architecture/talk pages and can write `status` back per slide.

**Headless / CI:** put slide specs on a Notion page as ```` ```yaml ```` code
blocks, then:

```bash
export NOTION_TOKEN=secret_xxx
node scripts/notion-sync.mjs pull <pageId>                        # → specs/pulled/*.yaml
node scripts/notion-sync.mjs push-status <pageId> 1.2 "designed"  # write status back
```

## QA checklist (per the architecture doc)

After `npm run deck`, inspect `build/shots/*.png`:

- [ ] one clear message per slide, on-slide text final
- [ ] motif/diagram specified enough to design from
- [ ] chart data explicit + **source note present** (no unsourced numbers)
- [ ] speaker note explains the move; notes hidden in PDF
- [ ] core phrases preserved verbatim
- [ ] no text clipped by slide edges; no awkward wrapping
- [ ] metaphor supports, not replaces, the technical point
- [ ] status set on every slide

## Source

Both Notion pages under **Harness Talk**: the talk outline
(_Harness Engineering — The Operator's Journey_) and the
_Designer-Ready Slide Spec Architecture_.
