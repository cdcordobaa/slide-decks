#!/usr/bin/env node
/*
 * build-cards.mjs — compile NotebookLM-style card specs into one editable HTML
 * deck using the light card theme.
 *
 *   node scripts/build-cards.mjs cards --out build/harness-talk.html [--min-status ready]
 *
 * Each card = one teaching slide: eyebrow, title, teaching subtitle, a central
 * visual (from `visual.kind`), and a bottom takeaway. Production/speaker notes
 * render on screen only; the full spec is embedded as JSON for round-tripping.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "notebooklm-cards.css");
const STATUS_RANK = { draft: 0, ready: 1, final: 2 };
// Rendering context (spec dir + output dir) for resolving/copying image assets.
const CTX = { dir: ".", outDir: ".", assets: new Set() };

// ---------- args ----------
function parseArgs(argv) {
  const opts = { dir: "cards", out: "build/harness-talk.html", minStatus: null };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--min-status") opts.minStatus = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node build-cards.mjs <cardsDir> --out <file.html> [--min-status <status>]");
      process.exit(0);
    } else rest.push(a);
  }
  if (rest[0]) opts.dir = rest[0];
  return opts;
}

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const rank = (s) => STATUS_RANK[String(s ?? "").trim().toLowerCase()] ?? 0;
const item = (it) =>
  typeof it === "object" && it
    ? { label: it.label, caption: it.caption ?? it.note ?? null, state: it.state ?? null }
    : { label: it, caption: null, state: null };

// ---------- monoline icon set ----------
const ICON_PATHS = {
  model: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  tools: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19"/>',
  context: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/>',
  retry: '<path d="M20 5v6h-6"/><path d="M20 11a8 8 0 1 0-2 5.7"/>',
  state: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  evaluation: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  safety: '<path d="M12 3l7 3v6c0 4-3 6.6-7 9-4-2.4-7-5-7-9V6l7-3Z"/>',
  human: '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  specs: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  improve: '<path d="M4 20V12M10 20V8M16 20v-6M3 20h18"/>',
  missing:
    '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/><path d="M9.6 9.5a2.4 2.4 0 1 1 3 3.8c-.6.4-.6.7-.6 1.4"/><circle cx="12" cy="17.6" r=".7" fill="currentColor" stroke="none"/>',
  generic: '<circle cx="12" cy="12" r="4"/>',
};
function iconFor(label) {
  const s = String(label ?? "").toLowerCase();
  if (/model/.test(s)) return "model";
  if (/missing|runtime|\?\?\?/.test(s)) return "missing";
  if (/human|^you\b|\byou\b/.test(s)) return "human";
  if (/spec/.test(s)) return "specs";
  if (/context|assemble|copy context|\bsee\b/.test(s)) return "context";
  if (/tool|command|edit/.test(s)) return "tools";
  if (/retry|recover/.test(s)) return "retry";
  if (/state|track/.test(s)) return "state";
  if (/eval|judge|review|correct/.test(s)) return "evaluation";
  if (/safe|constraint|permission/.test(s)) return "safety";
  if (/improve|system/.test(s)) return "improve";
  return "generic";
}
const icon = (name, cls) =>
  `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] ?? ICON_PATHS.generic}</svg>`;

function loadDeckMeta(dir) {
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
      return { file: f, section: doc.section ?? {}, cards: asList(doc.cards) };
    })
    .filter((s) => s.cards.length);
}

// ---------- visual kinds ----------
// stack — layered diagram; each layer has an icon + what it does
function renderStack(v) {
  const rows = asList(v.items)
    .map(item)
    .map((it) => {
      const miss = it.state === "missing";
      const cap = it.caption ? `<span class="stack__cap">${esc(it.caption)}</span>` : "";
      const tag = miss ? `<span class="stack__tag">not engineered</span>` : "";
      return `<li class="stack__item${miss ? " stack__item--missing" : ""}">${icon(iconFor(it.label), "stack__ico")}<span class="stack__label">${esc(it.label)}</span>${cap}${tag}</li>`;
    })
    .join("");
  return `<ul class="stack">${rows}</ul>`;
}

// hub — a central node with explained satellites and connector wires
function renderHub(v, reveal) {
  const center = v.center ?? v.subject ?? "";
  const items = asList(v.items).map(item);
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);
  const node = (it) =>
    `<div class="hub__node">${icon(iconFor(it.label), "hub__ico")}<div class="hub__text"><div class="hub__label">${esc(it.label)}</div>${it.caption ? `<div class="hub__cap">${esc(it.caption)}</div>` : ""}</div></div>`;
  const col = (arr, side) => `<div class="hub__col hub__col--${side}">${arr.map(node).join("")}</div>`;
  const ys = (n) =>
    n <= 1 ? [50] : n === 2 ? [28, 72] : n === 3 ? [16, 50, 84] : Array.from({ length: n }, (_, i) => Math.round(((i + 1) * 100) / (n + 1)));
  const wire = (x, y) => `<line vector-effect="non-scaling-stroke" x1="50" y1="50" x2="${x}" y2="${y}"/>`;
  const wires = [...ys(left.length).map((y) => wire(31, y)), ...ys(right.length).map((y) => wire(69, y))].join("");
  const cap = v.caption ? `<div class="hub__center-cap">${esc(v.caption)}</div>` : "";
  return `<div class="hub${reveal ? " hub--reveal" : ""}">
    <svg class="hub__wires" viewBox="0 0 100 100" preserveAspectRatio="none">${wires}</svg>
    ${col(left, "left")}
    <div class="hub__center">${icon(iconFor(center), "hub__center-ico")}<div class="hub__center-label">${esc(center)}</div>${cap}</div>
    ${col(right, "right")}
  </div>`;
}

// transfer — two labelled columns (icons per item) with an arrow + caption
function renderTransfer(v) {
  const li = (i) => `<li>${icon(iconFor(i), "transfer__ico")}<span>${esc(i)}</span></li>`;
  const col = (c, to) =>
    `<div class="transfer__col${to ? " transfer__col--to" : ""}"><div class="transfer__label">${esc(c.label)}</div><ul class="transfer__list">${asList(c.items).map(li).join("")}</ul></div>`;
  const mid = `<div class="transfer__mid"><div class="transfer__arrow">→</div>${v.caption ? `<div class="transfer__cap">${esc(v.caption)}</div>` : ""}</div>`;
  return `<div class="transfer">${col(v.from ?? {}, false)}${mid}${col(v.to ?? {}, true)}</div>`;
}

// image — Gemini-generated illustration (hybrid) with HTML labels overlaid.
// Falls back to a placeholder so the deck builds before art is generated.
function renderImage(v, card) {
  const src = path.join(CTX.dir, "assets", `${card.id}.png`);
  let inner;
  if (fs.existsSync(src)) {
    CTX.assets.add(card.id);
    inner = `<img class="figure__img" src="assets/${esc(card.id)}.png" alt="${esc(card.title)}">`;
  } else {
    inner = `<div class="figure__placeholder"><span>infographic pending</span><code>npm run art -- --only ${esc(card.id)}</code></div>`;
  }
  const tags = asList(v.overlay)
    .map((t, i) => `<span class="figure__tag figure__tag--${i + 1}">${esc(t)}</span>`)
    .join("");
  return `<figure class="figure">${inner}${tags}</figure>`;
}

const VISUALS = {
  stack: renderStack,
  orbit: (v) => renderHub(v, false),
  mirror: (v) => renderHub(v, true),
  transfer: renderTransfer,
};

function renderVisual(card) {
  const v = card.visual ?? {};
  const kind = String(v.kind ?? "").trim();
  const labels = asList(card.labels);
  const labelHtml = labels.length ? `<ul class="card__labels">${labels.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
  if (kind === "image") return renderImage(v, card) + labelHtml;
  const fn = VISUALS[kind];
  if (!fn) return "";
  return fn(v) + labelHtml;
}

// ---------- card + notes ----------
function renderNotes(card) {
  const row = (label, val) => (val == null || val === "" ? "" : `<dt>${esc(label)}</dt><dd>${esc(val)}</dd>`);
  return `<aside class="card-notes" contenteditable="false">
  <h3>Notes · ${esc(card.id)} ${esc(card.name ?? "")}</h3>
  <dl>
    ${row("Type", card.type)}
    ${row("Purpose", card.purpose)}
    ${row("Speaker adds", card.speaker)}
    ${row("Design note", card.design_note)}
    <dt>Status</dt><dd class="status">${esc(card.status)}</dd>
  </dl>
</aside>`;
}

function renderCard(card, sectionMeta) {
  const type = String(card.type ?? "concept").trim();
  const eyebrow = `§${esc(sectionMeta.id ?? "")} · ${esc((sectionMeta.title ?? "").toUpperCase())} · ${esc(card.id ?? "")}`;
  const visual = renderVisual(card);
  const spec = `<script type="application/json" class="slide-spec">${JSON.stringify(card).replace(/</g, "\\u003c")}</script>`;
  return `<div class="slide-wrap">
  <section class="card slide card--${esc(type)}" contenteditable="true" spellcheck="true" aria-label="${esc(card.id)} — ${esc(card.name ?? "")}">
    <div class="card__eyebrow" contenteditable="false">${eyebrow}</div>
    <h1 class="card__title">${esc(card.title)}</h1>
    ${card.subtitle ? `<p class="card__subtitle">${esc(card.subtitle)}</p>` : ""}
    ${visual ? `<div class="card__visual">${visual}</div>` : ""}
    ${card.takeaway ? `<div class="card__takeaway"><span class="card__takeaway-mark">▸</span> ${esc(card.takeaway)}</div>` : ""}
  </section>
  ${renderNotes(card)}
  ${spec}
</div>`;
}

// ---------- document ----------
function renderDocument({ deck, sections, css, minStatus, stats }) {
  const cardsHtml = sections
    .map((s) => s.cards.map((c) => renderCard(c, s.section)).join("\n"))
    .join("\n");
  const meta = {
    title: deck.title ?? "Slide Deck",
    subtitle: deck.subtitle ?? "",
    audience: deck.audience ?? "",
    style: deck.style ?? "",
    core_lines: deck.core_lines ?? [],
    source: deck.source ?? [],
    generated: new Date().toISOString(),
    min_status: minStatus,
    rendered_cards: stats.rendered,
    skipped_cards: stats.skipped,
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)} — ${esc(meta.subtitle)}</title>
<script type="application/json" id="deck-metadata">${JSON.stringify(meta, null, 2).replace(/</g, "\\u003c")}</script>
<style>
${css}
</style>
</head>
<body>
<aside class="edit-toolbar" contenteditable="false">
  <p><strong>${esc(meta.title)}</strong> — NotebookLM-style cards. Click any text to edit. Save with File → Save Page As… → Webpage, Complete. Notes are screen-only.</p>
  <p>${stats.rendered} cards · gate ≥ “${esc(minStatus)}”${stats.skipped ? ` · ${stats.skipped} below gate` : ""}</p>
</aside>
<main class="deck">
${cardsHtml}
</main>
</body>
</html>
`;
}

// ---------- main ----------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opts.dir)) throw new Error(`Cards dir not found: ${opts.dir}`);
  CTX.dir = opts.dir;
  CTX.outDir = path.dirname(path.resolve(opts.out));
  const deck = loadDeckMeta(opts.dir);
  const minStatus = (opts.minStatus ?? deck.min_status ?? "ready").trim();
  const gate = rank(minStatus);
  const css = fs.readFileSync(THEME, "utf8");
  const stats = { rendered: 0, skipped: 0, skippedList: [] };

  const sections = loadSections(opts.dir)
    .map((s) => {
      const kept = s.cards.filter((c) => {
        const ok = rank(c.status) >= gate;
        if (!ok) { stats.skipped += 1; stats.skippedList.push(`${c.id} (${c.status ?? "no status"})`); }
        return ok;
      });
      stats.rendered += kept.length;
      return { ...s, cards: kept };
    })
    .filter((s) => s.cards.length);

  const html = renderDocument({ deck, sections, css, minStatus, stats });
  fs.mkdirSync(CTX.outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);

  // Copy referenced image assets next to the HTML so the deck stays portable.
  if (CTX.assets.size) {
    const dest = path.join(CTX.outDir, "assets");
    fs.mkdirSync(dest, { recursive: true });
    for (const id of CTX.assets) fs.copyFileSync(path.join(CTX.dir, "assets", `${id}.png`), path.join(dest, `${id}.png`));
  }

  console.log(`✔ ${deck.title ?? "(untitled)"} — ${deck.subtitle ?? ""}`);
  console.log(`  Status gate: ≥ "${minStatus}"`);
  for (const s of sections) console.log(`  §${s.section.id ?? "?"} ${s.section.title ?? s.file}: ${s.cards.length} card(s)`);
  console.log(`  Rendered ${stats.rendered}; skipped ${stats.skipped}${stats.skipped ? `: ${stats.skippedList.join(", ")}` : ""}`);
  console.log(`  Wrote ${opts.out}`);
}

try { main(); } catch (err) { console.error(`build-cards failed: ${err.message}`); process.exit(1); }
