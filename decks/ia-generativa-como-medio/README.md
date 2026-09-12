# La IA generativa como medio · Pecha Kucha

Presentación del anteproyecto de tesis de Paola Andrea Caro Burgos.
Maestría en Comunicación Creativa y Medios Emergentes, Universidad Externado de Colombia.

**Formato:** Pecha Kucha. 20 láminas, 20 segundos cada una, 6 minutos 40 segundos.
**Registro:** TED-Ed. Explicar y enseñar, no defender.

## Qué hay acá

| Archivo | Qué es |
|---|---|
| `build/genealogia-c.html` | **El deck.** Se abre en cualquier navegador, sin internet. Editable con un clic |
| `build/genealogia-c.pdf` | El mismo deck en PDF, una lámina por página |
| `build/genealogia-c-notas.md` | Solo el guion hablado, para el teleprompter |
| `GUION-C-genealogia.md` | La opción C completa: estructura, guion y sistema visual |
| `OPCIONES-A-Y-C.md` | Las dos estructuras candidatas, lámina por lámina |
| `PLAN.md` | El plan inicial, con el cotejo contra la fuente |
| `fuente/anteproyecto-2026-06-18.md` | El anteproyecto. Fuente canónica de todo |
| `scripts/build-c.py` | Genera el HTML. Ya se corrió: no hace falta volver a correrlo |

## Cómo se usa el deck

Abre `build/genealogia-c.html` haciendo doble clic.

- **Para editar:** haz clic sobre cualquier texto y escribe. Se edita directo en el navegador.
- **Para guardar tus cambios:** `Archivo > Guardar como... > Página web, completa`. Ese archivo guardado pasa a ser la versión buena.
- **Para presentar:** botón *Presentar* arriba a la derecha. Las láminas avanzan solas cada 20 segundos, con barra de progreso y cuenta regresiva abajo. Flechas para moverte a mano, `Esc` para salir.
- **Para exportar a PDF:** Imprimir, activar gráficos de fondo, horizontal, sin márgenes.

## El sistema visual

Una sola cosa en cuatro estados: **la marca**.

Sin marca en la oralidad (aire que se desvanece). La primera marca con la escritura, quieta. La misma marca repetida idéntica con la imprenta. Y con la IA, la marca aparece antes de que llegue la mano, en otra tinta.

El azul es la tinta que no es tuya. El pez de McLuhan, en la lámina 8, es la única imagen figurativa de toda la charla.

## Pendiente

- [ ] Revisión de Andrea sobre el guion
- [ ] Desarrollar la opción A (la cadena de un texto) al mismo nivel
- [ ] Elegir entre A y C
- [ ] Ensayo contra reloj
- [ ] Añadir dos o tres líneas sobre la imprenta al 4.1.2 del anteproyecto, que hoy no la trata

## Verificación (skill `create-slide-deck`)

El deck se construyó siguiendo `skill/SKILL.md` y `skill/references/editable-html-deck-mechanics.md`.

**Render oficial del repo** (`npm run render`, que llama a `skill/scripts/render-pdf.mjs` con `--fail-on-overflow`):

```
Found 20 slides.
No likely overflow detected.
Saved 20 slide screenshots to build/shots
Wrote PDF: build/genealogia-c.pdf
```

**Checklist funcional** (`node scripts/qa.mjs`), 14 de 14:

edición directa al hacer clic · Presentar entra en modo presentación · una sola lámina a la vez ·
la lámina cabe en pantalla · no editable mientras se presenta · la barra de progreso avanza ·
la cuenta regresiva muestra segundos · las flechas cambian de lámina · Escape sale ·
vuelve a ser editable al salir · la barra de herramientas no sale al imprimir ·
la barra de progreso tampoco · las 20 láminas se imprimen · cada lámina rompe página

## Desviaciones respecto al skill

| Regla del skill | Qué hice | Por qué |
|---|---|---|
| Partir de `assets/editable-deck-template.html` | CSS propio, con las mismas mecánicas | El formato Pecha Kucha necesita temporizador y modo presentación, que la plantilla no trae. Todas las mecánicas del reference se cumplen y están verificadas arriba |
| Logo de la institución arriba a la derecha | **Sin logo** | Esa esquina lleva el número de lámina, que en Pecha Kucha orienta al público. Pendiente de decisión de Andrea |
