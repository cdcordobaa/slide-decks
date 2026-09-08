# Inspire on Site · Atarraya

Marco de la charla del 11 de septiembre, 9:30 a 11:30, para 40 adolescentes de
noveno grado de un colegio publico de Bogota. Dos voces, una sola historia:
Cristian y Juliana.

Fuente de la estructura: Notion, "Estructura charla" dentro de Charla Atarraya.

- `atarraya-deck.html` es el deck. Es la fuente de verdad, no hay build step.
- `build/atarraya-deck.pdf` es el render.
- `assets/` tiene los logos de Globant y el arte generado.
- `build/shots/` son capturas de QA, no se versionan.

## Que hay aqui y que falta

Esto es **el marco**: estructura completa, sistema visual y todos los titulos.
Lo que falta va marcado dentro del deck con recuadros punteados y una etiqueta
negra (`Pendiente`, `Foto`, `Frase ancla`, `El golpe`, `Puente a Juliana`).
Cada uno de esos recuadros es una tarea concreta de contenido.

Pendientes principales:

1. Las cuatro respuestas de Cristian que desbloquean su acto (lamina 08).
2. La frase ancla de Juliana para las ninas (lamina 11).
3. La frase de traspaso entre los dos actos (lamina 09).
4. Fotos reales: Cristian y Juliana no laborales, Cristian adolescente,
   un equipo o la oficina, Juliana en su equipo.
5. Las dos o tres categorias de cliente reconocibles (lamina 06).
6. El ejemplo propio del taller, hecho por ustedes (lamina 21).

## Sistema visual

Cartel de calle limpio: papel calido, tinta casi negra, bordes gruesos y
sombras duras tipo sticker. Nada de degradados ni de iconos genericos.

Un color por acto, mas amarillo cada vez que habla la sala:

| Color    | Significado                                  |
|----------|----------------------------------------------|
| Lima     | Acto 1, de donde sale la tecnologia          |
| Cian     | Acto 2, como aprende una maquina             |
| Magenta  | Acto 3, la decide quien la construye         |
| Amarillo | La sala participa, en cualquier acto         |

Dos dispositivos que se repiten en todas las laminas:

- **Riel de tiempo** arriba: cuanto de las dos horas llevamos. Los chicos
  siempre saben cuanto falta y el que no habla controla el tiempo de un vistazo.
- **Chip de modo** arriba a la derecha: `Hablamos`, `Habla la sala`,
  `Manos a la obra`. Ninguna franja pasa de 20 minutos sin que la sala hable.

## Minuto a minuto

| Lam | Hora  | Bloque                      | Quien              |
|-----|-------|-----------------------------|--------------------|
| 01  | 9:30  | Apertura en frio (imagen)   | Cristian           |
| 02  | 9:32  | La pregunta del hilo        | Cristian           |
| 03  | 9:36  | Presentacion cruzada        | Los dos            |
| 04  | 9:38  | Acto 1                      | Cristian           |
| 05  | 9:39  | El garaje (imagen)          | Cristian           |
| 06  | 9:40  | Globant en cuatro golpes    | Cristian           |
| 07  | 9:46  | Que hacemos, traducido      | Cristian           |
| 08  | 9:50  | Dinamica: grita tu app      | La sala            |
| 09  | 9:52  | Cristian, el camino torcido | Cristian           |
| 10  | 10:08 | Traspaso                    | Cristian           |
| 11  | 10:10 | Dinamica: cierra los ojos   | La sala            |
| 12  | 10:12 | Juliana                     | Juliana            |
| 13  | 10:28 | Acto 2                      | Cristian           |
| 14  | 10:30 | Montaje de la red neuronal  | 6 voluntarios      |
| 15  | 10:34 | Las cuatro rondas           | Cristian y la sala |
| 16  | 10:36 | Los cinco casos (imagenes)  | La sala            |
| 17  | 10:43 | El sesgo, y puente a datos  | Cristian           |
| 18  | 10:45 | Respiro y armado de grupos  | Los dos            |
| 19  | 10:50 | Tus datos valen oro (imagen)| Juliana            |
| 20  | 10:56 | Tres cosas para hoy         | Juliana            |
| 21  | 10:58 | Acto 3                      | Los dos            |
| 22  | 10:58 | Brief del taller            | Los dos            |
| 23  | 11:00 | La plantilla de 5 casillas  | Grupos             |
| 24  | 11:14 | Pitch de 45 segundos (imagen)| Grupos            |
| 25  | 11:20 | La carrera que cambio       | Cristian           |
| 26  | 11:24 | Tres pasos                  | Cristian           |
| 27  | 11:27 | La pregunta, respondida     | Los dos            |
| 28  | 11:29 | Foto grupal (imagen)        | Todos              |

