#!/usr/bin/env python3
"""Genera el deck Pecha Kucha de la opcion C (la genealogia de la palabra).
Emite un HTML estatico y editable. Ejecutar una sola vez: despues de eso,
el HTML guardado por Andrea desde el navegador es la fuente de verdad."""
import html, io, os, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "build" / "genealogia-c.html"

# ---------------------------------------------------------------- piezas SVG
STROKE = "M8,44 C24,12 52,10 74,30 C92,46 116,50 140,34"  # la marca base

def mark(color="var(--ink)", dash=None, op=1.0, w=7):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<path d="{STROKE}" fill="none" stroke="{color}" stroke-width="{w}" '
            f'stroke-linecap="round" opacity="{op}"{d}/>')

def svg(body, vb="0 0 148 60", cls="art"):
    return f'<svg class="{cls}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{body}</svg>'

def art_oralidad():
    # onda que se desvanece: sin marca permanente
    p = []
    for i in range(9):
        x = 10 + i * 16
        h = [26, 40, 18, 46, 22, 36, 14, 26, 10][i]
        op = round(max(0.06, 1 - i * 0.13), 2)
        p.append(f'<rect x="{x}" y="{30 - h/2:.0f}" width="5" height="{h}" rx="2.5" '
                 f'fill="var(--ink)" opacity="{op}"/>')
    p.append('<line x1="4" y1="56" x2="144" y2="56" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 6"/>')
    return svg("".join(p))

def art_escritura():
    return svg(f'<line x1="4" y1="56" x2="144" y2="56" stroke="var(--line)" stroke-width="2"/>{mark()}')

def art_escritura_anotada():
    extra = ('<line x1="4" y1="56" x2="144" y2="56" stroke="var(--line)" stroke-width="2"/>'
             + mark()
             + '<path d="M128,12 C126,-4 34,-6 14,20" fill="none" stroke="var(--accent)" '
               'stroke-width="2.2" stroke-linecap="round"/>'
               '<path d="M14,20 L21,13 M14,20 L23,22" fill="none" stroke="var(--accent)" '
               'stroke-width="2.2" stroke-linecap="round"/>')
    return svg(extra, vb="0 -8 148 72")

def art_imprenta():
    rows = []
    for r in range(3):
        for c in range(3):
            rows.append(f'<g transform="translate({6+c*48},{4+r*24}) scale(0.26)">{mark(w=20)}</g>')
    return svg("".join(rows), vb="0 0 148 78")

def art_serie(n=3, hueco=False):
    cells, labels = [], ["oralidad", "escritura", "imprenta", "¿?"]
    for i in range(4 if hueco else n):
        x = i * 38
        if i < n:
            inner = (art_oralidad_mini() if i == 0 else
                     f'<g transform="translate(2,6) scale(0.2)">{mark(w=26)}</g>' if i == 1 else
                     "".join(f'<g transform="translate({2+(k%2)*14},{4+(k//2)*9}) scale(0.093)">{mark(w=52)}</g>' for k in range(4)))
            box = f'<rect x="0" y="0" width="32" height="26" rx="3" fill="none" stroke="var(--line)" stroke-width="1.5"/>'
        else:
            inner = '<text x="16" y="18" text-anchor="middle" font-size="13" fill="var(--accent)" font-weight="700">?</text>'
            box = '<rect x="0" y="0" width="32" height="26" rx="3" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-dasharray="4 4"/>'
        cells.append(f'<g transform="translate({x},4)">{box}{inner}'
                     f'<text x="16" y="37" text-anchor="middle" font-size="6" fill="var(--muted)" '
                     f'font-family="Inter,system-ui,sans-serif">{labels[i]}</text></g>')
    return svg("".join(cells), vb="0 0 148 48")

def art_oralidad_mini():
    return "".join(f'<rect x="{4+i*5}" y="{13-[5,9,4,10,6][i]/2:.0f}" width="2.4" height="{[5,9,4,10,6][i]}" '
                   f'rx="1.2" fill="var(--ink)" opacity="{round(1-i*0.17,2)}"/>' for i in range(5))

