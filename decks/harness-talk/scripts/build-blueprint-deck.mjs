#!/usr/bin/env node
/*
 * build-blueprint-deck.mjs — render the card manifest as the Globant-branded
 * blueprint deck: a green-forward engineering board (grid + navy margins),
 * greens-only accents, via theme/blueprint.css. Adds a branded cover slide and
 * a Globant logo mark on every card.
 *
 *   node scripts/build-blueprint-deck.mjs cards --out build/harness-blueprint.html [--all]
 *   node scripts/build-blueprint-deck.mjs cards --ids 0.1,0.3 --out build/verify.html
 *
 * By default renders deck.core (the spine) in order; --all renders every card;
 * --ids <a,b,c> renders just those cards (used to verify the theme quickly).
 * --no-cover skips the title slide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { ICONS } from "../theme/tabler-icons.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "blueprint.css");
const LOGO_PATH = path.join(HERE, "..", "cards", "assets", "globant-logo.svg");
const LOGO_RAW = fs.readFileSync(LOGO_PATH, "utf8");
// The brand logo is two-tone: wordmark (no fill → inherits) + green arrow (.cls-1).
// `letters` sets the wordmark colour; the arrow always stays Globant green.
const logoTwo = (letters, arrow = "#bfd732") => "data:image/svg+xml;base64," +
  Buffer.from(LOGO_RAW.replace(/fill:#bfd732/gi, `fill:${arrow}`).replace(/<svg /, `<svg fill="${letters}" `)).toString("base64");
const LOGO_BRAND = logoTwo("#00292e");     // navy wordmark + green arrow — for the light board
const LOGO_BRAND_REV = logoTwo("#ffffff"); // white wordmark + green arrow — for the navy band
const LOGO_TAG = `<img class="bp-logo" src="${LOGO_BRAND}" alt="Globant">`;
// Authentic brand PNGs extracted from the corporate Tech Talks PPTX.
const pngURI = (f) => "data:image/png;base64," + fs.readFileSync(path.join(HERE, "..", "cards", "assets", f)).toString("base64");
const LOGO_WHITE = pngURI("globant-white.png");
const ENG_LOGO = pngURI("engineering-logo.png");
const engLogo = (h = 30) => `<img class="bp-englogo" style="height:${h}px" src="${ENG_LOGO}" alt="Engineering">`;
// Corporate structural bits (Tech Talks conventions in the green skin)
const band = (eyebrow, main) => `<div class="bp-band"><div class="bp-band__ttl"><div class="bp-band__eyebrow">${esc(eyebrow)}</div><div class="bp-band__main">${esc(main)}</div></div><img class="bp-band__logo" src="${LOGO_BRAND_REV}" alt="Globant"></div>`;
const conf = () => `<div class="bp-conf">Globant proprietary | Confidential information</div>`;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const norm = (it) => (typeof it === "object" && it ? { label: it.label, caption: it.caption ?? null, state: it.state ?? null } : { label: it, caption: null, state: null });

let CTX = { dir: ".", outDir: ".", assets: new Set() };

function parseArgs(argv) {
  const o = { dir: "cards", out: "build/harness-blueprint.html", all: false, ids: null, cover: true, corporate: false };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") o.out = argv[++i];
    else if (argv[i] === "--all") o.all = true;
    else if (argv[i] === "--ids") o.ids = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === "--no-cover") o.cover = false;
    else if (argv[i] === "--corporate") o.corporate = true;
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

// Slide-number badge (bottom-right). num/total are 1-based.
const pageNo = (num, total) => `<div class="bp-pageno"><b>${String(num).padStart(2, "0")}</b> / ${total}</div>`;

// ---------- Cover slide ----------
function cover(deck, num, total) {
  return `<section class="slide bp bp-cover" aria-label="cover">
    ${frameSVG()}${pageNo(num, total)}
    <img class="bp-cover__logo" src="${LOGO_BRAND}" alt="Globant">
    <div class="bp-cover__eyebrow">${esc(deck.audience ?? "Harness Engineering")}</div>
    <h1 class="bp-cover__title">${esc(deck.title ?? "Deck")}</h1>
    <div class="bp-cover__rule"></div>
    <p class="bp-cover__sub">${esc(deck.subtitle ?? "")}</p>
    <div class="bp-cover__meta"><b>GLOBANT</b> &nbsp;//&nbsp; Harness Engineering</div>
  </section>`;
}

// ---------- SVG chrome (Globant navy) ----------
function frameSVG(stroke = "#00292e") {
  const corner = (x, y, sx, sy) => `<path d="M ${x} ${y + sy * 22} L ${x} ${y} L ${x + sx * 22} ${y}" fill="none" stroke="${stroke}" stroke-width="1.6"/>`;
  return `<svg class="bp-frame" viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.55"/>
    ${corner(34, 34, 1, 1)}${corner(1246, 34, -1, 1)}${corner(34, 686, 1, -1)}${corner(1246, 686, -1, -1)}
    <rect x="628" y="694" width="24" height="12" fill="none" stroke="${stroke}" stroke-width="1.2"/>
  </svg>`;
}

// ---------- Corporate slide types (Tech Talks structure) ----------
function coverCorporate(deck, num, total) {
  return `<section class="slide bp bp-cover" aria-label="cover">
    ${frameSVG()}${pageNo(num, total)}
    <div style="margin-bottom:34px">${engLogo(34)}</div>
    <div class="bp-cover__eyebrow">Tech Talks · Engineering</div>
    <h1 class="bp-cover__title">${esc(deck.title ?? "Deck")}</h1>
    <div class="bp-cover__rule"></div>
    <p class="bp-cover__sub">${esc(deck.subtitle ?? "")}</p>
    <div class="bp-cover__meta"><b>GLOBANT</b> &nbsp;//&nbsp; Harness Engineering</div>
  </section>`;
}

function indexSlide(sections, num, total) {
  const rows = sections.map((s, i) => `<div class="bp-index__row"><span class="bp-index__n">${i + 1}.</span><span class="bp-index__label">${esc(s.title)}</span></div>`).join("");
  return `<section class="slide bp bp-card has-band" aria-label="index">
    ${frameSVG()}${band("Presentation title", "Index")}${pageNo(num, total)}${conf()}
    <div class="bp-index__grid">${rows}</div>
  </section>`;
}

function dividerSlide(sec, num, total) {
  return `<section class="slide bp bp-div" aria-label="§${esc(sec.id)} ${esc(sec.title)}">
    ${frameSVG()}${pageNo(num, total)}${conf()}
    <img class="bp-logo" src="${LOGO_BRAND}" alt="Globant">
    <div class="bp-div__no">${String(sec.n).padStart(2, "0")}</div>
    <div class="bp-div__eyebrow">Section</div>
    <h2 class="bp-div__title">${esc(sec.title)}</h2>
    <div class="bp-div__rule"></div>
  </section>`;
}

function thanksSlide(num, total) {
  return `<section class="slide bp bp-thanks is-dark" aria-label="thanks">
    ${frameSVG("#8fb98a")}${pageNo(num, total)}
    <div class="bp-thanks__eng"><span class="bp-eng-panel">${engLogo(34)}</span></div>
    <div class="bp-thanks__msg">Thank <b>you</b></div>
    <img class="bp-thanks__logo" src="${LOGO_WHITE}" alt="Globant">
  </section>`;
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
  if (h(/eval|judge|correct|grade|verif/)) return "evaluation";
  if (h(/recover|retry/)) return "recovery";
  if (h(/safe|safety|constraint|contain/)) return "safety";
  if (h(/environment|\benv\b/)) return "environment";
  if (h(/human|operator|\byou\b/)) return "human";
  if (h(/coordinat|orchestrat|direct/)) return "coordination";
  if (h(/git|branch/)) return "git";
  if (h(/terminal/)) return "terminal";
  if (h(/filesystem|folder|workspace/)) return "workspace";
  if (h(/\btest|ci\b/)) return "tests";
  if (h(/browser|web/)) return "browser";
  if (h(/review/)) return "review";
  if (h(/ticket/)) return "ticket";
  if (h(/spec|\bfile\b|mcp/)) return "specs";
  if (h(/improve|system|signal/)) return "improve";
  if (h(/api|plug|connect/)) return "api";
  if (h(/custom|skill/)) return "custom";
  if (h(/runtime|loop/)) return "runtime";
  if (h(/missing|\?\?\?/)) return "missing";
  if (h(/agent|robot/)) return "agent";
  return "generic";
}
const icon = (name, cls) => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.generic}</svg>`;
// SVG-embedded icon (nested <svg>, explicit Globant green-deep stroke)
const svgIcon = (name, x, y) => `<svg x="${x}" y="${y}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f7a3d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ICONS.generic}</svg>`;

// ---------- HTML diagrams ----------
const stack = (v) => `<div class="bp-stk">${asList(v.items).map(norm).map((it) => `<div class="bp-stk__row${it.state === "missing" ? " is-missing" : ""}">${icon(it.state === "missing" ? "missing" : iconFor(it.label), "bp-stk__ico")}<span class="bp-stk__label">${esc(it.label)}</span>${it.caption ? `<span class="bp-stk__cap">${esc(it.caption)}</span>` : ""}${it.state === "missing" ? `<span class="bp-stk__tag">not engineered</span>` : ""}</div>`).join("")}</div>`;

const comparison = (v) => `<div class="bp-cmp">${asList(v.boxes).map((b) => `<div class="bp-cmp__col"><div class="bp-cmp__h">${esc(b.label)}</div><div class="bp-cmp__b">${esc(b.result)}</div></div>`).join("")}</div>`;

function equation(v) {
  const parse = (t) => { const [l, r] = String(t).split("→"); return { l: (l || "").trim(), r: (r || "").trim() }; };
  const terms = asList(v.terms).map(parse);
  const box = (t) => `<div class="bp-eq__box"><div class="bp-eq__l">${esc(t.l)}</div>${t.r ? `<div class="bp-eq__r">${esc(t.r)}</div>` : ""}</div>`;
  const ops = ["+", "="];
  return `<div class="bp-eq">${terms.map((t, i) => box(t) + (i < terms.length - 1 ? `<div class="bp-eq__op">${ops[i] ?? "+"}</div>` : "")).join("")}</div>`;
}

const xferCol = (node, cls = "") => node ? `<div class="bp-xfer__col ${cls}"><h4>${esc(node.label)}</h4><ul>${asList(node.items).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>${node.tag ? `<div class="bp-xfer__tag">${esc(node.tag)}</div>` : ""}</div>` : "";
const xferArw = `<div class="bp-xfer__arw">→</div>`;
// transfer — from → [via] → to. The optional middle `via` node makes it a
// three-stage flow (e.g. responsibilities landing in an engineered harness).
const transfer = (v) => `<div class="bp-xfer${v.via ? " is-triple" : ""}">${xferCol(v.from, "is-from")}${xferArw}${v.via ? xferCol(v.via, "is-via") + xferArw : ""}${xferCol(v.to, "is-to")}</div>`;

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

const formula = (v) => `<div class="bp-eq">${asList(v.terms).map((t, i, a) => `<div class="bp-eq__box"><div class="bp-eq__l">${esc(t)}</div></div>` + (i < a.length - 1 ? `<div class="bp-eq__op">×</div>` : "")).join("")}</div>`;

// harness_ring — model core ringed by icon-labelled subsystem modules (Globant colors)
function harnessRing(v) {
  const items = asList(v.items).map(norm);
  const n = items.length || 1;
  const cx = 430, cy = 305, R = 212, hexR = 54, bw = 150, bh = 46;
  const hexPts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + hexR * Math.cos(a)).toFixed(1)},${(cy + hexR * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const pipes = [], boxes = [];
  items.forEach((it, i) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    const mx = cx + R * Math.cos(a), my = cy + R * Math.sin(a);
    pipes.push(`<line x1="${(cx + hexR * Math.cos(a)).toFixed(1)}" y1="${(cy + hexR * Math.sin(a)).toFixed(1)}" x2="${(mx - (bw / 2 - 8) * Math.cos(a)).toFixed(1)}" y2="${(my - (bh / 2 - 4) * Math.sin(a)).toFixed(1)}" stroke="#bfd732" stroke-width="6" stroke-linecap="round"/>`);
    const bx = mx - bw / 2, by = my - bh / 2;
    boxes.push(`<g><rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw}" height="${bh}" rx="9" fill="#f4f7ef" stroke="#00292e" stroke-width="1.5"/>${svgIcon(iconFor(it.label), (bx + 11).toFixed(1), (by + 12).toFixed(1))}<text x="${(bx + 42).toFixed(1)}" y="${(by + 29).toFixed(1)}" class="hr-label">${esc(it.label)}</text></g>`);
  });
  const core = `<polygon points="${hexPts}" fill="#00292e" stroke="#1f7a3d" stroke-width="3"/><text x="${cx}" y="${(cy + 6).toFixed(1)}" text-anchor="middle" class="hr-core">${esc(v.center ?? "MODEL")}</text>`;
  return `<svg class="bp-dia bp-ring" viewBox="0 0 860 610">${pipes.join("")}${boxes.join("")}${core}</svg>`;
}

// fleet — source -> orchestrator -> isolated agents -> CI/review gate
function fleet(v) {
  const agents = asList(v.agents).length ? asList(v.agents) : ["Agent A", "Agent B", "Agent C"];
  const source = v.source ?? "Tickets", hub = v.hub ?? "Orchestrator", gate = v.gate ?? "CI + Review";
  const nodeW = 164, nodeH = 44, wsW = 200, wsH = 66;
  const nb = (cx, cy, label, ic, accent) => {
    const x = cx - nodeW / 2, y = cy - nodeH / 2;
    return `<g><rect x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="10" fill="${accent ? "rgba(191,215,50,0.22)" : "#f4f7ef"}" stroke="${accent ? "#1f7a3d" : "#00292e"}" stroke-width="1.5"/>${svgIcon(ic, x + 12, cy - 11)}<text x="${x + 40}" y="${cy + 5}" class="hr-label">${esc(label)}</text></g>`;
  };
  const pipe = (x1, y1, x2, y2) => `<path d="M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="#bfd732" stroke-width="5" stroke-linecap="round"/>`;
  const src = { x: 110, y: 240 }, hb = { x: 320, y: 240 }, gt = { x: 820, y: 240 }, ax = 590;
  const ays = agents.map((_, i) => (agents.length === 1 ? 240 : 110 + (i * 260) / (agents.length - 1)));
  const pipes = [pipe(src.x + nodeW / 2, src.y, hb.x - nodeW / 2, hb.y)];
  agents.forEach((_, i) => { pipes.push(pipe(hb.x + nodeW / 2, hb.y, ax - wsW / 2, ays[i])); pipes.push(pipe(ax + wsW / 2, ays[i], gt.x - nodeW / 2, gt.y)); });
  const ws = agents.map((a, i) => `<rect x="${ax - wsW / 2}" y="${ays[i] - wsH / 2}" width="${wsW}" height="${wsH}" rx="10" fill="none" stroke="#7c8a7e" stroke-width="1.3" stroke-dasharray="5 4"/>` + nb(ax, ays[i], a, "agent")).join("");
  const nodes = nb(src.x, src.y, source, "ticket") + nb(hb.x, hb.y, hub, "coordination") + nb(gt.x, gt.y, gate, "review", true);
  return `<svg class="bp-dia bp-fleet" viewBox="0 0 930 480">${pipes.join("")}${ws}${nodes}</svg>`;
}

// matrix — small comparison table
function matrix(v) {
  const cols = asList(v.columns), rows = asList(v.rows);
  const mk = (c) => esc(c).replace(/✅/g, '<span class="mx-y">✓</span>').replace(/❌/g, '<span class="mx-n">✕</span>').replace(/⚠️?/g, '<span class="mx-m">~</span>');
  const th = cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const trs = rows.map((r) => `<tr>${asList(r).map((c, i) => `<td${i === 0 ? ' class="bp-mx__h"' : ""}>${mk(c)}</td>`).join("")}</tr>`).join("");
  const src = v.source ? `<div class="bp-mx__src">Source: ${esc(v.source)}</div>` : "";
  return `<div class="bp-mxwrap"><table class="bp-mx${v.dense ? " bp-mx--dense" : ""}"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>${src}</div>`;
}

// four_functions — 2x2 labelled cards
const fourFunctions = (v) => `<div class="bp-4fn">${asList(v.items).map(norm).map((it) => `<div class="bp-4fn__q">${icon(iconFor(it.label), "bp-4fn__ico")}<div><b>${esc(it.label)}</b>${it.caption ? `<span>${esc(it.caption)}</span>` : ""}</div></div>`).join("")}</div>`;

// spectrum — the operator's journey as a continuum: a gradient track with staged nodes
function spectrum(v) {
  const stages = asList(v.stages).map(norm);
  const n = Math.max(stages.length, 2);
  const x0 = 130, x1 = 910, y = 150, step = (x1 - x0) / (n - 1);
  const grad = `<defs><linearGradient id="spg" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"><stop offset="0" stop-color="#8a9199"/><stop offset="1" stop-color="#bfd732"/></linearGradient></defs>`;
  const track = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="url(#spg)" stroke-width="7" stroke-linecap="round"/>`;
  const nodes = stages.map((s, i) => {
    const x = x0 + i * step, last = i === n - 1;
    return `<g><circle cx="${x}" cy="${y}" r="${last ? 14 : 11}" fill="${last ? "#bfd732" : "#00292e"}" stroke="#00292e" stroke-width="2.5"/><text x="${x}" y="${y - 30}" text-anchor="middle" class="sp-label">${esc(s.label)}</text>${s.caption ? `<text x="${x}" y="${y + 44}" text-anchor="middle" class="sp-cap">${esc(s.caption)}</text>` : ""}</g>`;
  }).join("");
  return `<svg class="bp-dia bp-spectrum" viewBox="0 0 1040 290">${grad}${track}${nodes}</svg>`;
}

// control_plane — orchestration architecture: repo + board -> orchestrator -> workspace -> agent -> review
function controlPlane(v) {
  const box = (n, cls) => n ? `<div class="cp__box ${cls}"><b>${esc(n.title)}</b>${Array.isArray(n.items) ? `<ul class="cp__list">${n.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : n.items ? `<span>${esc(n.items)}</span>` : ""}${n.note ? `<em>${esc(n.note)}</em>` : ""}</div>` : "";
  const arw = (t) => `<div class="cp__arw"><span>${esc(t)}</span></div>`;
  return `<div class="bp-dia bp-cplane">${box(v.repo, "cp--repo")}${arw(v.l1 || "repo rules")}<div class="cp__row">${box(v.orchestrator, "cp--orch")}<div class="cp__link">board state</div>${box(v.board, "cp--board")}</div>${arw(v.l2 || "spawns isolated runs")}${box(v.workspace, "cp--ws")}${arw(v.l3 || "launches")}${box(v.agent, "cp--agent")}${arw(v.l4 || "output")}${box(v.sink, "cp--sink")}</div>`;
}

// agentic_search_loop — search as a loop: plan -> act -> inspect -> refine, with query in / results out
function agenticLoop(v) {
  const loop = asList(v.loop); const n = Math.max(loop.length, 3);
  const cx = 450, cy = 225, R = 152;
  const pos = (i) => { const th = (180 + i * 360 / n) * Math.PI / 180; return [cx + R * Math.cos(th), cy + R * Math.sin(th)]; };
  const ring = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#bfd732" stroke-width="4"/>`;
  const chevrons = loop.map((_, i) => {
    const th = (180 + (i + 0.5) * 360 / n) * Math.PI / 180;
    const px = cx + R * Math.cos(th), py = cy + R * Math.sin(th);
    const tx = -Math.sin(th), ty = Math.cos(th), nx = Math.cos(th), ny = Math.sin(th);
    const p = (s) => `${(px - 7 * tx + s * 5 * nx).toFixed(1)},${(py - 7 * ty + s * 5 * ny).toFixed(1)}`;
    return `<path d="M ${p(1)} L ${px.toFixed(1)},${py.toFixed(1)} L ${p(-1)}" fill="none" stroke="#bfd732" stroke-width="3.5" stroke-linecap="round"/>`;
  }).join("");
  const nodes = loop.map((l, i) => { const [x, y] = pos(i); return `<g><rect x="${(x - 80).toFixed(1)}" y="${(y - 20).toFixed(1)}" width="160" height="40" rx="9" fill="#f4f7ef" stroke="#00292e" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" class="al-label">${esc(l)}</text></g>`; }).join("");
  const center = `<text x="${cx}" y="${cy + 5}" text-anchor="middle" class="al-center">${esc(v.center || "search loop")}</text>`;
  const io = (label, x, fill) => `<g><rect x="${x - 82}" y="${cy - 21}" width="164" height="42" rx="10" fill="${fill}" stroke="#1f7a3d" stroke-width="1.6"/><text x="${x}" y="${cy + 5}" text-anchor="middle" class="al-io">${esc(label)}</text></g>`;
  const entry = v.entry ? io(v.entry, 100, "#eef4dd") + `<line x1="182" y1="${cy}" x2="${cx - R - 6}" y2="${cy}" stroke="#bfd732" stroke-width="4"/>` : "";
  const ei = Math.floor(n / 2); const [exX] = pos(ei);
  const exit = v.exit ? `<line x1="${cx + R + 6}" y1="${cy}" x2="798" y2="${cy}" stroke="#bfd732" stroke-width="4"/>` + io(v.exit, 890, "#bfd732") : "";
  return `<svg class="bp-dia bp-aloop" viewBox="0 0 990 460">${ring}${chevrons}${entry}${exit}${nodes}${center}</svg>`;
}

// build_stack — layered system (base -> top)
const buildStack = (v) => { const layers = [...asList(v.layers)].reverse(); return `<div class="bp-bstack">${layers.map((l, i) => `<div class="bs__layer${i === 0 ? " bs__layer--top" : ""}${i === layers.length - 1 ? " bs__layer--base" : ""}"><b>${esc(l.label)}</b>${l.note ? `<span>${esc(l.note)}</span>` : ""}</div>`).join("")}</div>`; };

// file_tree — coded repo tree
function fileTree(v) {
  const es = asList(v.entries); const rows = [];
  es.forEach((e, i) => {
    const last = i === es.length - 1 && !asList(e.children).length;
    const dir = /\/$|\/\*/.test(e.name || e.label || "");
    rows.push(`<div class="ft__row"><span class="ft__c">${last ? "└─" : "├─"}</span><span class="ft__n${dir ? " ft__dir" : ""}">${esc(e.name || e.label)}</span>${e.note ? `<span class="ft__note">${esc(e.note)}</span>` : ""}</div>`);
    asList(e.children).forEach((c, j, arr) => rows.push(`<div class="ft__row"><span class="ft__c">${i === es.length - 1 ? "  " : "│ "} ${j === arr.length - 1 ? "└─" : "├─"}</span><span class="ft__n">${esc(c)}</span></div>`));
  });
  return `<div class="bp-ftree"><div class="ft__root">${esc(v.root || "project/")}</div>${rows.join("")}</div>`;
}

