# Editable HTML Deck Mechanics

## Purpose

Use these notes when implementing or repairing the editable web-page deck pattern. The goal is a normal HTML file that can be opened locally, edited directly in the browser, saved with the browser's native "Webpage, Complete" flow, and exported to PDF with one slide per page.

## Slide Structure

Use one root per slide:

```html
<section class="slide" contenteditable="true" spellcheck="true" aria-label="Slide 1 Title">
  ...
</section>
```

Why the whole slide is editable:

- Users can click text directly instead of finding source lines in HTML.
- Browser edits update the page the user is viewing.
- Browser `File -> Save Page As... -> Webpage, Complete` can save the edited page and its assets.

Put controls outside `.deck`, not inside a slide:

```html
<aside class="edit-toolbar" contenteditable="false">...</aside>
<main class="deck">...</main>
```

## Saving Browser Edits

Use the browser's native save flow as the primary path:

```
File -> Save Page As... -> Webpage, Complete
```

Chrome writes the HTML file and a sibling asset folder. Keep both together.

If a user saves an edited deck, use that newest saved HTML file as canonical. If Chrome creates a folder such as `Deck Name_files`, preserve it beside the HTML file.

## Print CSS

For a 16:9 deck:

```css
@media print {
  @page {
    size: 13.333in 7.5in;
    margin: 0;
  }

  .edit-toolbar {
    display: none;
  }

  .deck {
    display: block;
    padding: 0;
  }

  .slide {
    width: 13.333in;
    height: 7.5in;
    margin: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }
}
```

Use `printBackground: true` when rendering with Chromium/Playwright, or backgrounds may disappear.

## Asset Paths

Prefer relative paths:

```html
<img src="./deck-assets/product-screenshot.png" alt="">
```

If Chrome saves a page with a `_files` folder, preserve that folder beside the saved HTML. When editing later, use the user's latest saved HTML and its asset folder as the source of truth.

## Rendering Command

Run:

```bash
node /path/to/create-slide-deck/scripts/render-pdf.mjs deck.html deck.pdf --screenshots deck-shots
```

If Playwright is unavailable:

```bash
npm install -D playwright
node /path/to/create-slide-deck/scripts/render-pdf.mjs deck.html deck.pdf
```

In Codex desktop, use `load_workspace_dependencies` and run with `NODE_PATH` pointing at the bundled node modules directory.

## QA Checklist

- Open the HTML and type in a slide to confirm direct editing.
- Save with `File -> Save Page As... -> Webpage, Complete` and keep the generated asset folder with the HTML file.
- Render the PDF from the edited HTML, not the original draft.
- Inspect generated screenshots or PDF pages for:
  - missing images
  - accidental translucent overlays
  - text clipped by slide edges
  - awkward wrapping in labels, badges, charts, and tables
  - browser UI, edit toolbar, or focus outlines appearing in print
  - appendix slides included or excluded as requested

## Common Fixes

- **PDF has white boxes or missing colors**: ensure `printBackground: true` and no print CSS strips background colors.
- **Deck prints with browser headers**: use Playwright render script, or manual Chrome print with headers disabled.
- **Slides split across pages**: confirm each `.slide` has fixed print width/height and `break-after: page`.
- **User edits disappeared**: use the browser-saved edited HTML file, not the original HTML source.
- **Images work locally but not elsewhere**: copy the asset folder with the HTML and keep paths relative.
- **Text wraps badly after user edits**: tighten copy, reduce font size for that component, widen the grid column, or move detail to speaker notes/appendix.
