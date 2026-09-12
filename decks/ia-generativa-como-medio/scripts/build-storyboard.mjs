#!/usr/bin/env node
// Storyboard (escaleta) del deck. Misma arquitectura que decks/harness-talk:
// las cards YAML son la fuente de verdad, esto es la vista de produccion.
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const DIR = "cards", OUT = "build/storyboard.html";
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

const deck = parseYaml(fs.readFileSync(path.join(DIR,"deck.yaml"),"utf8")) || {};
const secs = fs.readdirSync(DIR).filter(f=>/\.ya?ml$/.test(f) && f!=="deck.yaml").sort()
  .map(f => parseYaml(fs.readFileSync(path.join(DIR,f),"utf8"))||{})
  .filter(s => (s.cards||[]).length);
const all = secs.flatMap(s=>s.cards);

// ---- miniatura del wireframe, por arquetipo de composicion
const WF = {
  imagen_sangre:        '<div class="wf"><div class="wf-img"></div></div>',
  imagen_sangre_palabra:'<div class="wf"><div class="wf-img"><em>palabra</em></div></div>',
  imagen_sangre_frase:  '<div class="wf"><div class="wf-img"><em class="bl">frase</em></div></div>',
  tipografia_sola:      '<div class="wf wf-pap"><i></i><i></i><i class="s"></i></div>',
  tipografia_pico:      '<div class="wf wf-pap wf-pico"><i></i><i></i><i class="s"></i></div>',
  tipografia_invertida: '<div class="wf wf-dark"><i></i><i class="s"></i></div>',
  mitad_imagen_texto:   '<div class="wf wf-split"><div class="wf-img"></div><div class="wf-side"><i></i><i></i><i class="s"></i></div></div>',
  cifra_sobre_imagen:   '<div class="wf"><div class="wf-img q"><b>00%</b></div></div>',
  cifra_sola:           '<div class="wf wf-pap wf-ctr"><b>00%</b></div>',
  dos_bloques:          '<div class="wf wf-pap wf-ctr wf-row"><u></u><span>vs</span><u></u></div>',
  secuencia_3:          '<div class="wf wf-pap wf-ctr wf-row"><u></u><u></u><u></u></div>',
  cadena_5:             '<div class="wf wf-pap wf-ctr wf-chain">'+Array.from({length:9},(_,i)=>i%2?'<hr>':'<o></o>').join("")+'</div>',
  red:                  '<div class="wf wf-pap wf-ctr wf-net"><span>RED</span></div>',
};

function visual(c){
  const v = c.visual ?? {};
  if (v.kind === "image") {
    const png = path.join(DIR,"assets",`${c.id}.png`);
    const done = fs.existsSync(png);
    return `<div class="vis vis--img">
      <div class="vis__tag">IMAGEN · Gemini</div>
      <div class="vis__brief">${esc(v.brief)}</div>
      <div class="vis__state ${done?"ok":"wait"}">${done?"generada":"sin generar · costará una llamada a Gemini"}</div>
    </div>`;
  }
  if (v.kind && v.kind !== "none") {
    const bits = [];
    if (v.items) bits.push(`items: ${v.items.map(esc).join(" · ")}`);
    if (v.steps) bits.push(`pasos: ${v.steps.map(esc).join(" → ")}`);
    if (v.boxes) bits.push(...v.boxes.map(b=>`${esc(b.label)}: ${esc(b.result)}`));
    if (v.note)  bits.push(`nota: ${esc(v.note)}`);
    return `<div class="vis vis--dia">
      <div class="vis__tag">DIAGRAMA · ${esc(v.kind)} <span class="free">construido · gratis · inmediato</span></div>
      ${bits.map(b=>`<div class="vis__row">${b}</div>`).join("")}
    </div>`;
  }
  return `<div class="vis vis--none"><div class="vis__tag">SIN VISUAL</div>
    <div class="vis__row">solo tipografía</div></div>`;
}

const imgs = all.filter(c=>c.visual?.kind==="image");
const done = imgs.filter(c=>fs.existsSync(path.join(DIR,"assets",`${c.id}.png`))).length;
const dias = all.filter(c=>c.visual?.kind && !["image","none"].includes(c.visual.kind)).length;
const tipo = all.length - imgs.length - dias;

const argumento = `<div class="arg"><b>El argumento completo · las 20 ideas que se entregan, en orden</b>
<ol>${all.map(c=>`<li><span>${esc(c.id)}</span>${esc(c.entrega)}</li>`).join("")}</ol></div>`;

