# Porting a rich HTML artifact into a branded 16:9 deck

Use this workflow when the source material is an already well-designed HTML page
(for example a claude.ai artifact) and the goal is a branded slide deck. The rule:
**keep the original design, adapt only the colors, then slice into fixed slides.**
Do not rebuild rich source designs through coarse card/layout renderers; they
butcher the original.

## 1. Recolor via CSS variables only

Well-built artifacts centralize every color in CSS custom properties, usually in
four blocks:

- `:root { ... }`
- `@media (prefers-color-scheme: dark) { :root { ... } }`
- `:root[data-theme="light"] { ... }`
- `:root[data-theme="dark"] { ... }`

The recolor is a rewrite of only those blocks to the target brand palette.
Everything else stays byte-for-byte.

- First confirm there are no hardcoded hex colors outside the variable blocks;
  grep for each original hex after the swap and assert zero leftovers.
- Map the artifact's accent roles onto the brand's accent roles (e.g. its
  "signal" accent to the brand's primary accent, its secondary accent to the
  brand's secondary), not color-to-nearest-color.

## 2. Pin the color scheme

The recolored CSS still carries the `@media (prefers-color-scheme: dark)` block,
so on a dark-mode OS the deck inverts and any hardcoded-light SVG boxes lose
their variable-driven text. If the deck must always present in one scheme, set
it on the root element:

```html
<html lang="en" data-theme="light">
```

The `:root[data-theme="light"]` block out-specifies the dark `@media` block.
Verify by rendering with Playwright under `colorScheme: 'dark'` and asserting
the slide background stays the light board color.

## 3. Slice into fixed slides

- Reuse the recolored `<style>` verbatim; append a slide framework on top:
  `.slide { width: 1280px; height: 720px; overflow: hidden; }` plus brand
  chrome (wordmark, footer, page numbers).
- Place each source section into a slide. Reflow tall sections instead of
  shrinking them (a 10-step vertical timeline becomes two 2-column grids).
- When building a sibling deck in the same family, read the first deck's built
  `<style>` as the shared base and namespace any new components (e.g. `vp-*`)
  to avoid collisions.

## 4. Verify, always with the same gates

Never eyeball fit. For every built deck assert:

- **Overflow**: per slide, `body.scrollHeight <= body.clientHeight` measured in
  Playwright. Target: NONE.
- **Scheme pin**: light board background under an emulated dark OS.
- **Copy rules**: whatever standing copy rules apply (e.g. zero em dashes),
  asserted in the build script itself.
- **Screenshots**: per-slide PNGs for a final visual pass.

## 5. Keep it reproducible

- Builders are small scripts (Python or Node) that live in the deck's repo
  next to the outputs (`<deck>/build/`), with paths relative to the script
  location, never in a temp/scratch directory.
- Commit the original source artifact HTML into the repo (`<deck>/sources/`);
  session caches and temp dirs get wiped.
- The built HTML is committed as the deliverable, but the scripts are the
  source of truth: a rebuild must be byte-identical before you trust them.

A worked example of this whole pipeline: `decks/harness-talk/proof/build/` in
the slide-decks monorepo (artifact -> recolor.py -> slices.py -> vipp.py, with
check.mjs as the gate).
