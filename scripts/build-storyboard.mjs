#!/usr/bin/env node
/*
 * build-storyboard.mjs — render the slide MANIFEST into a scannable review sheet
 * you can go through BEFORE anything is generated. Shows, per slide: status,
 * title, content, takeaway, and the planned visual (a coded diagram + its data,
 * or a Gemini image brief that hasn't been generated yet). No API calls.
 *
 *   node scripts/build-storyboard.mjs cards --out build/storyboard.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function parseArgs(argv) {
  const o = { dir: "cards", out: "build/storyboard.html" };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") o.out = argv[++i];
    else rest.push(argv[i]);
  }
  if (rest[0]) o.dir = rest[0];
  return o;
}

function loadDeck(dir) {
  for (const p of [path.join(dir, "deck.yaml"), path.join(dir, "..", "deck.yaml")]) {
    if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).deck ?? {};
  }
  return {};
}
function loadSections(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml")
    .sort()
    .map((f) => {
      const doc = parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {};
      return { section: doc.section ?? {}, cards: doc.cards ?? [] };
    })
    .filter((s) => s.cards.length);
}

// Summarise a coded diagram's data as readable review lines.
function diagramSummary(v) {
  const parts = [];
  if (v.center || v.subject) parts.push(`center: ${esc(v.center ?? v.subject)}`);
  const list = (label, arr) => arr && parts.push(`${label}: ${arr.map((i) => esc(typeof i === "object" ? i.label : i)).join(", ")}`);
  list("items", v.items);
  list("terms", v.terms);
  list("rungs", v.rungs);
  list("layers", v.layers);
  list("steps", v.steps);
  if (v.boxes) parts.push(`boxes: ${v.boxes.map((b) => `${esc(b.label)}→${esc(b.result)}`).join(", ")}`);
  if (v.rows) parts.push(`rows: ${v.rows.map((r) => `${esc(r.metaphor)}→${esc(r.technical)}`).join("; ")}`);
  if (v.from && v.to) parts.push(`${esc(v.from.label)} ⇒ ${esc(v.to.label)}`);
  return parts;
}

function visualBlock(card, dir) {
  const v = card.visual ?? {};
  if (v.kind === "image") {
    const generated = fs.existsSync(path.join(dir, "assets", `${card.id}.png`));
    const flags = [v.transparent ? "transparent" : null, v.overlay ? `${v.overlay.length} labels` : null].filter(Boolean);
    return `<div class="vis vis--image">
      <div class="vis__tag">🖼 IMAGE · Gemini${flags.length ? ` · ${esc(flags.join(" · "))}` : ""}</div>
      <div class="vis__brief">${esc((v.brief ?? "").trim())}</div>
      <div class="vis__state ${generated ? "ok" : "wait"}">${generated ? "✓ generated" : "◻ not generated — will call Gemini"}</div>
    </div>`;
  }
  if (v.kind) {
    const rows = diagramSummary(v).map((p) => `<div class="vis__row">${p}</div>`).join("");
    return `<div class="vis vis--diagram">
      <div class="vis__tag">▦ DIAGRAM · ${esc(v.kind)} <span class="vis__free">coded · free · instant</span></div>
      ${rows}
    </div>`;
  }
  return `<div class="vis vis--none"><div class="vis__tag">— no visual specified</div></div>`;
}

function row(card, dir) {
  const status = String(card.status ?? "draft").toLowerCase();
  const speaker = card.speaker ? `<details class="row__more"><summary>speaker / design notes</summary><div>${esc(card.speaker)}${card.design_note ? `<br><em>${esc(card.design_note)}</em>` : ""}</div></details>` : "";
  return `<article class="row">
    <div class="row__visual">${visualBlock(card, dir)}</div>
    <div class="row__meta">
      <div class="row__head"><span class="pill pill--${status}">${esc(status)}</span><span class="row__id">${esc(card.id)} · ${esc(card.name ?? "")}</span></div>
      <h3 class="row__title">${esc(card.title)}</h3>
      ${card.subtitle ? `<p class="row__content">${esc(card.subtitle)}</p>` : ""}
      ${card.takeaway ? `<p class="row__take">▸ ${esc(card.takeaway)}</p>` : ""}
      ${speaker}
    </div>
  </article>`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const deck = loadDeck(opts.dir);
  const sections = loadSections(opts.dir);
  const all = sections.flatMap((s) => s.cards);
  const imgPending = all.filter((c) => c.visual?.kind === "image" && !fs.existsSync(path.join(opts.dir, "assets", `${c.id}.png`))).length;
  const imgDone = all.filter((c) => c.visual?.kind === "image" && fs.existsSync(path.join(opts.dir, "assets", `${c.id}.png`))).length;
  const diagrams = all.filter((c) => c.visual?.kind && c.visual.kind !== "image").length;
  const byStatus = all.reduce((m, c) => ((m[c.status ?? "draft"] = (m[c.status ?? "draft"] || 0) + 1), m), {});

  const body = sections
    .map((s) => `<section class="sec"><h2 class="sec__title">§${esc(s.section.id ?? "")} · ${esc(s.section.title ?? "")}</h2>${s.cards.map((c) => row(c, opts.dir)).join("")}</section>`)
    .join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Storyboard — ${esc(deck.title ?? "Deck")}</title>
<style>
  :root { --ink:#1c2530; --muted:#6b7684; --line:#e3e7ee; --accent:#3b5bdb; --paper:#f6f7f9; }
  * { box-sizing:border-box; } body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.5 Inter,system-ui,sans-serif; }
  .wrap { max-width:1000px; margin:0 auto; padding:36px 28px 80px; }
  .head h1 { margin:0 0 6px; font-size:28px; } .head p { margin:0; color:var(--muted); }
  .counts { display:flex; gap:10px; flex-wrap:wrap; margin:16px 0 8px; }
  .count { background:#fff; border:1px solid var(--line); border-radius:8px; padding:8px 14px; font-size:13px; }
  .count b { font-size:18px; display:block; }
  .count--spend { border-color:#f0c36d; background:#fff8e8; }
  .sec__title { margin:34px 0 12px; font-size:15px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent); border-bottom:1px solid var(--line); padding-bottom:8px; }
  .row { display:grid; grid-template-columns:300px 1fr; gap:20px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:18px; margin-bottom:14px; }
  .row__visual { border-right:1px dashed var(--line); padding-right:18px; }
  .vis__tag { font-size:12px; font-weight:700; color:var(--ink); margin-bottom:8px; }
  .vis__free { color:#2a9d6f; font-weight:600; }
  .vis--diagram { }
  .vis__row { font-size:12.5px; color:var(--muted); font-family:ui-monospace,Menlo,monospace; margin:3px 0; }
  .vis__brief { font-size:12.5px; color:#4a5563; font-style:italic; background:#f6f4ff; border:1px solid #e2ddfb; border-radius:6px; padding:8px 10px; }
  .vis__state { margin-top:8px; font-size:12px; font-weight:700; }
  .vis__state.ok { color:#2a9d6f; } .vis__state.wait { color:#c47f1a; }
  .vis--none .vis__tag { color:var(--muted); font-weight:500; }
  .row__head { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
  .row__id { font-size:12px; color:var(--muted); font-family:ui-monospace,Menlo,monospace; }
  .row__title { margin:0 0 6px; font-size:21px; line-height:1.2; }
  .row__content { margin:0 0 8px; color:#3a4553; }
  .row__take { margin:0; font-weight:650; color:var(--ink); }
  .row__more { margin-top:8px; font-size:12.5px; color:var(--muted); }
  .row__more summary { cursor:pointer; color:var(--accent); }
  .pill { font-size:11px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; padding:3px 9px; border-radius:999px; }
  .pill--draft { background:#eef1f5; color:#6b7684; } .pill--ready { background:#e7f0ff; color:#3b5bdb; }
  .pill--generated { background:#e7f7ef; color:#2a9d6f; } .pill--final { background:#e7f7ef; color:#177a4f; }
  @media print { body { background:#fff; } .row, .count { box-shadow:none; } }
</style></head>
<body><div class="wrap">
  <div class="head"><h1>Storyboard — ${esc(deck.title ?? "Deck")}</h1>
    <p>${esc(deck.subtitle ?? "")} · review each slide before generating. Diagrams are free/instant; images cost one Gemini call each and only run when you approve.</p></div>
  <div class="counts">
    <div class="count"><b>${all.length}</b> slides</div>
    <div class="count"><b>${diagrams}</b> coded diagrams (free)</div>
    <div class="count count--spend"><b>${imgPending}</b> images to generate</div>
    <div class="count"><b>${imgDone}</b> images done</div>
    <div class="count"><b>${Object.entries(byStatus).map(([k, n]) => `${n} ${k}`).join(" · ") || "—"}</b>status</div>
  </div>
  ${body}
</div></body></html>`;

  fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
  fs.writeFileSync(opts.out, html);
  console.log(`Wrote ${opts.out} — ${all.length} slides (${diagrams} diagrams, ${imgPending} images pending, ${imgDone} done)`);
}

try { main(); } catch (e) { console.error(`build-storyboard failed: ${e.message}`); process.exit(1); }
