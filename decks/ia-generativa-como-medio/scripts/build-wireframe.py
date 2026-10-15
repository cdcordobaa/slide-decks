#!/usr/bin/env python3
"""Wireframe del deck: esquema visual de las 20 laminas, sin contenido redactado.
Solo composicion: donde va la imagen, donde va el texto, y con que peso."""
import io, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "build" / "wireframe.html"

# (n, bloque, arquetipo, nota de imagen, zonas)
# zonas: lista de (clase, alto%, etiqueta)
W = [
 (1,"Apertura","Imagen a sangre, sin texto","Un plano cerrado, humano, ambiguo. Todavia no se sabe de que trata",[("img",100,"IMAGEN A SANGRE")]),
 (2,"El tema","Imagen a sangre + una palabra","El encuadre comun: velocidad, rendimiento, metrica",[("img",100,"IMAGEN A SANGRE"),("ovl",0,"1 palabra, centrada")]),
 (3,"El tema","Tipografia sola","Sin imagen. Respiro despues de dos imagenes seguidas",[("gap",22,""),("txt",30,"FRASE GRANDE  ·  2 lineas"),("gap",48,"")]),
 (4,"El tema","Imagen a sangre + frase corta","Algo que se reorganiza al pasar por otra cosa",[("img",100,"IMAGEN A SANGRE"),("ovl",0,"frase corta, abajo izquierda")]),
 (5,"El tema","Imagen a sangre, sin texto","El ambiente que no se ve desde adentro. El momento visual mas fuerte",[("img",100,"IMAGEN A SANGRE")]),
 (6,"La pregunta","Tipografia sola, pico del deck","Sin imagen. La lamina mas grande tipograficamente de toda la charla",[("gap",14,""),("txt",46,"LA PREGUNTA  ·  3 lineas, tamano maximo"),("gap",40,"")]),
 (7,"La pregunta","Mitad imagen, mitad texto","No el aparato: la mano, el escritorio, el uso cotidiano",[("split",100,"IMAGEN 50%  |  TEXTO 50%")]),
 (8,"La pregunta","Imagen a sangre + una palabra","La region como lugar desde donde se mira, no como postal",[("img",100,"IMAGEN A SANGRE"),("ovl",0,"1 palabra")]),
 (9,"La pregunta","Tipografia sola","Sin imagen. Segundo pico tipografico, menor que el de la 6",[("gap",20,""),("txt",38,"LA PREGUNTA DE INVESTIGACION  ·  4 lineas"),("gap",42,"")]),
 (10,"Ya pasa","Cifra dominante sobre imagen tenue","Imagen al 15% de opacidad detras. La cifra manda",[("imgq",100,"imagen tenue de fondo"),("num",0,"CIFRA ENORME + pie de fuente")]),
 (11,"Ya pasa","Cifra dominante, sin imagen","Solo la cifra sobre el fondo. Gemela de la 10, mas seca",[("gap",24,""),("num2",44,"CIFRA ENORME + pie de fuente"),("gap",32,"")]),
 (12,"La practica","Dos bloques enfrentados","Diagrama, no foto. Dos cajas y algo que las tacha",[("gap",26,""),("duo",40,"BLOQUE A   vs   BLOQUE B"),("gap",34,"")]),
 (13,"La practica","Secuencia de tres","Diagrama. Tres columnas iguales, sin jerarquia",[("gap",24,""),("tri",42,"1  ·  2  ·  3"),("gap",34,"")]),
 (14,"Lo que se juega","Cadena de cinco eslabones","Diagrama horizontal. Cinco nodos conectados",[("gap",30,""),("chain",30,"o - o - o - o - o"),("gap",40,"")]),
 (15,"Lo que se juega","Imagen a sangre + una palabra","Un gesto de decision: algo que se acepta o se descarta",[("img",100,"IMAGEN A SANGRE"),("ovl",0,"1 palabra")]),
 (16,"Lo que se juega","Tipografia sola, fondo invertido","Unica lamina oscura del deck. El giro emocional",[("dark",100,"FONDO OSCURO  ·  frase en claro")]),
 (17,"Vacio y aporte","Imagen a sangre, el vacio","Una ausencia con forma. Espacio negativo dominante",[("img",100,"IMAGEN A SANGRE")]),
 (18,"Vacio y aporte","Mitad imagen, mitad texto","La region otra vez, ahora como hueco en el mapa de la literatura",[("split",100,"IMAGEN 50%  |  TEXTO 50%")]),
 (19,"Vacio y aporte","Diagrama, la red","La ontologia relacional. Construido, no generado",[("gap",18,""),("net",52,"RED DE NODOS Y RELACIONES"),("gap",30,"")]),
 (20,"Cierre","Imagen a sangre + frase","Rima visual con la lamina 1: el mismo plano, resuelto",[("img",100,"IMAGEN A SANGRE"),("ovl",0,"frase de cierre")]),
]

