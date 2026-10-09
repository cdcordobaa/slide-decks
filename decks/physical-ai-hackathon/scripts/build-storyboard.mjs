#!/usr/bin/env node
/*
 * build-storyboard.mjs: render the card manifest (cards/*.yaml) into a review
 * sheet to go through BEFORE anything is built or generated. Same model as
 * decks/harness-talk/scripts/build-storyboard.mjs, plus what this deck needs:
 * a 16:9 frame sketch per slide (real screenshots for full-bleed frames and
 * swaps, a placeholder for Gemini infographics), the overlay numbers with
 * their status colour and fact id, honest lines, gates, the D path and the
 * time budget. No API calls.
 *
 *   node scripts/build-storyboard.mjs cards --out build/storyboard.html
 */
import fs from "node:fs";
import path from "node:path";
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

const loadYaml = (p) => parseYaml(fs.readFileSync(p, "utf8")) || {};
function loadSections(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && f !== "deck.yaml")
    .sort()
    .map((f) => {
      const doc = loadYaml(path.join(dir, f));
      return { section: doc.section ?? {}, cards: doc.cards ?? [] };
    })
    .filter((s) => s.cards.length);
}

const onPath = (c) => String(c.path ?? "on") !== "D";
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Paths in the cards are relative to the deck folder; the sheet lives in build/.
function rel(out, src) {
  return path.relative(path.dirname(path.resolve(out)), path.resolve(src)).split(path.sep).join("/");
}

function frameSketch(card, out, dir) {
  const v = card.visual ?? {};
  const head = `<div class="fr__h">${esc(card.title)}</div>`;
  if (v.kind === "frame") {
    return `<div class="fr fr--img" style="background-image:url('${esc(rel(out, v.src))}')"><div class="fr__shade"></div>${head}</div>`;
  }
  if (v.kind === "swap") {
    return `<div class="fr fr--swap"><div style="background-image:url('${esc(rel(out, v.before))}')"><span>BEFORE</span></div><div style="background-image:url('${esc(rel(out, v.after))}')"><span>AFTER</span></div></div>`;
  }
  if (v.kind === "image") {
    const asset = path.join(dir, "..", "assets", "gen", `${v.ref}.png`);
    if (fs.existsSync(asset)) return `<div class="fr fr--img" style="background-image:url('${esc(rel(out, asset))}')"></div>`;
    const labels = (v.labels ?? []).map((l) => `<i>${esc(l)}</i>`).join("");
    return `<div class="fr fr--gen"><b>${esc(v.ref)}</b><span>Gemini infographic · not generated</span>${labels ? `<div class="fr__labels">${labels}</div>` : ""}<em>empty for overlay: ${esc(v.keep_empty ?? "")}</em></div>`;
  }
  if (v.kind === "video") {
    return `<div class="fr fr--img" style="background-image:url('${esc(rel(out, v.poster ?? ""))}')"><span class="fr__play">▶ VIDEO · ${esc(path.basename(v.src ?? ""))}</span></div>`;
  }
  if (v.kind === "media") {
    const slots = (v.slots ?? []).map((m) => `<div class="slot slot--${esc(m.kind)}"><b>${m.kind === "splat" ? "⟲" : "▶"}</b><span>${esc(m.label)}</span></div>`).join("");
    return `<div class="fr fr--media">${slots}</div>`;
  }
  if (v.kind === "chart") return `<div class="fr fr--plain"><b>${esc((v.chart ?? "chart").toUpperCase())}</b><span>coded chart · exact numbers</span></div>`;
  if (v.kind === "map") return `<div class="fr fr--plain"><b>PLANT MAP</b><span>the round completes</span></div>`;
  return `<div class="fr fr--plain"><b>${esc((v.kind ?? "layout").toUpperCase())}</b><span>${esc(v.note ?? "")}</span></div>`;
}

