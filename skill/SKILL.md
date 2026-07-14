---
name: create-slide-deck
description: Create, revise, and render presentation decks as editable HTML pages. Use when a user wants a browser-editable slide deck, an "editable HTML page" presentation, direct in-browser text editing instead of editing HTML source, a deck that can be saved with browser Save Page As using Webpage Complete, or a PDF generated from HTML/CSS for pitch decks, talks, reports, lessons, workshops, sales decks, executive updates, or other presentations.
metadata:
  short-description: Create editable HTML slide decks and render them to PDF
---

# Create Slide Deck

## Overview

Build presentation decks as static HTML pages where the user can click directly into each slide, type edits in the browser, save the edited page with the browser's native "Webpage, Complete" flow, and export the result to PDF. Keep the deck general-purpose: the editable mechanics apply to any presentation genre, not just pitch decks.

## Core Workflow

1. Gather the presentation purpose, audience, source material, visual assets, target length, output directory, and whether the user wants appendix slides.
2. Draft the slide narrative before writing HTML. Prefer one clear claim per slide, concise supporting evidence, and scannable layout.
3. Create one HTML file for the deck. Start from `assets/editable-deck-template.html` when building from scratch.
4. Add deck front matter near the top of the HTML as a comment or `<script type="application/json" id="deck-metadata">` with title, source, audience, date, visual system, and asset credits.
5. Put images, logos, and generated assets beside the HTML file or in a sibling asset folder. Reference them with relative paths so the deck remains portable.
6. Make each slide a fixed-size `<section class="slide" contenteditable="true" spellcheck="true">`. Put any editing toolbar outside `.deck` and mark it `contenteditable="false"`.
7. Include print CSS with `@page`, zero margins, hidden editing controls, fixed slide dimensions, and `break-after: page`.
8. Open the HTML in a browser for user review and direct editing.
9. Tell the user to save browser edits with `File -> Save Page As... -> Webpage, Complete`. This preserves the edited page plus a sibling asset folder.
10. Treat the user's newest saved HTML file and its `_files` folder as the source of truth.
11. Export to PDF either manually with browser Print -> Save as PDF, or reproducibly with `scripts/render-pdf.mjs`. Use screenshots or the script's inspection output to catch overflow and print-only surprises.

## Editable HTML Mechanics

Use these mechanics in every deck unless an existing deck already has a better equivalent:

- One static HTML document, no build step.
- Slide root: `<section class="slide" contenteditable="true" spellcheck="true" aria-label="Slide 1 Title">`.
- Screen dimensions: 16:9, usually `1280px x 720px`.
- Print dimensions: `@page { size: 13.333in 7.5in; margin: 0; }`.
- Save path: use browser `File -> Save Page As... -> Webpage, Complete` so assets are packaged with the edited HTML.
- PDF path: use browser Print -> Save as PDF for human workflows; use the render script for reproducible agent output.
- Toolbar/edit notes: hide with `.edit-toolbar { display: none; }` inside `@media print`.
- Overflow: set `.slide { overflow: hidden; }`, then inspect for clipped text before handoff.

For detailed implementation notes and pitfalls, read `references/editable-html-deck-mechanics.md`.

## Porting Rich HTML Artifacts

When the source material is an already well-designed HTML page (for example a
claude.ai artifact) and the goal is a branded deck, do not rebuild it through
coarse card renderers. Keep the original design, swap only the CSS variable
blocks to the brand palette, pin the color scheme on the root element, then
slice sections into fixed 1280x720 slides reusing the recolored stylesheet.
Keep the builder scripts and the source artifact in the deck's folder so the
deck rebuilds byte-identical on any machine. Full workflow:
`references/artifact-recolor-slicing.md`.

## Rendering To PDF

For agent-rendered output, use the bundled script:

```bash
node /path/to/create-slide-deck/scripts/render-pdf.mjs input.html output.pdf --screenshots output-screens
```

If the project does not already have Playwright, either install it locally (`npm install -D playwright`) or, in Codex desktop, call `load_workspace_dependencies` and run the script with `NODE_PATH` set to the bundled node modules path.

The script:

- Opens the HTML through Chromium using a `file://` URL.
- Waits for fonts and images.
- Reports slide count and likely overflow.
- Optionally saves per-slide PNG screenshots.
- Writes a print-background PDF using the deck's CSS page size.

Human default: open the edited HTML in Chrome, choose Print, enable background graphics, choose Save to PDF, and use landscape orientation with no margins.

## Design Rules

- Build the actual deck, not a landing page or explanatory wrapper.
- Use a restrained, presentation-grade design system: type scale, spacing scale, color tokens, repeated components, and predictable slide headers.
- If the deck has a brand, event, institution, product, place, or team, find the most relevant logo from local assets first; if none exists and web access is allowed, use an official or clearly attributable source. Copy the logo into the deck asset folder, record the source in deck metadata, and place a small non-dominant logo in the top-right corner of each slide unless the user forbids logos or the source material makes a logo inappropriate.
- Keep slides editable. Avoid canvas-rendered text for core content.
- Keep slide text short enough for direct editing. Use charts, tables, and diagrams when they make the argument clearer.
- Use real product, person, place, or data visuals when they matter. Keep decorative assets secondary.
- Leave source footers, appendix labels, and speaker notes out unless the user asks for them or the deck needs them.
- Verify that long words, badges, chart labels, and table cells do not wrap awkwardly.

## Handling User Edits

When a user edits the deck in the browser and saves a new HTML file:

- Use the newest saved HTML file as canonical.
- Keep the saved `_files` asset folder beside the HTML file.
- Diff before editing so line-break and copy tweaks are preserved.
- Make only the requested changes.
- Re-render PDF from the edited HTML, not from an older source file.

## Handoff Checklist

- HTML file opens locally without a dev server.
- User can click into slide text and type.
- Browser `File -> Save Page As... -> Webpage, Complete` preserves the edited deck and assets.
- Print controls, edit notes, focus outlines, and UI chrome are hidden in PDF.
- PDF has one slide per page, correct aspect ratio, background graphics, and no browser headers.
- Screenshots or PDF pages were visually checked for clipping, awkward wrapping, missing images, and accidental overlays.

## Resources

- `assets/editable-deck-template.html`: copy this when starting a new editable deck.
- `scripts/render-pdf.mjs`: render editable HTML decks to PDF and optional screenshots.
- `references/editable-html-deck-mechanics.md`: implementation notes, print CSS details, browser save mechanics, and troubleshooting.
- `references/artifact-recolor-slicing.md`: port a rich HTML artifact into a branded 16:9 deck (CSS-variable recolor, scheme pin, slicing, verification gates, reproducibility).
