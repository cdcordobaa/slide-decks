#!/usr/bin/env node
/*
 * check-deck.mjs: the team's deck rules as checks (CONTRIBUTING.md). Run before sharing a change.
 *   node scripts/check-deck.mjs        (npm run check)
 * Errors: em dashes in slide text or notes; a receipt tag with more than its status (audit ids, sources);
 * an audit id in slide text; a URL on a slide; a missing asset; a slide without speaker notes.
 * Warnings: the talk over budget (from the cards); a card number without a fact id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "deck.html"), "utf8");
const errors = [], warnings = [];

const sections = [...html.matchAll(/<section class="slide[^"]*"[^>]*>[\s\S]*?<\/section>/g)].map((m) => m[0]);
const STATUS = new Set(["measured", "sourced", "estimate", "claim", "lesson", "pending"]);

sections.forEach((sec, i) => {
  const n = i + 1;
  const title = (sec.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) || [, ""])[1].replace(/<[^>]+>/g, "").slice(0, 50);
  const where = `slide ${n} "${title}"`;
  const text = sec.replace(/<[^>]+>/g, " ");
  if (/—/.test(text)) errors.push(`${where}: em dash in text or notes`);
  for (const [, tag] of sec.matchAll(/data-tag="([^"]*)"/g)) {
    const [first, ...rest] = tag.split("·").map((t) => t.trim());
    if (STATUS.has(first) && /\b12[a-z]{1,2}\b|audit|facts\.json|\.md\b|source|OSHA|NSC|Allied|business case/i.test(rest.join(" "))) errors.push(`${where}: receipt tag carries a source: "${tag}"`);
  }
  const face = sec.replace(/<aside class="notes">[\s\S]*?<\/aside>/, "").replace(/<[^>]+>/g, " ");
  const audit = face.match(/\b12[a-z]{1,2}\b/);
  if (audit) errors.push(`${where}: audit id on the slide face: "${audit[0]}"`);
  if (/https?:\/\/(?!fonts\.|cdn\.jsdelivr)/.test(face)) errors.push(`${where}: URL on the slide`);
  if (!/<aside class="notes">/.test(sec)) errors.push(`${where}: no speaker notes`);
  for (const [, a, b] of sec.matchAll(/(?:src|poster)="(assets\/[^"]+)"|url\('(assets\/[^']+)'\)/g)) {
    const src = a || b;
    if (src && !fs.existsSync(path.join(ROOT, src)) && !/twin\.mp4$|splat\//.test(src)) errors.push(`${where}: missing asset ${src}`);
  }
});

// cards: budget and fact ids
const dir = path.join(ROOT, "cards");
const deck = (parseYaml(fs.readFileSync(path.join(dir, "deck.yaml"), "utf8")) || {}).deck ?? {};
let secs = 0;
for (const f of fs.readdirSync(dir).filter((f) => /^section-.*\.ya?ml$/.test(f))) {
  for (const c of (parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {}).cards ?? []) {
    if (String(c.path ?? "on") !== "D") secs += c.time ?? 0;
    for (const o of c.overlay ?? []) if (["measured", "sourced", "estimate"].includes(o.status) && !o.fact) warnings.push(`card ${c.id}: "${o.n}" has no fact id`);
  }
}
const budget = deck.budget_seconds ?? 600;
if (secs > budget) warnings.push(`talk is ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}, over the ${budget / 60}:00 budget`);

console.log(`${sections.length} slides checked · talk ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} of ${budget / 60}:00`);
for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
if (errors.length) process.exit(1);
console.log(errors.length || warnings.length ? "" : "all rules pass");
