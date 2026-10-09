# The Round · Team 05, Globant Physical AI Hackathon

The 10-minute talk that follows the live demo (judging Oct 8, 2026). The talk is a round of the bottling plant: seven
checkpoints, one per act, and the robot walks the real plant map between them. 21 slides on screen (10:00), 3 more
behind D.

Open `deck.html` in Chrome. Full screen with Cmd+Ctrl+F. Everything works from the file.

| Key | What |
|---|---|
| → / space | next (walks to the next checkpoint when the act changes); hidden D slides are skipped |
| ← | back (instant) |
| A / R / Enter | approve / reject the proposal; → is blocked until you decide (2 gates: imagine, act) |
| D | opens the slide's hidden D slides one by one, then its diagrams / charts; Esc goes back |
| N | speaker notes |
| Home | restart (clears gates and timeline) |

`deck.html?slide=N` opens slide N directly with both gates approved (QA, backup).

## Adding content (team)

Read `CONTRIBUTING.md`: the story, the number rules and the steps. With Claude Code, open this folder and ask; the
`team05-deck` skill (`.claude/skills/team05-deck/`) applies the rules and the slide patterns. `npm run check` enforces
them (em dashes, source tags or audit ids on slides, URLs, missing assets, notes, the 10-minute budget).
`npm run kit` packs this folder into `build/team05-deck-kit.zip` to share (no node_modules, build or .env).

## Storyboard first

The deck is planned in `cards/*.yaml` (one file per act; same card model as `decks/harness-talk`):

- `npm run storyboard` renders `build/storyboard.html`: every slide with its sketch, numbers (status colour + fact id),
  real screenshots, requested shots, honest lines and points to review.
- `npm run art` generates the Gemini infographics into `assets/gen/`: only three are kept (G9 parallel tracks, G12 scan → twin, G14 go-to-market); the rest of the deck uses coded SVGs and real screenshots.
  The key is read from this folder's `.env` or the file in `GEMINI_ENV_FILE` (default `../atarraya-inspire/.env`), never
  copied. Gemini draws, the HTML writes the numbers: briefs ask for no numbers, labels are HTML.

## Acts and checkpoints

| # | Stop on the map | Slides |
|---|---|---|
| — | cover | A robot operator that thinks before it acts |
| 1 | JAM-1 · why | The problem · The architecture is the loop |
| 2 | SP-1 · how it learned | Eyes (fire before/after) · Legs (stair training, video) · How we trained it (video) |
| 3 | BC-1 · imagine | The what-if planner (gate 1) |
| 4 | V-3 · act | The hands (gate 2) |
| 5 | MCC room · one Thor | One Thor, one loop (D: how it senses, the link) · Nine models, memory and GPU · Built from specs |
| 6 | QA lab · the twin | One twin, four uses · Scan → twin · The robot builds the twin (video) · Digital understanding (knowledge graph) |
| 7 | Muster · business | Who pays · Unit economics · What you have to believe · Go-to-market (D: risks) · Lessons + the ask · Close |

## Sources

Everything comes from `GlobantHackaton/presentation/` (main, b8b71cb):

- Numbers: `facts.json`; business figures from `BUSINESS.adoc`. Slide faces carry no source text: a box tag says only
  measured, sourced or estimate. Fact ids live in the cards and the storyboard. No PLACEHOLDER is shown.
- Stairs: the teammate's training run (stairs.rl_*, audit 12aq) and their two videos (`assets/video/`), kept apart
  from the ported DreamWaQ numbers.
- Map: `poc-mujoco/sites/bottling.py` (zones, walls, exits, the 11 round stations, BC-1), metres.
- `assets/img/`: screenshots from `images/`. `assets/dd/`: the `-deck` diagrams and charts.
- Credits from `CREDITS.adoc`, in full on the close.

## Backup

`npm install && npm run backup` renders every slide to `build/backup.pdf` (24 pages, gates approved).

`design/` holds the exploration (three directions, the first prototype of the round).