def art_ia():
    # la marca aparece en otra tinta, antes de que la mano llegue
    return svg(
        '<line x1="4" y1="56" x2="144" y2="56" stroke="var(--line)" stroke-width="2"/>'
        + mark(color="var(--accent)")
        + '<text x="74" y="72" text-anchor="middle" font-size="7" fill="var(--muted)" '
          'font-family="Inter,system-ui,sans-serif">la marca llega antes que la mano</text>',
        vb="0 0 148 78")

def art_pez():
    return svg(
        '<path d="M30,34 C44,16 84,14 104,32 C84,50 44,52 30,34 Z" fill="none" stroke="var(--ink)" stroke-width="3"/>'
        '<path d="M104,32 L126,18 L126,48 Z" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>'
        '<circle cx="48" cy="30" r="3" fill="var(--ink)"/>'
        '<g stroke="var(--accent)" stroke-width="2" stroke-linecap="round" opacity="0.5">'
        '<path d="M6,12 C16,6 26,18 36,12"/><path d="M112,10 C122,4 132,16 142,10"/>'
        '<path d="M6,58 C16,52 26,64 36,58"/><path d="M100,60 C110,54 120,66 130,60"/></g>',
        vb="0 0 148 72")

def art_red():
    import math
    names = ["profesional","prompt","output","criterio","voz","autoría","organización","poder"]
    cx, cy, rx, ry = 74, 46, 44, 26
    pos = []
    for k, n in enumerate(names):
        a = -math.pi/2 + 2*math.pi*k/len(names)
        pos.append((n, cx + rx*math.cos(a), cy + ry*math.sin(a), a))
    edges = [(0,1),(1,2),(2,3),(3,4),(4,5),(5,0),(0,2),(1,4),(6,0),(6,2),(7,3),(7,6)]
    p = [f'<line x1="{pos[a][1]:.1f}" y1="{pos[a][2]:.1f}" x2="{pos[b][1]:.1f}" y2="{pos[b][2]:.1f}" '
         f'stroke="var(--accent)" stroke-width="1" opacity="0.5"/>' for a, b in edges]
    for n, x, y, a in pos:
        lx, ly = x + 11*math.cos(a), y + 10*math.sin(a) + 1.6
        anc = "middle" if abs(math.cos(a)) < 0.35 else ("start" if math.cos(a) > 0 else "end")
        p.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.8" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.8"/>')
        p.append(f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anc}" font-size="5.2" fill="var(--muted)" '
                 f'font-family="Inter,system-ui,sans-serif">{n}</text>')
    return svg("".join(p), vb="-20 -2 188 100")

def art_final():
    return svg(f'<g opacity="0.9">{art_serie(3, hueco=True)[art_serie(3, hueco=True).index(">")+1:-6]}</g>', vb="0 0 148 48")

# ---------------------------------------------------------------- las laminas
S = []
def slide(seccion, titulo, cuerpo, dice, art=""):
    S.append(dict(seccion=seccion, titulo=titulo, cuerpo=cuerpo, dice=dice, art=art))

slide("La pregunta vieja", "", 
      '<p class="lead">¿Qué le hace a una persona<br>la tecnología con la que escribe?</p>',
      "Voy a empezar con una pregunta que no es sobre inteligencia artificial. Es mucho más vieja que eso. Qué le hace a una persona la tecnología con la que escribe. Cada vez que esa tecnología cambió, la respuesta fue incómoda.")

slide("La pregunta vieja", "Oralidad",
      '<p class="stmt">Pensar era recordar.</p>', 
      "Antes de la escritura, pensar era recordar. El saber tenía que viajar en la memoria, así que venía en fórmulas, en ritmos, en repeticiones. No era una decisión de estilo. Era la única forma de que durara.",
      art_oralidad())

slide("Lo que cambió cada vez", "Escritura",
      '<p class="stmt">No fue una técnica<br>para registrar.</p>',
      "Entonces aparece la escritura. Y acá está lo que Walter Ong hace ver: no fue simplemente una técnica para registrar lo que la gente ya pensaba. Reconfiguró la conciencia, la relación con el tiempo y la autoridad del texto.",
      art_escritura())

slide("Lo que cambió cada vez", "Escritura",
      '<ul class="cols"><li>Volver atrás sobre una frase</li><li>Sostener un argumento largo</li>'
      '<li>Comparar dos versiones</li><li>Abstraer</li></ul>',
      "Lo que se podía hacer cambió. Volver atrás sobre una frase. Sostener un argumento largo. Comparar dos versiones. Abstraer. El pensamiento analítico, tal como lo entendemos, necesitó una superficie donde quedarse quieto. Nada de eso era posible cuando el saber vivía solo en la memoria.",
      art_escritura_anotada())

