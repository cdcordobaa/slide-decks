# proof/ build pipeline

The three HTML decks in `proof/` are generated, never hand-edited. The chain is:

```
sources/artifact-0c361fc8-eval-harness.html    (claude.ai note, original design)
        │  recolor.py   swap the 4 :root variable blocks to the Globant palette,
        │               pin data-theme="light"; everything else stays byte-for-byte
        ▼
harness-proof.html                             (recolored scroll page)
        │  slices.py    reuse the recolored <style>, add the 1280x720 slide
        │               framework, reshape sections into 5 slides
        ▼
harness-proof-slides.html                      (proof deck, 5 slides, 16:9)
        │  vipp.py      reads the proof deck's <style> as the shared base,
        │               builds the VIPP deck (namespaced vp-* components,
        │               Symphony-style architecture SVG)
        ▼
vipp-slides.html                               (VIPP deck, 5 slides, 16:9)
```

`sources/artifact-ca6d5368-vipp-harness.html` is the original VIPP note the
vipp.py content was written from (kept for reference; vipp.py does not read it).

## Rebuild

```bash
cd decks/harness-talk
python3 proof/build/recolor.py
python3 proof/build/slices.py
python3 proof/build/vipp.py
```

Each script asserts there are no em dashes in its output (standing rule).

## Verify

Playwright check (slide count, overflow, light-mode pin under a dark OS, em dashes),
run from `decks/harness-talk/` so node finds the local playwright install:

```bash
node proof/build/check.mjs proof/harness-proof-slides.html
node proof/build/check.mjs proof/vipp-slides.html proof/vp   # also saves vp-NN.png shots
```

Expected: `overflows: NONE`, `light-pinned under dark OS: YES`, `em-dashes: 0`.
Screenshots (`vp-*.png`, `sl-*.png`, `shot-*.png`) are gitignored.

## Rules that shaped these decks

- Recolor rich artifacts by rewriting only the 4 CSS `:root` variable blocks;
  never rebuild them through the coarse YAML card renderers.
- Always pin `data-theme="light"` on the root html: the artifact CSS keeps a
  `@media (prefers-color-scheme: dark)` block that would invert the deck.
- No em dashes anywhere in copy.
- Globant palette anchors: board `#e8ede1`, sheet `#f6f9f0`, ink `#00292e`,
  forest `#1f7a3d`, olive `#6f8f16`, gold `#a9761f`, brick `#b1483f`.

The generic method is documented in `skill/references/artifact-recolor-slicing.md`
at the repo root.
