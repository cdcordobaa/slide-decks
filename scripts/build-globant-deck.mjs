#!/usr/bin/env node
/*
 * build-globant-deck.mjs — render the card manifest as a Globant-branded deck.
 * Same card model as the blueprint builder, re-skinned to the Globant palette
 * (white-predominant, green + navy, teal/magenta accents) via theme/globant.css.
 * Adds a branded cover slide and a Globant logo mark on every card.
 *
 *   node scripts/build-globant-deck.mjs cards --out build/harness-globant.html [--all]
 *   node scripts/build-globant-deck.mjs cards --ids 0.1,0.3 --out build/globant-verify.html
 *
 * By default renders deck.core (the spine) in order; --all renders every card;
 * --ids <a,b,c> renders just those cards (used to verify the theme quickly).
 * --no-cover skips the title slide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "globant.css");
const LOGO_PATH = path.join(HERE, "..", "cards", "assets", "globant-logo.svg");
const LOGO_RAW = fs.readFileSync(LOGO_PATH, "utf8");
// The mark is a single-fill green wordmark; recolor per surface.
const logoURI = (hex) => "data:image/svg+xml;base64," + Buffer.from(LOGO_RAW.replace(/#bfd732/gi, hex)).toString("base64");
const LOGO_GREEN = logoURI("#bfd732");        // for dark surfaces
const LOGO_NAVY = logoURI("#00292e");         // for the light board
const LOGO_TAG = `<img class="bp-logo" src="${LOGO_NAVY}" alt="Globant">`;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const norm = (it) => (typeof it === "object" && it ? { label: it.label, caption: it.caption ?? null, state: it.state ?? null } : { label: it, caption: null, state: null });

let CTX = { dir: ".", outDir: ".", assets: new Set() };

function parseArgs(argv) {
  const o = { dir: "cards", out: "build/harness-globant.html", all: false, ids: null, cover: true };
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

// ---------- Cover slide ----------
function cover(deck) {
  return `<section class="slide bp bp-cover" aria-label="cover">
    ${frameSVG()}
    <img class="bp-cover__logo" src="${LOGO_NAVY}" alt="Globant">
    <div class="bp-cover__eyebrow">${esc(deck.audience ?? "Harness Engineering")}</div>
    <h1 class="bp-cover__title">${esc(deck.title ?? "Deck")}</h1>
    <div class="bp-cover__rule"></div>
    <p class="bp-cover__sub">${esc(deck.subtitle ?? "")}</p>
    <div class="bp-cover__meta"><b>GLOBANT</b> &nbsp;//&nbsp; Harness Engineering</div>
  </section>`;
}

// ---------- SVG chrome (Globant navy) ----------
function frameSVG() {
  const corner = (x, y, sx, sy) => `<path d="M ${x} ${y + sy * 22} L ${x} ${y} L ${x + sx * 22} ${y}" fill="none" stroke="#00292e" stroke-width="1.6"/>`;
  return `<svg class="bp-frame" viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke="#00292e" stroke-width="1.2" opacity="0.55"/>
    ${corner(34, 34, 1, 1)}${corner(1246, 34, -1, 1)}${corner(34, 686, 1, -1)}${corner(1246, 686, -1, -1)}
    <rect x="628" y="694" width="24" height="12" fill="none" stroke="#00292e" stroke-width="1.2"/>
  </svg>`;
}

// ---------- SVG tool loop (green pipes, navy modules, teal core) ----------
const C = { x: 300, y: 292 };
function moduleSVG(cx, cy, label) {
  const w = 122, h = 80, x = cx - w / 2, y = cy - h / 2;
  const bolt = (bx, by) => `<circle cx="${bx}" cy="${by}" r="3" fill="#0a3a40"/>`;
  return `<g><rect x="${x}" y="${y + 6}" width="${w}" height="${h - 6}" rx="10" fill="#00292e" stroke="#0a3a40" stroke-width="2"/><rect x="${x + 6}" y="${y}" width="${w - 12}" height="18" rx="7" fill="#17505a" stroke="#0a3a40" stroke-width="2"/>${bolt(x + 12, y + h - 12)}${bolt(x + w - 12, y + h - 12)}<text x="${cx}" y="${cy + 16}" text-anchor="middle" class="mod-label">${esc(label)}</text></g>`;
}
function pipeSVG(cx, cy) {
  const dx = C.x - cx, dy = C.y - cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const sx = cx + ux * 46, sy = cy + uy * 46, ex = C.x - ux * 128, ey = C.y - uy * 128;
  return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#bfd732" stroke-width="11" stroke-linecap="round"/><line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#e8f5b3" stroke-width="3.5" stroke-linecap="round"/>`;
}
function hexSVG(cx, cy, r, label) {
  const pts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${pts}" fill="#00292e" stroke="#1f7a3d" stroke-width="3"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" class="core-label">${esc(label)}</text>`;
}
function arrowhead(deg) { const a = (deg * Math.PI) / 180, x = C.x + 118 * Math.cos(a), y = C.y + 118 * Math.sin(a); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg + 90})"><path d="M -9 -7 L 9 0 L -9 7 Z" fill="#00292e"/></g>`; }
function toolLoop(d = {}) {
  const mods = asList(d.modules).slice(0, 4);
  const pos = [[95, 96], [505, 96], [95, 488], [505, 488]];
  const phases = asList(d.phases), phasePos = [[C.x, 198], [C.x + 84, C.y + 4], [C.x - 84, C.y + 4]];
  return `<svg class="bp-diagram bp-dia" viewBox="0 0 600 604">
    ${mods.map((_, i) => pipeSVG(pos[i][0], pos[i][1])).join("")}
    <circle cx="${C.x}" cy="${C.y}" r="118" fill="none" stroke="#bfd732" stroke-width="16" opacity="0.9"/>
    <circle cx="${C.x}" cy="${C.y}" r="76" fill="none" stroke="#00877b" stroke-width="1" stroke-dasharray="4 5"/>
    ${[-58, 62, 182].map(arrowhead).join("")}
    ${mods.map((m, i) => moduleSVG(pos[i][0], pos[i][1], m)).join("")}
    ${hexSVG(C.x, C.y, 46, d.core ?? "MODEL")}
    ${phases.map((p, i) => `<text x="${phasePos[i][0]}" y="${phasePos[i][1]}" text-anchor="middle" class="phase">${esc(p)}</text>`).join("")}
  </svg>`;
}

// ---------- HTML diagrams ----------
const stack = (v) => `<div class="bp-stk">${asList(v.items).map(norm).map((it) => `<div class="bp-stk__row${it.state === "missing" ? " is-missing" : ""}"><span class="bp-stk__label">${esc(it.label)}</span>${it.caption ? `<span class="bp-stk__cap">${esc(it.caption)}</span>` : ""}${it.state === "missing" ? `<span class="bp-stk__tag">not engineered</span>` : ""}</div>`).join("")}</div>`;

const comparison = (v) => `<div class="bp-cmp">${asList(v.boxes).map((b) => `<div class="bp-cmp__col"><div class="bp-cmp__h">${esc(b.label)}</div><div class="bp-cmp__b">${esc(b.result)}</div></div>`).join("")}</div>`;

function equation(v) {
  const parse = (t) => { const [l, r] = String(t).split("→"); return { l: (l || "").trim(), r: (r || "").trim() }; };
  const terms = asList(v.terms).map(parse);
  const box = (t) => `<div class="bp-eq__box"><div class="bp-eq__l">${esc(t.l)}</div>${t.r ? `<div class="bp-eq__r">${esc(t.r)}</div>` : ""}</div>`;
  const ops = ["+", "="];
  return `<div class="bp-eq">${terms.map((t, i) => box(t) + (i < terms.length - 1 ? `<div class="bp-eq__op">${ops[i] ?? "+"}</div>` : "")).join("")}</div>`;
}

const transfer = (v) => `<div class="bp-xfer"><div class="bp-xfer__col"><h4>${esc(v.from?.label)}</h4><ul>${asList(v.from?.items).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div><div class="bp-xfer__arw">→</div><div class="bp-xfer__col is-to"><h4>${esc(v.to?.label)}</h4><ul>${asList(v.to?.items).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div></div>`;

const fanout = (v) => `<div class="bp-fan"><div class="bp-fan__src">${esc(v.center)}</div><div class="bp-fan__arw">→</div><div class="bp-fan__tgts">${asList(v.items).map((i) => `<div class="bp-fan__t">${esc(i)}</div>`).join("")}</div></div>`;

function ladder(v) {
  const rungs = asList(v.rungs), cur = String(v.current ?? "").toLowerCase();
  return `<div class="bp-ladder">${rungs.slice().reverse().map((r, i) => { const n = rungs.length - i; return `<div class="bp-rung${String(r).toLowerCase() === cur ? " is-current" : ""}"><span class="bp-rung__n">${n}</span>${esc(r)}</div>`; }).join("")}</div>`;
}

const capmap = (v) => `<div class="bp-cap"><div class="bp-cap__c">${esc(v.center)}</div><div class="bp-cap__items">${asList(v.items).map((i) => `<span class="bp-chip">${esc(i)}</span>`).join("")}</div></div>`;

const flow = (v) => `<div class="bp-flow">${asList(v.steps).map((s, i, a) => `<div class="bp-flow__step">${esc(s)}</div>${i < a.length - 1 ? `<div class="bp-flow__arw">↓</div>` : ""}`).join("")}</div>`;

const cardsRow = (v) => `<div class="bp-cards">${asList(v.items).map((t, i) => `<div class="bp-cardp"><span class="bp-cardp__n">${i + 1}</span><p>${esc(t)}</p></div>`).join("")}</div>`;

function hub(v, reveal) {
  const center = v.center ?? v.subject ?? "";
  const items = asList(v.items).map(norm);
  const half = Math.ceil(items.length / 2), left = items.slice(0, half), right = items.slice(half);
  const node = (it) => `<div class="bp-hub__node"><b>${esc(it.label)}</b>${it.caption ? `<span>${esc(it.caption)}</span>` : ""}</div>`;
  const col = (a) => `<div class="bp-hub__col">${a.map(node).join("")}</div>`;
  return `<div class="bp-hub${reveal ? " is-reveal" : ""}">${col(left)}<div class="bp-hub__c">${esc(center)}</div>${col(right)}</div>`;
}

function image(v, card) {
  const src = path.join(CTX.dir, "assets", `${card.id}.png`);
  let inner;
  if (fs.existsSync(src)) { CTX.assets.add(card.id); inner = `<img class="bp-fig__img" src="assets/${esc(card.id)}.png" alt="">`; }
  else inner = phBox(card);
  const tags = asList(v.overlay).map((t, i) => `<span class="bp-fig__tag t${i + 1}">${esc(t)}</span>`).join("");
  return `<figure class="bp-fig">${inner}${tags}</figure>`;
}

const formula = (v) => `<div class="bp-eq">${asList(v.terms).map((t, i, a) => `<div class="bp-eq__box"><div class="bp-eq__l">${esc(t)}</div></div>` + (i < a.length - 1 ? `<div class="bp-eq__op">×</div>` : "")).join("")}</div>`;

const VIS = {
  stack, comparison, equation, formula, transfer, fanout, ladder, flow,
  tool_loop: toolLoop, cards_row: cardsRow, capability_map: capmap,
  system_diagram: (v) => (asList(v.steps).length ? flow(v) : capmap(v)),
  failure_mode: (v) => capmap({ center: v.center ?? "⚠ Failure modes", items: v.items }),
  mirror: (v) => hub(v, true), orbit: (v) => hub(v, false),
};

function copyAsset(absSrc) {
  const base = path.basename(absSrc);
  const d = path.join(CTX.outDir, "assets");
  fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(absSrc, path.join(d, base));
  return `assets/${base}`;
}

function phBox(card) {
  const brief = String(card.visual?.brief || card.image?.brief || "").trim();
  return `<div class="bp-fig__ph"><div class="bp-fig__ph-h">🖼 IMAGE — prompt (not generated)</div>${brief ? `<div class="bp-fig__ph-b">${esc(brief)}</div>` : ""}<code>gen ${esc(card.id)}</code></div>`;
}

function splitMedia(card) {
  const im = card.image ?? (card.visual?.kind === "image" ? card.visual : {});
  const src = im.src ? path.resolve(CTX.dir, im.src) : path.join(CTX.dir, "assets", `${card.id}.png`);
  const inner = fs.existsSync(src)
    ? `<img class="bp-half__img" src="${esc(copyAsset(src))}" alt="">`
    : phBox(card);
  return `<div class="bp-half__media">${inner}</div>`;
}

function renderVisual(card) {
  const v = card.visual ?? {};
  if (v.kind === "image") return image(v, card);
  const fn = VIS[v.kind];
  return fn ? fn(v, card) : `<div class="bp-cap"><div class="bp-cap__c">${esc(card.title)}</div></div>`;
}

// ---------- slide ----------
function slide(card) {
  const sec = card._sec ?? {};
  const eyebrow = `<div class="bp-eyebrow">§${esc(sec.id ?? "")} · ${esc((sec.title ?? "").toUpperCase())} · ${esc(card.id)}</div>`;
  const title = `<h1 class="bp-h">${esc(card.title)}</h1>`;
  const sub = card.subtitle ? `<p class="bp-sub">${esc(card.subtitle)}</p>` : "";
  const take = card.takeaway ? `<div class="bp-take"><span>▸</span> ${esc(card.takeaway)}</div>` : "";
  const credit = `<div class="bp-credit">HARNESS ENGINEERING // ${esc(card.id)}</div>`;

  if (card.layout === "full") {
    const src = path.join(CTX.dir, "assets", `${card.id}.png`);
    const img = fs.existsSync(src)
      ? `<img class="bp-full__img" src="${esc(copyAsset(src))}" alt="${esc(card.title)}">`
      : `<div class="bp-full__ph"><span>full infographic pending</span><code>gen ${esc(card.id)}</code></div>`;
    return `<section class="slide bp bp-full" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">${img}</section>`;
  }

  if (card.layout === "hero") {
    const im = card.image ?? (card.visual?.kind === "image" ? card.visual : {});
    const src = im.src ? path.resolve(CTX.dir, im.src) : path.join(CTX.dir, "assets", `${card.id}.png`);
    const media = fs.existsSync(src)
      ? `<img src="${esc(copyAsset(src))}" alt="${esc(card.title)}">`
      : phBox(card);
    const cap = asList(card.caption).length
      ? `<div class="bp-hero__cap">${asList(card.caption).map((c) => `<span>${esc(c)}</span>`).join('<i>→</i>')}</div>`
      : "";
    return `<section class="slide bp bp-card bp-hero" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${frameSVG()}${LOGO_TAG}
    ${eyebrow}${title}
    <div class="bp-hero__media">${media}</div>
    ${cap}${take}${credit}
  </section>`;
  }

  if (card.layout === "split") {
    const body = asList(card.body).length
      ? `<ul class="bp-body">${asList(card.body).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      : card.visual && card.visual.kind !== "image"
        ? `<div class="bp-split__dia">${renderVisual(card)}</div>`
        : "";
    const content = `<div class="bp-half__content">${eyebrow}${title}${sub}${body}</div>`;
    return `<section class="slide bp bp-card" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${frameSVG()}${LOGO_TAG}
    <div class="bp-split${card.side === "image-left" ? " is-left" : ""}">${content}${splitMedia(card)}</div>
    ${take}${credit}
  </section>`;
  }

  return `<section class="slide bp bp-card" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${frameSVG()}${LOGO_TAG}
    ${eyebrow}${title}${sub}
    <div class="bp-stage">${renderVisual(card)}</div>
    ${take}${credit}
  </section>`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  CTX.dir = opts.dir; CTX.outDir = path.dirname(path.resolve(opts.out));
  const deck = loadDeck(opts.dir);
  const cards = loadCards(opts.dir);
  const order = opts.ids ? opts.ids : opts.all ? [...cards.keys()] : asList(deck.core).map(String);
  const chosen = order.map((id) => cards.get(id)).filter(Boolean);
  const missing = order.filter((id) => !cards.get(id));
  if (missing.length) console.error(`  ! not found: ${missing.join(", ")}`);

  const css = fs.readFileSync(THEME, "utf8");
  const slides = [opts.cover ? cover(deck) : "", ...chosen.map(slide)].filter(Boolean);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(deck.title ?? "Deck")} — Globant</title>
<style>${css}</style></head><body><main class="deck">
${slides.join("\n")}
</main></body></html>`;
  fs.mkdirSync(CTX.outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);
  if (CTX.assets.size) { const d = path.join(CTX.outDir, "assets"); fs.mkdirSync(d, { recursive: true }); for (const id of CTX.assets) fs.copyFileSync(path.join(CTX.dir, "assets", `${id}.png`), path.join(d, `${id}.png`)); }
  console.log(`Wrote ${opts.out} — ${slides.length} slides (${CTX.assets.size} images embedded)`);
}
try { main(); } catch (e) { console.error(`build-globant-deck failed: ${e.stack || e.message}`); process.exit(1); }