def zonas(zs):
    h=[]
    hasov = any(z[0] in ('ovl','num') for z in zs)
    for cls,alto,lab in zs:
        if cls=="img":   h.append(f'<div class="z img">{"" if hasov else f"<span>{lab}</span>"}</div>')
        elif cls=="imgq":h.append(f'<div class="z imgq">{"" if hasov else f"<span>{lab}</span>"}</div>')
        elif cls=="ovl":
            pos = 'bl' if 'abajo izquierda' in lab else ('bot' if 'abajo' in lab else 'ctr')
            h.append(f'<div class="ovl {pos}"><em>{lab}</em></div>')
        elif cls=="num": h.append('<div class="ovl num"><b>00%</b><i>fuente</i></div>')
        elif cls=="num2":h.append('<div class="z plain num2"><b>00%</b><i>fuente</i></div>')
        elif cls=="txt": h.append(f'<div class="z plain txt" style="height:{alto}%"><i></i><i></i><i class="s"></i></div>')
        elif cls=="gap": h.append(f'<div class="z gap" style="height:{alto}%"></div>')
        elif cls=="split":h.append('<div class="z split"><div class="img"><span>IMAGEN</span></div><div class="side"><i></i><i></i><i class="s"></i></div></div>')
        elif cls=="duo": h.append(f'<div class="z duo" style="height:{alto}%"><div class="bx off"></div><div class="vs">vs</div><div class="bx"></div></div>')
        elif cls=="tri": h.append(f'<div class="z tri" style="height:{alto}%"><div class="bx"></div><div class="bx"></div><div class="bx"></div></div>')
        elif cls=="chain":h.append(f'<div class="z chain" style="height:{alto}%">'+"".join('<u></u>' if i%2 else '<b></b>' for i in range(9))+'</div>')
        elif cls=="net": h.append(f'<div class="z net" style="height:{alto}%"><span>RED</span></div>')
        elif cls=="dark":h.append('<div class="z dark"><i></i><i class="s"></i></div>')
    return "".join(h)

cards="".join(f"""
<figure class="card">
  <div class="frame {'has-ovl' if any(z[0] in ('ovl','num') for z in zs) else ''}">{zonas(zs)}
    <div class="tag">{n:02d}</div>
  </div>
  <figcaption><b>{arq}</b><span class="blk">{blk}</span><span class="nota">{nota}</span></figcaption>
</figure>""" for n,blk,arq,nota,zs in W)

doc=f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Wireframe · La IA generativa como medio</title><style>
:root{{--ink:#16150F;--pap:#F4F2EC;--ln:#C9C3B4;--mut:#77725F;--ac:#2B3FD9;
 --sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}}
*{{box-sizing:border-box}} body{{margin:0;background:#E6E3D9;color:var(--ink);font-family:var(--sans)}}
header{{padding:38px 44px 6px}} h1{{margin:0 0 6px;font-size:26px;letter-spacing:-.01em}}
header p{{margin:0;color:var(--mut);font-size:14px;max-width:78ch;line-height:1.55}}
.leyenda{{display:flex;flex-wrap:wrap;gap:8px;padding:16px 44px 0}}
.leyenda span{{font-size:11.5px;border:1px solid var(--ln);border-radius:999px;padding:4px 11px;background:var(--pap);color:var(--mut)}}
.grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:26px;padding:24px 44px 48px}}
.card{{margin:0;break-inside:avoid;page-break-inside:avoid}}
.frame{{position:relative;aspect-ratio:16/9;background:var(--pap);border:1px solid var(--ln);
 display:flex;flex-direction:column;overflow:hidden}}
.tag{{position:absolute;top:9px;right:11px;font-size:11px;font-weight:700;color:var(--mut);
 font-variant-numeric:tabular-nums;letter-spacing:.08em}}
