# Using this repo for your own decks

This guide is for anyone who wants to build presentations the way these decks
were built: with an AI agent (Claude Code or similar) doing the heavy lifting,
and you deciding the story, the look and every number. You don't need to copy
any of our decks. Take the skill, pick the pieces that fit your workflow, and
leave the rest.

## What you get

| Piece | Where | What it does for you |
|---|---|---|
| The skill | `skill/` | Teaches the agent how to build a deck as one HTML page you can open, edit in the browser, and print to PDF. |
| Deck template | `skill/assets/editable-deck-template.html` | A blank 16:9 deck with print CSS, editable slides and a toolbar that hides in the PDF. |
| PDF renderer | `skill/scripts/render-pdf.mjs` | HTML to PDF plus one PNG per slide, and a warning for text that overflows a slide. |
| Artifact porting | `skill/references/artifact-recolor-slicing.md` | Turns a well-designed HTML page (for example a claude.ai artifact) into branded slides without redesigning it. |
| Slide cards | `decks/*/cards/*.yaml` | One YAML card per slide: title, content, takeaway, planned visual, speaker note, time. |
| Storyboard builder | `decks/harness-talk/scripts/build-storyboard.mjs` (also in `physical-ai-hackathon/`) | Renders all cards into one review page, so you can judge the whole talk before any slide is designed. |
| Card-to-deck renderers | `decks/harness-talk/scripts/build-blueprint-deck.mjs`, `decks/product-eng-colombia/scripts/build-deck.mjs` | Generate the slides straight from the cards, with a small set of visual kinds (stats, cycle, pillars, map, charts). |
| Illustration generator | `decks/harness-talk/scripts/gen-infographics.mjs` | Makes images with Gemini from a brief in a card. Cached, so only changed briefs are regenerated. Needs your own `GEMINI_API_KEY` in a gitignored `.env`. |
| Notion sync | `decks/harness-talk/scripts/notion-sync.mjs` | Pulls slide specs written in Notion into YAML and writes slide status back. With Claude, the Notion connector does the same with no token. |
| Deck checks | `decks/physical-ai-hackathon/scripts/check-deck.mjs` | Your rules as a script: no em dashes, every number tagged with its source, no URLs on slides, no missing images, every slide has notes. |
| Team skill | `decks/physical-ai-hackathon/.claude/skills/team05-deck/` | An example of a deck's own skill, so teammates (and their agents) add slides by the same rules. |

The pieces under `decks/` live inside the deck that needed them. To reuse one,
copy the script into your deck folder and adjust it; they are small and have
a usage comment at the top.

## Set up

```bash
git clone https://github.com/cdcordobaa/slide-decks.git
ln -s "$(pwd)/slide-decks/skill" ~/.claude/skills/create-slide-deck

mkdir -p slide-decks/decks/my-talk && cd slide-decks/decks/my-talk
npm init -y && npm install -D playwright yaml
npx playwright install chromium
```

You can also keep your decks in your own repo and only link the skill. The
skill works without any of the scripts; they are there for when a deck grows.

## Choose how much process you need

Pick the lightest path that fits. You can move up a level later.

| Your situation | Path | What you use |
|---|---|---|
| A short internal update, a class, a one-off pitch | **Quick deck** | The skill and its template. Ask for the deck, edit in the browser, print to PDF. |
| You already have a good HTML page or artifact | **Port** | The artifact-porting reference. The design stays, the colors become your brand, sections become slides. |
| A talk you will rehearse and revise many times | **Card-driven** | Cards, storyboard, a card-to-deck renderer. Change a card, rebuild the deck. |
| A high-stakes deck with custom slides, numbers that must be right, or several people editing | **Hand-built with cards as the spec** | Cards and storyboard for the plan, a hand-built `deck.html`, a facts list, the checks script and a deck skill for the team. |

Examples in this repo: `symphony/` is a quick deck, `harness-talk/` and
`product-eng-colombia/` are card-driven, `physical-ai-hackathon/` is
hand-built with cards as the spec.

## The way of working

Whatever the path, the order is the same. Each step ends with you saying "yes,
that one" before the agent moves on. Slides come last.

### 1. Agree on a visual concept

