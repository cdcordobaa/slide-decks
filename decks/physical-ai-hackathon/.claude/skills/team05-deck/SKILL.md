---
name: team05-deck
description: Add or change a slide in the Team 05 Physical AI Hackathon deck (deck.html + cards/*.yaml) following the team's rules for numbers, story, screenshots and Gemini infographics. Use whenever someone asks to add content, a slide, a number, an image or a diagram to this deck, or to review a slide against the guidelines.
---

# Team 05 deck: adding content

You are editing a shared, live presentation. Follow `CONTRIBUTING.md` at the deck root: it is the source of truth
for the story, the number rules and the workflow. Read it first, every time. Then:

## 1. Understand the request against the story

- Find the act and checkpoint it belongs to (CONTRIBUTING.md, "The story"). If it repeats what the live demo shows,
  turn it into how/why, or push back.
- Run `npm run storyboard` and read `build/storyboard.html` (or the YAML in `cards/`) to see what already exists.
  Prefer changing an existing slide over adding one; the talk must stay at or under 10:00.

## 2. Get the numbers right before writing anything

- Every number needs a fact id from `GlobantHackaton/presentation/facts.json` (path in `README.md`). Look it up:
  `python3 -c "import json;f=json.load(open('<path>/facts.json'));..."`. Use the value and wording as registered.
- Status decides the colour and wording: measured / sourced / estimate ("~", "about"). PLACEHOLDER = do not show.
- If the number isn't registered, stop and tell the user to ask the bundle owner. Never invent, round up, or combine
  numbers into a new claim. Never put trained-stairs numbers (`stairs.rl_*`) on a line with DreamWaQ's.

## 3. Card, then storyboard

- Add or edit the card in `cards/section-<act>.yaml` (same fields as its neighbours). Put every number in `overlay`
  with `status` and `fact`. Add `honest:` for limits, `review:` for anything the user must decide.
- `npm run storyboard`. Check the time counter and the review flags.

## 4. Visuals

- Real screenshots first: `GlobantHackaton/presentation/images/` plus its `manifest.json`. Copy what you use into
  `assets/img/` and crop out anything that contradicts the slide (laptop-run captions, "auto-approval" panels,
  URLs). Never present a stand-in or laptop frame as the Thor or as our scan.
- Infographic: write a brief in the card (`kind: image`, `ref: G<n>`, `brief`, `keep_empty`, `labels: []`), run
  `npm run art -- --only G<n>`, then LOOK at the PNG. Wrong proportions, garbled text, invented numbers: regenerate,
  or replace it with a coded HTML chart when exact values matter.

## 5. Build the slide

- Use the patterns in `references/slide-patterns.md` (stage 1280×720, absolute positions, kicker `.k`, `h2`,
  `.stat.det.<status>` with `data-tag="<status>"` only, `.genbox`, `.shot`, `.honest`, full-bleed `.bleedf`).
- Insert the `<section>` in act order with the right `data-cp`. Speaker notes in `<aside class="notes">`, written to
  be said aloud, no em dashes.

## 6. Verify, then report

- `npm run check`: must print no errors (em dashes, source tags on faces, missing assets, URLs).
- `npm run backup`, then open your slide's PNG in `build/slides/` and look at it: no overlaps, nothing below y≈650.
- Report: what changed, the fact ids used, anything left for review. Do not deploy, merge or touch the Thor or the
  GlobantHackaton repo: those go through their owner.
