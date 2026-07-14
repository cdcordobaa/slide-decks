#!/usr/bin/env node
/*
 * gen-infographics.mjs — generate the hybrid card illustrations with Gemini.
 *
 *   node scripts/gen-infographics.mjs [cardsDir] [--only <id>] [--force] [--dry]
 *
 * Reads GEMINI_API_KEY from the environment or a gitignored .env file, finds
 * cards with `visual.kind: image`, builds each prompt as
 * deck.art.style + the card's `visual.brief`, calls the Gemini image model
 * ("Nano Banana"), and writes <cardsDir>/assets/<id>.png. Results are cached by
 * prompt hash in assets/.manifest.json, so re-runs only regenerate changed art.
 * The key is never printed; nothing is generated with --dry.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const API = "https://generativelanguage.googleapis.com/v1beta/models";

function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const TRANSPARENT_CLAUSE =
  " The subject must be isolated on a fully transparent background (PNG with real alpha channel). No background, no scene, no ground, no drop shadow — only the cut-out subject.";

function parseArgs(argv) {
  const o = { dir: "cards", only: null, force: false, dry: false, brief: null, out: null, transparent: false };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--only") o.only = argv[++i];
    else if (a === "--force") o.force = true;
    else if (a === "--dry") o.dry = true;
    else if (a === "--brief") o.brief = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--transparent") o.transparent = true;
    else rest.push(a);
  }
  if (rest[0]) o.dir = rest[0];
  return o;
}

function loadArt(dir) {
  for (const p of [path.join(dir, "deck.yaml"), path.join(dir, "..", "deck.yaml")]) {
    if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).art ?? {};
  }
  return {};
}

function collectImageCards(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml")) {
    const doc = parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {};
    for (const c of doc.cards ?? []) {
      if (c?.visual?.kind === "image" && c.visual.brief) out.push({ id: c.id, brief: c.visual.brief.trim() });
    }
  }
  return out;
}

async function generate(model, key, prompt) {
  const res = await fetch(`${API}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const data = img?.inlineData?.data || img?.inline_data?.data;
  if (!data) throw new Error(`No image in response: ${JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(data, "base64");
}

async function main() {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  const key = process.env.GEMINI_API_KEY;

  // Ad-hoc mode: generate one image straight from a brief (used by the blueprint
  // proof). --transparent appends the alpha clause.
  if (opts.brief && opts.out) {
    if (!key) { console.error("GEMINI_API_KEY not set (add to .env)."); process.exit(1); }
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
    const prompt = opts.brief + (opts.transparent ? TRANSPARENT_CLAUSE : "");
    process.stdout.write(`• ad-hoc: generating ${opts.out} with ${model}${opts.transparent ? " (transparent)" : ""}… `);
    const buf = await generate(model, key, prompt);
    fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
    fs.writeFileSync(opts.out, buf);
    console.log(`saved (${Math.round(buf.length / 1024)} KB)`);
    return;
  }

  const art = loadArt(opts.dir);
  const model = process.env.GEMINI_IMAGE_MODEL || art.model || "gemini-2.5-flash-image";
  const style = (art.style || "Flat modern NotebookLM-style infographic. No text.").trim();
  const aspect = art.aspect || "16:9";

  let cards = collectImageCards(opts.dir);
  if (opts.only) cards = cards.filter((c) => c.id === opts.only);
  if (!cards.length) return console.log(`No image cards found${opts.only ? ` for --only ${opts.only}` : ""} in ${opts.dir}.`);

  const assetsDir = path.join(opts.dir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  const manifestPath = path.join(assetsDir, ".manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

  if (!key && !opts.dry) {
    console.error("GEMINI_API_KEY not set. Add it to harness-talk-deck/.env (gitignored):\n  GEMINI_API_KEY=your_key_here");
    process.exit(1);
  }

  for (const card of cards) {
    const prompt = `${style}\n\nSubject: ${card.brief}\n\nComposition: ${aspect} aspect ratio, single centered subject, generous empty margins.`;
    const hash = crypto.createHash("sha256").update(`${model}\n${prompt}`).digest("hex").slice(0, 16);
    const png = path.join(assetsDir, `${card.id}.png`);
    const fresh = manifest[card.id] === hash && fs.existsSync(png);
    if (fresh && !opts.force) { console.log(`• ${card.id}: up to date`); continue; }
    if (opts.dry) { console.log(`• ${card.id}: would generate (${model})`); continue; }
    process.stdout.write(`• ${card.id}: generating with ${model}… `);
    const buf = await generate(model, key, prompt);
    fs.writeFileSync(png, buf);
    manifest[card.id] = hash;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`saved assets/${card.id}.png (${Math.round(buf.length / 1024)} KB)`);
  }
  console.log("Done. Rebuild the deck to embed the art (npm run build / build the sample).");
}

main().catch((err) => { console.error(`gen-infographics failed: ${err.message}`); process.exit(1); });