function visualTag(card, dir) {
  const v = card.visual ?? {};
  if (v.kind === "image") {
    const done = fs.existsSync(path.join(dir, "..", "assets", "gen", `${v.ref}.png`));
    return `<div class="vis__tag">🖼 ${esc(v.ref)} · Gemini · <span class="${done ? "ok" : "wait"}">${done ? "✓ generated" : "◻ not generated"}</span></div>`;
  }
  const names = { video: "▶ video · existing file", media: "▶ video + ⟲ interactive splat · slots", chart: "▤ coded chart · exact numbers, no Gemini", frame: "📷 full-bleed frame · existing screenshot", swap: "⇄ before/after swap · existing screenshots", map: "▦ plant map · coded", cards: "▦ lesson cards · coded" };
  return `<div class="vis__tag">${names[v.kind] ?? esc(v.kind ?? "no visual")}</div>`;
}

function overlayList(card) {
  if (!card.overlay?.length) return "";
  return `<ul class="ov">${card.overlay
    .map((o) => `<li class="st-${esc(o.status ?? "claim")}"><b>${esc(o.n)}</b><span>${esc(o.label)}${o.status === "estimate" ? " <u>est.</u>" : ""}</span>${o.fact ? `<code>${esc(o.fact)}</code>` : ""}</li>`)
    .join("")}</ul>`;
}

