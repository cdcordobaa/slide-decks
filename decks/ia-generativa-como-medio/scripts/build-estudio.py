#!/usr/bin/env python3
"""Guia de estudio para NotebookLM. Lineal, densa en texto y autocontenida:
se genera desde cards/ para que nunca se desincronice del deck."""
import io, pathlib, re, yaml

R = pathlib.Path(__file__).resolve().parent.parent
deck = yaml.safe_load((R/"cards"/"deck.yaml").read_text())
secs = [yaml.safe_load(f.read_text()) for f in sorted((R/"cards").glob("*.yaml"))
        if f.name != "deck.yaml"]
secs = [s for s in secs if s.get("cards")]
secs.sort(key=lambda s: str(s["section"]["id"]))
all_c = [c for s in secs for c in s["cards"]]
FUENTE = (R/deck["fuente"]).read_text(encoding="utf-8")

def pantalla(c):
    cp = c.get("copy") or {}
    if not cp: return "Sin texto en pantalla."
    et = {"titulo":"Título","bajada":"Bajada","titular":"Titular","pregunta":"Pregunta",
          "cifra":"Cifra","glosa":"Glosa","fuente":"Fuente"}
    return " · ".join(f"**{et.get(k,k)}:** " + re.sub(r"</?em>","",str(v)).replace("<br>"," / ")
                      for k,v in cp.items())

def visual(c):
    v = c.get("visual") or {}
    k = v.get("kind")
    if k == "image":
        return f"Fotografía generada. Brief: *{v['brief']}* Acento azul: {'sí' if v.get('acento') else 'no'}."
    if k == "columnas":
        return ("Diagrama de dos columnas. Izquierda, " + v["izq"]["titulo"].lower() + ": "
                + ", ".join(v["izq"]["items"]) + ". Derecha, " + v["der"]["titulo"].lower() + ": "
                + ", ".join(v["der"]["items"]) + ".")
    if k == "flujo":
        return (f"Diagrama de flujo. Entra «{v['entra']}», pasa por "
                + ", ".join(v["pasos"]) + f", y sale «{v['sale']}».")
    if k == "two_boxes":
        return "Diagrama. Dos bloques tachados: " + " y ".join(v["tachar"]) + "."
    if k == "sequence_3":
        return "Diagrama de tres columnas: " + " · ".join(f"{a} ({d})" for a,d in v["tres"]) + "."
    if k == "chain_5":
        return "Diagrama de cadena: " + " → ".join(v["pasos"]) + "."
    if k == "barras":
        return ("Barras comparativas: " + " y ".join(f"{a}, {n} %" for a,n in v["barras"])
                + f". Pie: {v['pie']}.")
    if k == "network":
        return "Diagrama de red. Nodos: " + ", ".join(v["nodos"]) + "."
    return "Sin elemento visual. Solo tipografía."

CONCEPTOS = [
 ("Medio", "Una tecnología que importa menos por los contenidos que transporta que por la reorganización perceptiva, social y simbólica que introduce. Leer la IA generativa como medio, y no como herramienta, es la decisión teórica que abre todo el proyecto.", "§4.1.1, §7.2"),
 ("Ambiente", "Un medio, en clave de ecología de los medios, no se usa y se suelta: instala condiciones de relación. Qué vuelve fácil, qué desplaza, qué normaliza, qué tipo de pensamiento favorece.", "§7.2"),
 ("Mediación", "El concepto articulador del marco. Lo decisivo no ocurre en el aparato ni en sus productos, sino en los usos y apropiaciones con que la gente vuelve cultura a un medio. Viene de Martín-Barbero.", "§7.2.1"),
 ("Agencia", "La capacidad de decidir, orientar, validar y responder por lo que se produce. En el trabajo con IA se reparte de forma despareja: hay decisiones que se delegan casi sin mirar y otras que se retienen con celo.", "§7.2.2"),
 ("Autoría", "Tratada como práctica relacional y no como propiedad individual del texto. Conviene separar idea, formulación, edición, firma y responsabilidad.", "§7.2.2"),
 ("Criterio", "El centro del marco: la capacidad de evaluar, seleccionar y corregir lo que la herramienta ofrece. Es lo que permite ver qué conservan los profesionales como suyo y qué empiezan a ceder sin notarlo.", "§7.2.2"),
 ("Reasignación situada de roles", "El supuesto que ordena la investigación. Lo que ocurre con la IA no es reemplazo ni aumento, sino un nuevo reparto: qué se delega, qué se retiene, qué se supervisa. Viene de Clarke y Joffe.", "§4.2.2, §7.1"),
 ("Ontología relacional de las mediaciones humano–IA", "El aporte de la tesis. Una manera de nombrar las entidades y las relaciones que reaparecen en estas prácticas: profesional, herramienta, prompt, output, criterio, autoría, voz, organización, audiencia, poder. Su función es metodológica además de conceptual: cada relación se vuelve una categoría con la que se leerán las entrevistas.", "§7.2.4"),
 ("Delegación reflexiva", "Desplaza la pregunta desde el uso hacia el juicio. No es si el profesional usa IA, sino con qué criterio decide cuándo delegar, cuándo corregir y cuándo desconfiar.", "§4.2.2"),
 ("Deuda cognitiva", "Un costo diferido por delegar el esfuerzo de elaboración. Aparece en Kosmyna junto con la menor conectividad neuronal en usuarios de modelos de lenguaje.", "§4.4.2"),
 ("Trampa de la confianza", "La fiabilidad atribuida al sistema reduce el escrutinio precisamente cuando resultaría más necesario. Viene de Lee et al.", "§4.4.1"),
 ("Descarga cognitiva", "La delegación en el sistema del esfuerzo de recordar, comparar o razonar. Gerlich la señala como mediadora entre uso intensivo de IA y menor desempeño en pensamiento crítico.", "§4.4.2"),
]

