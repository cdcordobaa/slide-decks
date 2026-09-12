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
/* ---- capa Pecha Kucha: sistema gráfico propio ---- */
:root{--paper:#F2EFE7;--ink:#12110D;--muted:#7A7566;--mut:#7A7566;--line:#CFC8B7;
 --ac:#1B2FE8;--accent:#1B2FE8;--w:1280px;--h:720px;
 --cond:"Avenir Next Condensed","Avenir Next",Inter,system-ui,sans-serif;
 --serif:"New York","Iowan Old Style",Palatino,Georgia,serif;
 --mono:Menlo,"SF Mono",ui-monospace,monospace}
body{background:#DAD6C9;font-family:var(--cond)}
.deck{display:grid;gap:26px;justify-items:center;padding:26px}
.slide{position:relative;width:var(--w);height:var(--h);overflow:hidden;background:var(--paper);
 padding:0;border:1px solid var(--line);border-radius:0;box-shadow:none;display:block;color:var(--ink)}
.slide:focus{outline:3px solid var(--ac);outline-offset:6px}
.slide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.slide.dark::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
 background:linear-gradient(to top,rgba(6,6,4,.80) 0%,rgba(6,6,4,.40) 30%,rgba(6,6,4,0) 58%),
            linear-gradient(to bottom,rgba(6,6,4,.62) 0%,rgba(6,6,4,.18) 22%,rgba(6,6,4,0) 40%)}

/* aparato gráfico común: se reconoce sin las fotos */
.slide .marco{position:absolute;inset:0;z-index:4;pointer-events:none}
.slide .rot{position:absolute;top:38px;left:56px;font-family:var(--mono);font-size:13px;
 letter-spacing:.18em;text-transform:uppercase;color:var(--mut)}
.slide .nm{position:absolute;top:24px;right:52px;font-family:var(--cond);font-weight:700;
 font-size:78px;line-height:1;color:var(--ink);opacity:.13;letter-spacing:-.03em}