function row(card, out, dir) {
  const v = card.visual ?? {};
  const badges = [
    onPath(card) ? `<span class="b b--t">${card.time ?? 0} s</span>` : `<span class="b b--d">D · if asked</span>`,
    card.gate ? `<span class="b b--g">GATE · ${esc(card.gate)}</span>` : "",
    card.type ? `<span class="b">${esc(card.type)}</span>` : "",
  ].join("");
  const brief = v.kind === "image" ? `<div class="vis__brief">${esc((v.brief ?? "").trim())}</div>` : v.note ? `<div class="vis__note">${esc(v.note)}</div>` : "";
  const shots = (v.shots ?? []).map((src) => `<div class="shot" style="background-image:url('${esc(rel(out, src))}')" title="${esc(src)}"></div>`).join("");
  const wanted = (v.wanted ?? []).map((w) => `<div class="shot shot--want" title="requested">${esc(w)}</div>`).join("");
  const strip = shots || wanted ? `<div class="vis__shots-h">Real screenshots on the slide</div><div class="vis__shots">${shots}${wanted}</div>` : "";
  const slots = (v.slots ?? []).map((m) => `<div class="vis__note"><b>${esc(m.label)}:</b> ${esc(m.detail)}</div>`).join("");
  const backup = v.backup?.length ? `<div class="vis__bk">D → ${v.backup.map(esc).join(" · ")}</div>` : "";
  const more = [
    card.speaker ? `<div><b>Say:</b> ${esc(card.speaker)}</div>` : "",
    card.options ? `<div><b>Option:</b> ${esc(card.options)}</div>` : "",
    card.credits ? `<div><b>Credits:</b> ${esc(card.credits)}</div>` : "",
    card.honest_facts ? `<div><b>Honest-line facts:</b> <code>${card.honest_facts.map(esc).join(" · ")}</code></div>` : "",
  ].join("");
  return `<article class="row${onPath(card) ? "" : " row--d"}" id="s${esc(card.id)}">
    <div class="row__visual">${frameSketch(card, out, dir)}${visualTag(card, dir)}${brief}${slots}${strip}${backup}</div>
    <div class="row__meta">
      <div class="row__head"><span class="pill">${esc(card.status ?? "draft")}</span><span class="row__id">${esc(card.id)} · ${esc(card.name ?? "")}</span>${badges}</div>
      <h3 class="row__title">${esc(card.title)}</h3>
      ${card.subtitle ? `<p class="row__content">${esc(card.subtitle)}</p>` : ""}
      ${overlayList(card)}
      ${card.honest ? `<p class="row__honest">⚑ ${esc(card.honest)}</p>` : ""}
      ${[...(card.review ?? []), ...(v.review ?? [])].map((r) => `<p class="row__review">✎ ${esc(r)}</p>`).join("")}
      ${card.takeaway ? `<p class="row__take">▸ ${esc(card.takeaway)}</p>` : ""}
      ${more ? `<details class="row__more"><summary>speaker notes · facts</summary>${more}</details>` : ""}
    </div>
  </article>`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cfg = loadYaml(path.join(opts.dir, "deck.yaml"));
  const deck = cfg.deck ?? {};
  const art = cfg.art ?? {};
  const sections = loadSections(opts.dir);
  const all = sections.flatMap((s) => s.cards);
  const on = all.filter(onPath);
  const secs = on.reduce((n, c) => n + (c.time ?? 0), 0);
  const imgs = all.filter((c) => c.visual?.kind === "image");
  const imgDone = imgs.filter((c) => fs.existsSync(path.join(opts.dir, "..", "assets", "gen", `${c.visual.ref}.png`))).length;
  const reviews = all.reduce((n, c) => n + (c.review?.length ?? 0) + (c.visual?.review?.length ?? 0), 0);
  const wantedN = all.reduce((n, c) => n + (c.visual?.wanted?.length ?? 0), 0);
  const frames = all.filter((c) => ["frame", "swap"].includes(c.visual?.kind)).length;

  const strip = sections
    .map((s) => {
      const t = s.cards.filter(onPath).reduce((n, c) => n + (c.time ?? 0), 0);
      const cells = s.cards.map((c) => `<a href="#s${esc(c.id)}" class="${onPath(c) ? "" : "d"}" title="${esc(c.name)}" style="flex:${onPath(c) ? Math.max(c.time ?? 0, 8) : 6}">${esc(c.id)}</a>`).join("");
      return `<div class="act"><div class="act__h">${esc(s.section.id)} · ${esc(s.section.title)} <span>${mmss(t)}</span></div><div class="act__cells">${cells}</div></div>`;
    })
    .join("");

  const body = sections
    .map((s) => `<section class="sec"><h2 class="sec__title">Act ${esc(s.section.id)} · ${esc(s.section.title)}</h2><p class="sec__goal">${esc(s.section.goal ?? "")}</p>${s.cards.map((c) => row(c, opts.out, opts.dir)).join("")}</section>`)
    .join("");

  const briefs = imgs
    .map((c) => `<tr><td><b>${esc(c.visual.ref)}</b><br><a href="#s${esc(c.id)}">${esc(c.id)} · ${esc(c.name)}</a></td><td>${esc((c.visual.brief ?? "").trim())}</td><td>${(c.visual.labels ?? []).map(esc).join(", ") || "none"}</td><td>${esc(c.visual.keep_empty ?? "")}</td></tr>`)
    .join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard · ${esc(deck.title ?? "Deck")}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root { --ink:#1c2530; --muted:#6b7684; --line:#e3e7ee; --accent:#1F7A3D; --paper:#f6f7f9;
          --m:#5E7A00; --mbg:#F1F7D6; --s:#0B6E99; --sbg:#E3F3FB; --e:#B45309; --ebg:#FDF1E1; --night:#0A0E13; --lime:#BFD732; }
  * { box-sizing:border-box; } body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.5 Inter,system-ui,sans-serif; }
  .wrap { max-width:1180px; margin:0 auto; padding:36px 28px 80px; }
  .head h1 { margin:0 0 6px; font-size:28px; } .head p { margin:0; color:var(--muted); }
  .core { margin:14px 0 0; font:italic 22px/1.3 "Instrument Serif",serif; }
  .counts { display:flex; gap:10px; flex-wrap:wrap; margin:16px 0 8px; }
  .count { background:#fff; border:1px solid var(--line); border-radius:8px; padding:8px 14px; font-size:13px; }
  .count b { font-size:18px; display:block; } .count--spend { border-color:#f0c36d; background:#fff8e8; }
  .count--over { border-color:#e5a3a3; background:#fdeeee; }
  .rules { background:#fff; border:1px solid var(--line); border-radius:10px; padding:12px 18px; margin:14px 0; font-size:13.5px; }
  .rules li { margin:3px 0; } .legend span { display:inline-block; margin-right:14px; font-size:12.5px; }
  .legend i { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:-1px; }
  .strip { display:flex; gap:8px; margin:18px 0 6px; } .act { flex:1; min-width:0; }
  .act__h { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .act__h span { color:var(--ink); } .act__cells { display:flex; gap:3px; }
  .act__cells a { background:var(--night); color:var(--lime); text-decoration:none; font:500 11px "JetBrains Mono"; text-align:center; padding:6px 0; border-radius:4px; }
  .act__cells a.d { background:#dfe3ea; color:var(--muted); }
  .sec__title { margin:38px 0 4px; font-size:15px; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent); border-bottom:1px solid var(--line); padding-bottom:8px; }
  .sec__goal { margin:0 0 14px; color:var(--muted); font-size:14px; }
  .row { display:grid; grid-template-columns:400px 1fr; gap:22px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:18px; margin-bottom:14px; }
  .row--d { background:#fbfbfc; border-style:dashed; }
  .row__visual { border-right:1px dashed var(--line); padding-right:20px; min-width:0; }
  .fr { aspect-ratio:16/9; border-radius:8px; overflow:hidden; position:relative; background:var(--night); margin-bottom:10px; }
  .fr--img { background-size:cover; background-position:center; }
  .fr__shade { position:absolute; inset:0; background:linear-gradient(90deg,rgba(7,9,11,.88),rgba(7,9,11,.15) 80%); }
  .fr__h { position:absolute; left:14px; bottom:12px; right:30%; color:#F3F1EA; font:20px/1.05 "Instrument Serif",serif; }
  .fr__play { position:absolute; left:10px; bottom:10px; font:500 11px "JetBrains Mono"; background:var(--lime); color:var(--night); padding:3px 8px; border-radius:3px; }
  .fr--media { display:grid; grid-template-columns:2fr 1fr; gap:4px; padding:4px; }
  .slot { border:1.5px dashed #34465A; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:#C4CED8; text-align:center; padding:6px; font-size:11px; }
  .slot b { color:var(--lime); font-size:26px; }
  .vis__shots-h { margin-top:10px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--muted); }
  .vis__shots { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:4px; }
  .shot { aspect-ratio:16/10; border-radius:5px; background-size:cover; background-position:center; border:1px solid var(--line); }
  .shot--want { border:1.5px dashed #c47f1a; background:#fff8e8; color:#8a5a00; font-size:10.5px; line-height:1.25; padding:5px; display:flex; align-items:center; }
  .row__review { margin:6px 0; font-size:13px; color:#8f1d1d; background:#fdeeee; border-radius:6px; padding:6px 10px; }
  .fr--swap { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
  .fr--swap div { background-size:cover; background-position:center; position:relative; }
  .fr--swap span { position:absolute; left:6px; top:6px; font:500 10px "JetBrains Mono"; background:rgba(10,14,19,.85); color:#fff; padding:2px 6px; }
  .fr--gen, .fr--plain { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:#8796A6; border:1.5px dashed #34465A; text-align:center; padding:10px; }
  .fr--gen b, .fr--plain b { color:var(--lime); font:500 22px "JetBrains Mono"; }
  .fr--gen span, .fr--plain span { font-size:12px; } .fr--gen em { font-size:11px; color:#5B6B7B; }
  .fr__labels { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin:4px 0; }
  .fr__labels i { font:500 10px "JetBrains Mono"; font-style:normal; color:#EAF0F4; border:1px solid #34465A; padding:2px 6px; border-radius:3px; }
  .vis__tag { font-size:12px; font-weight:700; margin-bottom:6px; } .vis__tag .ok { color:#2a9d6f; } .vis__tag .wait { color:#c47f1a; }
  .vis__brief { font-size:12.5px; color:#4a5563; font-style:italic; background:#f6f4ff; border:1px solid #e2ddfb; border-radius:6px; padding:8px 10px; }
  .vis__note { font-size:12.5px; color:var(--muted); }
  .vis__bk { margin-top:8px; font:500 11.5px "JetBrains Mono"; color:var(--muted); }
  .row__head { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px; }
  .row__id { font-size:12px; color:var(--muted); font-family:ui-monospace,Menlo,monospace; }
  .pill { font-size:11px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:#eef1f5; color:#6b7684; }
  .b { font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px; background:#eef1f5; color:#4a5563; }
  .b--t { background:var(--night); color:var(--lime); } .b--d { background:#dfe3ea; color:#4a5563; } .b--g { background:#FFF4D6; color:#8a5a00; }
  .row__title { margin:2px 0 6px; font:26px/1.12 "Instrument Serif",serif; }
  .row__content { margin:0 0 8px; color:#3a4553; }
  .ov { list-style:none; margin:8px 0; padding:0; display:grid; gap:6px; }
  .ov li { display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:baseline; border-left:4px solid; padding:5px 10px; border-radius:4px; font-size:13.5px; }
  .ov li b { font-weight:700; max-width:230px; } .ov li code { font-size:11px; color:var(--muted); max-width:190px; text-align:right; }
  .ov u { text-decoration:none; font-weight:700; color:var(--e); }
  .st-measured { border-color:var(--lime) !important; background:var(--mbg); } .st-measured b { color:var(--m); }
  .st-sourced { border-color:#7DD3FC !important; background:var(--sbg); } .st-sourced b { color:var(--s); }
  .st-estimate { border-color:#F5B841 !important; background:var(--ebg); } .st-estimate b { color:var(--e); }
  .st-claim { border-color:#c9d0da !important; background:#f3f5f8; }
  .row__honest { margin:6px 0; font-size:13.5px; color:#7a4a00; background:#fff8e8; border-radius:6px; padding:6px 10px; }
  .row__take { margin:6px 0 0; font-weight:650; }
  .row__more { margin-top:8px; font-size:12.5px; color:var(--muted); } .row__more summary { cursor:pointer; color:var(--accent); }
  .row__more div { margin:6px 0; }
  table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); font-size:13px; }
  th, td { text-align:left; vertical-align:top; padding:8px 10px; border-bottom:1px solid var(--line); }
  th { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
  .style { background:var(--night); color:#C4CED8; border-radius:8px; padding:12px 16px; font:12.5px/1.5 "JetBrains Mono"; }
  @media (max-width:820px) { .row { grid-template-columns:1fr; } .row__visual { border-right:0; padding-right:0; } .strip { flex-direction:column; } }
  @media print { body { background:#fff; } .row { break-inside:avoid; } }
</style></head>
<body><div class="wrap">
  <div class="head"><h1>Storyboard · ${esc(deck.title ?? "Deck")}</h1>
    <p>${esc(deck.subtitle ?? "")}</p>
    <p class="core">${esc(deck.core_line ?? "")}</p></div>
  <div class="counts">
    <div class="count"><b>${on.length}</b> slides on screen</div>
    <div class="count"><b>${all.length - on.length}</b> behind D</div>
    <div class="count ${secs > (deck.budget_seconds ?? 420) ? "count--over" : ""}"><b>${mmss(secs)}</b> of ${mmss(deck.budget_seconds ?? 420)} talk</div>
    <div class="count"><b>${frames}</b> full-bleed / swap / video</div>
    <div class="count"><b>${wantedN}</b> screenshots requested</div>
    <div class="count count--over"><b>${reviews}</b> points to review</div>
    <div class="count count--spend"><b>${imgs.length - imgDone}</b> Gemini images to generate</div>
    <div class="count"><b>${imgDone}</b> images done</div>
  </div>
  <div class="strip">${strip}</div>
  <div class="rules"><b>Spine:</b> ${esc(deck.spine ?? "")}<ul>${(deck.rules ?? []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    <div class="legend"><span><i style="background:var(--lime)"></i>measured</span><span><i style="background:#7DD3FC"></i>sourced</span><span><i style="background:#F5B841"></i>estimate (+ est.)</span><span><i style="background:#c9d0da"></i>claim / plan</span> · fact ids show here only, never on the slide</div></div>
  ${body}
  <section class="sec"><h2 class="sec__title">Gemini infographics · briefs (not generated)</h2>
    <p class="sec__goal">Gemini draws, the HTML writes the numbers. Model ${esc(art.model ?? "")}, ${esc(art.aspect ?? "16:9")}. Every prompt starts with the shared style:</p>
    <div class="style">${esc((art.style ?? "").trim())}</div>
    <table style="margin-top:14px"><tr><th style="width:150px">ID · slide</th><th>Picture</th><th style="width:170px">Labels allowed</th><th style="width:130px">Keep empty</th></tr>${briefs}</table>
  </section>
</div></body></html>`;

  fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
  fs.writeFileSync(opts.out, html);
  console.log(`Wrote ${opts.out}: ${all.length} slides (${on.length} on screen, ${mmss(secs)}), ${imgs.length - imgDone} images pending`);
}

try { main(); } catch (e) { console.error(`build-storyboard failed: ${e.message}`); process.exit(1); }