## Logo

`assets/globant-ink.svg` (monocromo, para fondos claros y de color) y
`assets/globant-white.png` (para las laminas oscuras y las de imagen a sangre).
Van en la esquina superior derecha de las 28 laminas, a 25 px de alto.
Origen: `decks/harness-talk/cards-v3/assets/`.

## Arte generado con Gemini

Seis ilustraciones tipo cartel serigrafico con la misma paleta del deck, mas
cinco fotos de los casos ambiguos del clasificador. Van en `assets/art/` y no
se versionan hasta que esten aprobadas.

| Archivo        | Donde        | Que es                                        |
|----------------|--------------|-----------------------------------------------|
| `apertura.png` | Lamina 01    | Salon lleno de manos levantadas               |
| `garaje.png`   | Lamina 05    | Cuatro amigos, garaje, ano 2000               |
| `zoo-1..5.png` | Lamina 16    | Los cinco casos ambiguos perro / gato         |
| `datos.png`    | Lamina 19    | Anzuelo que pesca datos personales            |
| `taller.png`   | Lamina 24    | Grupos presentando su asistente               |
| `futuro.png`   | Lamina 28    | Adolescente sobre Bogota al amanecer          |

Las cinco fotos del clasificador no son decorativas: son el material del
ejercicio y reemplazan las cinco impresiones del kit. Cada una rompe a proposito
alguna de las seis preguntas de las neuronas (el gato en caja, el chihuahua de
orejas puntudas, el perro con la lengua afuera, el gato con collar).

Para generarlas hace falta una llave de Gemini:

```bash
echo 'GEMINI_API_KEY=tu_llave' > .env    # el archivo esta en .gitignore
./scripts/gen-art.sh                     # genera lo que falte
./scripts/gen-art.sh --force             # regenera todo
./scripts/gen-art.sh apertura            # solo una
```

Mientras no exista el arte, las laminas de imagen renderizan con una trama
diagonal en el lugar de la foto y el resto del deck funciona igual.

## Materiales que hay que llevar impresos

- 6 cartulinas, 6 post-its, marcadores gruesos
- 5 fotos ambiguas de perros y gatos (gato en caja, chihuahua, perro de orejas
  puntudas). Los casos ambiguos son los que generan la discusion.
- 10 plantillas del taller, cronometro grande, stickers para el grupo ganador
- Tablero o papelografo libre para la demo de ingenieria social

Plan B sin proyector: toda la charla funciona con cartulina y papel. Solo tres
laminas son realmente necesarias en pantalla.

## Editar y renderizar

Abre `atarraya-deck.html` en el navegador, haz clic en cualquier texto y
escribe. Guarda con Archivo, Guardar como, Pagina web completa.

```bash
NODE_PATH=../product-eng-colombia/node_modules \
  node ../../skill/scripts/render-pdf.mjs \
  atarraya-deck.html build/atarraya-deck.pdf --screenshots build/shots
```

El chequeo de overflow reporta los tres separadores de acto: el numero gigante
de fondo sangra a proposito fuera del borde y queda recortado por el marco.
