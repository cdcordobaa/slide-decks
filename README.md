# slide-decks

One monorepo for a reusable slide-deck product and every presentation built with it.

```
slide-decks/
├── skill/                 The product: the create-slide-deck skill (generic, reusable)
│   ├── SKILL.md           Entry point: workflows, design rules, handoff checklist
│   ├── assets/            editable-deck-template.html to start any new deck
│   ├── scripts/           render-pdf.mjs (HTML -> PDF + screenshots via Playwright)
│   ├── references/        Deck mechanics + the artifact-recolor-slicing workflow
│   └── agents/            Packaging metadata for other harnesses
└── decks/                 The outputs: one folder per presentation
    ├── harness-talk/      "Operators, Not Authors" talk (Globant, active)
    └── symphony/          Symphony x Claude Code deck (finished)
```

Every future presentation gets its own folder under `decks/`, built with the
skill in `skill/`.

## Using the skill

Point Claude Code (or any harness) at `skill/`. To install it locally:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/create-slide-deck
```

## decks/harness-talk

The main talk deck plus its proof decks. Everything is generated from sources
committed in this repo; nothing depends on files outside it.

- `cards-v3/` - YAML slide sources for the current v3 talk (v1/v2 kept as
  `cards/`, `cards-v2/`; `legacy/` is the oldest generation)
- `scripts/` + `theme/` - the YAML -> HTML blueprint renderer
- `proof/` - the artifact-ported decks (`harness-proof-slides.html`,
  `vipp-slides.html`) with their own reproducible pipeline in `proof/build/`
  and original claude.ai sources in `proof/sources/` (see `proof/build/README.md`)
- `build/` - rendered output, gitignored
- `.env` - local only (GEMINI_API_KEY for infographic generation), gitignored

## Working from a new machine

```bash
git clone git@github.com:cdcordobaa/slide-decks.git
cd slide-decks/decks/harness-talk
npm install                          # playwright etc.
npx playwright install chromium

# rebuild + verify the proof decks (byte-identical to the committed HTML)
python3 proof/build/recolor.py && python3 proof/build/slices.py && python3 proof/build/vipp.py
node proof/build/check.mjs proof/vipp-slides.html

# render the v3 talk deck
node scripts/build-blueprint-deck.mjs cards-v3 --out build/harness-v3.html
```

## House rules

- Built deck HTML is committed as the deliverable, but builder scripts are the
  source of truth; a rebuild must be byte-identical before trusting a change.
- No em dashes in any deck copy (build scripts assert this).
- Branded decks pin `data-theme="light"` so a dark-mode OS never inverts them.
- Screenshots (`vp-*.png`, `sl-*.png`, `shot-*.png`) are disposable QA output
  and stay gitignored.