EN_ESCENA = [
 ("McLuhan", "El medio es el mensaje. Da la pregunta problema.", "Láminas 4 y 6"),
 ("Martín-Barbero", "De los medios a las mediaciones. Da el lugar donde se busca la respuesta, y la raíz latinoamericana.", "Lámina 7"),
 ("Liang et al. (2025)", "Entre el 10 y el 24 % de la comunicación pública analizada con marcas de escritura asistida.", "Lámina 10"),
 ("Kosmyna et al. (2025)", "El 83 % no pudo citar lo que acababa de escribir. Deuda cognitiva.", "Lámina 11"),
 ("Clarke y Joffe (2025)", "Reasignación situada de roles, más allá del binario reemplazo/aumento.", "Lámina 13"),
 ("Petricini, Islas, Scolari", "Sostienen la lectura de la IA como medio y ambiente desde la ecología de los medios.", "Se nombran de paso"),
]
EN_BANCA = [
 ("Winner (1980), Crawford (2021)", "Los artefactos tienen política; la IA es infraestructura material y extractiva.", "Si preguntan por poder e infraestructura"),
 ("Noble, Benjamin, Eubanks", "Los sistemas automatizados reproducen jerarquías bajo apariencia de neutralidad.", "Si preguntan por sesgo y desigualdad"),
 ("Agarwal, Naaman y Vashistha (2024)", "Las sugerencias empujan hacia estilos occidentales y estrechan la diversidad léxica.", "Si preguntan por homogeneización"),
 ("Brynjolfsson, Li y Raymond (2025)", "La IA sube la productividad, sobre todo en trabajadores junior.", "Si objetan que también hay beneficios"),
 ("Lee et al. (2025), Gerlich (2025)", "Trampa de la confianza y descarga cognitiva.", "Si preguntan por el mecanismo del daño"),
 ("Ong, Heidegger, Postman, Benjamin, Habermas", "La genealogía larga: tecnologías de la palabra, técnica, ecología cultural, reproductibilidad y racionalidad.", "Si preguntan por el marco teórico amplio"),
 ("Farías Ocampo et al. (2025)", "Periodistas de Puebla: la IA como aliada y como inquietud ética.", "Si piden evidencia regional"),
 ("Bender et al. (2021)", "Loros estocásticos: fluidez no es comprensión.", "Si preguntan qué es realmente el modelo"),
]
PREGUNTAS = [
 ("¿Por qué McLuhan y no un marco más reciente?",
  "Porque la pregunta que necesito no es sobre capacidades del modelo sino sobre qué reorganiza su uso. Esa pregunta la formula la ecología de los medios, y es una posición vigente y revisada por pares: Petricini (2024), Islas et al. (2024) y Scolari (2023) la sostienen hoy para la IA generativa."),
 ("¿No estás ignorando que la IA también mejora el trabajo?",
  "No. Brynjolfsson, Li y Raymond documentan ganancias de productividad y aprendizaje, sobre todo en junior. Lo que sostengo es que la productividad no agota el análisis: la misma tecnología puede erosionar el criterio en ciertas condiciones de uso y favorecerlo en otras. Eso reorienta la pregunta hacia las condiciones de incorporación."),
 ("¿Cómo vas a medir el criterio o la voz propia?",
  "No los mido. El enfoque es cualitativo e interpretativo: entrevistas y observación de prácticas situadas. Lo que busco es cómo los propios profesionales describen, nombran e interpretan esa reconfiguración. La metodología detallada está fuera del alcance del anteproyecto."),
 ("¿Por qué América Latina?",
  "No porque la región sea el lugar donde ocurre el caso, sino porque mirar el fenómeno desde aquí, desde la desigualdad de acceso y los usos cotidianos, revela dimensiones que los estudios de otros sitios no alcanzan a ver. Además, la mayoría de los estudios empíricos revisados se hizo en contextos anglosajones o europeos."),
 ("¿Qué es exactamente una ontología relacional? ¿No es solo un esquema?",
  "No es una taxonomía cerrada. Es una manera de nombrar las entidades y las relaciones que reaparecen en estas prácticas, y su función es metodológica: cada relación que el marco vuelve visible se convierte en una categoría con la que se leerán las entrevistas. El marco no decora la investigación, le da los ojos con que mira sus datos."),
 ("¿Y el poder? Hablas de criterio individual, pero esto lo deciden las plataformas.",
  "Está en el marco. El criterio individual se ejerce sobre un terreno que nunca es neutro: hay infraestructura material y extractiva (Crawford), sesgos documentados (Noble, Benjamin, Eubanks) y una política de la técnica que decide qué se vuelve visible (Winner). En la charla no cabe; en el documento ocupa la sección 4.5."),
 ("¿No es esto simplemente alfabetización en prompts?",
  "Explícitamente no. El proyecto no se conforma con esa noción: su contribución es describir y nombrar la reconfiguración del pensar, escribir y comunicar desde la experiencia de profesionales creativos latinoamericanos."),
]