Ask for two or three directions as rough HTML pages: palette, type, one hero
slide, and the device that will carry the story (a map that fills in, a robot
doing its round, a ladder you climb). Pick one and keep the page as the
reference.

> "Before any slides, show me three visual directions for this talk as one
> HTML page each: palette, fonts, a title slide and one content slide."

### 2. Gather the information

Collect everything the talk may use: facts and numbers with their source,
screenshots, photos, videos, quotes. Put the numbers in one list (a JSON or
YAML file, or a Notion table) with a status for each: measured, sourced,
estimate, or not confirmed yet. The slides only ever take numbers from that
list.

> "Read these docs and build facts.json: every number we might show, where it
> comes from, and whether it's measured, sourced or an estimate."

### 3. Outline the talk

Write the story as acts with a time budget. For each act: what the audience
must believe at the end, in one line, and the evidence that proves it. No
layouts yet. Notion or a Markdown file is fine.

> "Outline a 10-minute talk in five acts. For each act give the one thing the
> audience should believe and which facts prove it. No slides yet."

### 4. Generate the storyboard

Turn the outline into one card per slide and render the storyboard page. Read
it top to bottom like the talk: does it flow, is it on time, is every number
backed, is anything missing? This is where changes are cheap. Generate
illustrations only from approved cards.

> "Write the cards for act 2 and build the storyboard. Flag any number that
> isn't in facts.json."

### 5. Make the slides

Build the deck from the approved cards in the chosen visual concept, either
with a renderer or by hand. Then run the checks, click through the deck in the
browser at presentation size, and export the PDF. Look at every page of the
PDF before you share it.

> "Build the slides for act 2 from the cards, run the checks, render the PDF
> and show me any slide where text overflows or overlaps."

**When something changes later,** go back to the earliest step it touches: a
new number goes into the facts list first, a new slide gets a card first,
then the slide.

## Make it yours

- **Your brand.** Put your colors and fonts in CSS variables at the top of the
  deck (or in `theme/*.css` for card-driven decks) and pin
  `data-theme="light"` or `"dark"` so a viewer's OS setting can't invert it.
  Put the logo in the deck's asset folder.
- **Your language.** Cards and slides can be in any language; two of our decks
  are in Spanish.
- **Your rules.** Write the rules your deck must follow (tone, numbers,
  what never goes on a slide) in a `CONTRIBUTING.md` in the deck folder, then
  turn the checkable ones into a script like `check-deck.mjs`. Rules that live
  in a script get followed; rules that live in a chat get forgotten.
- **Your team.** If others will add slides, give the deck its own skill under
  `.claude/skills/<name>/SKILL.md` that says: read the rules, find the facts,
  card first, build, check, report. Copy `team05-deck` as a starting point.
- **Your visual kinds.** A card-driven renderer only knows a few visual kinds.
  Add one by writing a render function and a matching CSS block, then use it
  from any card.
- **Your sources.** If your outline lives in Notion, Google Docs or elsewhere,
  let the agent read it through a connector, or adapt `notion-sync.mjs`.

## Rules we keep, and why

- **Every number has a source and a status.** Estimates say "about" or "~".
  Unconfirmed numbers stay off the slides. One wrong number costs the room's
  trust in all the others.
- **Say what is simulated, estimated or not done yet,** on the slide, in a
  short honest line. It reads as confidence, not weakness.
- **One clear message per slide.** If a slide needs two takeaways, it is two
  slides.
- **No em dashes** in slide text. The checks and builders enforce it.
- **Look at the output.** Render screenshots or the PDF and check every page
  for clipped text, overlaps and missing images before calling a deck done.
- **No secrets on slides.** No API keys, tokens or private URLs in slides,
  notes or committed files. Keys live in a gitignored `.env`.

## Handy commands

```bash
# any HTML deck to PDF plus screenshots
node path/to/skill/scripts/render-pdf.mjs deck.html deck.pdf --screenshots shots

# card-driven decks (in their folder)
npm run storyboard     # cards -> build/storyboard.html
npm run art            # Gemini illustrations for cards with visual.kind: image
npm run build          # cards -> deck (name varies per deck, see its package.json)

# hand-built deck (physical-ai-hackathon)
npm run check          # the deck's rules
npm run backup         # every slide to PNG and build/backup.pdf
```

Each deck's own `README.md` has its exact commands and keys.