// overloaded_prompt — one prompt carrying an OS's jobs (amber = strain)
function overloadedPrompt(v) {
  const jobs = asList(v.jobs); const n = Math.max(jobs.length, 1);
  const cx = 450, cy = 230, R = 172, bw = 156, bh = 42, hw = 152, hh = 66;
  const defs = `<defs><marker id="opar" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto"><path d="M0,0 L6.5,3 L0,6 z" fill="#c98a2b"/></marker></defs>`;
  const items = jobs.map((j, i) => {
    const a = (-90 + i * 360 / n) * Math.PI / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const line = `<line x1="${(x - (bw / 2 - 6) * Math.cos(a)).toFixed(1)}" y1="${(y - (bh / 2 - 4) * Math.sin(a)).toFixed(1)}" x2="${(cx + (hw / 2 + 10) * Math.cos(a)).toFixed(1)}" y2="${(cy + (hh / 2 + 10) * Math.sin(a)).toFixed(1)}" stroke="#c98a2b" stroke-width="4" marker-end="url(#opar)"/>`;
    return line + `<g><rect x="${(x - bw / 2).toFixed(1)}" y="${(y - bh / 2).toFixed(1)}" width="${bw}" height="${bh}" rx="9" fill="#f4f7ef" stroke="#00292e" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" class="op-label">${esc(j)}</text></g>`;
  }).join("");
  const core = `<rect x="${cx - hw / 2}" y="${cy - hh / 2}" width="${hw}" height="${hh}" rx="11" fill="#00292e" stroke="#c98a2b" stroke-width="3"/><text x="${cx}" y="${cy - 2}" text-anchor="middle" class="op-core">${esc(v.center || "One prompt")}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="op-sub">doing an OS's job</text>`;
  return `<svg class="bp-dia bp-oprompt" viewBox="0 0 900 470">${defs}${items}${core}</svg>`;
}