def md():
    o = [f"# {deck['title']}", f"\n*{deck['subtitle']}*\n",
         f"**Autora:** {deck['autora']}  ", f"**Curso:** {deck['curso']}  ",
         f"**Formato:** {deck['formato']}  ", f"**Registro:** {deck['registro']}  ",
         f"**Fuente de todo el contenido:** el anteproyecto, `{deck['fuente']}`\n",
         "\n> Guía de estudio. Documento lineal y autocontenido, pensado para repasar la charla "
         "lámina por lámina: la idea, lo que se ve, lo que se dice y de dónde sale en el anteproyecto. "
         "Al final hay un glosario de conceptos, un mapa de autores y un banco de preguntas probables.\n",
         "\n---\n\n## 1. El argumento completo, de corrido\n",
         "Las veinte ideas que recibe el público, en orden. Si esta lista se lee sola y se entiende, "
         "la charla funciona.\n"]
    for c in all_c:
        o.append(f"{int(c['id'])}. {c['entrega']}")
    tot = sum(len(c["guion"].split()) for c in all_c)
    o += ["\n---\n\n## 2. Estructura y tiempo\n",
          "| Bloque | Láminas | Minutos |", "|---|---|---|"]
    for s in secs:
        o.append(f"| {s['section']['title']} | {s['section']['laminas']} | {s['section']['tiempo']} |")
    o += [f"| **Total** | **{len(all_c)}** | **6:40** |\n",
          f"\nEl guion completo tiene **{tot} palabras**. A 20 segundos por lámina eso son unas "
          f"{tot/len(all_c):.0f} palabras por lámina y un ritmo de {tot/400*60:.0f} palabras por minuto. "
          "Es un ritmo hablado y pausado, no de lectura: deja aire para respirar y para que una "
          "imagen se vea antes de explicarla.\n",
          "\n---\n\n## 3. Las veinte láminas en detalle\n"]
    for s in secs:
        o.append(f"\n### Bloque {s['section']['id']} · {s['section']['title']}\n")
        o.append(f"*{s['section']['laminas']} lámina(s), {s['section']['tiempo']}.*\n")
        for c in s["cards"]:
            o += [f"\n#### Lámina {c['id']} · {c['name']}\n",
                  f"**Idea de la lámina.** {c['idea_central']}\n",
                  f"**Lo que se lleva el público.** {c['entrega']}\n",
                  f"**En pantalla.** {pantalla(c)}\n",
                  f"**Elemento visual.** {visual(c)}\n",
                  f"**Guion, 20 segundos ({len(c['guion'].split())} palabras).**\n",
                  f"> {c['guion']}\n",
                  f"**De dónde sale.** {c['soporte']['seccion']}:\n",
                  f"> {c['soporte']['cita']}\n"]
            if c.get("speaker"): o.append(f"**Nota de producción.** {c['speaker']}\n")
    o += ["\n---\n\n## 4. Conceptos clave\n",
          "Los términos que la charla usa y que conviene poder definir si preguntan.\n"]
    for n, d, s_ in CONCEPTOS:
        o.append(f"\n**{n}** *(anteproyecto {s_})*  \n{d}\n")
    o += ["\n---\n\n## 5. Quién aparece en la charla\n",
          "\n| Autor | Qué aporta | Dónde |", "|---|---|---|"]
    for a, q, d in EN_ESCENA: o.append(f"| {a} | {q} | {d} |")
    o += ["\n### Quién queda en la banca\n",
          "No caben en 6:40, pero sostienen el documento y sirven para responder.\n",
          "\n| Autor | Qué aporta | Cuándo sacarlo |", "|---|---|---|"]
    for a, q, d in EN_BANCA: o.append(f"| {a} | {q} | {d} |")
    o += ["\n---\n\n## 6. Las cifras y sus fuentes\n",
          "\n| Cifra | Qué dice | Fuente |", "|---|---|---|",
          "| 10–24 % | De la comunicación pública e institucional analizada mostraba marcas de redacción asistida por modelos de lenguaje, hacia finales de 2024 | Liang et al., 2025 |",
          "| 83 % | De los participantes no logró citar lo que acababa de escribir, con disminución del sentido de propiedad sobre el texto. Medido con EEG | Kosmyna et al., 2025 |",
          "| 86 / 14 % | Proporción aproximada de estudios empíricos revisados en contextos anglosajones o europeos frente a América Latina | Estimación propia sobre el estado del arte del anteproyecto |",
          "\n> Cuidado con la última: es una estimación de la autora sobre su propia revisión, no un dato publicado. Decirlo así si preguntan.\n",
          "\n---\n\n## 7. Preguntas probables\n"]
    for q, a in PREGUNTAS:
        o += [f"\n**{q}**\n", f"{a}\n"]
    o += ["\n---\n\n## 8. Las dos preguntas, textuales\n",
          "\n**Pregunta problema.** Si el medio es el mensaje, ¿cuál es el «mensaje» de la IA generativa como medio?\n",
          "\n**Pregunta de investigación.** ¿Cómo describen los profesionales creativos la reconfiguración de su forma de pensar, escribir y comunicar al integrar la IA generativa en su trabajo cotidiano?\n",
          "\n**Las cuatro subpreguntas.**\n",
          "1. Reasignación de roles desde el pensar: ¿qué tareas y decisiones delegan, retienen o supervisan los profesionales al usar IA generativa?",
          "2. Autoría desde la escritura: ¿cómo cambian sus prácticas de escritura y su sentido de autoría y voz propia?",
          "3. Criterio desde la cognición: ¿qué nociones de competencia, criterio y dependencia emergen en ese uso cotidiano?",
          "4. El medio como ambiente: ¿qué revela esa reconfiguración sobre la IA generativa entendida como medio, y no como herramienta?\n",
          "\n> Las cuatro subpreguntas no aparecen en la charla: no cabían. Están acá porque son lo primero que puede preguntar un jurado.\n"]
    return "\n".join(o)

texto = md()
out = R/"build"/"guia-de-estudio.md"
out.write_text(texto, encoding="utf-8")

# verificacion: las citas siguen siendo textuales del anteproyecto
def N(x): return re.sub(r"\s+"," ",re.sub(r"\*\*|\*|`|&nbsp;|\\|_","",x)).strip()
SRC = N(FUENTE)
malas = [c["id"] for c in all_c if N(c["soporte"]["cita"]) not in SRC]
if malas: raise SystemExit("citas no textuales: " + ", ".join(malas))
print(f"escrito: {out}")
print(f"{len(all_c)} láminas · {len(texto.split())} palabras · {len(texto)//1024} KB")
print(f"citas verificadas: {len(all_c)}/{len(all_c)} textuales")
