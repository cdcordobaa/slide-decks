# Inspire on Site · Atarraya

Charla del 11 de septiembre, 9:30 a 11:30, para 40 adolescentes de noveno grado
de un colegio publico de Bogota. Dos voces, una sola historia: Cristian y
Juliana.

## Dos piezas, dos casas

| Pieza | Donde vive | Quien la ve |
|-------|------------|-------------|
| **El deck** | Este repo, `charla.html` | La sala. 28 laminas de proyeccion |
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
derecha de las 28 laminas, 25 px de alto. Origen:
`decks/harness-talk/cards-v3/assets/`.

## Arte

Cinco ilustraciones tipo cartel serigrafico con la paleta del deck, mas cinco
fotos de los casos del clasificador. Viven en `assets/art/`.

| Archivo         | Donde                | Que es                                  |
|-----------------|----------------------|-----------------------------------------|
| `apertura.jpg`  | Portada              | Salon lleno de manos levantadas         |
| `garaje.jpg`    | Respuesta 1          | Cuatro amigos, garaje, ano 2000         |
| `datos.jpg`     | Respuesta 2, vertical| Anzuelo que pesca datos personales      |
| `taller.jpg`    | Respuesta 3          | Grupos presentando su asistente         |
| `futuro.jpg`    | Cierre               | Adolescente sobre Bogota al amanecer    |
| `zoo-1..5.jpg`  | Respuesta 2          | Los cinco casos ambiguos perro / gato   |

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

## Fotos reales que faltan

Van en `assets/fotos/` y son lo unico de diseno que bloquea el deck. Mientras no
esten, esas laminas muestran un panel oscuro con el nombre, que se ve
intencional pero no es lo que queremos.

- `cristian.jpg` y `juliana.jpg`, algo no laboral
- `cristian-15.jpg`, foto de adolescente
- `juliana-equipo.jpg`, en su equipo hoy

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
