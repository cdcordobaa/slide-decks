# Product Engineering Made in Colombia (Tribu IA)

Charla en espanol contada a traves de **Tribu IA** y cuatro builders
(Jhon, Diego, Cristian, Rogett). El hilo conductor es **el mapa de la
comunidad**: empieza casi vacio y se llena nodo por nodo hasta revelarse
completo, con las conexiones cruzadas entre panelistas.

Built with the same YAML-cards approach as `../harness-talk`, but with its
own focused renderer (`scripts/build-deck.mjs`) and a theme (`theme/deck.css`)
using the official Tribu IA palette (navy #1b2a5e, magenta #dc1b5c, cyan
#00cfff, gold #e9b73c) and the real "Tribu iA/" logo, pulled from tribuia.org
into `cards/assets/brand/`.

## Estructura

```
product-eng-colombia/
├── cards/                YAML sources (one file per bloque)
│   ├── deck.yaml         metadata + build order (deck.core)
│   ├── 00-apertura.yaml  tesis, ciclo de valor, mapa semilla, numeros
│   ├── 01-jhon.yaml      Bloque 1 · Retos (A/B/C/D)
│   ├── 02-diego.yaml     Bloque 2 · Ecole Galia -> Igniters
│   ├── 03-cristian.yaml  Bloque 3 · Track IA Agentica + productos
│   ├── 04-rogett.yaml    Bloque 4 · Proyecto AI + agentes de voz
│   └── 05-cierre.yaml    mapa completo, frases, llamado a la accion
├── theme/deck.css        Tribu IA theme (light, diagram-first)
├── scripts/build-deck.mjs  YAML -> HTML renderer
└── build/                rendered output (gitignored)
```

## Build + render

```bash
npm install                                  # yaml + playwright
npx playwright install chromium              # first time only

npm run build                                # cards -> build/deck.html
NODE_PATH="$PWD/node_modules" npm run render # -> build/deck.pdf + build/shots
```

Render a subset while iterating:

```bash
node scripts/build-deck.mjs cards --ids 0.3,3.d,5.1 --out build/verify.html
```

## El modelo de tarjetas

Cada slide es una `card` en YAML con: `id`, `title`, `subtitle`, un `visual`
(por `kind`), y un `takeaway`. Visual kinds disponibles:

- `map` &mdash; el grafo de la comunidad. `stage: 0..5` controla que nodos
  estan encendidos; los nodos que aparecen en ese stage reciben un halo. La
  topologia (nodos, posiciones, conexiones cruzadas) vive en `MAP` dentro del
  renderer. `highlight: [ids]` resalta nodos especificos (usado en el cierre).
- `pillars` &mdash; los tres pilares del ADN en columnas.
- `cycle` &mdash; el ciclo de valor (Aprender ... Escalar).
- `stats` &mdash; grid de numeros grandes.
- `persona` &mdash; slide "Quien soy": foto (o placeholder) + nombre + rol.
- `product` &mdash; slide "Que construi"; el item con `hero: true` se destaca.
- `video` &mdash; marco poster para el clip de 30 a 90 s (`duration`, `caption`).
- `quotes` &mdash; frases potentes apiladas.
- `bullets` &mdash; lista de llamado a la accion.

Fotos y posters van en `cards/assets/` y se referencian con `photo:` /
`poster:` (rutas relativas a `cards/`).

## Reglas de la casa

- Sin em dashes en el copy del deck (el build lo verifica sobre el HTML).
- El deck fija `data-theme="light"`.
- Los screenshots (`build/shots/`) son QA desechable y estan gitignored.

## Pendientes (del doc de Notion)

- Hero product de Cristian para el video (recomendado: agentes de voz).
- Proyecto individual de Rogett (confirmar cual es el principal).
- Videos: cuales, duracion y quien los edita.
- Fotos reales de los cuatro panelistas.