.z{{position:relative;width:100%}}
.img{{flex:1;background:repeating-linear-gradient(45deg,#DAD5C6,#DAD5C6 7px,#D2CCBB 7px,#D2CCBB 14px);
 display:flex;align-items:center;justify-content:center}}
.img span{{font-size:10.5px;letter-spacing:.16em;color:#6E6959;font-weight:700}}
.imgq{{flex:1;background:repeating-linear-gradient(45deg,#EAE7DC,#EAE7DC 7px,#E4E0D3 7px,#E4E0D3 14px);
 display:flex;align-items:center;justify-content:center}}
.imgq span{{font-size:10px;letter-spacing:.14em;color:#A29C89}}
.gap{{flex:0 0 auto}} .plain{{flex:0 0 auto;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:0 13%}}
.txt i{{display:block;height:13px;background:var(--ink);opacity:.82;border-radius:2px}}
.txt i.s{{width:52%;margin:0 auto}}
.has-ovl .ovl{{position:absolute;inset:0;display:flex;flex-direction:column;padding:6%;
 font-size:11px;letter-spacing:.05em;font-weight:700}}
.ovl.ctr{{align-items:center;justify-content:center}}
.ovl.bot{{align-items:center;justify-content:flex-end}}
.ovl.bl{{align-items:flex-start;justify-content:flex-end}}
.ovl em{{font-style:normal;background:var(--ink);color:var(--pap);padding:6px 12px;border-radius:3px}}
.ovl.num b{{font-size:44px;color:var(--ac);text-shadow:none;letter-spacing:-.02em}}
.ovl.num i{{font-style:normal;font-size:10px;color:var(--mut);text-shadow:none;margin-top:4px}}
.num2{{align-items:center}} .num2 b{{font-size:52px;color:var(--ac);letter-spacing:-.02em;line-height:1}}
.num2 i{{font-style:normal;font-size:10px;color:var(--mut);margin-top:6px}}
.split{{flex:1;display:flex}} .split .img{{width:50%}}
.split .side{{width:50%;display:flex;flex-direction:column;justify-content:center;gap:7px;padding:0 9%}}
.split .side i{{display:block;height:11px;background:var(--ink);opacity:.8;border-radius:2px}}
.split .side i.s{{width:58%}}
.duo{{display:flex;align-items:center;justify-content:center;gap:16px}}
.duo .bx{{width:26%;height:68%;border:2px solid var(--ink);opacity:.8}}
.duo .bx.off{{opacity:.3}} .duo .vs{{font-size:11px;color:var(--mut);letter-spacing:.1em}}
.tri{{display:flex;align-items:center;justify-content:center;gap:14px}}
.tri .bx{{width:20%;height:72%;border:2px solid var(--ink);opacity:.8}}
.chain{{display:flex;align-items:center;justify-content:center;gap:0}}
.chain b{{width:17px;height:17px;border-radius:50%;border:2.5px solid var(--ink)}}
.chain u{{width:34px;height:2.5px;background:var(--ink);opacity:.55}}
.net{{display:flex;align-items:center;justify-content:center;
 background:radial-gradient(circle at 30% 40%,var(--ln) 0 3px,transparent 3px),
            radial-gradient(circle at 62% 28%,var(--ln) 0 3px,transparent 3px),
            radial-gradient(circle at 74% 62%,var(--ln) 0 3px,transparent 3px),
            radial-gradient(circle at 42% 70%,var(--ln) 0 3px,transparent 3px)}}
.net span{{font-size:10.5px;letter-spacing:.16em;color:var(--mut);font-weight:700}}
.dark{{flex:1;background:#16150F;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:0 14%}}
.dark i{{display:block;height:13px;background:#F4F2EC;opacity:.92;border-radius:2px}}
.dark i.s{{width:46%}}
figcaption{{padding:9px 2px 0;line-height:1.45}}
figcaption b{{display:block;font-size:13.5px}}
figcaption .blk{{display:inline-block;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
 color:var(--ac);margin:3px 0 2px;font-weight:700}}
figcaption .nota{{display:block;font-size:12px;color:var(--mut)}}
@page{{size:A3 landscape;margin:12mm}}
@media print{{body{{background:#fff}} .grid{{grid-template-columns:repeat(2,1fr)}}}}
</style></head><body>
<header>
<h1>Wireframe · La IA generativa como medio</h1>
<p>Esquema visual de las 20 láminas. <b>No hay contenido redactado</b>: las barras representan texto, las tramas
representan imagen. Lo que se define acá es la composición y el ritmo, es decir dónde va cada cosa y con cuánto peso.
Pecha Kucha, 20 × 20 segundos. Taller PDA, Pensamiento de diseño aplicado.</p>
</header>
<div class="leyenda">
<span>trama diagonal = imagen generada</span><span>barra oscura = línea de texto</span>
<span>caja con borde = diagrama construido, no generado</span><span>fondo oscuro = única lámina invertida</span>
</div>
<div class="grid">{cards}</div>
</body></html>"""
OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT,"w",encoding="utf-8").write(doc)
print("escrito:", OUT)

# conteo de arquetipos, para verificar el ritmo
from collections import Counter
c=Counter(a for _,_,a,_,_ in W)
print("\nRITMO (arquetipos):")
for k,v in c.most_common(): print(f"  {v:2d}x  {k}")
print("\nlaminas con imagen generada:", sum(1 for _,_,a,_,_ in W if "Imagen" in a or "imagen" in a))
print("laminas sin imagen (tipografia o diagrama):", sum(1 for _,_,a,_,_ in W if "Imagen" not in a and "imagen" not in a))