.slide .regla{position:absolute;left:56px;right:56px;top:68px;height:1px;background:var(--line)}
.slide.dark .rot{color:rgba(242,239,231,.72)}
.slide.dark .nm{color:#F2EFE7;opacity:.24}
.slide.dark .regla{background:rgba(242,239,231,.3)}

/* titulares */
.slide .titular{position:absolute;left:56px;bottom:60px;z-index:3;margin:0;font-family:var(--cond);
 font-weight:700;font-size:70px;line-height:.95;letter-spacing:-.018em;text-transform:uppercase;
 max-width:17ch}
.slide.dg .titular{font-size:58px;max-width:26ch}
.slide.dg .titular::before{content:"";position:absolute;left:0;top:-30px;width:64px;height:3px;background:var(--ac)}
.slide.dark .titular{color:#F2EFE7}
.slide .pregunta{position:absolute;left:56px;right:56px;top:50%;transform:translateY(-50%);z-index:3;
 margin:0;font-family:var(--serif);font-size:62px;line-height:1.16;letter-spacing:-.01em;max-width:26ch}

/* portada */
.slide .tit{position:absolute;left:56px;bottom:132px;z-index:3;margin:0;font-family:var(--cond);
 font-weight:700;font-size:104px;line-height:.92;letter-spacing:-.025em;text-transform:uppercase;
 color:#F2EFE7;max-width:15ch}
.slide .baj{position:absolute;left:56px;right:200px;bottom:64px;z-index:3;margin:0;
 font-family:var(--serif);font-size:23px;line-height:1.35;color:rgba(242,239,231,.9)}

/* diagrama de columnas */
.dgm{position:absolute;left:56px;right:56px;top:112px;bottom:268px;z-index:2;display:flex;gap:0}
.dgm .col{flex:1;padding:0 34px 0 0}
.dgm .col+.col{padding:0 0 0 34px;border-left:2px solid var(--ink)}
.dgm .col.off{opacity:.36}
.dgm h3{margin:0 0 22px;font-family:var(--mono);font-size:13px;letter-spacing:.18em;
 text-transform:uppercase;color:var(--mut);font-weight:400}
.dgm .col.on h3{color:var(--ac)}
.dgm ul{margin:0;padding:0;list-style:none}
.dgm li{font-family:var(--cond);font-weight:600;font-size:33px;line-height:1.26;
 letter-spacing:-.01em;text-transform:uppercase}
.dgm .col.on li{color:var(--ac)}

/* al imprimir manda la plantilla, no la vista de edicion */
@media print{
  body{background:#fff}
  .deck{display:block;padding:0;gap:0}
  .slide{width:13.333in;height:7.5in;border:0;margin:0;break-after:page;page-break-after:always}
  .slide:last-child{break-after:auto;page-break-after:auto}
}

/* diagrama de flujo */
.flj{position:absolute;left:56px;right:56px;top:112px;bottom:268px;z-index:2;
 display:flex;align-items:center;gap:0}
.flj .ext{flex:0 0 auto;max-width:15ch;font-family:var(--serif);font-size:24px;line-height:1.25;
 color:var(--mut)}
.flj .caja{flex:1;margin:0 26px;border:2px solid var(--ink);display:flex}
.flj .caja span{flex:1;padding:30px 10px;text-align:center;font-family:var(--cond);font-weight:700;
 font-size:30px;letter-spacing:-.005em;text-transform:uppercase}
.flj .caja span+span{border-left:1px solid var(--line)}
.flj .fl{flex:0 0 auto;width:34px;height:2px;background:var(--ac);position:relative}
.flj .fl::after{content:"";position:absolute;right:0;top:-4px;border:5px solid transparent;border-left-color:var(--ac)}
.flj .ext.sale{color:var(--ac);font-style:italic}

/* ---- formatos nuevos ---- */
.slide.oscura{background:var(--ink)}
.slide.oscura .titular{color:#F2EFE7;font-size:76px;max-width:20ch;bottom:auto;top:50%;
 transform:translateY(-50%)}
.slide.oscura .rot{color:rgba(242,239,231,.6)}
.slide.oscura .nm{color:#F2EFE7;opacity:.16}
.slide.oscura .regla{background:rgba(242,239,231,.22)}

/* superposicion de contraste sobre imagen */
.ovl{position:absolute;left:56px;top:140px;z-index:3;display:flex;align-items:center;gap:22px}
.ovl b{font-family:var(--cond);font-weight:700;font-size:34px;letter-spacing:-.01em;
 text-transform:uppercase;padding:10px 20px;border:2px solid rgba(242,239,231,.55);
 color:rgba(242,239,231,.6);position:relative}
.ovl b::after{content:"";position:absolute;left:8%;right:8%;top:50%;height:2px;
 background:rgba(242,239,231,.6)}
.ovl i{font-style:normal;width:40px;height:2px;background:var(--ac);position:relative}
.ovl i::after{content:"";position:absolute;right:0;top:-5px;border:6px solid transparent;
 border-left-color:var(--ac)}
.ovl s{text-decoration:none;font-family:var(--cond);font-weight:700;font-size:34px;
 letter-spacing:-.01em;text-transform:uppercase;padding:10px 20px;background:var(--ac);color:#fff}

/* cifra sobre imagen */
.cif{position:absolute;left:56px;bottom:60px;z-index:3}
.cif b{display:block;font-family:var(--cond);font-weight:700;font-size:150px;line-height:.85;
 letter-spacing:-.035em;color:#F2EFE7}
.cif p{margin:16px 0 0;font-family:var(--serif);font-size:27px;line-height:1.3;max-width:22ch;
 color:rgba(242,239,231,.92)}
.cif span{display:block;margin-top:14px;font-family:var(--mono);font-size:13px;
 letter-spacing:.12em;color:rgba(242,239,231,.62)}

/* cifra con barra de proporcion */
.prop{position:absolute;left:56px;right:56px;top:118px;z-index:2}
.prop b{display:block;font-family:var(--cond);font-weight:700;font-size:186px;line-height:.84;
 letter-spacing:-.035em;color:var(--ac)}
.prop p{margin:18px 0 0;font-family:var(--serif);font-size:32px;line-height:1.3;max-width:24ch}
.prop span{display:block;margin-top:10px;font-family:var(--mono);font-size:13px;
 letter-spacing:.12em;color:var(--mut)}
.prop .pista{margin-top:26px;height:22px;background:#DFD9C9;display:flex}
.prop .pista u{display:block;height:100%;background:var(--ac)}

/* dos bloques tachados */
.tach{position:absolute;left:56px;right:56px;top:122px;bottom:268px;z-index:2;
 display:flex;align-items:center;gap:34px}
.tach div{flex:1;border:3px solid var(--ink);padding:52px 0;text-align:center;position:relative;
 font-family:var(--cond);font-weight:700;font-size:52px;letter-spacing:-.015em;
 text-transform:uppercase;opacity:.34}
.tach div::after{content:"";position:absolute;left:6%;right:6%;top:50%;height:4px;background:var(--ac)}

/* tres columnas con glosa */
.tres{position:absolute;left:56px;right:56px;top:122px;bottom:268px;z-index:2;display:flex;gap:0}
.tres div{flex:1;padding:0 30px}
.tres div+div{border-left:2px solid var(--ink)}
.tres b{display:block;font-family:var(--cond);font-weight:700;font-size:46px;line-height:1;
 letter-spacing:-.015em;text-transform:uppercase;color:var(--ac);margin-bottom:16px}
.tres span{font-family:var(--serif);font-size:21px;line-height:1.34;color:var(--mut)}

/* cadena de eslabones */
.cad{position:absolute;left:56px;right:56px;top:150px;bottom:268px;z-index:2;
 display:flex;align-items:center}
.cad em{flex:0 0 auto;font-style:normal;font-family:var(--cond);font-weight:700;font-size:26px;
 letter-spacing:-.005em;text-transform:uppercase;border:2px solid var(--ink);padding:16px 18px;
 background:var(--paper)}
.cad u{flex:1;height:2px;background:var(--ink);opacity:.45}

/* barras comparativas */
.brs{position:absolute;left:56px;right:56px;top:122px;bottom:268px;z-index:2;
 display:flex;flex-direction:column;justify-content:center;gap:30px}
.brs .fila{display:flex;align-items:center;gap:22px}
.brs .et{flex:0 0 330px;font-family:var(--cond);font-weight:600;font-size:27px;line-height:1.12;
 text-transform:uppercase;letter-spacing:-.005em}
.brs .tk{flex:1;height:40px;background:#DFD9C9;position:relative}
.brs .tk u{display:block;height:100%;background:var(--ink)}
.brs .fila.on .tk u{background:var(--ac)}
.brs .pc{flex:0 0 90px;text-align:right;font-family:var(--cond);font-weight:700;font-size:36px}
.brs .fila.on .pc{color:var(--ac)}
.brs .pie{margin:6px 0 0;font-family:var(--mono);font-size:12px;letter-spacing:.1em;color:var(--mut)}

/* red de relaciones */
.red{position:absolute;left:56px;right:56px;top:104px;bottom:250px;z-index:2}
.red svg{width:100%;height:100%}
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

SEC = {"01":"Apertura","02":"El tema","03":"El tema","04":"El tema","05":"El tema",
 "06":"La pregunta","07":"La pregunta","08":"La pregunta","09":"La pregunta",
 "10":"Ya pasa","11":"Ya pasa","12":"La práctica","13":"La práctica",
 "14":"Lo que se juega","15":"Lo que se juega","16":"Lo que se juega",
 "17":"El vacío y el aporte","18":"El vacío y el aporte","19":"El vacío y el aporte","20":"Cierre"}

def marco(c):
    return (f'<div class="marco"><span class="rot">{SEC.get(c["id"],"")}</span>'
            f'<span class="nm">{c["id"]}</span><span class="regla"></span></div>')

def red_svg(nodos):
    import math
    cx, cy, rx, ry = 300, 118, 208, 86
    pos = []
    for k, n in enumerate(nodos):
        a = -math.pi/2 + 2*math.pi*k/len(nodos)
        pos.append((n, cx+rx*math.cos(a), cy+ry*math.sin(a), a))
    ar = [(0,1),(1,2),(2,3),(3,4),(4,5),(5,0),(0,2),(1,4),(6,0),(6,2),(7,3),(7,6)]
    o = [f'<line x1="{pos[a][1]:.0f}" y1="{pos[a][2]:.0f}" x2="{pos[b][1]:.0f}" y2="{pos[b][2]:.0f}" '
         f'stroke="#1B2FE8" stroke-width="1.6" opacity=".55"/>' for a,b in ar]
    for n,x,y,a in pos:
        lx, ly = x+16*math.cos(a), y+15*math.sin(a)+4
        anc = "middle" if abs(math.cos(a))<.35 else ("start" if math.cos(a)>0 else "end")
        o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="5" fill="#F2EFE7" stroke="#12110D" stroke-width="3"/>')
        o.append(f'<text x="{lx:.0f}" y="{ly:.0f}" text-anchor="{anc}" font-size="15" fill="#7A7566" '
                 f'font-family="Menlo,monospace" letter-spacing="1">{n}</text>')
    return f'<svg viewBox="-12 -6 624 248" preserveAspectRatio="xMidYMid meet">{"".join(o)}</svg>'

def slide(c):
    lay, cp, v = c["layout"], c.get("copy") or {}, c.get("visual") or {}
    img = b64(c["id"]) if v.get("kind") == "image" else None
    cls = ""
    if img: cls += " dark"
    if lay in ("diagrama_columnas","diagrama_flujo","tachado","tres","cadena","barras","red","barra"):
        cls += " dg"
    if lay == "oscura": cls += " oscura"
    b = f'<img src="{img}" alt="">' if img else ""

    if lay == "portada":
        b += f'<h1 class="tit">{cp["titulo"]}</h1><p class="baj">{cp.get("bajada","")}</p>'
    if lay == "pregunta":
        b += f'<p class="pregunta">{cp["pregunta"]}</p>'
    if lay == "imagen_diagrama":
        ov = v["overlay"]
        b += f'<div class="ovl"><b>{ov["off"]}</b><i></i><s>{ov["on"]}</s></div>'
    if lay == "imagen_cifra":
        b += (f'<div class="cif"><b>{cp["cifra"]}</b><p>{cp["glosa"]}</p>'
              f'<span>{cp["fuente"]}</span></div>')
    if lay == "barra":
        pc = int(re.sub(r"\D", "", cp["cifra"]))
        b += (f'<div class="prop"><b>{cp["cifra"]}</b><p>{cp["glosa"]}</p>'
              f'<span>{cp["fuente"]}</span>'
              f'<div class="pista"><u style="width:{pc}%"></u></div></div>')
    if lay == "diagrama_columnas":
        col = lambda d, k: ('<div class="col ' + k + '"><h3>' + d["titulo"] + '</h3><ul>'
                            + "".join(f"<li>{i}</li>" for i in d["items"]) + '</ul></div>')
        b += '<div class="dgm">' + col(v["izq"],"off") + col(v["der"],"on") + '</div>'
    if lay == "diagrama_flujo":
        pasos = "".join(f"<span>{x}</span>" for x in v["pasos"])
        b += (f'<div class="flj"><div class="ext">{v["entra"]}</div><div class="fl"></div>'
              f'<div class="caja">{pasos}</div><div class="fl"></div>'
              f'<div class="ext sale">{v["sale"]}</div></div>')
    if lay == "tachado":
        b += '<div class="tach">' + "".join(f"<div>{x}</div>" for x in v["tachar"]) + '</div>'
    if lay == "tres":
        b += '<div class="tres">' + "".join(f"<div><b>{a}</b><span>{d}</span></div>"
             for a,d in v["tres"]) + '</div>'
    if lay == "cadena":
        ps = v["pasos"]
        b += ('<div class="cad">' + "<u></u>".join(f"<em>{x}</em>" for x in ps) + '</div>')
    if lay == "barras":
        fs = "".join(f'<div class="fila{" on" if i else ""}"><div class="et">{a}</div>'
                     f'<div class="tk"><u style="width:{n}%"></u></div>'
                     f'<div class="pc">{n} %</div></div>' for i,(a,n) in enumerate(v["barras"]))
        b += f'<div class="brs">{fs}<p class="pie">{v["pie"]}</p></div>'
    if lay == "red":
        b += f'<div class="red">{red_svg(v["nodos"])}</div>'
    if cp.get("titular"):
        b += f'<p class="titular">{cp["titular"]}</p>'
    return (f'  <section class="slide{cls}" contenteditable="true" spellcheck="true" '
            f'aria-label="Lámina {c["id"]} · {c["name"]}">{b}{marco(c)}</section>')

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
con = sum(1 for c in cards if (c.get("visual") or {}).get("kind")=="image" and b64(c["id"]))
dgm = sum(1 for c in cards if (c.get("visual") or {}).get("kind") in ("columnas","flujo"))
print(f"escrito: {OUT} ({len(html)//1024} KB)")
print(f"láminas: {len(cards)} · imagen: {con} · diagrama: {dgm} · otras: {len(cards)-con-dgm}")
