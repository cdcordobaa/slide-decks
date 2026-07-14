#!/usr/bin/env node
/*
 * build-blueprint.mjs — render ONE blueprint slide from a spec, proving the
 * layered stack: CSS grid → SVG chrome → parametric SVG diagram → transparent
 * PNG illustration → crisp HTML text.
 *
 *   node scripts/build-blueprint.mjs cards/_blueprint/rung2.yaml --out build/blueprint.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "blueprint.css");
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function parseArgs(argv) {
  const o = { spec: null, out: "build/blueprint.html" };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out") o.out = argv[++i];
    else rest.push(argv[i]);
  }
  o.spec = rest[0];
  return o;
}

// ---------- SVG chrome: frame + corner registration marks ----------
function frameSVG() {
  const corner = (x, y, sx, sy) =>
    `<path d="M ${x} ${y + sy * 22} L ${x} ${y} L ${x + sx * 22} ${y}" fill="none" stroke="#2b333b" stroke-width="1.6"/>`;
  return `<svg class="bp-frame" viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke="#2b333b" stroke-width="1.2"/>
    ${corner(34, 34, 1, 1)}${corner(1246, 34, -1, 1)}${corner(34, 686, 1, -1)}${corner(1246, 686, -1, -1)}
    <rect x="628" y="694" width="24" height="12" fill="none" stroke="#2b333b" stroke-width="1.2"/>
  </svg>`;
}

// ---------- SVG diagram: the tool loop ----------
const C = { x: 310, y: 292 };
const dimLine = (x1, y, x2, label, below) => {
  const ty = below ? y + 18 : y - 8;
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#0f7f96" stroke-width="1"/>
    <line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}" stroke="#0f7f96" stroke-width="1"/>
    <line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}" stroke="#0f7f96" stroke-width="1"/>
    <text x="${(x1 + x2) / 2}" y="${ty}" text-anchor="middle" class="anno-cy">${esc(label)}</text>`;
};

function moduleSVG(cx, cy, label) {
  const w = 126, h = 84, x = cx - w / 2, y = cy - h / 2;
  const bolt = (bx, by) => `<circle cx="${bx}" cy="${by}" r="3.2" fill="#222a30"/>`;
  return `<g>
    <rect x="${x}" y="${y + 6}" width="${w}" height="${h - 6}" rx="10" fill="#3c4650" stroke="#222a30" stroke-width="2"/>
    <rect x="${x + 6}" y="${y}" width="${w - 12}" height="19" rx="7" fill="#59636f" stroke="#222a30" stroke-width="2"/>
    ${bolt(x + 13, y + h - 12)}${bolt(x + w - 13, y + h - 12)}
    <text x="${cx}" y="${cy + 17}" text-anchor="middle" class="mod-label">${esc(label)}</text>
  </g>`;
}

function pipeSVG(cx, cy) {
  const dx = C.x - cx, dy = C.y - cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const sx = cx + ux * 48, sy = cy + uy * 48, ex = C.x - ux * 130, ey = C.y - uy * 130;
  return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#1fb6d6" stroke-width="11" stroke-linecap="round"/>
    <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#c7ecf4" stroke-width="3.5" stroke-linecap="round"/>`;
}

function hexSVG(cx, cy, r, label) {
  const pts = Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return `<polygon points="${pts}" fill="#f2a51c" stroke="#b5771a" stroke-width="3"/>
    <polygon points="${pts}" fill="none" stroke="#fff" stroke-width="1" opacity="0.5" transform="scale(0.86)" transform-origin="${cx} ${cy}"/>
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" class="core-label">${esc(label)}</text>`;
}

function arrowhead(deg) {
  const a = (deg * Math.PI) / 180, x = C.x + 118 * Math.cos(a), y = C.y + 118 * Math.sin(a);
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg + 90})"><path d="M -9 -7 L 9 0 L -9 7 Z" fill="#0f7f96"/></g>`;
}

function toolLoop(d = {}) {
  const mods = (d.modules ?? []).slice(0, 4);
  const pos = [[95, 96], [525, 96], [95, 488], [525, 488]];
  const phases = d.phases ?? [];
  const phasePos = [[C.x, 198], [C.x + 84, C.y + 4], [C.x - 84, C.y + 4]];
  const dims = d.dims ?? {};
  return `<svg class="bp-diagram" viewBox="0 0 620 604">
    ${dims.dia ? dimLine(96, 44, 524, dims.dia, false) : ""}
    ${mods.map((_, i) => pipeSVG(pos[i][0], pos[i][1])).join("")}
    <circle cx="${C.x}" cy="${C.y}" r="118" fill="none" stroke="#1fb6d6" stroke-width="16" opacity="0.82"/>
    <circle cx="${C.x}" cy="${C.y}" r="126" fill="none" stroke="#0f7f96" stroke-width="1"/>
    <circle cx="${C.x}" cy="${C.y}" r="110" fill="none" stroke="#0f7f96" stroke-width="1"/>
    <circle cx="${C.x}" cy="${C.y}" r="76" fill="none" stroke="#0f7f96" stroke-width="1" stroke-dasharray="4 5"/>
    ${[-58, 62, 182].map(arrowhead).join("")}
    ${mods.map((m, i) => moduleSVG(pos[i][0], pos[i][1], m)).join("")}
    ${hexSVG(C.x, C.y, 46, d.core ?? "MODEL")}
    ${phases.map((p, i) => `<text x="${phasePos[i][0]}" y="${phasePos[i][1]}" text-anchor="middle" class="phase">${esc(p)}</text>`).join("")}
    ${dims.cycle ? `<text x="${C.x + 2}" y="168" text-anchor="middle" class="anno-cy">${esc(dims.cycle)}</text>` : ""}
    ${dims.offset ? `<text x="120" y="450" class="anno">${esc(dims.offset)}</text>` : ""}
    ${dims.bus ? dimLine(96, 556, 524, dims.bus, true) : ""}
  </svg>`;
}

// ---------- document ----------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.spec || !fs.existsSync(opts.spec)) throw new Error(`Spec not found: ${opts.spec}`);
  const spec = parseYaml(fs.readFileSync(opts.spec, "utf8")) || {};
  const specDir = path.dirname(opts.spec);
  const outDir = path.dirname(path.resolve(opts.out));
  const css = fs.readFileSync(THEME, "utf8");

  const title = String(spec.title ?? "").split("\n").map(esc).join("<br>");
  const copy = (spec.copy ?? []).map((p) => `<p>${esc(p)}</p>`).join("");
  const status = spec.status ? `<div class="bp-status">${esc(spec.status).replace(/\/\//g, "<b>//</b>")}</div>` : "";

  // Illustration (transparent PNG) copied next to the HTML.
  let illus = "";
  if (spec.illustration?.src) {
    const src = path.join(specDir, spec.illustration.src);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
      const base = path.basename(src);
      fs.copyFileSync(src, path.join(outDir, "assets", base));
      const { left = 60, top = 460, width = 200 } = spec.illustration;
      illus = `<img class="bp-illus" src="assets/${esc(base)}" style="left:${left}px;top:${top}px;width:${width}px" alt="">`;
    }
  }

  const legend = (spec.legend ?? [])
    .map(([sw, label]) => `<div class="bp-legend__row"><span class="sw sw--${esc(sw)}"></span>${esc(label)}</div>`)
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(spec.title ?? "Blueprint")}</title>
<style>${css}</style></head>
<body><main class="deck">
<section class="slide bp" aria-label="${esc((spec.title ?? "").replace(/\n/g, " "))}">
  ${frameSVG()}
  <div class="bp-left"><h1 class="bp-title">${title}</h1>${status}<div class="bp-copy">${copy}</div></div>
  ${toolLoop(spec.diagram)}
  ${illus}
  ${legend ? `<div class="bp-legend">${legend}</div>` : ""}
  <div class="bp-credit">HARNESS ENGINEERING // BLUEPRINT</div>
</section>
</main></body></html>
`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(opts.out, html);
  console.log(`Wrote ${opts.out}`);
}

try { main(); } catch (e) { console.error(`build-blueprint failed: ${e.message}`); process.exit(1); }
