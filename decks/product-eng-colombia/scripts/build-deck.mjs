#!/usr/bin/env node
/*
 * build-deck.mjs — render the "Product Engineering Made in Colombia" talk
 * (Tribu IA) from YAML cards into a single editable HTML deck.
 *
 *   node scripts/build-deck.mjs cards --out build/deck.html
 *   node scripts/build-deck.mjs cards --ids 0.1,3.d --out build/verify.html
 *   node scripts/build-deck.mjs cards --all --out build/full.html
 *
 * Architecture mirrors the harness-talk blueprint renderer: a card model
 * (layout + visual + takeaway) plus a VIS registry of central visuals. The
 * signature visual is `map` — the Tribu IA community graph that builds up
 * stage by stage across the talk and is revealed complete at the close.
 *
 * House rule: no em dashes in deck copy. main() asserts this on the output.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "deck.css");

// Official Tribu IA logos (downloaded from tribuia.org), base64-embedded so the
// deck stays portable. LOGO_DARK is the light-on-dark variant for dark slides.
const BRAND = path.join(HERE, "..", "cards", "assets", "brand");
const dataURI = (f) => "data:image/png;base64," + fs.readFileSync(path.join(BRAND, f)).toString("base64");
const LOGO = dataURI("logo-tribu-ia.png");
const LOGO_DARK = dataURI("logo-tribu-ia-dark-bg.png");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const norm = (it) => (typeof it === "object" && it ? it : { label: it });

let CTX = { dir: ".", outDir: ".", assets: new Set() };

// ---------------------------------------------------------------------------
// The community map graph (from Notion "Tribu IA como ecosistema vivo", 16.1.7).
// Reads left to right: Tribu IA -> programs/origins -> projects (brotes) ->
// the four people who built them. Everything is stage 0 (the map is revealed
// once, fully lit, at the close). Node kinds drive colour:
//   hub (navy) · program (cyan) · project (gold) · person (magenta).
// ---------------------------------------------------------------------------
const MAP = {
  nodes: [
    { id: "T", label: "Tribu IA", sub: "la comunidad", x: 88, y: 300, kind: "hub", stage: 0 },
    // programs / origins
    { id: "IG", label: "Igniters", x: 300, y: 150, kind: "program", stage: 0 },
    { id: "AG", label: "IA Agéntica", x: 300, y: 300, kind: "program", stage: 0 },
    { id: "CM", label: "Comunicaciones", x: 300, y: 452, kind: "program", stage: 0 },
    // projects (brotes del ecosistema)
    { id: "GS", label: "Genuine School", x: 566, y: 74, kind: "project", stage: 0 },
    { id: "IN", label: "Inbest", x: 566, y: 166, kind: "project", stage: 0 },
    { id: "EC", label: "Ecolegalia", x: 566, y: 288, kind: "project", stage: 0 },
    { id: "PB", label: "PerciBot", x: 566, y: 410, kind: "project", stage: 0 },
    { id: "AC", label: "Agente de Contenido", x: 566, y: 520, kind: "project", stage: 0 },
    // people (los cuatro presenters)
    { id: "J", label: "Jhon", x: 900, y: 110, kind: "person", stage: 0 },
    { id: "D", label: "Diego", x: 900, y: 262, kind: "person", stage: 0 },
    { id: "C", label: "Cristian", x: 900, y: 404, kind: "person", stage: 0 },
    { id: "R", label: "Rogert", x: 900, y: 540, kind: "person", stage: 0 },
  ],
  edges: [
    // Tribu IA -> programs
    { a: "T", b: "IG", stage: 0 }, { a: "T", b: "AG", stage: 0 }, { a: "T", b: "CM", stage: 0 },
    // programs -> projects
    { a: "IG", b: "GS", stage: 0 }, { a: "IG", b: "IN", stage: 0 }, { a: "IG", b: "EC", stage: 0 },
    { a: "AG", b: "PB", stage: 0 },
    { a: "CM", b: "AC", stage: 0 },
    // projects -> people (ownership + hackaton collaboration on Ecolegalia)
    { a: "GS", b: "D", stage: 0 }, { a: "GS", b: "R", stage: 0 },
    { a: "IN", b: "D", stage: 0 },
    { a: "EC", b: "D", stage: 0 }, { a: "EC", b: "J", stage: 0 }, { a: "EC", b: "C", stage: 0 },
    { a: "PB", b: "C", stage: 0 }, { a: "PB", b: "R", stage: 0 },
    { a: "AC", b: "C", stage: 0 }, { a: "AC", b: "J", stage: 0 },
  ],
};
const NODE_BY_ID = Object.fromEntries(MAP.nodes.map((n) => [n.id, n]));

// backdrop — a faint gray network behind the coloured subgraph, to show that
// our projects are a small part of a much larger community. Deterministic
// scatter (Math.sin hash, no randomness) so rebuilds stay byte-identical.
function backdrop() {
  const N = 40;
  const rnd = (i, s) => { const v = Math.sin((i + 1) * s) * 43758.5453; return v - Math.floor(v); };
  const pts = Array.from({ length: N }, (_, i) => ({
    x: -30 + rnd(i, 12.9898) * 1060,
    y: -20 + rnd(i, 78.233) * 640,
    r: 2.5 + rnd(i, 3.11) * 3.5,
  }));
  const lines = [];
  pts.forEach((p, i) => { [7, 13, 19].forEach((m, k) => { const j = (i * m + 3 + k) % N; lines.push([p, pts[j]]); }); });
  const edgeSvg = lines.map(([a, b]) => `<line class="bg-edge" x1="${a.x.toFixed(0)}" y1="${a.y.toFixed(0)}" x2="${b.x.toFixed(0)}" y2="${b.y.toFixed(0)}"/>`).join("");
  const dotSvg = pts.map((p) => `<circle class="bg-node" cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" r="${p.r.toFixed(1)}"/>`).join("");
  return `<svg class="map__bg" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">${edgeSvg}${dotSvg}</svg>`;
}

// map — the community graph at a given stage. v = { stage, highlight:[ids] }.
// Nodes/edges with stage <= active are lit; the rest are ghosted. Nodes whose
// own stage === active (or listed in highlight) get the "new" halo.
function communityMap(v) {
  const active = v.stage ?? 4;
  const hi = new Set(asList(v.highlight));
  const lit = (n) => n.stage <= active;
  const isNew = (n) => hi.has(n.id) || (v.highlight == null && n.stage === active && active > 0);

  const edges = MAP.edges.map((e) => {
    const na = NODE_BY_ID[e.a], nb = NODE_BY_ID[e.b];
    const on = e.stage <= active;
    const fresh = e.stage === active && active > 0;
    const cls = `map__edge${on ? " is-lit" : " is-ghost"}${fresh ? " is-new" : ""}${e.cross ? " is-cross" : ""}`;
    return `<line class="${cls}" x1="${na.x}" y1="${na.y}" x2="${nb.x}" y2="${nb.y}" />`;
  }).join("");

  const nodes = MAP.nodes.map((n) => {
    const state = lit(n) ? (isNew(n) ? "is-new" : "is-lit") : "is-ghost";
    const cx = (n.x / 1000) * 100, cy = (n.y / 600) * 100;
    return `<div class="map__node map--${n.kind} ${state}" style="left:${cx.toFixed(2)}%;top:${cy.toFixed(2)}%">
      <span class="map__dot"></span>
      <span class="map__label">${esc(n.label)}${n.sub ? `<em>${esc(n.sub)}</em>` : ""}</span>
    </div>`;
  }).join("");

  return `<div class="map is-ecosystem">
    ${backdrop()}
    <svg class="map__edges" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
    ${nodes}
  </div>`;
}

// programs_map — Tribu IA at center with its programs radiating out (the
// ecosystem map, distinct from the projects map). Radial hub-and-spoke.
const PROGRAMS = ["IA Fácil", "Agentes", "Agentic Engineering", "Tribu IA Papers", "AI Product Engineer", "AI Tinkerers", "Retos", "Igniters", "Agentic Startups"];
function programsMap(v) {
  const items = asList(v.items).length ? asList(v.items) : PROGRAMS;
  const cx = 500, cy = 300, rx = 392, ry = 250, n = items.length;
  const pts = items.map((label, i) => {
    const a = (-90 + i * 360 / n) * Math.PI / 180;
    return { label, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  const edges = pts.map((p) => `<line class="map__edge is-lit" x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" />`).join("");
  const nodes = pts.map((p) => `<div class="map__node map--program is-lit" style="left:${(p.x / 1000 * 100).toFixed(2)}%;top:${(p.y / 600 * 100).toFixed(2)}%"><span class="map__dot"></span><span class="map__label">${esc(p.label)}</span></div>`).join("");
  const hub = `<div class="map__node map--hub is-lit" style="left:50%;top:50%"><span class="map__dot"></span><span class="map__label">Tribu IA<em>la comunidad</em></span></div>`;
  return `<div class="map">
    <svg class="map__edges" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
    ${nodes}${hub}
  </div>`;
}

// pillars — the three ADN pillars as columns.
const pillars = (v) => `<div class="pillars">${asList(v.items).map((it, i) => {
  const n = norm(it);
  return `<div class="pillar pillar--${(i % 3) + 1}"><div class="pillar__n">${String(i + 1).padStart(2, "0")}</div><div class="pillar__label">${esc(n.label)}</div><p class="pillar__cap">${esc(n.caption)}</p></div>`;
}).join("")}</div>`;

// cycle — the value cycle as a horizontal flow of chips.
const cycle = (v) => `<div class="cycle">${asList(v.steps).map((s, i, a) =>
  `<div class="cycle__step">${esc(s)}</div>${i < a.length - 1 ? `<span class="cycle__arw">&rarr;</span>` : ""}`).join("")}</div>`;

// stats — grid of big-number tiles.
const stats = (v) => `<div class="stats">${asList(v.items).map((it) => {
  const n = norm(it);
  return `<div class="stat"><div class="stat__num">${esc(n.value ?? n.label)}</div><div class="stat__lbl">${esc(n.caption ?? n.label)}</div></div>`;
}).join("")}</div>`;

// persona — "Quien soy" card: photo slot + name + role line.
function persona(v) {
  const src = v.photo ? path.resolve(CTX.dir, v.photo) : null;
  const media = src && fs.existsSync(src)
    ? `<img class="persona__photo" src="${esc(copyAsset(src))}" alt="${esc(v.name || "")}">`
    : `<div class="persona__photo persona__photo--ph"><span>${esc((v.name || "").slice(0, 1) || "?")}</span></div>`;
  const lines = asList(v.lines).map((l) => `<li>${esc(l)}</li>`).join("");
  return `<div class="persona">${media}<div class="persona__body"><div class="persona__name">${esc(v.name)}</div>${v.role ? `<div class="persona__role">${esc(v.role)}</div>` : ""}${lines ? `<ul class="persona__lines">${lines}</ul>` : ""}</div></div>`;
}

// product — "Que construi": a highlighted hero item + supporting trajectory.
function product(v) {
  const items = asList(v.items).map(norm);
  return `<div class="prod">${items.map((it) => `<div class="prod__item${it.hero ? " is-hero" : ""}">
    <div class="prod__label">${esc(it.label)}${it.hero ? `<span class="prod__badge">${esc(v.badge || "en video")}</span>` : ""}</div>
    ${it.caption ? `<p class="prod__cap">${esc(it.caption)}</p>` : ""}
  </div>`).join("")}</div>`;
}

// video — an embedded <video> when `src:` is given (copied beside the HTML,
// not base64), otherwise a poster/placeholder frame with a play glyph.
function video(v) {
  const posterAbs = v.poster ? path.resolve(CTX.dir, v.poster) : null;
  const poster = posterAbs && fs.existsSync(posterAbs) ? copyAsset(posterAbs) : null;
  const vidAbs = v.src ? path.resolve(CTX.dir, v.src) : null;
  const dur = v.duration ? `<figcaption class="video__dur">${esc(v.duration)}</figcaption>` : "";
  const cap = v.caption ? `<figcaption class="video__cap">${esc(v.caption)}</figcaption>` : "";
  if (vidAbs && fs.existsSync(vidAbs)) {
    const rel = copyAsset(vidAbs);
    return `<figure class="video"><video class="video__el" controls preload="metadata"${poster ? ` poster="${esc(poster)}"` : ""}><source src="${esc(rel)}"></video>${dur}${cap}</figure>`;
  }
  const inner = poster ? `<img class="video__poster" src="${esc(poster)}" alt="">` : `<div class="video__ph"></div>`;
  return `<figure class="video">${inner}<div class="video__play"><span>&#9658;</span></div>${dur}${cap}</figure>`;
}

// embed — an autoplaying local HTML demo in an <iframe>. Copies the html's
// whole directory (images, reports, sibling html) beside the deck so its
// relative links resolve. Use when a builder demos a live HTML instead of video.
function embed(v) {
  const abs = v.src ? path.resolve(CTX.dir, v.src) : null;
  if (!abs || !fs.existsSync(abs)) return `<div class="video__ph"></div>`;
  const srcDir = path.dirname(abs), name = path.basename(srcDir);
  const destDir = path.join(CTX.outDir, "assets", name);
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.cpSync(srcDir, destDir, { recursive: true });
  const rel = `assets/${name}/${path.basename(abs)}`;
  const posterAbs = v.poster ? path.resolve(CTX.dir, v.poster) : null;
  const poster = posterAbs && fs.existsSync(posterAbs) ? copyAsset(posterAbs) : null;
  // Poster sits under the iframe: on screen the live iframe covers it; in print
  // the iframe is hidden (CSS) so the static poster shows in the shared PDF.
  const posterImg = poster ? `<img class="video__poster embed__poster" src="${esc(poster)}" alt="">` : "";
  const cap = v.caption ? `<figcaption class="video__cap">${esc(v.caption)}</figcaption>` : "";
  return `<figure class="video embed">${posterImg}<iframe class="video__frame" src="${esc(rel)}" title="${esc(v.caption || "demo")}"></iframe>${cap}</figure>`;
}

// quotes — stacked pull-quotes (the "frases potentes" slide).
const quotes = (v) => `<div class="quotes">${asList(v.items).map((q) => `<blockquote class="quote">${esc(q)}</blockquote>`).join("")}</div>`;

// bullets — plain teaching list.
const bullets = (v) => `<ul class="bullets">${asList(v.items).map((it) => { const n = norm(it); return `<li><b>${esc(n.label)}</b>${n.caption ? ` ${esc(n.caption)}` : ""}</li>`; }).join("")}</ul>`;

const VIS = {
  map: communityMap, programs_map: programsMap, pillars, cycle, stats, persona, product, video, embed, quotes, bullets,
};

function copyAsset(absSrc) {
  const base = path.basename(absSrc);
  const d = path.join(CTX.outDir, "assets");
  fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(absSrc, path.join(d, base));
  return `assets/${base}`;
}

function renderVisual(card) {
  const v = card.visual ?? {};
  const fn = VIS[v.kind];
  return fn ? fn(v, card) : "";
}

// ---------- brand mark ----------
const mark = () => `<div class="brand"><img class="brand__logo" src="${LOGO}" alt="Tribu iA"></div>`;
const pageNo = (num, total) => `<div class="pageno">${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>`;

// ---------- cover ----------
function cover(deck, num, total) {
  const names = asList(deck.presenters).map((p) => `<span>${esc(p)}</span>`).join("<i>·</i>");
  return `<section class="slide cover" aria-label="portada">
    ${pageNo(num, total)}
    <div class="cover__glow"></div>
    <img class="cover__logo" src="${LOGO}" alt="Tribu iA">
    <div class="cover__eyebrow">${esc(deck.tagline || "Comunidad de IA de Latinoamerica")}</div>
    <h1 class="cover__title">${esc(deck.title)}</h1>
    <p class="cover__sub">${esc(deck.subtitle)}</p>
    ${names ? `<div class="cover__names">${names}</div>` : ""}
  </section>`;
}

// ---------- section divider ----------
function divider(sec, num, total) {
  return `<section class="slide divider" aria-label="bloque ${esc(sec.id)}">
    ${mark()}${pageNo(num, total)}
    <div class="divider__no">${esc(sec.no || sec.id)}</div>
    <div class="divider__eyebrow">${esc(sec.eyebrow || "Bloque")}</div>
    <h2 class="divider__title">${esc(sec.title)}</h2>
    ${sec.sub ? `<p class="divider__sub">${esc(sec.sub)}</p>` : ""}
  </section>`;
}

// ---------- thanks ----------
function thanks(deck, num, total) {
  const c = deck.contact ? `<div class="thanks__contact">${esc(deck.contact)}</div>` : "";
  return `<section class="slide thanks is-dark" aria-label="gracias">
    ${pageNo(num, total)}
    <div class="thanks__msg">Gracias</div>
    <img class="thanks__logo" src="${LOGO_DARK}" alt="Tribu iA">
    ${c}
  </section>`;
}

// ---------- standard content slide ----------
function slide(card, num, total) {
  const sec = card._sec ?? {};
  const eyebrow = `<div class="eyebrow">${sec.tag ? `<span class="eyebrow__tag">${esc(sec.tag)}</span>` : ""}${esc(sec.title ? sec.title : "")}${card.step ? ` <span class="eyebrow__step">${esc(card.step)}</span>` : ""}</div>`;
  const title = card.title ? `<h1 class="h">${esc(card.title)}</h1>` : "";
  const sub = card.subtitle ? `<p class="sub">${esc(card.subtitle)}</p>` : "";
  const take = card.takeaway ? `<div class="take"><span>&#9656;</span> ${esc(card.takeaway)}</div>` : "";
  const foot = `${mark()}${pageNo(num, total)}`;
  const stageCls = card.visual?.kind ? ` stage--${card.visual.kind}` : "";
  const accent = sec.accent ? ` accent--${sec.accent}` : "";

  return `<section class="slide card${accent}" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${eyebrow}${title}${sub}
    <div class="stage${stageCls}">${renderVisual(card)}</div>
    ${take}${foot}
  </section>`;
}

// ---------- loaders ----------
function loadDeck(dir) {
  for (const p of [path.join(dir, "deck.yaml"), path.join(dir, "..", "deck.yaml")]) {
    if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).deck ?? {};
  }
  return {};
}
function loadCards(dir) {
  const map = new Map();
  for (const f of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml").sort()) {
    const doc = parseYaml(fs.readFileSync(path.join(dir, f), "utf8")) || {};
    const sec = doc.section ?? {};
    for (const c of doc.cards ?? []) map.set(String(c.id), { ...c, _sec: sec });
  }
  return map;
}

function parseArgs(argv) {
  const o = { dir: "cards", out: "build/deck.html", all: false, ids: null, cover: true };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") o.out = argv[++i];
    else if (argv[i] === "--all") o.all = true;
    else if (argv[i] === "--ids") o.ids = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === "--no-cover") o.cover = false;
    else rest.push(argv[i]);
  }
  if (rest[0]) o.dir = rest[0];
  return o;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  CTX.dir = opts.dir;
  CTX.outDir = path.dirname(path.resolve(opts.out));
  const deck = loadDeck(opts.dir);
  const cards = loadCards(opts.dir);
  const order = opts.ids ? opts.ids : opts.all ? [...cards.keys()] : asList(deck.core).map(String);
  const chosen = order.map((id) => cards.get(id)).filter(Boolean);
  const missing = order.filter((id) => !cards.get(id));
  if (missing.length) console.error(`  ! not found: ${missing.join(", ")}`);

  const css = fs.readFileSync(THEME, "utf8");
  const makers = [];
  if (opts.cover) makers.push((n, t) => cover(deck, n, t));
  let lastSec = null;
  for (const c of chosen) {
    const sec = c._sec ?? {};
    if (sec.divider && sec.id !== lastSec) makers.push((n, t) => divider(sec, n, t));
    lastSec = sec.id;
    makers.push((n, t) => slide(c, n, t));
  }
  makers.push((n, t) => thanks(deck, n, t));

  const total = makers.length;
  let n = 0;
  const slides = makers.map((f) => f((n += 1), total));
  const html = `<!doctype html><html lang="es" data-theme="light"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(deck.title ?? "Deck")} · Tribu IA</title>
<style>${css}</style></head><body><main class="deck">
${slides.join("\n")}
</main></body></html>`;

  // House rule: no em dashes in deck copy.
  const emdash = html.match(/[—–]/g);
  if (emdash) throw new Error(`em/en dash found in output (${emdash.length}). Use commas, colons, or periods.`);

  fs.mkdirSync(CTX.outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);
  console.log(`Wrote ${opts.out} — ${slides.length} slides`);
}

try { main(); } catch (e) { console.error(`build-deck failed: ${e.stack || e.message}`); process.exit(1); }
