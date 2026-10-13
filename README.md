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
    ├── atarraya-inspire/  "Inspire on Site" talk for ninth graders, Atarraya (Spanish)
    ├── harness-talk/      "Operators, Not Authors" talk (Globant, active)
    ├── physical-ai-hackathon/  Team 05 "The Round" deck, Globant Physical AI Hackathon (finished)
    ├── product-eng-colombia/   "Product Engineering Made in Colombia", Tribu IA (Spanish)
    └── symphony/          Symphony x Claude Code deck (finished)
```

Every future presentation gets its own folder under `decks/`, built with the
skill in `skill/`.

Want to use this for your own decks? Start with [GUIDE.md](GUIDE.md): what the
skill and the scripts can do, which path fits your situation, and how to adapt
the process to your own workflow.

## What you get: HTML and PDF

Every deck comes out in two forms, from the same source, so you never keep two
versions in sync by hand.

| | **HTML** (`deck.html`) | **PDF** (`*.pdf`) |
|---|---|---|
| Best for | Presenting live, and editing | Sharing with anyone, anywhere |
| Who it's for | The speaker and the team | Wide audiences: attendees, managers, clients, students, anyone who wasn't in the room |
| Opens in | A browser (Chrome works best), no internet or server needed | Any PDF reader, phone, tablet, email preview, Slack, Drive, a printer |
| Moving parts | Videos play, animations and interactive steps run, speaker notes on a key | Each slide is a still page; videos show as a frame; interactive steps are shown completed |
| Editing | Click into any text and type, then save with File, Save Page As, Webpage Complete | Not editable; regenerate it from the HTML |
| Extras | Hidden backup slides you can open on demand | One page per slide in 16:9, backgrounds included, no notes or toolbars; backup slides included where the deck says so |

Also produced: one PNG per slide (from `render-pdf.mjs --screenshots` or a
deck's backup script). Use them for social posts, a doc, a thumbnail, or to
review the deck at a glance.

**Rule of thumb:** present from the HTML, send the PDF. Share the PDF after
the talk, attach it to invites, upload it where people will look for it later,
and keep it as the backup if the presenting laptop or browser fails. Regenerate
the PDF every time the HTML changes so the two never drift.

To get the PDF:

- Any deck: `node path/to/skill/scripts/render-pdf.mjs deck.html deck.pdf --screenshots shots`
- Without a terminal: open the HTML in Chrome, Print, Save as PDF, landscape,
  margins none, background graphics on.
- Decks with their own script: `npm run render` or `npm run backup` (see the
  deck's `package.json`).

Before sharing a PDF widely, page through all of it: no clipped text, no
missing images, and nothing on it you wouldn't want forwarded (internal URLs,
names, draft numbers).

## How we build a deck

Every deck goes through the same five steps, in this order. Each step ends with
something the speaker signs off on before the next one starts; slides come
last, never first.

1. **Agree on a visual concept.** Explore two or three directions as rough
   HTML pages (palette, type, one hero slide, the device that carries the
   story, such as the community map or the robot's round) and pick one.
   Example: `decks/physical-ai-hackathon/design/directions.html`, then
   `design/the-round.html` for the chosen one.
2. **Compile the information.** Gather every fact, number, image and video
   the talk may use, each with its source. Numbers come only from that list,
   and anything unconfirmed is marked as an estimate or left out.
3. **Outline the talk.** Write the story as acts or sections with a time
   budget: what each part must make the audience believe, in one line, and
   the evidence that proves it. No slide layouts yet. The outline often lives
   in Notion (the harness talk outline, the Atarraya escaleta).
4. **Generate the storyboard.** Turn the outline into one YAML card per slide
   (`cards/*.yaml`: title, content, takeaway, planned visual, receipts,
   speaker note, time) and render the cards into `build/storyboard.html`, one
   scannable review sheet for the whole talk (`npm run storyboard` in
   `harness-talk/` and `physical-ai-hackathon/`). It shows every slide's
   message and planned visual before any image is generated or any slide is
   designed, so the flow, timing and gaps get fixed here, where they are cheap.
   Infographics are generated from the approved cards (`npm run art`).
5. **Make the slides.** Build the deck from the approved cards with the
   chosen visual concept: either generated from the cards by a script
   (`harness-talk`, `product-eng-colombia`) or hand-built on the skill's
   template with the cards as the spec (`physical-ai-hackathon`). Run the
   deck's checks (no em dashes, every number sourced, assets present), click
   through it in the browser, and export the PDF (`npm run backup`,
   `npm run render` or `skill/scripts/render-pdf.mjs`).

Changes after step 5 go back to the earliest step they touch: a new number
goes into the facts first, a new slide gets a card first.

## Using the skill

Point Claude Code (or any harness) at `skill/`. To install it locally:

```bash
ln -s "$(pwd)/skill" ~/.claude/skills/create-slide-deck
```

## decks/harness-talk

The main talk deck. Everything is generated from sources committed in this
repo; nothing depends on files outside it.

- `cards-v3/` - YAML slide sources for the current v3 talk (v1/v2 kept as
  `cards/`, `cards-v2/`; `legacy/` is the oldest generation)
- `scripts/` + `theme/` - the YAML -> HTML blueprint renderer
- `build/` - rendered output, gitignored
- `.env` - local only (GEMINI_API_KEY for infographic generation), gitignored

## decks/physical-ai-hackathon

The Team 05 deck for the Globant Physical AI Hackathon: a 10-minute talk after
the live demo, 23 slides on screen plus 4 behind D. Open `deck.html` in Chrome;
`README.md` in the folder has the keys, the acts and the build steps
(`npm run check`, `npm run storyboard`, `npm run backup`). Its own
`.claude/skills/team05-deck/` skill holds the team's rules for adding content.
The team's working copy lives in the GlobantHackaton repo at
`presentation/deck/`; this folder is the same deck, kept here as the record.

## Working from a new machine

```bash
git clone git@github.com:cdcordobaa/slide-decks.git
cd slide-decks/decks/harness-talk
npm install                          # playwright etc.
npx playwright install chromium

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
