#!/usr/bin/env node
/* dump-storyboard.mjs — emit the whole manifest + image config as Markdown
 * (for pasting into Notion). node scripts/dump-storyboard.mjs cards */
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const dir = process.argv[2] || "cards";
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").replace(/\|/g, "/").trim();

const deck = (() => {
  for (const p of [path.join(dir, "deck.yaml")]) if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).deck ?? {};
  return {};
})();
const art = (() => {
  for (const p of [path.join(dir, "deck.yaml")]) if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).art ?? {};
  return {};
})();
const core = new Set((deck.core ?? []).map(String));

const sections = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml").sort()
  .map((f) => { const d = parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {}; return { section: d.section ?? {}, cards: d.cards ?? [] }; })
  .filter((s) => s.cards.length);

function visual(c) {
  const v = c.visual ?? {};
  if (v.kind === "image") return `🖼 IMAGE — ${clean(v.brief).slice(0, 90)}…`;
  const bits = [];
  if (v.center || v.subject) bits.push(`center: ${clean(v.center ?? v.subject)}`);
  for (const k of ["items", "terms", "rungs", "steps", "layers"]) if (v[k]) bits.push(clean((v[k]).map((x) => (x?.label ?? x)).join(", ")));
  if (v.boxes) bits.push(clean(v.boxes.map((b) => `${b.label}→${b.result}`).join("; ")));
  if (v.from && v.to) bits.push(`${clean(v.from.label)} ⇒ ${clean(v.to.label)}`);
  return `▦ ${v.kind ?? "—"} — ${bits.join(" · ").slice(0, 110)}`;
}

const out = [];
out.push(`## Core cut — 20-slide spine (build target)\n`);
out.push((deck.core ?? []).join(" · ") + "\n");
out.push(`## Full storyboard (${sections.reduce((n, s) => n + s.cards.length, 0)} slides)\n`);
for (const s of sections) {
  out.push(`### §${s.section.id ?? ""} · ${s.section.title ?? ""}`);
  out.push(`| ID | Title | Content | Visual | Layout | Status |`);
  out.push(`|---|---|---|---|---|---|`);
  for (const c of s.cards) {
    const star = core.has(String(c.id)) ? "★ " : "";
    out.push(`| ${star}${clean(c.id)} | ${clean(c.title)} | ${clean(c.subtitle)} | ${visual(c)} | ${clean(c.layout ?? "centered")} | ${clean(c.status)} |`);
  }
  out.push("");
}
out.push(`## Image generation — shared style preamble\n`);
out.push("```\n" + clean(art.style) + "\n```\n");
out.push(`## Image briefs (from manifest)\n`);
for (const s of sections) for (const c of s.cards) if (c.visual?.kind === "image") out.push(`**${c.id} — ${c.name ?? c.title}**\n\n> ${clean(c.visual.brief)}\n`);

fs.writeFileSync("build/storyboard.md", out.join("\n"));
console.log("Wrote build/storyboard.md");