slide("Lo que cambió cada vez", "Imprenta",
      '<p class="stmt">Estable. Idéntico.<br>Firmado.</p>',
      "Con la imprenta vuelve a pasar. El texto se vuelve estable, idéntico, masivo. Se fija la página, se fija la ortografía. Y aparece con una fuerza nueva algo que antes era difuso: el autor, con su nombre encima de un texto que ya nadie puede alterar.",
      art_imprenta())

slide("Lo que cambió cada vez", "El patrón",
      '<p class="stmt">Mientras pasa,<br>no se siente como un cambio.</p>',
      "Tres veces ocurrió lo mismo. Y las tres veces, la gente que estaba adentro creyó que solo estaba usando algo nuevo para hacer lo de siempre. El cambio se ve después. Mientras pasa, no se siente como un cambio.",
      art_serie(3))

slide("El nombre del patrón", "McLuhan",
      '<p class="lead">El medio es el mensaje.</p>',
      "McLuhan le puso nombre a ese patrón. Una tecnología importa menos por lo que transporta que por lo que reorganiza. Su significado no está en el contenido que lleva, sino en la reorganización perceptiva y social que introduce. El medio es el mensaje.")

slide("El nombre del patrón", "El pez y el agua",
      '<p class="stmt">No porque sea invisible.<br>Porque es todo lo que hay.</p>',
      "Y dejó la imagen que lo explica mejor. El pez sería el último en descubrir el agua. Un ambiente no se ve mientras uno está adentro. No porque sea invisible, sino porque es todo lo que hay.",
      art_pez())

slide("Ahora", "La siguiente de la serie",
      '<p class="stmt">Un medio emergente<br>que hereda problemas viejos.</p>',
      "Con eso en la mano, miro lo que tengo enfrente. La IA generativa entra en esa misma serie. No como una ruptura absoluta, dice Scolari, sino como un medio emergente que hereda problemas viejos y los reorganiza en otra escala.",
      art_serie(3, hueco=True))

slide("Ahora", "Qué cambió esta vez",
      '<p class="stmt">Escribir ya no empieza<br>en una página en blanco.</p>',
      "Esto es lo que cambió. Durante toda la historia de la escritura, escribir empezaba en una página en blanco. Hoy puede empezar en una propuesta ya formulada, una estructura sugerida, incluso una voz simulada. El punto de partida se movió de sitio.",
      art_ia())

slide("Ahora", "Y no se queda en el arranque",
      '<p class="verbs"><span>sugiere</span><span>ordena</span><span>completa</span><span>reformula</span></p>'
      '<p class="foot">El trabajo no desaparece. Se corre de sitio.</p>',
      "Y no se queda ahí. Sugiere, ordena, completa y reformula el lenguaje con el que pensamos, escribimos y nos comunicamos. Escribir se vuelve menos formular y más seleccionar, corregir, supervisar y validar. El trabajo no desaparece. Se corre de sitio.")

slide("Ahora", "Entonces no es una herramienta",
      '<p class="strike">herramienta</p><p class="lead accent">ambiente</p>',
      "Por eso llamarla herramienta se queda corto. Una herramienta se toma y se suelta. Esto está adentro del proceso, decidiendo con uno. Es un medio, y es un ambiente. Petricini, Islas y Scolari lo sostienen desde la ecología de los medios.")

slide("La pregunta", "Pregunta problema",
      '<p class="lead">Si el medio es el mensaje,<br>¿cuál es el mensaje<br>de la IA generativa como medio?</p>',
      "Y si es un medio, entonces le cabe la pregunta de McLuhan. Esta es la pregunta que ordena todo mi proyecto. Si el medio es el mensaje, cuál es el mensaje de la IA generativa como medio.")

slide("La pregunta", "Dónde se busca ese mensaje",
      '<p class="stmt off">en el aparato</p><p class="stmt on">en los usos</p>'
      '<p class="foot">Martín-Barbero, de los medios a las mediaciones.</p>',
      "Pero ese mensaje no se lee en el aparato ni en lo que entrega. Martín-Barbero movió el foco de los medios a las mediaciones. Lo decisivo está en los usos y apropiaciones con que la gente vuelve cultura a un medio.")

