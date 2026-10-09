#!/usr/bin/env node
/*
 * gen-infographics.mjs: generate the deck's Gemini infographics from the card
 * manifest (cards/*.yaml, visual.kind: image). Adapted from
 * decks/harness-talk/scripts/gen-infographics.mjs; differences:
 *  - output is assets/gen/<ref>.png (G1, G5, ...), the name the storyboard and
 *    the deck look for;
 *  - the prompt carries the card's allowed labels and the area to keep empty
 *    (the HTML overlays the exact numbers there);
 *  - the aspect ratio is passed on every call.
 * Key: GEMINI_API_KEY from the environment, this deck's gitignored .env, or the
 * .env file named by GEMINI_ENV_FILE (so the key is never copied around).
 *
 *   GEMINI_ENV_FILE=../atarraya-inspire/.env node scripts/gen-infographics.mjs cards [--only G5] [--force] [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://generativelanguage.googleapis.com/v1beta/models";

function loadEnv(p) {
  if (!p || !fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

function parseArgs(argv) {
  const o = { dir: "cards", only: null, force: false, dry: false };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--only") o.only = argv[++i];
    else if (a === "--force") o.force = true;
    else if (a === "--dry") o.dry = true;
    else rest.push(a);
  }
  if (rest[0]) o.dir = rest[0];
  return o;
}

function collect(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml").sort()) {
    const doc = parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {};
    for (const c of doc.cards ?? []) {
      const v = c?.visual;
      if (v?.kind === "image" && v.brief && v.ref) out.push({ id: c.id, ref: v.ref, brief: v.brief.trim(), labels: v.labels ?? [], empty: v.keep_empty });
    }
  }
  return out;
}

function prompt(style, aspect, c) {
  const labels = c.labels.length
    ? `Text: only these labels, each exactly as written, in plain all-caps sans-serif, once each: ${c.labels.map((l) => `"${l}"`).join(", ")}. No other words, letters or numbers anywhere.`
    : "Text: none. No words, letters or numbers anywhere in the image.";
  const empty = c.empty ? ` Leave the ${c.empty} empty (plain background) for an overlay.` : "";
  return `${style}\n\nSubject: ${c.brief}\n\n${labels}\n\nComposition: ${aspect} aspect ratio, landscape slide.${empty}`;
}

async function generate(model, key, text, aspect) {
  const res = await fetch(`${API}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const data = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const b64 = data?.inlineData?.data || data?.inline_data?.data;
  if (!b64) throw new Error(`No image in response: ${JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(b64, "base64");
}

async function main() {
  loadEnv(path.join(ROOT, ".env"));
  loadEnv(process.env.GEMINI_ENV_FILE && path.resolve(process.env.GEMINI_ENV_FILE));
  const opts = parseArgs(process.argv.slice(2));
  const art = (parseYaml(fs.readFileSync(path.join(opts.dir, "deck.yaml"), "utf8")) || {}).art ?? {};
  const model = process.env.GEMINI_IMAGE_MODEL || art.model || "gemini-2.5-flash-image";
  const aspect = art.aspect || "16:9";
  const style = (art.style ?? "").trim();
  const key = process.env.GEMINI_API_KEY;
  if (!key && !opts.dry) { console.error("GEMINI_API_KEY not set: put it in this deck's .env (gitignored) or point GEMINI_ENV_FILE at one."); process.exit(1); }

  let cards = collect(opts.dir);
  if (opts.only) cards = cards.filter((c) => opts.only.split(",").includes(c.ref));
  const outDir = path.join(ROOT, "assets", "gen");
  fs.mkdirSync(outDir, { recursive: true });
  const manPath = path.join(outDir, ".manifest.json");
  const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, "utf8")) : {};

  const jobs = cards.map(async (c) => {
    const text = prompt(style, aspect, c);
    const hash = crypto.createHash("sha256").update(`${model}\n${text}`).digest("hex").slice(0, 16);
    const png = path.join(outDir, `${c.ref}.png`);
    if (man[c.ref]?.hash === hash && fs.existsSync(png) && !opts.force) return `• ${c.ref}: up to date`;
    if (opts.dry) return `• ${c.ref} (slide ${c.id}): would generate\n${text}\n`;
    const buf = await generate(model, key, text, aspect);
    fs.writeFileSync(png, buf);
    man[c.ref] = { hash, slide: c.id, model, at: new Date().toISOString() };
    return `• ${c.ref} (slide ${c.id}): saved assets/gen/${c.ref}.png (${Math.round(buf.length / 1024)} KB)`;
  });
  for (const r of await Promise.allSettled(jobs)) console.log(r.status === "fulfilled" ? r.value : `✗ ${r.reason.message}`);
  fs.writeFileSync(manPath, JSON.stringify(man, null, 2));
}

main().catch((err) => { console.error(`gen-infographics failed: ${err.message}`); process.exit(1); });
