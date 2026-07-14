#!/usr/bin/env node
/*
 * build-deck.mjs — compile designer-ready YAML slide specs into one editable
 * HTML deck, using the Harness Talk theme.
 *
 *   node scripts/build-deck.mjs specs --out build/harness-talk.html [--min-status "ready for design"]
 *
 * Each slide's `chart_or_diagram` names a motif the generator knows how to
 * render (equation, ladder, responsibility_ring, bar_chart, ...). Speaker
 * notes are emitted outside the printable slide, and the full spec is embedded
 * as JSON for round-tripping back to the source.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.join(HERE, "..", "theme", "harness-theme.css");

const STATUS_RANK = {
  draft: 0,
  "needs data": 1,
  "ready for design": 2,
  designed: 3,
  reviewed: 4,
};

// ---------- args ----------
function parseArgs(argv) {
  const opts = { specsDir: "specs", out: "build/harness-talk.html", minStatus: null };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--min-status") opts.minStatus = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node build-deck.mjs <specsDir> --out <file.html> [--min-status <status>]");
      process.exit(0);
    } else rest.push(a);
  }
  if (rest[0]) opts.specsDir = rest[0];
  return opts;
}

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const rank = (status) => STATUS_RANK[String(status ?? "").trim().toLowerCase()] ?? 0;

function loadDeckMeta(specsDir) {
  for (const p of [path.join(specsDir, "deck.yaml"), path.join(specsDir, "..", "deck.yaml")]) {
    if (fs.existsSync(p)) return parseYaml(fs.readFileSync(p, "utf8")).deck ?? {};
  }
  return {};
}

function loadSections(specsDir) {
  const files = fs
    .readdirSync(specsDir)
    .filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml")
    .sort();
  const out = [];
  for (const f of files) {
    const doc = parseYaml(fs.readFileSync(path.join(specsDir, f), "utf8")) || {};
    if (Array.isArray(doc.slides) && doc.slides.length) {
      out.push({ file: f, section: doc.section ?? {}, slides: doc.slides });
    }
  }
  return out;
}

// ---------- motif renderers ----------
// Motifs that render the headline themselves (so we skip the separate <h1>).
const HEADLINE_MOTIFS = new Set(["equation", "formula"]);

function renderEquation(slide) {
  const main = esc(slide.on_slide_headline).replace(/ = /g, ' <span class="op">=</span> ').replace(/ \+ /g, ' <span class="op">+</span> ');
  const terms = asList(slide.data_required?.terms).map((t) => `<li>${esc(t)}</li>`).join("");
  return `<div class="equation"><div class="equation__main mono">${main}</div>${terms ? `<ul class="equation__terms">${terms}</ul>` : ""}</div>`;
}

function renderFormula(slide) {
  const main = esc(slide.on_slide_headline).replace(/ = /g, ' <span class="op">=</span> ').replace(/ (×|x|\*) /g, ' <span class="op">×</span> ');
  const note = asList(slide.on_slide_body)[0];
  return `<div><div class="formula mono">${main}</div>${note ? `<div class="formula__note">${esc(note)}</div>` : ""}</div>`;
}

function renderTwoBoxes(slide) {
  const boxes = asList(slide.data_required?.boxes)
    .map(
      (b) =>
        `<div class="box"><span class="box__label">${esc(b.label)}</span><span class="box__arrow">${esc(b.arrow ?? "→")}</span><span class="box__result mono">${esc(b.result)}</span></div>`
    )
    .join("");
  return `<div class="two-boxes">${boxes}</div>`;
}

function renderRing(slide) {
  const d = slide.data_required ?? {};
  const held = String(d.held_by ?? "harness");
  const items = asList(d.items).map((i) => `<li class="chip">${esc(i)}</li>`).join("");
  return `<div class="ring"><div class="ring__center">${esc(d.center ?? "Model")}</div><ul class="ring__items ring__items--${esc(held)}">${items}</ul></div>`;
}

function renderCapabilityLayer(slide) {
  const layers = asList(slide.data_required?.layers).map((l) => `<li>${esc(l)}</li>`).join("");
  return `<ul class="layer-stack">${layers}</ul>`;
}

function renderMappingTable(slide) {
  const rows = asList(slide.data_required?.rows)
    .map((r) => `<tr><td class="mapping__metaphor">${esc(r.metaphor)}</td><td class="mapping__tech">${esc(r.technical)}</td></tr>`)
    .join("");
  return `<table class="mapping"><caption>Metaphor → Technical</caption>${rows}</table>`;
}

function renderLadder(slide) {
  const d = slide.data_required ?? {};
  const current = d.current == null ? "" : String(d.current).toLowerCase();
  const rungs = asList(d.rungs)
    .map((r, i) => {
      const isCur = String(r).toLowerCase() === current;
      return `<li class="rung${isCur ? " is-current" : ""}"><span class="rung__index mono">Rung ${i + 1}</span>${esc(r)}</li>`;
    })
    .join("");
  const cap = d.caption ? `<p class="ladder-caption">${esc(d.caption)}</p>` : "";
  return `<div style="width:100%"><ol class="ladder">${rungs}</ol>${cap}</div>`;
}

function renderChecklist(slide) {
  const d = slide.data_required ?? {};
  const missing = String(d.state ?? "").toLowerCase() === "missing";
  const items = asList(d.items)
    .map((i) => `<li class="check"><span class="check__mark"></span><span>${esc(i)}</span></li>`)
    .join("");
  return `<ul class="checklist${missing ? " checklist--missing" : ""}">${items}</ul>`;
}

function renderArrowFlow(slide) {
  const steps = asList(slide.data_required?.steps);
  const nodes = steps
    .map((s, i) => {
      const node = `<span class="flow__node${i === steps.length - 1 ? " flow__node--to" : ""}">${esc(s)}</span>`;
      return i < steps.length - 1 ? `${node}<span class="flow__arrow">→</span>` : node;
    })
    .join("");
  return `<div class="flow">${nodes}</div>`;
}

function renderBarChart(slide) {
  const chart = slide.chart ?? {};
  const data = asList(chart.data);
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const values = data.map((d) => Number(d.value) || 0);
  const maxV = Math.max(...values);
  const secondV = Math.max(...values.filter((v) => v !== maxV));
  const bars = data
    .map((d) => {
      const v = Number(d.value) || 0;
      let cls = "";
      if (v === maxV) cls = " bar--hi";
      else if (v === secondV) cls = " bar--blue";
      const h = Math.round((v / max) * 100);
      return `<div class="bar${cls}"><span class="bar__val">${esc(d.value)}${esc(d.unit ?? "")}</span><div class="bar__col" style="height:${h}%"></div><span class="bar__label">${esc(d.label)}</span></div>`;
    })
    .join("");
  const ann = asList(chart.annotations).map((a) => `<li>${esc(a)}</li>`).join("");
  const chartBlock = `<figure class="chart"><div class="chart__axis">${esc(chart.y_axis ?? "")}</div><div class="chart__bars">${bars}</div><div class="chart__axis">${esc(chart.x_axis ?? "")}</div><figcaption>Source: ${esc(chart.source_note ?? "—")}</figcaption></figure>`;
  const side = `<div class="proof__side"><p class="proof__claim">${esc(chart.claim ?? slide.audience_takeaway ?? "")}</p>${ann ? `<ul class="proof__annotations">${ann}</ul>` : ""}</div>`;
  return chartBlock + side;
}

const MOTIFS = {
  equation: renderEquation,
  formula: renderFormula,
  two_boxes: renderTwoBoxes,
  responsibility_ring: renderRing,
  capability_layer: renderCapabilityLayer,
  mapping_table: renderMappingTable,
  ladder: renderLadder,
  checklist: renderChecklist,
  arrow_flow: renderArrowFlow,
  bar_chart: renderBarChart,
};

function renderStage(slide) {
  const key = String(slide.chart_or_diagram ?? "none").trim();
  const fn = MOTIFS[key];
  return fn ? fn(slide) : "";
}

// Illustration placeholder — turns the empty column of a metaphor slide into
// explicit art direction a designer can execute (from visual_elements + refs).
function assetPlaceholder(slide) {
  const els = asList(slide.visual_elements).map((e) => `<li>${esc(e)}</li>`).join("");
  const refs = asList(slide.asset_references);
  const src = refs.length ? `<p class="asset-frame__src">Ref: ${esc(refs.join("; "))}</p>` : "";
  return `<figure class="asset-frame" contenteditable="false"><div class="asset-frame__tag">Illustration</div><ul class="asset-frame__els">${els}</ul>${src}</figure>`;
}

// ---------- slide + notes ----------
function renderNotes(slide) {
  const row = (label, val) => (val == null || val === "" ? "" : `<dt>${esc(label)}</dt><dd>${esc(val)}</dd>`);
  const constraints = asList(slide.designer_constraints);
  return `<aside class="slide-notes" contenteditable="false">
  <h3>Speaker &amp; production notes · ${esc(slide.slide_id)}</h3>
  <dl>
    ${row("Type", slide.slide_type)}
    ${row("Duration", slide.duration)}
    ${row("Narrative role", slide.narrative_role)}
    ${row("Takeaway", slide.audience_takeaway)}
    ${row("Speaker says", slide.speaker_note)}
    ${constraints.length ? `<dt>Constraints</dt><dd>${constraints.map(esc).join("; ")}</dd>` : ""}
    ${row("Accessibility", slide.accessibility_note)}
    <dt>Status</dt><dd class="status">${esc(slide.status)}</dd>
  </dl>
</aside>`;
}

function renderSlide(slide) {
  const type = String(slide.slide_type ?? "definition").trim();
  const motif = String(slide.chart_or_diagram ?? "none").trim();
  const label = `${slide.slide_id ?? ""} — ${slide.slide_title ?? ""}`.trim();

  const chrome =
    type === "hook"
      ? ""
      : `<header class="slide__chrome" contenteditable="false"><span class="chrome__mark">${esc(slide.section ?? "")} · ${esc(slide.slide_id ?? "")}</span><span class="chrome__type">${esc(type)}</span></header>`;

  const headline = HEADLINE_MOTIFS.has(motif)
    ? ""
    : `<div class="slide__title-row"><h1>${esc(slide.on_slide_headline)}</h1></div>`;

  const bodyLines = HEADLINE_MOTIFS.has(motif)
    ? ""
    : asList(slide.on_slide_body).map((b) => `<p class="slide__body">${esc(b)}</p>`).join("");

  let stage = renderStage(slide);
  if (type === "metaphor") stage = assetPlaceholder(slide) + stage;
  const stageBlock = stage ? `<div class="slide__stage">${stage}</div>` : "";

  const spec = `<script type="application/json" class="slide-spec">${JSON.stringify(slide).replace(/</g, "\\u003c")}</script>`;

  return `<div class="slide-wrap">
  <section class="slide slide--${esc(type)}" contenteditable="true" spellcheck="true" aria-label="${esc(label)}">
    ${chrome}
    ${headline}
    ${bodyLines}
    ${stageBlock}
  </section>
  ${renderNotes(slide)}
  ${spec}
</div>`;
}

// ---------- document ----------
function renderDocument({ deck, sections, css, minStatus, stats }) {
  const slidesHtml = sections
    .map((s) => s.slides.map(renderSlide).join("\n"))
    .join("\n");

  const meta = {
    title: deck.title ?? "Slide Deck",
    subtitle: deck.subtitle ?? "",
    audience: deck.audience ?? "",
    date: deck.date ?? "",
    visual_system: deck.visual_system ?? "",
    source: deck.source ?? [],
    core_phrases: deck.core_phrases ?? [],
    generated: new Date().toISOString(),
    min_status: minStatus,
    rendered_slides: stats.rendered,
    skipped_slides: stats.skipped,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)} — ${esc(meta.subtitle)}</title>
<!-- Deck front matter -->
<script type="application/json" id="deck-metadata">${JSON.stringify(meta, null, 2).replace(/</g, "\\u003c")}</script>
<style>
${css}
</style>
</head>
<body>
<aside class="edit-toolbar" contenteditable="false">
  <p><strong>${esc(meta.title)}</strong> — editable deck. Click slide text to revise. Save with File → Save Page As… → Webpage, Complete. Speaker notes are screen-only and hidden in print/PDF.</p>
  <p>${stats.rendered} slides · gate ≥ “${esc(minStatus)}”${stats.skipped ? ` · ${stats.skipped} below gate` : ""}</p>
</aside>
<main class="deck">
${slidesHtml}
</main>
</body>
</html>
`;
}

// ---------- main ----------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(opts.specsDir)) throw new Error(`Specs dir not found: ${opts.specsDir}`);

  const deck = loadDeckMeta(opts.specsDir);
  const minStatus = (opts.minStatus ?? deck.min_status ?? "ready for design").trim();
  const gate = rank(minStatus);
  const css = fs.readFileSync(THEME, "utf8");

  const rawSections = loadSections(opts.specsDir);
  const stats = { rendered: 0, skipped: 0, skippedList: [] };

  const sections = rawSections.map((s) => {
    const kept = s.slides.filter((slide) => {
      const ok = rank(slide.status) >= gate;
      if (!ok) {
        stats.skipped += 1;
        stats.skippedList.push(`${slide.slide_id} (${slide.status ?? "no status"})`);
      }
      return ok;
    });
    stats.rendered += kept.length;
    return { ...s, slides: kept };
  }).filter((s) => s.slides.length);

  const html = renderDocument({ deck, sections, css, minStatus, stats });
  fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
  fs.writeFileSync(opts.out, html);

  // Build report
  console.log(`✔ Deck: ${deck.title ?? "(untitled)"} — ${deck.subtitle ?? ""}`);
  console.log(`  Status gate: ≥ "${minStatus}"`);
  for (const s of sections) {
    console.log(`  §${s.section.section_id ?? "?"} ${s.section.section_title ?? s.file}: ${s.slides.length} slide(s)`);
  }
  console.log(`  Rendered ${stats.rendered} slide(s); skipped ${stats.skipped} below gate${stats.skipped ? `: ${stats.skippedList.join(", ")}` : ""}`);
  console.log(`  Wrote ${opts.out}`);
}

try {
  main();
} catch (err) {
  console.error(`build-deck failed: ${err.message}`);
  process.exit(1);
}
