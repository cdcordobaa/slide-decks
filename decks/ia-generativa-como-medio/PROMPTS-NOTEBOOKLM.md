# Prompts para NotebookLM

**Antes de nada:** sube `build/guia-de-estudio.md` como fuente del cuaderno. Es el documento
que tiene las 20 láminas con su idea, su guion y su cita. Si subes el PDF del deck en vez del
markdown, NotebookLM lee peor los diagramas, porque son imagen.

Puedes subir también `fuente/anteproyecto-2026-06-18.md` como segunda fuente. Sirve para que
pueda responder preguntas de profundidad, pero **no la subas si quieres que se ciña a la
charla**: con el anteproyecto entero a la mano tiende a irse a las secciones largas.

---

## 1 · Para generar diapositivas (Video Overview)

En NotebookLM: **Studio → Video Overview → Personalizar**. Pega esto.

```
Genera una presentación de exactamente 20 diapositivas en español, una por cada lámina
de la sección "3. Las veinte láminas en detalle" de la fuente, en ese mismo orden, de la
01 a la 20.

En cada diapositiva:
- Un solo titular corto, en mayúsculas, tomado del campo "Lo que se lleva el público".
  Nunca más de diez palabras. Nada de viñetas ni de párrafos.
- La narración de esa diapositiva es el campo "Guion, 20 segundos", dicho tal cual o casi.
  No lo alargues: cada diapositiva dura veinte segundos.
- Cuando la lámina tenga un elemento visual descrito como diagrama, dibuja ese diagrama en
  vez de poner una foto. Los diagramas son: dos columnas enfrentadas (lámina 02), un flujo
  de cuatro pasos (03), dos bloques tachados (12), tres columnas (13), una cadena de cinco
  eslabones (14), dos barras comparadas (18) y una red de ocho nodos (19).
- Cuando la lámina lleve una cifra (10 y 11), la cifra ocupa la diapositiva entera y debajo
  va su fuente.

Estilo visual: fondo claro cálido, casi hueso. Fotografía en blanco y negro cálido cuando
haya foto. Un único color de acento, azul saturado, y úsalo solo para marcar lo que dejó
de ser enteramente humano. Tipografía de palo seco condensada para los titulares.
Prohibido: robots, cerebros, circuitos, manos azules, humanoides y cualquier imagen de
banco. Nada de emojis.

Tono: expositivo y directo, en primera persona, como quien presenta su propia investigación
ante una clase. Sin gancho publicitario y sin cierre motivacional.

No inventes datos. Las únicas cifras que existen son 10–24 % (Liang et al., 2025), 83 %
(Kosmyna et al., 2025) y la proporción 86/14, que es una estimación de la autora sobre su
propio estado del arte y debe presentarse como tal.
```

**Qué esperar.** Va a respetar el orden, los titulares y la narración. Va a fallar en la
paleta y en los diagramas: los hace planos y genéricos. Sirve para estudiar y para tener una
versión narrada, no para reemplazar el deck.

---

## 2 · Para generar el podcast, lámina por lámina

En NotebookLM: **Studio → Audio Overview → Personalizar**. Pega esto.

```
Haz un audio en español, en registro de charla académica, que recorra la presentación
lámina por lámina, de la 01 a la 20, siguiendo la sección "3. Las veinte láminas en
detalle" de la fuente.

Quiero una sola voz que presenta, no una conversación entre dos locutores. Habla en
primera persona, como si fuera la autora exponiendo su propia investigación ante una
clase de maestría. Nada de "hoy vamos a hablar de", nada de "bienvenidos al episodio",
nada de preguntas retóricas entre presentadores.

Estructura para cada una de las veinte láminas, en este orden:
1. Anuncia la lámina y qué se ve en pantalla, en una frase.
   Ejemplo: "Lámina trece. En pantalla, tres columnas: delega, retiene, supervisa."
2. Di el guion de veinte segundos de esa lámina, tal como está en la fuente.
3. Amplía entre treinta y cincuenta segundos con el contenido del campo "De dónde sale",
   explicando de qué sección del anteproyecto viene y qué dice esa sección. Nombra la
   sección en voz alta, por ejemplo "esto sale de la justificación, sección siete punto uno".
4. Pasa a la siguiente sin música ni transición.

Al final, cierra con dos minutos: primero las cinco preguntas más difíciles del banco de
preguntas de la fuente con su respuesta, y después el glosario, definiendo en una frase
cada uno de estos términos: medio, ambiente, mediación, criterio, autoría, reasignación
situada de roles y ontología relacional.

Español de Colombia, tuteando al oyente. Frases cortas. Vocabulario claro: si usas un
término técnico, defínelo en la misma frase.

No inventes nada. No agregues estudios, cifras ni autores que no estén en la fuente. Si
algo no está, dilo: "eso no está en el anteproyecto".
```

**Qué esperar.** NotebookLM tiende a poner dos locutores aunque le pidas uno. Si te salen
dos, vuelve a generar: suele obedecer a la segunda o tercera. La duración te va a quedar
larga, entre veinte y treinta minutos, que para estudiar está bien.

---

## 3 · Variante corta, para repasar antes de exponer

Si lo que quieres es escucharlo la noche anterior, usa este en Audio Overview:

```
Haz un audio de ocho minutos en español, una sola voz, que me ayude a memorizar el orden
de una presentación de veinte láminas.

Recorre las veinte en orden y de cada una di solo dos cosas: el número de lámina y la idea
que entrega, tomada del campo "Lo que se lleva el público". Nada más. Sin explicar, sin
ampliar, sin ejemplos.

Cuando termines las veinte, repítelas otra vez de corrido, más rápido.

Al final di las dos preguntas de la investigación, textuales: la pregunta problema y la
pregunta de investigación.

Español de Colombia. Ritmo pausado, como quien dicta para que el otro memorice.
```

---

## 4 · Otras cosas útiles del mismo cuaderno

- **Mapa mental**: sale bien con esta fuente porque los bloques ya están jerarquizados.
- **Guía de estudio** (la función de NotebookLM, no este documento): genera preguntas de
  repaso sobre el glosario.
- **Preguntas al cuaderno**: prueba con *"¿qué láminas se apoyan en la sección 7.1 y qué
  pasa con mi argumento si el jurado cuestiona esa sección?"*. Esa es la fragilidad real
  del deck y conviene tenerla pensada.
