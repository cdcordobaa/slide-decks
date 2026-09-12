#!/usr/bin/env python3
"""Deck editable a partir de las cards. Renderiza las laminas que existan
(las que ya tengan copy y, si llevan imagen, su PNG en cards/assets).
Uso: python3 scripts/build-deck.py [--hasta 05]"""
import base64, io, pathlib, re, sys, yaml

R = pathlib.Path(__file__).resolve().parent.parent
SKILL = R.parent.parent/"skill"
PLANTILLA = SKILL/"assets"/"editable-deck-template.html"
CARDS, ASSETS, OUT = R/"cards", R/"cards"/"assets", R/"build"/"deck.html"
hasta = sys.argv[sys.argv.index("--hasta")+1] if "--hasta" in sys.argv else "20"

deck = yaml.safe_load((CARDS/"deck.yaml").read_text())
cards = []
for f in sorted(CARDS.glob("*.yaml")):
    if f.name == "deck.yaml": continue
    cards += (yaml.safe_load(f.read_text()) or {}).get("cards", [])
cards = [c for c in cards if c["id"] <= hasta]

def b64(cid):
    p = ASSETS/f"{cid}.png"
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode() if p.exists() else None

def css_plantilla():
    """CSS base de assets/editable-deck-template.html del skill."""
    t = PLANTILLA.read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", t, re.S)
    if not m: raise SystemExit("no pude leer el <style> de la plantilla del skill")
    return m.group(1)

# Solo lo que la plantilla no contempla: sangrado completo, texto sobre imagen,
# modo presentacion con temporizador de 20 s.
CSS = """
:root{--paper:#F2EFE7;--ink:#16150F;--muted:#6E6A5E;--mut:#6E6A5E;--line:#D6D0C1;--ac:#2B3FD9;--accent:#2B3FD9;
 --w:1280px;--h:720px;color-scheme:light;
 --sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
 --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:#DEDACE;color:var(--ink);font-family:var(--sans)}
.edit-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;
 padding:10px 18px;background:rgba(242,239,231,.96);border-bottom:1px solid var(--line);
 backdrop-filter:blur(10px);font-size:13px;color:var(--mut)}
.edit-toolbar strong{color:var(--ink);font-weight:600}.edit-toolbar .sp{flex:1}
.edit-toolbar button{font:inherit;font-weight:600;color:var(--ink);background:var(--paper);
 border:1px solid var(--line);border-radius:999px;padding:6px 14px;cursor:pointer}
.edit-toolbar button:hover{border-color:var(--ac);color:var(--ac)}
.deck{display:grid;gap:26px;justify-items:center;padding:26px}
.slide{position:relative;width:var(--w);height:var(--h);overflow:hidden;background:var(--paper);padding:0;border-radius:0;box-shadow:none;
 border:1px solid var(--line);display:flex;flex-direction:column;justify-content:center;
 align-items:center;text-align:center}
.slide:focus{outline:3px solid var(--ac);outline-offset:6px}
.slide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slide.dark::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
 background:linear-gradient(to top,rgba(8,8,6,.72) 0%,rgba(8,8,6,.34) 26%,rgba(8,8,6,0) 52%)}
.slide .num{position:absolute;right:26px;bottom:20px;font-size:12px;letter-spacing:.14em;
 color:var(--mut);font-variant-numeric:tabular-nums;z-index:3}
.slide.dark .num{color:rgba(242,239,231,.6)}
.slide .palabra{position:absolute;left:72px;bottom:64px;z-index:2;margin:0;font-family:var(--serif);
 font-size:88px;line-height:1;color:#F2EFE7;letter-spacing:-.015em}
.slide .frase{margin:0;font-family:var(--serif);font-size:58px;line-height:1.22;max-width:32ch;margin:0}
.slide .pie{position:absolute;left:72px;bottom:64px;z-index:2;margin:0;text-align:left;
 font-family:var(--serif);font-size:42px;line-height:1.24;color:#F2EFE7;max-width:28ch}
@page{size:13.333in 7.5in;margin:0}
@media print{body{background:#fff}.edit-toolbar,.pbar,.hud{display:none!important}
 .deck{display:block;padding:0;gap:0}
 .slide{width:13.333in;height:7.5in;border:none;break-after:page;page-break-after:always}
 .slide:last-child{break-after:auto}}
body.present{background:#0E0E0C;overflow:hidden}
body.present .edit-toolbar{display:none}body.present .deck{display:block;padding:0}
body.present .slide{display:none;border:none}
body.present .slide.on{display:flex;position:fixed;top:50%;left:50%;
 transform:translate(-50%,-50%) scale(var(--k,1));transform-origin:center}
.pbar{display:none}body.present .pbar{display:block;position:fixed;left:0;bottom:0;height:5px;
 width:100%;background:rgba(255,255,255,.14);z-index:30}
body.present .pbar i{display:block;height:100%;width:0;background:var(--ac)}
.hud{display:none}body.present .hud{display:flex;position:fixed;right:18px;bottom:18px;z-index:30;
 gap:12px;color:#8C887C;font-size:13px;font-variant-numeric:tabular-nums}
"""

