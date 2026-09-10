# Inspire on Site · Atarraya

Charla del 11 de septiembre, 9:30 a 11:30, para 40 adolescentes de noveno grado
de un colegio publico de Bogota. Dos voces, una sola historia: Cristian y
Adriana.

## Dos piezas, dos casas

| Pieza | Donde vive | Quien la ve |
|-------|------------|-------------|
| **El deck** | Este repo, `charla.html` | La sala. 54 laminas de proyeccion |
| **La escaleta** | [Notion](https://www.notion.so/arkatechie/3d550d30822781fd8fd7edd72fabfb0b) | Ustedes dos. Horas, reparto, guiones, materiales, pendientes |

La escaleta es un documento de trabajo, no algo que se proyecta, y por eso vive
en Notion y no aca. Este repo guarda **solo lo que se proyecta.**

El flujo es en una sola direccion:

```
Escaleta (Notion)   ->   charla.html (este repo)
ustedes iteran ahi       se regenera desde ella
```

Los cambios hechos directamente en `charla.html` se pierden en la siguiente
regeneracion. Las reglas de esa traduccion estan en `GUIA-VERSION-FINAL.md`
(y en `guia-version-final.html`, para leer o imprimir).

## Estructura

Un hilo: **"¿Quien decide como funciona la tecnologia que usas todos los dias?"**
Se lanza en el minuto 2 y se responde en el 118. Tres respuestas que la charla
desmonta en orden:

1. **La deciden otros, lejos de aqui.** Globant y dos historias de vida.
2. **La deciden los que saben mucho.** Una red neuronal entrenada en vivo.
3. **La decide quien la construye.** El taller y el cierre.

## Un momento de la escaleta no es una lamina

La escaleta tiene 28 momentos y el deck tiene 54 laminas, y eso esta bien: un
momento de 16 minutos no puede ser una sola lamina. Donde la relacion no es
uno a uno:

| Momento | Laminas | Por que |
|---------|---------|---------|
| 07 · Grita tu app | 2 | Despues de gritar hay que mostrar la respuesta |
| 08 · Cristian | 5 | Indice progresivo: se ilumina el momento en curso |
| 11 · Adriana | 5 | Igual, mas la frase dirigida a los hombres de la sala |
| 13 · Seis voluntarios | 2 | El peso de cada neurona tambien va proyectado |
| 15 · Perro o gato | 6 | Un caso por lamina, y la rejilla solo al final |
| 19 · El golpe | 4 | Reveal, ingenieria social, su oficio, y el sesgo |
| 22 y 23 · El taller | 5 | Plantilla, ejemplo resuelto, roles, cronometro |
| 24 · 45 segundos | 3 | Ensayo, presentaciones, votacion |
| 25 · La carrera cambio | 3 | El encuadre de pais y el antimito, cada uno solo |
| 26 · Tres pasos | 2 | "Busca una comunidad" sin decir cual no sirve |

La regla que no cambia: **lo que no este en "En pantalla" no se proyecta.** Que
un momento ocupe cinco laminas no autoriza a subir el guion a ninguna de ellas.

## Sistema visual

Cartel de calle: papel calido, tinta casi negra, bordes gruesos y sombras duras
tipo sticker. Un color por respuesta, mas amarillo cuando participa la sala.

| Color    | Donde                                        |
|----------|----------------------------------------------|
| Lima     | Respuesta 1, de donde sale la tecnologia     |
| Cian     | Respuesta 2, como aprende una maquina        |
| Magenta  | Respuesta 3, la decide quien la construye    |
| Amarillo | Apertura y momentos en que habla la sala     |

El riel superior es un **mapa de tres tramos**: muestra en cual de las tres
respuestas va la charla, sin decir la hora. El reloj es asunto de la escaleta.

## Logo

`assets/globant-ink.svg` (monocromo, fondos claros y de color) y
`assets/globant-white.png` (laminas oscuras y de imagen). Esquina superior
derecha de todas las laminas, 25 px de alto. Origen:
`decks/harness-talk/cards-v3/assets/`.

## Arte

Cinco ilustraciones tipo cartel serigrafico con la paleta del deck, mas cinco
fotos de los casos del clasificador. Viven en `assets/art/`.

| Archivo         | Donde                | Que es                                  |
|-----------------|----------------------|-----------------------------------------|
| `apertura.jpg`  | Portada              | Salon lleno de manos levantadas         |
| `garaje.jpg`    | Respuesta 1          | Cuatro amigos, garaje, ano 2000         |
| `datos.jpg`     | Respuesta 2, vertical| Dos chicos conversando, sin ninguna pista|
| `anzuelo.jpg`   | Respuesta 2, vertical| Anzuelo que pesca datos personales      |
| `taller.jpg`    | Respuesta 3          | Grupos presentando su asistente         |
| `futuro.jpg`    | Cierre               | Adolescente sobre Bogota al amanecer    |
| `zoo-1..5.jpg`  | Respuesta 2          | Los cinco casos ambiguos perro / gato   |

`datos.jpg` y `anzuelo.jpg` son la misma escena en dos tiempos, y el orden es lo
unico que importa: la lamina de las tres preguntas amables no puede insinuar
nada, porque si un solo chico huele la trampa antes de tiempo el golpe se cae.
El anzuelo entra despues, cuando ya se revelo.

Los cinco casos **no son decoracion**: son el material del ejercicio y
reemplazan las cinco impresiones del kit. Cada uno rompe a proposito alguna de
las seis preguntas de las neuronas (el gato en caja, el chihuahua de orejas
puntudas, el pastor aleman con la lengua afuera, el gato con collar).

```bash
echo 'GEMINI_API_KEY=tu_llave' > .env    # gitignored, la llave nunca se versiona
node scripts/gen-art.mjs                 # genera lo que falte
node scripts/gen-art.mjs --force         # regenera todo
node scripts/gen-art.mjs datos --force   # solo una
node scripts/gen-art.mjs --list          # ver los briefs sin generar
```

El script no tiene dependencias y comprime a JPEG con `sips` al terminar: el
deck completo pesa 3,5 MB en vez de 18. Si `sips` no existe se queda el PNG.

## Fotos reales

Van en `assets/fotos/` y son lo unico de diseno que sigue abierto.

| Archivo | Estado |
|---------|--------|
| `cristian.jpg` | Listo. Maraton, no laboral, sirve |
| `adriana.jpg` | Listo. Selfie en el avion, no laboral, sirve |
| `cristian-15.jpg` | **Falta.** Hoy tiene la misma foto de adulto |
| `adriana-equipo.jpg` | **Falta.** Hoy tiene la misma selfie del avion |

Los dos que faltan van a sangre completa en su lamina, asi que se notan. La de
Cristian a los 15 es la mas valiosa del deck: es donde 40 chicos de 15 se ven
reflejados, y si no existe una de esa edad sirve cualquiera anterior a la
universidad. La de Adriana tiene que ser **con su equipo**, y mejor si se nota
que es la unica mujer o casi: la lamina se llama "Lo que hago hoy" y el punto
es el equipo, no la cara.

No se generan con IA: son personas reales. El resto de pendientes (los de
contenido) esta en la escaleta.

## Renderizar

```bash
export NODE_PATH=../product-eng-colombia/node_modules
node ../../skill/scripts/render-pdf.mjs charla.html build/charla.pdf --screenshots build/shots
```

Si `node` viene de nvm es una funcion de shell, no un binario: `env VAR=... node`
falla con "No such file or directory" y el render no corre. Exporten la variable
antes, o usen la ruta absoluta del binario.

El chequeo de overflow reporta los separadores de respuesta y las laminas de
imagen: el numero gigante de fondo y el arte sangran a proposito y quedan
recortados por el marco.