slide("La pregunta", "Y desde dónde",
      '<p class="stmt">No es el lugar donde ocurre el caso.<br>Es el lugar desde donde se mira.</p>',
      "Ese giro es latinoamericano, y no es un dato decorativo. Sostiene la decisión de estudiarlo desde aquí. No porque la región sea el lugar donde ocurre el caso, sino porque mirarlo desde acá revela cosas que los estudios de otros sitios no alcanzan a ver.")

slide("La pregunta", "Pregunta de investigación",
      '<p class="lead sm">¿Cómo describen los profesionales creativos la reconfiguración '
      'de su forma de <em>pensar</em>, <em>escribir</em> y <em>comunicar</em> al integrar '
      'la IA generativa en su trabajo cotidiano?</p>',
      "De ahí sale mi pregunta de investigación, que es la puerta de entrada concreta. Cómo describen los profesionales creativos la reconfiguración de su forma de pensar, escribir y comunicar al integrar la IA generativa en su trabajo cotidiano.")

slide("La pregunta", "Los cuatro frentes",
      '<ul class="cols four"><li><b>Roles</b><span>qué delegan, retienen, supervisan</span></li>'
      '<li><b>Autoría</b><span>qué pasa con la voz propia</span></li>'
      '<li><b>Criterio</b><span>competencia y dependencia</span></li>'
      '<li><b>Ambiente</b><span>qué revela sobre el medio</span></li></ul>',
      "Se abre en cuatro. Qué tareas y decisiones delegan, retienen o supervisan. Cómo cambia su sentido de autoría y de voz propia. Qué nociones de criterio y de dependencia aparecen. Y qué revela todo eso sobre la IA entendida como medio.")

slide("Por qué importa", "No es especulación",
      '<div class="figs"><div><b>10–24 %</b><span>de la comunicación pública analizada, '
      'con marcas de escritura asistida<i>Liang et al., 2025</i></span></div>'
      '<div><b>83 %</b><span>no pudo citar lo que acababa de escribir<i>Kosmyna et al., 2025</i></span></div></div>',
      "Esto no es especulación. Liang y su equipo estiman que entre el diez y el veinticuatro por ciento de la comunicación pública analizada ya tiene marcas de escritura asistida. Kosmyna midió otra cosa: el ochenta y tres por ciento no pudo citar lo que acababa de escribir.")

slide("A dónde quiero llegar", "La ontología relacional",
      '<p class="stmt">Nombrar las entidades<br>y las relaciones.</p>',
      "A dónde quiero llegar con todo esto. A una ontología relacional de las mediaciones humano e IA. Una manera de nombrar las entidades y las relaciones que reaparecen en estas prácticas. Profesional, prompt, output, criterio, autoría, voz, organización, poder.",
      art_red())

slide("Cierre", "",
      '<p class="lead">Estamos adentro del agua.</p>'
      '<p class="foot">Por eso hay que preguntar ahora, mientras está pasando.</p>',
      "Ong pudo contar lo que la escritura le hizo a la conciencia porque miró desde afuera, siglos después. Nosotros no tenemos ese lujo. Estamos adentro del agua. Por eso hay que preguntarle ahora a quien ya trabaja así, mientras está pasando.",
      art_pez())

assert len(S) == 20, f"se esperaban 20 laminas, hay {len(S)}"

