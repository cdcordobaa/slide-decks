# Adding content to the Team 05 deck

This deck is shared. Anyone on the team can add or change a slide, as long as it follows the rules below. If you
use Claude Code, open this folder and ask for what you want: the `team05-deck` skill (`.claude/skills/team05-deck/`)
loads these rules and the slide patterns and walks the steps for you.

## The story (don't break it)

The talk follows the live demo, so it explains **how and why**, never repeats **what** the demo showed. It is a
round of the bottling plant in seven acts, one checkpoint each; the robot walks the map between them.

| CP | Act | Says |
|---|---|---|
| 1 | Why | night shifts are thin; robots look but can't act; the architecture is the loop |
| 2 | How it learned | eyes (fire detector trained on the Thor) and legs (stair policy trained on the Thor) |
| 3 | Imagine | the what-if planner (approval gate 1) |
| 4 | Act | the hands (approval gate 2) |
| 5 | One Thor | everything on one box; nine models and the GPU; built from specs |
| 6 | The twin | one twin, four uses; scan → twin; next, the robot builds the twin itself |
| 7 | Business | who pays; unit economics; what you have to believe; go-to-market; lessons + the ask |

The talk is **10 minutes**. A new slide must replace time, not add it: `npm run storyboard` shows the budget, and it
must stay at or under 10:00. Detail that doesn't fit goes on a hidden **D** slide (`data-hidden="1"`).

## Numbers: the rules that matter most

1. **Every number comes from `GlobantHackaton/presentation/facts.json`.** Put its fact id in the card (`fact:`).
   No fact id, no number. Missing a number? Ask the bundle owner to register it; never estimate one yourself.
2. **Respect the status.** `measured` → lime, `sourced` → sky blue, `estimate` → amber and written with "~" or
   "about". A `PLACEHOLDER` is never shown.
3. **No source text on the slide face.** No "Sources:" lines, no audit ids (`12x`), no fact ids. A number's tag says
   only its status (`data-tag="measured"`). Sources live in the cards, the storyboard and the speaker notes.
4. **Say what is simulated.** "In simulation" wherever a reader could think it was real. Our sim-trained models are
   not claimed on real cameras.
5. **Keep the honest results.** If a result is weak (our model finds 4 of 42 3D workers), it stays on the slide.
6. **Never mix the two stair policies.** Our trained policy (`stairs.rl_*`) and the ported DreamWaQ that the live
   round uses (19/20) never share a line, a bar or a sentence without saying which is which.

## Words and pictures

- No em dashes in slide text or notes. No credentials, tokens or app/IDE URLs on slides. No Git on the
  "built from specs" slide: specs → parallel tracks with coding agents → the audit trail.
- Headlines say the point as a sentence ("Ours, trained on the Thor, finds it."), not a topic ("Detection").
- Technical slides are **pictures, not paragraphs**: one infographic, at most three numbers, short labels.
- **Real screenshots first.** Use `GlobantHackaton/presentation/images/` (check `manifest.json` for what a frame
  really shows; "laptop run" frames must not claim the Thor). Crop out panels that contradict the slide.
- **Gemini draws, the HTML writes the numbers.** Infographic briefs ask for no numbers and no text; labels and numbers
  are HTML on top. Generate with `npm run art`, then look at every image: regenerate or replace any that is wrong.
- Credits: once, on the close slide (licences require it). New asset → add its credit there.

## How to add a slide

1. **Card first.** Add a card to the act's file in `cards/` (copy a neighbour): `id`, `title`, `time` (seconds),
   `visual`, `overlay` numbers with `status` and `fact`, `honest` line if any, `speaker` notes.
2. `npm run storyboard` → open `build/storyboard.html`. Check the time budget, the numbers' colours, the red review
   points. Share it for review before building.
3. **Infographic?** Add a `visual: {kind: image, ref: Gn, brief, keep_empty}` and run `npm run art -- --only Gn`.
4. **Build the slide** in `deck.html`: a `<section class="slide panel" data-cp="N">` in act order, using the patterns
   in `.claude/skills/team05-deck/references/slide-patterns.md`. Speaker notes go in `<aside class="notes">`.
5. `npm run check` (rules) and `npm run backup` (renders every slide to `build/slides/` and `build/backup.pdf`).
   Look at your slide's PNG: nothing overlaps, nothing runs into the timeline at the bottom.
6. Hand it back with what you changed and which facts you used.

## What is not yours to change from here

The Thor, the live demo and the team repo (`GlobantHackaton`) belong to their owner: deploys, merges and new facts go
through them. This deck only reads from the bundle.

## Setup

`npm install` once (Playwright for renders, `yaml` for the cards). Gemini: put `GEMINI_API_KEY=...` in a `.env` in this
folder (gitignored), or point `GEMINI_ENV_FILE` at one. Open `deck.html` in Chrome; keys are in `README.md`.