const rows = secs.map(s=>`<section class="sec">
  <h2>§${esc(s.section.id)} · ${esc(s.section.title)}
    <span class="sec__meta">${s.section.laminas} lámina${s.section.laminas===1?"":"s"} · ${esc(s.section.tiempo)}</span></h2>
  ${s.cards.map(c=>`<article class="row">
    <div class="col-wf">${WF[c.layout] ?? '<div class="wf wf-pap"></div>'}
      <div class="wf-lab">${esc(c.layout)}</div></div>
    <div class="col-vis">${visual(c)}</div>
    <div class="col-meta">
      <div class="head"><span class="pill pill--${esc(c.status)}">${esc(c.status)}</span>
        <span class="id">${esc(c.id)}</span><span class="nm">${esc(c.name)}</span>
        ${c.idea_ref?`<span class="ref">idea ${c.idea_ref} del mapa</span>`:""}</div>
      <p class="idea">${esc(c.idea_central)}</p>
      <p class="entrega">${esc(c.entrega)}</p>
      <p class="pant">En pantalla: ${esc(c.en_pantalla)}</p>
      ${c.fuente_dato?`<p class="fte">Fuente del dato: ${esc(c.fuente_dato)}</p>`:""}
      ${c.speaker?`<p class="spk">${esc(c.speaker)}</p>`:""}
    </div></article>`).join("")}</section>`).join("");

const sv = deck.sistema_visual ?? {};
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Storyboard · ${esc(deck.title)}</title><style>
:root{--ink:#16150F;--mut:#6E6A5E;--ln:#D6D0C1;--ac:#2B3FD9;--pap:#F4F2EC;--bg:#E6E3D9}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);
 font:14.5px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:34px 26px 70px}
h1{margin:0 0 4px;font-size:27px;letter-spacing:-.01em}
.sub{margin:0 0 4px;color:var(--mut);max-width:80ch}
.meta{margin:0;color:var(--mut);font-size:13px}
.counts{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0 4px}
.count{background:var(--pap);border:1px solid var(--ln);border-radius:8px;padding:8px 14px;font-size:12.5px;color:var(--mut)}
.count b{font-size:19px;display:block;color:var(--ink)}
.count--spend{border-color:#D9A441;background:#FBF3E2}
.sv{background:var(--pap);border:1px solid var(--ln);border-left:3px solid var(--ac);
 border-radius:8px;padding:14px 16px;margin:16px 0 0;font-size:13px}
.sv b{display:block;margin-bottom:6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ac)}
.sv div{margin:3px 0;color:#41402F}.sv i{color:var(--mut);font-style:normal}
.entrega{margin:0 0 8px;font-size:14px;line-height:1.4;color:#41402F;
 border-left:3px solid var(--ac);padding-left:10px}
.arg{background:var(--pap);border:1px solid var(--ln);border-radius:10px;padding:18px 20px;margin:18px 0 4px}
.arg b{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ac);margin-bottom:12px}
.arg ol{margin:0;padding:0;list-style:none;columns:2;column-gap:34px}
.arg li{break-inside:avoid;margin:0 0 7px;font-size:13.5px;line-height:1.42;display:flex;gap:9px}
.arg li span{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--ac);font-weight:700;flex:0 0 20px;padding-top:2px}
.sec h2{margin:34px 0 12px;font-size:13px;letter-spacing:.13em;text-transform:uppercase;color:var(--ac);
 border-bottom:1px solid var(--ln);padding-bottom:8px;display:flex;justify-content:space-between}
.sec__meta{color:var(--mut);letter-spacing:.04em;text-transform:none;font-weight:400}
.row{display:grid;grid-template-columns:150px 250px 1fr;gap:18px;background:var(--pap);
 border:1px solid var(--ln);border-radius:10px;padding:16px;margin-bottom:12px;break-inside:avoid}
.col-vis{border-left:1px dashed var(--ln);border-right:1px dashed var(--ln);padding:0 16px}
.wf{aspect-ratio:16/9;border:1px solid var(--ln);background:var(--pap);position:relative;
 display:flex;flex-direction:column;overflow:hidden}