JS = """
const S=[...document.querySelectorAll('.slide')],F=document.querySelector('.pbar i'),
 N=document.querySelector('.hud .n'),T=document.querySelector('.hud .t');
const STEP=20000;let i=0,t0=0,raf=null,on=false;
const fit=()=>{const s=S[i];if(s)s.style.setProperty('--k',Math.min(innerWidth/1280,innerHeight/720)*.94)};
const show=n=>{S.forEach(s=>s.classList.remove('on'));i=(n+S.length)%S.length;
 S[i].classList.add('on');N.textContent=(i+1)+' / '+S.length;fit();t0=performance.now()};
const tick=now=>{if(!on)return;const d=now-t0;F.style.width=Math.min(100,d/STEP*100)+'%';
 T.textContent=Math.max(0,Math.ceil((STEP-d)/1000))+'s';
 if(d>=STEP){if(i===S.length-1){stop();return}show(i+1)}raf=requestAnimationFrame(tick)};
const start=()=>{on=true;document.body.classList.add('present');
 S.forEach(s=>s.setAttribute('contenteditable','false'));show(0);raf=requestAnimationFrame(tick)};
const stop=()=>{on=false;cancelAnimationFrame(raf);document.body.classList.remove('present');
 S.forEach(s=>{s.setAttribute('contenteditable','true');s.classList.remove('on');s.style.removeProperty('--k')});
 F.style.width='0%'};
document.getElementById('go').onclick=()=>on?stop():start();
addEventListener('resize',()=>{if(on)fit()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&on){stop();return}if(!on)return;
 if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();show(i+1)}
 if(e.key==='ArrowLeft'){e.preventDefault();show(i-1)}});
"""

def slide(c):
    img, cp = b64(c["id"]), c.get("copy") or {}
    dark = " dark" if img else ""
    body = f'<img src="{img}" alt="">' if img else ""
    if cp.get("palabra"): body += f'<p class="palabra">{cp["palabra"]}</p>'
    if cp.get("frase"):   body += f'<p class="frase">{cp["frase"]}</p>'
    if cp.get("pie"):     body += f'<p class="pie">{cp["pie"]}</p>'
    return (f'  <section class="slide{dark}" contenteditable="true" spellcheck="true" '
            f'aria-label="Lámina {c["id"]} · {c["name"]}">{body}'
            f'<span class="num" contenteditable="false">{c["id"]} / 20</span></section>')

html = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{deck['title']} · Pecha Kucha</title>
<script type="application/json" id="deck-metadata">{{"titulo":"{deck['title']}",
 "curso":"{deck['curso']}","formato":"{deck['formato']}",
 "laminas_en_este_archivo":"01 a {hasta} de 20","fuente":"{deck['fuente']}",
 "imagenes":"Gemini (Nano Banana Pro), briefs en cards/*.yaml",
 "generado":"scripts/build-deck.py"}}</script>
<style>/* base: skill/assets/editable-deck-template.html */
{css_plantilla()}
/* capa Pecha Kucha */
{CSS}</style></head><body>
<aside class="edit-toolbar" contenteditable="false"><strong>{deck['title']}</strong>
 <span>láminas 01 a {hasta} · prueba de estilo</span><span class="sp"></span>
 <span>Haz clic en cualquier texto para editarlo</span>
 <button id="go">Presentar</button></aside>
<main class="deck">
{chr(10).join(slide(c) for c in cards)}
</main>
<div class="pbar" contenteditable="false"><i></i></div>
<div class="hud" contenteditable="false"><span class="n"></span><span class="t"></span></div>
<script>{JS}</script></body></html>"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")
con = sum(1 for c in cards if b64(c["id"]))
print(f"escrito: {OUT} ({len(html)//1024} KB)")
print(f"láminas: {len(cards)} · con imagen: {con} · solo tipografía: {len(cards)-con}")