# ---------------------------------------------------------------- el HTML
CSS = """
:root{
  --paper:#F2EFE7; --ink:#16150F; --muted:#6E6A5E; --line:#D6D0C1;
  --accent:#2B3FD9; --accent-soft:#E4E6FA;
  --w:1280px; --h:720px;
  color-scheme:light;
  --sans:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
}
*{box-sizing:border-box}
body{margin:0;background:#E2DED3;color:var(--ink);font-family:var(--sans)}

.edit-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;
  padding:10px 18px;background:rgba(242,239,231,.95);border-bottom:1px solid var(--line);
  backdrop-filter:blur(10px);font-size:13px;color:var(--muted)}
.edit-toolbar strong{color:var(--ink);font-weight:600}
.edit-toolbar button{font:inherit;font-weight:600;color:var(--ink);background:var(--paper);
  border:1px solid var(--line);border-radius:999px;padding:6px 14px;cursor:pointer}
.edit-toolbar button:hover{border-color:var(--accent);color:var(--accent)}
.edit-toolbar .sp{flex:1}

.deck{display:grid;gap:28px;justify-items:center;padding:28px}

.slide{position:relative;width:var(--w);height:var(--h);overflow:hidden;
  padding:64px 84px;background:var(--paper);border:1px solid var(--line);
  display:flex;flex-direction:column}
.slide:focus{outline:3px solid var(--accent);outline-offset:6px}

.head{display:flex;justify-content:space-between;align-items:baseline;
  font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.head .num{font-variant-numeric:tabular-nums;font-weight:600}
.body{flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:40px;text-align:center}
.kicker{font-size:15px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--accent);font-weight:600;margin:0}

.lead{font-family:var(--serif);font-size:62px;line-height:1.16;margin:0;
  letter-spacing:-.01em;max-width:30ch}
.lead.sm{font-size:40px;max-width:30ch;line-height:1.28}
.lead.accent{color:var(--accent)}
.lead em{font-style:italic;color:var(--accent)}
.stmt{font-family:var(--serif);font-size:46px;line-height:1.2;margin:0;max-width:34ch}
.foot{font-size:19px;color:var(--muted);margin:0;max-width:44ch}
.strike{font-family:var(--serif);font-size:40px;margin:0;color:var(--muted);
  text-decoration:line-through;text-decoration-thickness:2px}
.stmt.off{color:var(--muted);text-decoration:line-through;text-decoration-thickness:2px;font-size:34px}
.stmt.on{color:var(--accent);font-size:52px}

.artwrap{width:100%;display:flex;justify-content:center}
.art{width:min(660px,62%);height:auto;display:block}

.cols{list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:18px 44px;
  margin:0;padding:0;font-family:var(--serif);font-size:30px;text-align:left;max-width:860px}
.cols.four{grid-template-columns:repeat(4,1fr);gap:26px;font-size:22px}
.cols.four b{display:block;font-family:var(--sans);font-size:13px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--accent);margin-bottom:10px;font-weight:700}
.cols.four span{display:block;font-size:21px;line-height:1.35}

.verbs{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;margin:0}
.verbs span{font-family:var(--serif);font-size:44px;padding:6px 22px;
  border:1px solid var(--line);border-radius:999px}

.figs{display:flex;gap:80px;justify-content:center;align-items:flex-start;text-align:left}
.figs b{display:block;font-family:var(--serif);font-size:88px;line-height:1;
  color:var(--accent);letter-spacing:-.02em}
.figs span{display:block;margin-top:14px;font-size:19px;color:var(--ink);max-width:19ch;line-height:1.4}
.figs i{display:block;margin-top:8px;font-style:normal;font-size:14px;color:var(--muted)}

/* ---- modo presentacion ---- */
body.present{background:#0E0E0C;overflow:hidden}
body.present .edit-toolbar{display:none}
body.present .deck{display:block;padding:0}
body.present .slide{display:none;border:none}
body.present .slide.on{display:flex;position:fixed;top:50%;left:50%;
  transform:translate(-50%,-50%) scale(var(--k,1));transform-origin:center}
.pbar{display:none}
body.present .pbar{display:block;position:fixed;left:0;bottom:0;height:5px;
  width:100%;background:rgba(255,255,255,.14);z-index:30}
body.present .pbar i{display:block;height:100%;width:0;background:var(--accent)}
body.present .hud{display:flex;position:fixed;right:18px;bottom:18px;z-index:30;
  gap:12px;align-items:center;color:#8C887C;font-size:13px;font-variant-numeric:tabular-nums}
.hud{display:none}

/* ---- impresion ---- */
@page{size:13.333in 7.5in;margin:0}
@media print{
  body{background:#fff}
  .edit-toolbar,.pbar,.hud{display:none!important}
  .deck{display:block;padding:0;gap:0}
  .slide{display:flex!important;position:static!important;transform:none!important;
    width:13.333in;height:7.5in;border:none;break-after:page;page-break-after:always}
  .slide:last-child{break-after:auto}
}
"""

