#!/usr/bin/env node
/*
 * build-test-template.mjs — a small "theme test" deck that demonstrates the
 * Globant corporate "Tech Talks" STRUCTURE (header band, Engineering lockup,
 * two-tier title, confidential footer, section divider, Index/agenda, Thank-you)
 * rendered in OUR green-forward blueprint skin. Used to iterate on the theme
 * before committing conventions to the full deck.
 *
 *   node scripts/build-test-template.mjs --out build/test-template.html
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "blueprint.css");
const ASSETS = path.join(HERE, "..", "cards", "assets");
const LOGO_RAW = fs.readFileSync(path.join(ASSETS, "globant-logo.svg"), "utf8");
// The brand logo is two-tone: wordmark (no fill → inherits) + green arrow (.cls-1).
// `letters` sets the wordmark colour; the arrow stays Globant green.
const logoTwo = (letters, arrow = "#bfd732") => "data:image/svg+xml;base64," +
  Buffer.from(LOGO_RAW.replace(/fill:#bfd732/gi, `fill:${arrow}`).replace(/<svg /, `<svg fill="${letters}" `)).toString("base64");
const LOGO_BRAND = logoTwo("#00292e");     // navy wordmark + green arrow — for the light board
const LOGO_BRAND_REV = logoTwo("#ffffff"); // white wordmark + green arrow — for the navy band
// Authentic brand PNGs extracted from the corporate Tech Talks PPTX (last slide).
const pngURI = (f) => "data:image/png;base64," + fs.readFileSync(path.join(ASSETS, f)).toString("base64");
const LOGO_WHITE = pngURI("globant-white.png");       // white Globant wordmark (for dark surfaces)
const ENG_LOGO = pngURI("engineering-logo.png");      // "Engineering" lockup (purple marks + wordmark)
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let PAGE = 0, TOTAL = 0;
const pageNo = () => `<div class="bp-pageno"><b>${String((PAGE += 1)).padStart(2, "0")}</b> / ${TOTAL}</div>`;
const conf = () => `<div class="bp-conf">Globant proprietary | Confidential information</div>`;

function frameSVG(stroke = "#00292e") {
  const corner = (x, y, sx, sy) => `<path d="M ${x} ${y + sy * 22} L ${x} ${y} L ${x + sx * 22} ${y}" fill="none" stroke="${stroke}" stroke-width="1.6"/>`;
  return `<svg class="bp-frame" viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="20" y="20" width="1240" height="680" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.55"/>
    ${corner(34, 34, 1, 1)}${corner(1246, 34, -1, 1)}${corner(34, 686, 1, -1)}${corner(1246, 686, -1, -1)}
    <rect x="628" y="694" width="24" height="12" fill="none" stroke="${stroke}" stroke-width="1.2"/>
  </svg>`;
}

// Authentic "Engineering" sub-brand lockup extracted from the PPTX.
const engLogo = (h = 30) => `<img class="bp-englogo" style="height:${h}px" src="${ENG_LOGO}" alt="Engineering">`;

// Top header band: navy bar, two-tier title left, green logo right
const band = (eyebrow, main) => `<div class="bp-band">
  <div class="bp-band__ttl"><div class="bp-band__eyebrow">${esc(eyebrow)}</div><div class="bp-band__main">${esc(main)}</div></div>
  <img class="bp-band__logo" src="${LOGO_BRAND_REV}" alt="Globant">
</div>`;

// ---------- Slide types ----------
function cover() {
  return `<section class="slide bp bp-cover" aria-label="cover">
    ${frameSVG()}${pageNo()}
    <div style="margin-bottom:34px">${engLogo(34)}</div>
    <div class="bp-cover__eyebrow">Tech Talks · Engineering</div>
    <h1 class="bp-cover__title">Head title of one / two lines here</h1>
    <div class="bp-cover__rule"></div>
    <p class="bp-cover__sub">Secondary title goes here</p>
    <div class="bp-cover__meta"><b>GLOBANT</b> &nbsp;//&nbsp; Mar 2026</div>
  </section>`;
}

function divider() {
  return `<section class="slide bp bp-div" aria-label="divider">
    ${frameSVG()}${pageNo()}${conf()}
    <img class="bp-logo" src="${LOGO_BRAND}" alt="Globant">
    <div class="bp-div__no">01</div>
    <div class="bp-div__eyebrow">Section</div>
    <h2 class="bp-div__title">The operator's journey</h2>
    <div class="bp-div__rule"></div>
  </section>`;
}

function index() {
  const items = [
    "The mirror", "Rung 2 — Supervisor",
    "Agent = Model + Harness", "Rung 3 — Orchestrator",
    "The operator's journey", "Rung 4 — Operator",
    "Rung 1 — Prompter", "From prompting to operating",
  ];
  const rows = items.map((t, i) => `<div class="bp-index__row"><span class="bp-index__n">${i + 1}.</span><span class="bp-index__label">${esc(t)}</span></div>`).join("");
  return `<section class="slide bp bp-card has-band" aria-label="index">
    ${frameSVG()}${band("Presentation title", "Index")}${pageNo()}${conf()}
    <div class="bp-index__grid">${rows}</div>
  </section>`;
}

// A content slide using the corporate band + two-tier title, blueprint body
function content() {
  const paras = [
    ["1", "The harness is the operating environment", "Context, tools, memory, permissions, and runtime define what the model can actually do."],
    ["2", "A model produces tokens; an agent produces actions", "The difference is not intelligence — it is runtime."],
    ["3", "Every rung moves work out of the human", "Each failure on one rung becomes the design requirement for the next."],
    ["4", "The spec is the new keyboard", "The unit of engineering changed from prompt to specification."],
  ];
  const grid = paras.map(([n, h, b]) => `<div class="bp-cardp" style="grid-template-columns:auto 1fr;display:grid;gap:14px;align-items:start">
    <span class="bp-index__n" style="min-width:auto">${n}</span>
    <div><b style="font-size:18px">${esc(h)}</b><p style="margin:6px 0 0;font-size:15px;line-height:1.4;color:var(--muted)">${esc(b)}</p></div>
  </div>`).join("");
  return `<section class="slide bp bp-card has-band" aria-label="content">
    ${frameSVG()}${band("Presentation title", "Main title")}${pageNo()}${conf()}
    <div class="bp-cards" style="grid-auto-flow:row;grid-template-columns:1fr 1fr;margin-top:6px">${grid}</div>
  </section>`;
}

function thanks() {
  // Navy full-bleed closer, mirroring the corporate last slide: Engineering
  // lockup on a white circle-panel, white Globant wordmark, "Thank you".
  return `<section class="slide bp bp-thanks is-dark" aria-label="thanks">
    ${frameSVG("#8fb98a")}${pageNo()}
    <div class="bp-thanks__eng"><span class="bp-eng-panel">${engLogo(34)}</span></div>
    <div class="bp-thanks__msg">Thank <b>you</b></div>
    <img class="bp-thanks__logo" src="${LOGO_WHITE}" alt="Globant">
  </section>`;
}

function main() {
  const outArg = process.argv.indexOf("--out");
  const out = outArg >= 0 ? process.argv[outArg + 1] : "build/test-template.html";
  const makers = [cover, divider, index, content, thanks];
  TOTAL = makers.length; PAGE = 0;
  const slides = makers.map((f) => f()).join("\n");
  const css = fs.readFileSync(THEME, "utf8");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Theme test — Globant Tech Talks × blueprint</title>
<style>${css}</style></head><body><main class="deck">
${slides}
</main></body></html>`;
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`Wrote ${out} — ${makers.length} test slides`);
}
main();
