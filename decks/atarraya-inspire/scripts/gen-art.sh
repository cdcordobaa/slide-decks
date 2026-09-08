#!/usr/bin/env bash
# Genera todo el arte del deck con Gemini (modelo de imagen "Nano Banana").
#
#   ./scripts/gen-art.sh            genera lo que falte
#   ./scripts/gen-art.sh --force    regenera todo
#   ./scripts/gen-art.sh apertura   genera solo una
#
# Necesita GEMINI_API_KEY en el entorno o en decks/atarraya-inspire/.env
# (ese archivo esta en .gitignore, la llave nunca se versiona).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a
: "${GEMINI_API_KEY:?falta GEMINI_API_KEY (ponla en .env)}"
GEN="../harness-talk/scripts/gen-infographics.mjs"
NODE_PATH="$(cd ../product-eng-colombia/node_modules && pwd)"
export NODE_PATH GEMINI_API_KEY
mkdir -p assets/art

FORCE=0; ONLY=""
for a in "$@"; do [ "$a" = "--force" ] && FORCE=1 || ONLY="$a"; done

# Lenguaje visual compartido: el mismo cartel serigrafico del deck.
POSTER='Bold screen-print poster illustration with risograph texture and slight
print misregistration. Thick confident black outlines, flat shapes, visible
halftone dots. Strictly limited palette: warm off-white paper #f6f2e8, near-black
ink #14131a, electric lime #c2f000, bright cyan #12d3ff, hot pink #ff2e6d,
golden yellow #ffc400. High energy, optimistic, warm, made to grab the attention
of fifteen-year-olds. Latin American faces and settings, never generic stock
imagery. Absolutely no text, no words, no letters, no numbers, no logos anywhere
in the image.'

# Los casos del clasificador si son fotograficos: son el material del ejercicio.
PHOTO='Clean, sharp, well-lit color photograph. Single animal, full body clearly
visible, plain neutral seamless background, soft even studio light, no props
beyond the ones described, no people, no text or watermarks anywhere.'

gen () { # gen <id> <aspect> <style> <subject>
  local id="$1" aspect="$2" style="$3" subject="$4"
  [ -n "$ONLY" ] && [ "$ONLY" != "$id" ] && return 0
  if [ -f "assets/art/$id.png" ] && [ "$FORCE" -eq 0 ]; then
    echo "• $id: ya existe"; return 0
  fi
  node "$GEN" --brief "$style

Subject: $subject" --out "assets/art/$id.png" --aspect "$aspect"
}

gen apertura 16:9 "$POSTER" \
  'A classroom of Colombian teenagers seen from the front of the room, dozens of
   hands shot up in the air at once, faces lit up and laughing, backpacks and
   worn wooden desks, bright morning light pouring through tall windows.'

gen garaje 16:9 "$POSTER" \
  'Four young friends crammed into a small garage workspace at the turn of the
   millennium, bulky CRT monitors, tangled cables, pizza boxes, a hand-drawn map
   of the Americas taped to the wall with a pin on the south, single lamp burning
   late at night, messy and full of ambition.'

gen datos 16:9 "$POSTER" \
  'A friendly smiling figure casually holding a fishing rod; the line hooks a
   floating cluster of small glowing personal objects drifting out of a phone:
   a pet collar name tag, a birthday cake, a tiny school building, a house key.
   The objects glow like bait. Playful, not scary.'

gen taller 16:9 "$POSTER" \
  'Groups of teenagers crowded around tables covered in hand-filled paper
   templates and fat markers, one of them standing mid-pitch with an arm raised,
   the others leaning in, laughing and arguing. A workshop at full boil.'

gen futuro 16:9 "$POSTER" \
  'A teenager standing on a rooftop above Bogota at sunrise, the Andes behind the
   city, holding a single sheet of paper up against the wind, the skyline
   dissolving upward into constellations of circuit-like light.'

# Los cinco casos ambiguos del clasificador perro/gato. Cada uno rompe a
# proposito alguna de las seis preguntas de las neuronas.
gen zoo-1 1:1 "$PHOTO" \
  'A fluffy grey tabby cat sitting upright inside an open cardboard box, ears
   sharply pointed, long whiskers, tail curled up behind it, alert expression.'
gen zoo-2 1:1 "$PHOTO" \
  'A tan chihuahua with enormous pointed ears and very large round eyes, sitting,
   looking uncannily like a cat, no collar.'
gen zoo-3 1:1 "$PHOTO" \
  'A german shepherd puppy with tall pointed ears and its tongue hanging out,
   sitting, wearing no collar, tail down.'
gen zoo-4 1:1 "$PHOTO" \
  'A white long-haired cat wearing a red collar with a small bell, tongue tipped
   slightly out mid-lick, tail held straight up.'
gen zoo-5 1:1 "$PHOTO" \
  'A small fluffy pomeranian dog curled up inside a cardboard box, rounded ears
   barely visible, fluffy tail curled up over its back.'

echo "Listo. Vuelve a renderizar el deck."
