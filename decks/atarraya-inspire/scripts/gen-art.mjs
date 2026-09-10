#!/usr/bin/env node
/*
 * gen-art.mjs — genera el arte del deck de Atarraya con Gemini.
 *
 *   node scripts/gen-art.mjs              genera lo que falte
 *   node scripts/gen-art.mjs --force      regenera todo
 *   node scripts/gen-art.mjs apertura     genera solo esa
 *   node scripts/gen-art.mjs --list       muestra los briefs sin generar
 *
 * Lee GEMINI_API_KEY del entorno o de decks/atarraya-inspire/.env (gitignored).
 * Sin dependencias: el deck se reconstruye en cualquier maquina con solo node.
 * La llave nunca se imprime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets", "art");
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

/* Lenguaje visual compartido: el mismo cartel serigrafico del deck. */
const POSTER = `Bold screen-print poster illustration with risograph texture and slight print
misregistration. Thick confident black outlines, flat shapes, visible halftone dots. Strictly
limited palette: warm off-white paper #f6f2e8, near-black ink #14131a, electric lime #c2f000,
bright cyan #12d3ff, hot pink #ff2e6d, golden yellow #ffc400. High energy, optimistic, warm,
made to grab the attention of fifteen-year-olds. Latin American faces and settings, never
generic stock imagery. Full-bleed edge-to-edge composition: the artwork must fill the entire
frame with no border, no framing line, no paper margin around it. Absolutely no text, no words,
no letters, no numbers, no logos anywhere in the image.`;

/* Los casos del clasificador si son fotograficos: son el material del ejercicio. */
const PHOTO = `Clean, sharp, well-lit color photograph. Single animal, full body clearly visible,
plain neutral seamless background, soft even studio light, no people, no text or watermarks.`;

const ART = [
  ["apertura", "16:9", POSTER,
   `A classroom of Colombian teenagers seen from the front of the room, dozens of hands shot up
    in the air at once, faces lit up and laughing, backpacks and worn wooden desks, bright
    morning light pouring through tall windows.`],
  ["garaje", "16:9", POSTER,
   `Four young friends crammed into a small garage workspace at the turn of the millennium, bulky
    CRT monitors, tangled cables, pizza boxes, a hand-drawn map of the Americas taped to the wall
    with a pin on the south, single lamp burning late at night, messy and full of ambition.`],
  /* Dos imagenes para el mismo tramo, y el orden importa. "datos" acompana las
     tres preguntas amables y no puede insinuar nada: si la sala huele la trampa
     antes de tiempo, el golpe se cae. El anzuelo entra despues del golpe. */
  ["datos", "3:4", POSTER,
   `Two Colombian teenagers sitting side by side on a school staircase, leaning in and talking,
    both laughing, one gesturing mid sentence, an open notebook resting on a knee, warm morning
    light, completely ordinary and friendly. No phones, no screens, no locks, no keys.`],
  ["anzuelo", "3:4", POSTER,
   `A friendly smiling figure casually holding a fishing rod; the line hooks a floating cluster of
    small glowing personal objects drifting out of a phone: a pet collar name tag, a birthday
    cake, a tiny school building, a house key. The objects glow like bait. Playful, not scary.`],
  ["taller", "16:9", POSTER,
   `Groups of teenagers crowded around tables covered in hand-filled paper templates and fat
    markers, one of them standing mid-pitch with an arm raised, the others leaning in, laughing
    and arguing. A workshop at full boil.`],
  ["futuro", "16:9", POSTER,
   `A teenager standing on a rooftop above Bogota at sunrise, the Andes behind the city, holding a
    single sheet of paper up against the wind, the skyline dissolving upward into constellations
    of circuit-like light.`],

  /* Los cinco casos ambiguos. Cada uno rompe a proposito alguna de las seis
     preguntas de las neuronas: orejas, bigotes, lengua, caja, collar, cola. */
  ["zoo-1", "1:1", PHOTO,
   `A fluffy grey tabby cat sitting upright inside an open cardboard box, ears sharply pointed,
    long whiskers, tail curled up behind it, alert expression.`],
  ["zoo-2", "1:1", PHOTO,
   `A tan chihuahua with enormous pointed ears and very large round eyes, sitting, looking
    uncannily like a cat, wearing no collar.`],
  ["zoo-3", "1:1", PHOTO,
   `A german shepherd puppy with tall pointed ears and its tongue hanging out, sitting, wearing no
    collar, tail down.`],
  ["zoo-4", "1:1", PHOTO,
   `A white long-haired cat wearing a red collar with a small bell, tongue tipped slightly out
    mid-lick, tail held straight up.`],
  ["zoo-5", "1:1", PHOTO,
   `A small fluffy pomeranian dog curled up inside a cardboard box, rounded ears barely visible,
    fluffy tail curled up over its back.`],
];

function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const squash = (t) => t.replace(/\s+/g, " ").trim();

/* La API devuelve PNG de ~2 MB por la trama de semitono. sips (macOS) los pasa
 * a JPEG sin perdida visible y el deck baja de 18 MB a menos de 2. Si sips no
 * existe, el PNG se queda y el deck lo usa igual. */
function compress(png, jpg) {
  const r = spawnSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", png, "--out", jpg],
                      { stdio: "ignore" });
  if (r.status !== 0 || !fs.existsSync(jpg)) return null;
  fs.unlinkSync(png);
  return Math.round(fs.statSync(jpg).size / 1024);
}

async function generate(key, prompt, aspect) {
  const res = await fetch(`${API}/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const data = parts.map((p) => p.inlineData?.data || p.inline_data?.data).find(Boolean);
  if (!data) throw new Error(`sin imagen en la respuesta: ${JSON.stringify(json).slice(0, 240)}`);
  return Buffer.from(data, "base64");
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const list = args.includes("--list");
  const only = args.filter((a) => !a.startsWith("--"));

  const todo = ART.filter(([id]) => !only.length || only.includes(id));
  if (!todo.length) return console.error(`no conozco: ${only.join(", ")}`);

  if (list) {
    for (const [id, aspect, , subject] of todo) console.log(`${id} (${aspect})\n  ${squash(subject)}\n`);
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.error("falta GEMINI_API_KEY (ponla en .env)"); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });

  let hechas = 0;
  for (const [id, aspect, style, subject] of todo) {
    const file = path.join(OUT, `${id}.jpg`);
    const png = path.join(OUT, `${id}.png`);
    if (fs.existsSync(file) && !force) { console.log(`• ${id}: ya existe`); continue; }
    process.stdout.write(`• ${id}: generando (${aspect})... `);
    try {
      const buf = await generate(key, `${squash(style)}\n\nSubject: ${squash(subject)}`, aspect);
      fs.writeFileSync(png, buf);
      const kb = compress(png, file);
      console.log(kb ? `${kb} KB` : `${Math.round(buf.length / 1024)} KB (sin comprimir)`);
      hechas += 1;
    } catch (err) {
      console.log(`FALLO: ${err.message}`);
    }
  }
  console.log(`\nListo (${hechas} nuevas). Vuelve a renderizar el deck.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