JS = """
const slides=[...document.querySelectorAll('.slide')];
const fill=document.querySelector('.pbar i');
const hudN=document.querySelector('.hud .n'), hudT=document.querySelector('.hud .t');
const STEP=20000; let i=0,t0=0,raf=null,on=false;

function fit(){const s=slides[i];if(!s)return;
  const k=Math.min(innerWidth/1280,innerHeight/720)*0.94;
  s.style.setProperty('--k',k);}
function show(n){slides.forEach(s=>s.classList.remove('on'));
  i=(n+slides.length)%slides.length;slides[i].classList.add('on');
  hudN.textContent=(i+1)+' / '+slides.length;fit();t0=performance.now();}
function tick(now){if(!on)return;const d=now-t0;
  fill.style.width=Math.min(100,d/STEP*100)+'%';
  hudT.textContent=Math.max(0,Math.ceil((STEP-d)/1000))+'s';
  if(d>=STEP){if(i===slides.length-1){stop();return;}show(i+1);}
  raf=requestAnimationFrame(tick);}
function start(){on=true;document.body.classList.add('present');
  slides.forEach(s=>s.setAttribute('contenteditable','false'));
  show(0);raf=requestAnimationFrame(tick);}
function stop(){on=false;cancelAnimationFrame(raf);document.body.classList.remove('present');
  slides.forEach(s=>{s.setAttribute('contenteditable','true');s.classList.remove('on');s.style.removeProperty('--k');});
  fill.style.width='0%';}
document.getElementById('go').onclick=()=>on?stop():start();
addEventListener('resize',()=>{if(on)fit();});
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&on){stop();return;}
  if(!on)return;
  if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();show(i+1);}
  if(e.key==='ArrowLeft'){e.preventDefault();show(i-1);}
});
"""

def slide_html(n, s):
    art = f'<div class="artwrap">{s["art"]}</div>' if s["art"] else ""
    kick = f'<p class="kicker">{html.escape(s["titulo"])}</p>' if s["titulo"] else ""
    return f"""  <section class="slide" contenteditable="true" spellcheck="true" aria-label="Lámina {n}">
    <div class="head"><span>{html.escape(s['seccion'])}</span><span class="num">{n:02d} / 20</span></div>
    <div class="body">{kick}{s['cuerpo']}{art}</div>
  </section>"""

doc = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>La IA generativa como medio · Pecha Kucha</title>
<script type="application/json" id="deck-metadata">
{{"titulo":"La IA generativa como medio: mediaciones, criterio, autoría y la reconfiguración del trabajo creativo en América Latina",
 "estructura":"Opción C, la genealogía de la palabra",
 "formato":"Pecha Kucha, 20 láminas x 20 segundos, 6:40",
 "autora":"Paola Andrea Caro Burgos",
 "fuente":"fuente/anteproyecto-2026-06-18.md",
 "guion":"GUION-C-genealogia.md",
 "generado":"scripts/build-c.py"}}
</script>
<style>{CSS}</style>
</head>
<body>
<aside class="edit-toolbar" contenteditable="false">
  <strong>La genealogía de la palabra</strong>
  <span>20 láminas · 20 segundos · 6:40</span>
  <span class="sp"></span>
  <span>Haz clic en cualquier texto para editarlo</span>
  <button id="go">Presentar</button>
</aside>
<main class="deck">
{chr(10).join(slide_html(n+1, s) for n, s in enumerate(S))}
</main>
<div class="pbar" contenteditable="false"><i></i></div>
<div class="hud" contenteditable="false"><span class="n"></span><span class="t"></span></div>
<script>{JS}</script>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT, "w", encoding="utf-8").write(doc)
print(f"escrito: {OUT}  ({len(doc)//1024} KB, {len(S)} laminas)")

# guion aparte, para el teleprompter
NOT = OUT.parent / "genealogia-c-notas.md"
lines = ["# Guion hablado · opción C\n", "20 segundos por lámina. Total 6:40.\n"]
for n, s in enumerate(S, 1):
    w = len(s["dice"].split())
    lines.append(f"\n**{n:02d} · {s['titulo'] or s['seccion']}** ({w} palabras)\n\n{s['dice']}\n")
io.open(NOT, "w", encoding="utf-8").write("".join(lines))
print(f"escrito: {NOT}")