// points — condensed bullet list (left column of a step slide)
const points = (v) => `<ul class="bp-points">${asList(v.items).map(norm).map((it) => `<li><b>${esc(it.label)}</b>${it.caption ? `<span>${esc(it.caption)}</span>` : ""}</li>`).join("")}</ul>`;

// duo — two figures side by side (keeps both slides' visuals when merging)
function duo(v) {
  const col = (sv) => sv ? `<div class="bp-duo__col">${sv.title ? `<div class="bp-duo__t">${esc(sv.title)}</div>` : ""}<div class="bp-duo__fig">${(VIS[sv.kind] || (() => ""))(sv)}</div></div>` : "";
  return `<div class="bp-duo${v.stacked ? " is-stacked" : ""}">${col(v.left)}${col(v.right)}</div>`;
}

// harness_loop — concentric "body + motion": MODEL core, HARNESS body ring, LOOP motion ring
function harnessLoop(v) {
  const cx = 350, cy = 285, hexR = 40, R1 = 120, R2 = 232;
  const harness = asList(v.harness), loop = asList(v.loop);
  const nH = harness.length || 1, nL = loop.length || 1, bw = 98, bh = 30;
  const hexPts = Array.from({ length: 6 }, (_, k) => { const a = ((-90 + 60 * k) * Math.PI) / 180; return `${(cx + hexR * Math.cos(a)).toFixed(1)},${(cy + hexR * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const core = `<polygon points="${hexPts}" fill="#00292e" stroke="#1f7a3d" stroke-width="3"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" class="hl-core">${esc(v.center || "MODEL")}</text>`;
  const inner = harness.map((h, i) => {
    const a = (-90 + i * 360 / nH) * Math.PI / 180, x = cx + R1 * Math.cos(a), y = cy + R1 * Math.sin(a);
    const pipe = `<line x1="${(cx + hexR * Math.cos(a)).toFixed(1)}" y1="${(cy + hexR * Math.sin(a)).toFixed(1)}" x2="${(x - (bw / 2 - 6) * Math.cos(a)).toFixed(1)}" y2="${(y - (bh / 2 - 4) * Math.sin(a)).toFixed(1)}" stroke="#bfd732" stroke-width="4"/>`;
    return pipe + `<g><rect x="${(x - bw / 2).toFixed(1)}" y="${(y - bh / 2).toFixed(1)}" width="${bw}" height="${bh}" rx="7" fill="#f4f7ef" stroke="#00292e" stroke-width="1.4"/><text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="hl-h">${esc(h)}</text></g>`;
  }).join("");
  const ring = `<circle cx="${cx}" cy="${cy}" r="${R2}" fill="none" stroke="#bfd732" stroke-width="3"/>`;
  const chev = loop.map((_, i) => {
    const th = (-90 + (i + 0.5) * 360 / nL) * Math.PI / 180, px = cx + R2 * Math.cos(th), py = cy + R2 * Math.sin(th);
    const tx = -Math.sin(th), ty = Math.cos(th), nx = Math.cos(th), ny = Math.sin(th);
    const p = (s) => `${(px - 7 * tx + s * 5 * nx).toFixed(1)},${(py - 7 * ty + s * 5 * ny).toFixed(1)}`;
    return `<path d="M ${p(1)} L ${px.toFixed(1)},${py.toFixed(1)} L ${p(-1)}" fill="none" stroke="#bfd732" stroke-width="3" stroke-linecap="round"/>`;
  }).join("");
  const outer = loop.map((l, i) => {
    const a = (-90 + i * 360 / nL) * Math.PI / 180, x = cx + R2 * Math.cos(a), y = cy + R2 * Math.sin(a);
    const lx = cx + (R2 + 14) * Math.cos(a), ly = cy + (R2 + 14) * Math.sin(a) + 4;
    const anch = Math.abs(Math.cos(a)) < 0.35 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#1f7a3d"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anch}" class="hl-l">${esc(l)}</text>`;
  }).join("");
  return `<svg class="bp-dia bp-hloop" viewBox="0 0 700 570">${ring}${chev}${outer}${inner}${core}</svg>`;
}

const VIS = {
  stack, comparison, equation, formula, transfer, fanout, ladder, flow, spectrum, duo, points, harness_loop: harnessLoop,
  control_plane: controlPlane, agentic_search_loop: agenticLoop, build_stack: buildStack,
  file_tree: fileTree, overloaded_prompt: overloadedPrompt,
  harness_ring: harnessRing, fleet, matrix, four_functions: fourFunctions,
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
function slide(card, num, total, corporate = false) {
  const sec = card._sec ?? {};
  const secLabel = (sec.title ?? "").toUpperCase();
  const eyebrow = `<div class="bp-eyebrow">§${esc(sec.id ?? "")} · ${esc(secLabel)} · ${esc(card.id)}</div>`;
  const title = `<h1 class="bp-h">${esc(card.title)}</h1>`;
  const sub = card.subtitle ? `<p class="bp-sub">${esc(card.subtitle)}</p>` : "";
  const take = card.takeaway ? `<div class="bp-take"><span>▸</span> ${esc(card.takeaway)}</div>` : "";
  const credit = `<div class="bp-credit">HARNESS ENGINEERING // ${esc(card.id)}</div>${pageNo(num, total)}`;
  // In corporate mode the title is carried by the top band; add the confidential footer.
  const foot = corporate ? conf() : "";
  const chrome = corporate ? `${frameSVG()}${band(secLabel || "Presentation title", card.title)}` : `${frameSVG()}${LOGO_TAG}`;
  const cls = corporate ? "bp-card has-band" : "bp-card";
  const head = corporate ? sub : `${eyebrow}${title}${sub}`;

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
    // visual2 with `beside: true` (transfer only): flank the image — from-panel
    // left, image center, to-panel right, and the via node as a thin strip
    // below the image. Maximizes the illustration.
    const v2 = card.visual2;
    if (v2?.beside && v2.kind === "transfer") {
      const strip = v2.via
        ? `<div class="bp-hero__viastrip"><b>${esc(v2.via.label)}</b>${asList(v2.via.items).map((i) => `<span>${esc(i)}</span>`).join("<i>·</i>")}</div>`
        : "";
      return `<section class="slide bp ${cls} bp-hero" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${chrome}
    ${corporate ? sub : `${eyebrow}${title}`}
    <div class="bp-hero__flank">
      ${xferCol(v2.from, "is-from")}
      <div class="bp-hero__center"><div class="bp-hero__media">${media}</div>${strip}</div>
      ${xferCol(v2.to, "is-to")}
    </div>
    ${cap}${take}${credit}${foot}
  </section>`;
    }
    // Optional coded diagram rendered under the hero image (e.g. the minimal
    // spectrum line beneath the ladder illustration) — `visual2:` on the card.
    const under = card.visual2 && VIS[card.visual2.kind]
      ? `<div class="bp-hero__under">${VIS[card.visual2.kind](card.visual2, card)}</div>`
      : "";
    return `<section class="slide bp ${cls} bp-hero${under ? " has-under" : ""}" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${chrome}
    ${corporate ? sub : `${eyebrow}${title}`}
    <div class="bp-hero__media">${media}</div>
    ${under}${cap}${take}${credit}${foot}
  </section>`;
  }

  if (card.layout === "split") {
    const body = asList(card.body).length
      ? `<ul class="bp-body">${asList(card.body).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
      : card.visual && card.visual.kind !== "image"
        ? `<div class="bp-split__dia">${renderVisual(card)}</div>`
        : "";
    const content = `<div class="bp-half__content">${corporate ? sub : `${eyebrow}${title}${sub}`}${body}</div>`;
    return `<section class="slide bp ${cls}" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${chrome}
    <div class="bp-split${card.side === "image-left" ? " is-left" : ""}">${content}${splitMedia(card)}</div>
    ${take}${credit}${foot}
  </section>`;
  }

  return `<section class="slide bp ${cls}" aria-label="${esc(card.id)} ${esc(card.name ?? "")}">
    ${chrome}
    ${head}
    <div class="bp-stage">${renderVisual(card)}</div>
    ${take}${credit}${foot}
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
  // Build an ordered list of slide makers first, so page numbers can carry the true total.
  const makers = [];
  if (opts.corporate) {
    // Distinct sections in first-appearance order (for Index + dividers).
    const sections = []; const seen = new Set();
    for (const c of chosen) { const s = c._sec ?? {}; const id = String(s.id ?? ""); if (!seen.has(id)) { seen.add(id); sections.push({ id, title: s.title ?? id, n: sections.length + 1 }); } }
    if (opts.cover) makers.push((n, t) => coverCorporate(deck, n, t));
    for (const c of chosen) makers.push((n, t) => slide(c, n, t, true));
    makers.push((n, t) => thanksSlide(n, t));
  } else {
    if (opts.cover) makers.push((n, t) => cover(deck, n, t));
    for (const c of chosen) makers.push((n, t) => slide(c, n, t, false));
    makers.push((n, t) => thanksSlide(n, t));
  }
  const total = makers.length;
  let n = 0;
  const slides = makers.map((f) => f((n += 1), total));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(deck.title ?? "Deck")} · Globant</title>
<style>${css}</style></head><body><main class="deck">
${slides.join("\n")}
</main></body></html>`;
  fs.mkdirSync(CTX.outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);
  if (CTX.assets.size) { const d = path.join(CTX.outDir, "assets"); fs.mkdirSync(d, { recursive: true }); for (const id of CTX.assets) fs.copyFileSync(path.join(CTX.dir, "assets", `${id}.png`), path.join(d, `${id}.png`)); }
  console.log(`Wrote ${opts.out} — ${slides.length} slides (${CTX.assets.size} images embedded)`);
}
try { main(); } catch (e) { console.error(`build-globant-deck failed: ${e.stack || e.message}`); process.exit(1); }
