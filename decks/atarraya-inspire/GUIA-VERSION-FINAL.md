# De escaleta a version final

Como se pasa del guion interno con el que ustedes trabajan a la charla que ve
la sala, y como seguir iterando sin romper nada.

---

## 1. El principio: nada se borra, se muda

El deck original tenia un problema estructural, no una lista de detalles
internos sueltos: **estaba tratando de ser dos documentos a la vez.** Era el
guion de produccion y la superficie proyectada al mismo tiempo. Todo lo que se
sentia interno era guion que se estaba proyectando.

Por eso ahora hay dos archivos:

| Pieza | Donde vive | Quien la ve |
|-------|------------|-------------|
| La escaleta | [Notion](https://www.notion.so/arkatechie/3d550d30822781fd8fd7edd72fabfb0b) | Ustedes dos. Horas, reparto, materiales, guiones, pendientes |
| El deck | Este repo, `charla.html` | La sala. Solo lo que se proyecta |

La escaleta es un documento de trabajo, no un deck. Por eso vive en Notion: ahi
se escribe en prosa, se comenta y se edita a cuatro manos. El repo guarda solo
lo que se proyecta.

Ninguna informacion se perdio. Cambio de casa.

---

## 2. Que sale de la proyeccion

| Que | Como se veia en la escaleta |
|-----|------------------------------|
| El reloj | `10:43 · 17/28` en cada pie, y el riel que avanza con la hora |
| Acotaciones de direccion | `Hablamos`, `Habla la sala`, `Manos a la obra`, "Cristian, 6 minutos" |
| Recuadros punteados | `Pendiente`, `Foto`, `Frase ancla`, `El golpe`, `Puente a Adriana` |
| Instrucciones a ustedes mismos | "Un detalle concreto y algo vergonzoso", "Escena concreta", "Sin regano y con humor" |
| Vocabulario de produccion | Acto, Storytelling, Didactica 1 y 2, Brief, Kit, Micro dinamica, Bloque |
| Meta-narrativa | "Vuelve en el minuto 118", "La pregunta del minuto 2", "Transicion: con tension" |
| Logistica | "8 grupos de 5", "10 plantillas impresas", "8 stickers para el ganador" |

Dos matices, porque no todo es blanco y negro:

- **El riel se queda, sin reloj.** A un chico de 15 le sirve saber cuanto falta.
  En `charla.html` el riel dejo de marcar minutos y marca en cual de las tres
  respuestas va la charla. Ubica sin cronometrar, y ademas es tematico.
- **"Fotografia esto" se queda.** Es de las pocas acotaciones que si le habla a
  la audiencia. Reducida a dos palabras y un icono.

---

## 3. La regla que reemplaza cada acotacion

**La instruccion se convierte en el contenido.** No se traduce: se ejecuta.

En la escaleta:

> `Dinamica de entrada · 2 minutos · Habla la sala`
> **"Cierra los ojos. Imagina a alguien programando. Abrelos."**
> ¿Cuantos imaginaron un hombre? Manos arriba. Ese es el punto de partida.
> Sin regano y con humor.

En la charla, dos laminas de tres palabras:

> **CIERRA LOS OJOS**

> **¿CUANTOS IMAGINARON A UN HOMBRE?**

La etiqueta que decia "esto es una dinamica" era la parte interna. La dinamica
en si es la lamina.

Lo mismo con las historias de vida: en la escaleta son cinco momentos con
instrucciones sobre como contarlos. En la charla son cinco titulos de tres
palabras y una foto. La lamina no explica la estructura de la historia; la
estructura se vive cuando se cuenta.

**El efecto secundario:** desaparece la mitad del texto. Ahi es donde por fin se
cumple lo que ustedes mismos escribieron en el checklist original: si una lamina
tiene un parrafo, sobra.

---

## 4. Como seguir iterando

El flujo es en una sola direccion:

```
Escaleta (Notion)   ->   charla.html (repo)
ustedes iteran ahi       se regenera desde ella
```

Editen la escaleta con toda libertad: es de ustedes y para ustedes. La version
final se reconstruye a partir de ella. **Al reves no:** los cambios hechos
directamente en `charla.html` se pierden en la siguiente regeneracion.

### El formato que hace la traduccion automatica

Para que la charla se pueda construir sin adivinar, escriban cada momento de la
escaleta con estos cuatro campos. Con eso la traduccion deja de ser
interpretacion y pasa a ser mecanica.

```
MOMENTO: el nombre interno, el que quieran

En pantalla:     las palabras exactas que van proyectadas. Maximo una linea.
                 Si son mas de diez palabras, casi seguro pertenecen a
                 "Lo que decimos".
Lo que decimos:  lo hablado. Nunca se proyecta. Aqui va todo el detalle.
Hace la sala:    que hacen los 40. Levantar la mano, gritar, escribir, pararse.
Produccion:      minuto, quien habla, materiales, que hay que preparar antes.
```

**El contrato es simple: lo que no este en "En pantalla" no se proyecta.**

Ejemplo real, el bloque de Adriana:

```
MOMENTO: la demo de ingenieria social

En pantalla:     Tres preguntas rapidas
                 1. ¿Como se llama tu mascota?
                 2. ¿Quien cumple anos este mes?
                 3. ¿Cual fue tu primer colegio?
Lo que decimos:  Adriana arranca sin anunciar nada, en tono de conversacion.
                 Anota las respuestas en el tablero. Despues pausa, senala el
                 tablero y suelta el golpe.
Hace la sala:    Responde en voz alta. Ocho o nueve chicos dan datos reales.
Produccion:      10:50, Adriana, 8 min. Necesita tablero libre y marcador.
```

De ahi salen dos laminas de la charla (las preguntas, y despues el golpe) y una
entrada de la escaleta. Sin que nadie tenga que decidir nada.

### Que pasarme y como

- **Cambio de texto o de orden:** editen la pagina de Notion y avisen. No hace
  falta pasar nada: la escaleta se lee directamente desde ahi.
- **Contenido nuevo:** el bloque de cuatro campos de arriba.
- **Arte nuevo:** describanme la escena y yo escribo el brief y lo genero.
- **Fotos reales:** ponganlas en `assets/fotos/` con los nombres que espera el
  deck (`cristian.jpg`, `adriana.jpg`, `cristian-15.jpg`, `adriana-equipo.jpg`).

---

## 5. Lo que todavia bloquea la version final

La lista viva esta en la escaleta, en Notion, con casillas para ir marcando.
Ninguno es de diseno. Todos son de contenido.

1. Las cuatro respuestas de Cristian: el objeto que lo engancho, que creia que
   iba a ser, el peor fracaso tecnico, que sorprenderia de su trabajo.
2. La frase ancla de Adriana para las ninas, en sus palabras.
3. Las cuatro fotos reales.
4. Que dos o tres categorias de cliente se pueden decir en voz alta.
5. El ejemplo propio del taller, hecho por ustedes.
6. La frase de traspaso entre los dos actos.
7. **El nombre de la charla.** El arranque en frio sin portada es una buena
   decision de direccion, pero el colegio y Atarraya necesitan algo que
   anunciar. Hace falta un titulo aunque nunca se proyecte.

---

## 6. Como presentarla

- **Un solo computador, un solo control, y lo maneja el que no esta hablando.**
  Doble funcion: obliga a escuchar de verdad al otro y controla el tiempo sin
  que haya un reloj en pantalla. Es lo que reemplaza al riel de minutos.
- **La escaleta impresa en papel**, una hoja cada uno. Notion exporta a PDF.
  No en el celular: mirar el celular frente a 40 adolescentes cuesta la sala.
- **Nunca leer la lamina.** Prueba simple: si se puede leer en voz alta, sobra.
- **La sala armada antes de que entren.** Ocho mesas de cinco ya puestas. Mover
  sillas en el minuto 75 cuesta cinco minutos y toda la energia del respiro.
- **Ensayen solo tres momentos:** la presentacion cruzada, el traspaso entre
  ustedes y el cierre a dos voces. El resto sale mejor sin ensayar.
- **Q&A repartido durante la charla**, no al final, y quedense cinco minutos
  despues. Los que mas ganan con esto casi nunca preguntan en publico.
- **Pregunten cuatro nombres en los primeros 15 minutos y usenlos despues.** Es
  la tecnica mas barata y la que mas rinde.
- **Decidan el plan B ya:** cuales tres laminas son imprescindibles si no hay
  proyector, e impriman esas en pliego.
