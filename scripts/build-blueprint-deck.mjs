#!/usr/bin/env node
/*
 * build-blueprint-deck.mjs — render the core-cut card manifest as a full
 * blueprint-style deck. Most diagrams are blueprint-styled HTML/CSS (crisp,
 * wrapping text); the tool-loop is SVG. Text stays editable; images are the
 * only generated layer (placeholder until generated).
 *
 *   node scripts/build-blueprint-deck.mjs cards --out build/harness-blueprint.html [--all]
 *
 * By default renders deck.core (the 20-slide spine) in order; --all renders every card.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { ICONS } from "../theme/tabler-icons.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "blueprint.css");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const norm = (it) => (typeof it === "object" && it ? { label: it.label, caption: it.caption ?? null, state: it.state ?? null } : { label: it, caption: null, state: null });

let CTX = { dir: ".", outDir: ".", assets: new Set() };

function parseArgs(argv) {
  const o = { dir: "cards", out: "build/harness-blueprint.html", all: false };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") o.out = argv[++i];
    else if (argv[i] === "--all") o.all = true;
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

// ---------- SVG chrome ----------
function frameSVG() {
  const corner = (x, y, sx, sy) => `<path d="M ${x} ${y + sy * 22} L ${x} ${y} L ${x + sx * 22} ${y}" fill="none" stroke="#2b333b" stroke-width="1.6"/>`;
  return `<svg class="bp-frame" viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke="#2b333b" stroke-width="1.2"/>
    ${corner(34, 34, 1, 1)}${corner(1246, 34, -1, 1)}${corner(34, 686, 1, -1)}${corner(1246, 686, -1, -1)}
    <rect x="628" y="694" width="24" height="12" fill="none" stroke="#2b333b" stroke-width="1.2"/>
  </svg>`;
}

// ---------- SVG tool loop ----------
const C = { x: 300, y: 292 };
function moduleSVG(cx, cy, label) {
  const w = 122, h = 80, x = cx - w / 2, y = cy - h / 2;
  const bolt = (bx, by) => `<circle cx="${bx}" cy="${by}" r="3" fill="#222a30"/>`;
  return `<g><rect x="${x}" y="${y + 6}" width="${w}" height="${h - 6}" rx="10" fill="#3c4650" stroke="#222a30" stroke-width="2"/><rect x="${x + 6}" y="${y}" width="${w - 12}" height="18" rx="7" fill="#59636f" stroke="#222a30" stroke-width="2"/>${bolt(x + 12, y + h - 12)}${bolt(x + w - 12, y + h - 12)}<text x="${cx}" y="${cy + 16}" text-anchor="middle" class="mod-label">${esc(label)}</text></g>`;
}
function pipeSVG(cx, cy) {
  const dx = C.x - cx, dy = C.y - cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const sx = cx + ux * 46, sy = cy + uy * 46, ex = C.x - ux * 128, ey = C.y - uy * 128;
  return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#1fb6d6" stroke-width="11" stroke-linecap="round"/><line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#c7ecf4" stroke-width="3.5" stroke-linecap="round"/>`;
}
function hexSVG(cx, cy, r, label) {
  const pts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${pts}" fill="#f2a51c" stroke="#b5771a" stroke-width="3"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" class="core-label">${esc(label)}</text>`;
}
function arrowhead(deg) { const a = (deg * Math.PI) / 180, x = C.x + 118 * Math.cos(a), y = C.y + 118 * Math.sin(a); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg + 90})"><path d="M -9 -7 L 9 0 L -9 7 Z" fill="#0f7f96"/></g>`; }
function toolLoop(d = {}) {
  const mods = asList(d.modules).slice(0, 4);
  const pos = [[95, 96], [505, 96], [95, 488], [505, 488]];
  const phases = asList(d.phases), phasePos = [[C.x, 198], [C.x + 84, C.y + 4], [C.x - 84, C.y + 4]];
  return `<svg class="bp-diagram bp-dia" viewBox="0 0 600 604">
    ${mods.map((_, i) => pipeSVG(pos[i][0], pos[i][1])).join("")}
    <circle cx="${C.x}" cy="${C.y}" r="118" fill="none" stroke="#1fb6d6" stroke-width="16" opacity="0.82"/>
    <circle cx="${C.x}" cy="${C.y}" r="76" fill="none" stroke="#0f7f96" stroke-width="1" stroke-dasharray="4 5"/>
    ${[-58, 62, 182].map(arrowhead).join("")}
    ${mods.map((m, i) => moduleSVG(pos[i][0], pos[i][1], m)).join("")}
    ${hexSVG(C.x, C.y, 46, d.core ?? "MODEL")}
    ${phases.map((p, i) => `<text x="${phasePos[i][0]}" y="${phasePos[i][1]}" text-anchor="middle" class="phase">${esc(p)}</text>`).join("")}
  </svg>`;
}

// ---------- Tabler icons ----------
function iconFor(label) {
  const s = String(label ?? "").toLowerCase();
  const h = (re) => re.test(s);
  if (h(/\bmodel\b|core/)) return "model";
  if (h(/context|assemble/)) return "context";
  if (h(/\btool/)) return "tools";
  if (h(/memory|remember/)) return "memory";
  if (h(/state|track/)) return "state";
  if (h(/permission/)) return "permissions";
  if (h(/eval|judge|correct|grade/)) return "evaluation";
  if (h(/recover|retry/)) return "recovery";
  if (h(/safe|safety|constraint/)) return "safety";
  if (h(/environment|\benv\b/)) return "environment";
  if (h(/human|operator|\byou\b/)) return "human";
  if (h(/coordinat|orchestrat/)) return "coordination";
  if (h(/git|branch/)) return "git";
  if (h(/terminal/)) return "terminal";
  if (h(/filesystem|folder|workspace/)) return "workspace";
  if (h(/\btest|ci\b/)) return "tests";
  if (h(/browser|web/)) return "browser";
  if (h(/review/)) return "review";
  if (h(/ticket/)) return "ticket";
  if (h(/spec|\bfile\b/)) return "specs";
  if (h(/improve|system/)) return "improve";
  if (h(/api|plug/)) return "api";
  if (h(/custom|skill/)) return "custom";
  if (h(/runtime|loop/)) return "runtime";
  if (h(/missing|\?\?\?/)) return "missing";
  if (h(/agent|robot/)) return "agent";
  return "generic";
}
const icon = (name, cls) => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.generic}</svg>`;

// ---------- HTML blueprint diagrams ----------
const stack = (v) => `<div class="bp-stk">${asList(v.items).map(norm).map((it) => `<div class="bp-stk__row${it.state === "missing" ? " is-missing" : ""}">${icon(it.state === "missing" ? "missing" : iconFor(it.label), "bp-stk__ico")}<span class="bp-stk__label">${esc(it.label)}</span>${it.caption ? `<span class="bp-stk__cap">${esc(it.caption)}</span>` : ""}${it.state === "missing" ? `<span class="bp-stk__tag">not engineered</span>` : ""}</div>`).join("")}</div>`;

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

const capmap = (v) => `<div class="bp-cap"><div class="bp-cap__c">${esc(v.center)}</div><div class="bp-cap__items">${asList(v.items).map((i) => `<span class="bp-chip">${icon(iconFor(i), "bp-chip__ico")}${esc(i)}</span>`).join("")}</div></div>`;

const flow = (v) => `<div class="bp-flow">${asList(v.steps).map((s, i, a) => `<div class="bp-flow__step">${esc(s)}</div>${i < a.length - 1 ? `<div class="bp-flow__arw">↓</div>` : ""}`).join("")}</div>`;

const cardsRow = (v) => `<div class="bp-cards">${asList(v.items).map((t, i) => `<div class="bp-cardp"><span class="bp-cardp__n">${i + 1}</span><p>${esc(t)}</p></div>`).join("")}</div>`;

function hub(v, reveal) {
  const center = v.center ?? v.subject ?? "";
  const items = asList(v.items).map(norm);
  const half = Math.ceil(items.length / 2), left = items.slice(0, half), right = items.slice(half);
  const node = (it) => `<div class="bp-hub__node">${icon(iconFor(it.label), "bp-hub__ico")}<div class="bp-hub__t"><b>${esc(it.label)}</b>${it.caption ? `<span>${esc(it.caption)}</span>` : ""}</div></div>`;
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

// formula — factors joined by × (e.g. Model × Harness × Environment)
const formula = (v) => `<div class="bp-eq">${asList(v.terms).map((t, i, a) => `<div class="bp-eq__box"><div class="bp-eq__l">${esc(t)}</div></div>` + (i < a.length - 1 ? `<div class="bp-eq__op">×</div>` : "")).join("")}</div>`;

// harness_ring — coded SVG: an orange model core ringed by icon-labelled subsystem
// modules wired by cyan pipes (replaces the Gemini "harness machine" illustration).
function harnessRing(v) {
  const items = asList(v.items).map(norm);
  const n = items.length || 1;
  const cx = 430, cy = 305, R = 212, hexR = 54, bw = 150, bh = 46;
  const hexPts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + hexR * Math.cos(a)).toFixed(1)},${(cy + hexR * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const pipes = [], boxes = [];
  items.forEach((it, i) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    const mx = cx + R * Math.cos(a), my = cy + R * Math.sin(a);
    pipes.push(`<line x1="${(cx + hexR * Math.cos(a)).toFixed(1)}" y1="${(cy + hexR * Math.sin(a)).toFixed(1)}" x2="${(mx - (bw / 2 - 8) * Math.cos(a)).toFixed(1)}" y2="${(my - (bh / 2 - 4) * Math.sin(a)).toFixed(1)}" stroke="#1fb6d6" stroke-width="6" stroke-linecap="round"/>`);
    const bx = mx - bw / 2, by = my - bh / 2;
    boxes.push(`<g><rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw}" height="${bh}" rx="9" fill="#f8f7f1" stroke="#2b333b" stroke-width="1.5"/><svg x="${(bx + 11).toFixed(1)}" y="${(by + 12).toFixed(1)}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f7f96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconFor(it.label)] ?? ICONS.generic}</svg><text x="${(bx + 42).toFixed(1)}" y="${(by + 29).toFixed(1)}" class="hr-label">${esc(it.label)}</text></g>`);
  });
  const core = `<polygon points="${hexPts}" fill="#f2a51c" stroke="#b5771a" stroke-width="3"/><text x="${cx}" y="${(cy + 6).toFixed(1)}" text-anchor="middle" class="hr-core">${esc(v.center ?? "MODEL")}</text>`;
  return `<svg class="bp-dia bp-ring" viewBox="0 0 860 610">${pipes.join("")}${boxes.join("")}${core}</svg>`;
}

// fleet — coded SVG: source → orchestrator hub → N agents in isolated workspaces
// → CI/review gate (replaces the Gemini multi-agent illustration).
function fleet(v) {
  const agents = asList(v.agents).length ? asList(v.agents) : ["Agent A", "Agent B", "Agent C"];
  const source = v.source ?? "Tickets", hub = v.hub ?? "Orchestrator", gate = v.gate ?? "CI + Review";
  const nodeW = 164, nodeH = 44, wsW = 200, wsH = 66;
  const nb = (cx, cy, label, ic, accent) => {
    const x = cx - nodeW / 2, y = cy - nodeH / 2;
    return `<g><rect x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="10" fill="${accent ? "rgba(242,165,28,0.12)" : "#f8f7f1"}" stroke="${accent ? "#b5771a" : "#2b333b"}" stroke-width="1.5"/><svg x="${x + 12}" y="${cy - 11}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f7f96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic] ?? ICONS.generic}</svg><text x="${x + 40}" y="${cy + 5}" class="hr-label">${esc(label)}</text></g>`;
  };
  const pipe = (x1, y1, x2, y2) => `<path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="#1fb6d6" stroke-width="5" stroke-linecap="round"/>`;
  const src = { x: 110, y: 240 }, hb = { x: 320, y: 240 }, gt = { x: 820, y: 240 }, ax = 590;
  const ays = agents.map((_, i) => (agents.length === 1 ? 240 : 110 + (i * 260) / (agents.length - 1)));
  const pipes = [pipe(src.x + nodeW / 2, src.y, hb.x - nodeW / 2, hb.y)];
  agents.forEach((_, i) => { pipes.push(pipe(hb.x + nodeW / 2, hb.y, ax - wsW / 2, ays[i])); pipes.push(pipe(ax + wsW / 2, ays[i], gt.x - nodeW / 2, gt.y)); });
  const ws = agents.map((a, i) => `<rect x="${ax - wsW / 2}" y="${ays[i] - wsH / 2}" width="${wsW}" height="${wsH}" rx="10" fill="none" stroke="#8a9199" stroke-width="1.3" stroke-dasharray="5 4"/>` + nb(ax, ays[i], a, "agent")).join("");
  const nodes = nb(src.x, src.y, source, "ticket") + nb(hb.x, hb.y, hub, "coordination") + nb(gt.x, gt.y, gate, "review", true);
  return `<svg class="bp-dia bp-fleet" viewBox="0 0 930 480">${pipes.join("")}${ws}${nodes}</svg>`;
}

const VIS = {
  stack, comparison, equation, formula, transfer, fanout, ladder, flow, harness_ring: harnessRing, fleet,
  tool_loop: toolLoop, cards_row: cardsRow, capability_map: capmap,
  system_diagram: (v) => (asList(v.steps).length ? flow(v) : capmap(v)),
  failure_mode: (v) => capmap({ center: v.center ?? "⚠ Failure modes", items: v.items }),
  mirror: (v) => hub(v, true), orbit: (v) => hub(v, false),
};

// Copy an asset next to the HTML and return its relative path.
function copyAsset(absSrc) {
  const base = path.basename(absSrc);
  const d = path.join(CTX.outDir, "assets");
  fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(absSrc, path.join(d, base));
  return `assets/${base}`;
}

// Placeholder for an image slot with no generated art yet — shows the prompt.
function phBox(card) {
  const brief = String(card.visual?.brief || card.image?.brief || "").trim();
  return `<div class="bp-fig__ph"><div class="bp-fig__ph-h">🖼 IMAGE — prompt (not generated)</div>${brief ? `<div class="bp-fig__ph-b">${esc(brief)}</div>` : ""}<code>gen ${esc(card.id)}</code></div>`;
}

// The image half of a split slide (its own image block, or the card's visual image).
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

  // Full layout: one rich full-bleed infographic image (baked text), no chrome.
  if (card.layout === "full") {
    const src = path.join(CTX.dir, "assets", `${card.id}.png`);
    const img = fs.existsSync(src)
      ? `<img class="bp-full__img" src="${esc(copyAsset(src))}" alt="${esc(card.title)}">`
      : `<div class="bp-full__ph"><span>full infographic pending</span><code>gen ${esc(card.id)}</code></div>`;
    return `<section class="slide bp bp-full" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">${img}</section>`;
  }

  // Hero layout: a large framed image is the main element, held inside the
  // blueprint chrome, with crisp HTML title/takeaway and an optional label strip.
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
    ${frameSVG()}
    ${eyebrow}${title}
    <div class="bp-hero__media">${media}</div>
    ${cap}${take}${credit}
  </section>`;
  }

  // Split layout: content on one half, image on the other.
  if (card.layout === "split") {
    const body = asList(card.body).length
      ? `<ul class="bp-body">${asList(card.body).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      : card.visual && card.visual.kind !== "image"
        ? `<div class="bp-split__dia">${renderVisual(card)}</div>`
        : "";
    const content = `<div class="bp-half__content">${eyebrow}${title}${sub}${body}</div>`;
    return `<section class="slide bp bp-card" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${frameSVG()}
    <div class="bp-split${card.side === "image-left" ? " is-left" : ""}">${content}${splitMedia(card)}</div>
    ${take}${credit}
  </section>`;
  }

  return `<section class="slide bp bp-card" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${frameSVG()}
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
  const order = opts.all ? [...cards.keys()] : asList(deck.core).map(String);
  const chosen = order.map((id) => cards.get(id)).filter(Boolean);
  const missing = order.filter((id) => !cards.get(id));
  if (missing.length) console.error(`  ! not found: ${missing.join(", ")}`);

  const css = fs.readFileSync(THEME, "utf8");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(deck.title ?? "Deck")} — blueprint</title>
<style>${css}</style></head><body><main class="deck">
${chosen.map(slide).join("\n")}
</main></body></html>`;
  fs.mkdirSync(CTX.outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);
  if (CTX.assets.size) { const d = path.join(CTX.outDir, "assets"); fs.mkdirSync(d, { recursive: true }); for (const id of CTX.assets) fs.copyFileSync(path.join(CTX.dir, "assets", `${id}.png`), path.join(d, `${id}.png`)); }
  console.log(`Wrote ${opts.out} — ${chosen.length} slides (${CTX.assets.size} images embedded)`);
}
try { main(); } catch (e) { console.error(`build-blueprint-deck failed: ${e.stack || e.message}`); process.exit(1); }