.wf-img{flex:1;background:repeating-linear-gradient(45deg,#DAD5C6,#DAD5C6 5px,#D2CCBB 5px,#D2CCBB 10px);
 display:flex;align-items:center;justify-content:center;position:relative}
.wf-img.q{background:repeating-linear-gradient(45deg,#EBE8DE,#EBE8DE 5px,#E5E1D5 5px,#E5E1D5 10px)}
.wf-img em{font-style:normal;font-size:7.5px;font-weight:700;background:var(--ink);color:var(--pap);padding:2px 6px;border-radius:2px}
.wf-img em.bl{position:absolute;left:7%;bottom:9%}
.wf-img b{font-size:19px;color:var(--ac);letter-spacing:-.02em}
.wf-pap{justify-content:center;gap:4px;padding:0 14%}
.wf-pap i{display:block;height:5px;background:var(--ink);opacity:.8;border-radius:1px}
.wf-pap i.s{width:52%;margin:0 auto}
.wf-pico i{height:8px}
.wf-dark{background:#16150F;justify-content:center;gap:5px;padding:0 14%}
.wf-dark i{display:block;height:6px;background:var(--pap);opacity:.9;border-radius:1px}
.wf-dark i.s{width:46%}
.wf-split{flex-direction:row}.wf-split .wf-img{width:50%}
.wf-side{width:50%;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:0 10%}
.wf-side i{display:block;height:4px;background:var(--ink);opacity:.8;border-radius:1px}
.wf-side i.s{width:58%}
.wf-ctr{align-items:center;justify-content:center}.wf-ctr b{font-size:22px;color:var(--ac);letter-spacing:-.02em}
.wf-row{flex-direction:row;gap:8px}.wf-row u{width:26%;height:52%;border:1.5px solid var(--ink);opacity:.75}
.wf-row span{font-size:8px;color:var(--mut)}
.wf-chain{flex-direction:row;gap:0}.wf-chain o{display:block;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--ink)}
.wf-chain hr{width:14px;height:1.5px;background:var(--ink);border:0;opacity:.5;margin:0}
.wf-net span{font-size:8px;letter-spacing:.14em;color:var(--mut);font-weight:700}
.wf-lab{margin-top:6px;font-size:10.5px;color:var(--mut);font-family:ui-monospace,Menlo,monospace}
.vis__tag{font-size:11px;font-weight:800;letter-spacing:.07em;margin-bottom:7px}
.free{color:#1F7A52;font-weight:700;letter-spacing:0}
.vis__brief{font-size:12.5px;color:#41402F;background:#EFEDFB;border:1px solid #DCD8F5;
 border-radius:6px;padding:8px 10px;font-style:italic}
.vis__row{font-size:12px;color:var(--mut);font-family:ui-monospace,Menlo,monospace;margin:3px 0}
.vis__state{margin-top:7px;font-size:11.5px;font-weight:700}
.vis__state.ok{color:#1F7A52}.vis__state.wait{color:#A9741A}
.vis--none .vis__tag{color:var(--mut)}
.head{display:flex;align-items:center;gap:9px;margin-bottom:7px;flex-wrap:wrap}
.id{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--mut)}
.nm{font-size:12px;color:var(--mut)}
.ref{font-size:10.5px;color:var(--ac);border:1px solid var(--ac);border-radius:999px;padding:1px 8px}
.idea{margin:0 0 7px;font-size:17.5px;line-height:1.32;font-weight:600}
.pant{margin:0 0 5px;font-size:12.5px;color:var(--mut)}
.fte{margin:0 0 5px;font-size:12px;color:var(--mut);font-family:ui-monospace,Menlo,monospace}
.spk{margin:0;font-size:12.5px;color:#41402F;border-left:2px solid var(--ln);padding-left:9px}
.pill{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;
 background:#E4E0D3;color:var(--mut)}
.pill--listo{background:#DFF0E6;color:#1F7A52}
@page{size:A3 portrait;margin:11mm}
@media print{body{background:#fff}.wrap{max-width:none;padding:0}}
</style></head><body><div class="wrap">
<h1>Storyboard · ${esc(deck.title)}</h1>
<p class="sub">${esc(deck.subtitle)}</p>
<p class="meta">${esc(deck.autora)} · ${esc(deck.curso)}<br>${esc(deck.formato)} · ${esc(deck.registro)}</p>
<div class="counts">
  <div class="count"><b>${all.length}</b>láminas</div>
  <div class="count"><b>${dias}</b>diagramas construidos (gratis)</div>
  <div class="count count--spend"><b>${imgs.length-done}</b>imágenes por generar</div>
  <div class="count"><b>${done}</b>imágenes listas</div>
  <div class="count"><b>${tipo}</b>solo tipografía</div>
</div>
<div class="sv"><b>Sistema visual · borrador, pendiente de aprobación</b>
  <div><i>Tratamiento:</i> ${esc(sv.tratamiento)}</div>
  <div><i>Acento:</i> ${esc(sv.acento)}</div>
  <div><i>Encuadre:</i> ${esc(sv.encuadre)}</div>
  <div><i>Prohibido:</i> ${esc(sv.prohibido)}</div>
</div>
${argumento}
${rows}</div></body></html>`;

fs.mkdirSync("build",{recursive:true});
fs.writeFileSync(OUT, html);
console.log(`escrito: ${OUT}`);
console.log(`laminas: ${all.length} | imagenes: ${imgs.length} (${done} listas) | diagramas: ${dias} | solo tipografia: ${tipo}`);
const secSum = secs.reduce((a,s)=>a+(s.section.laminas||0),0);
console.log(`suma de laminas declaradas en las secciones: ${secSum}  ${secSum===all.length?"coincide":"NO COINCIDE"}`);
