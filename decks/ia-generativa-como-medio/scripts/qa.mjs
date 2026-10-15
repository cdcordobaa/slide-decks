// QA del checklist de la skill: edicion directa, modo presentacion, impresion limpia.
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";

const file = path.resolve("build/genealogia-c.html");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
const out = [];
const ok = (n, v) => out.push(`${v ? "PASA" : "FALLA"}  ${n}`);

// 1. edicion directa
const first = p.locator(".slide .lead").first();
await first.click();
await p.keyboard.type("XX");
ok("se puede escribir haciendo clic en una lamina", (await first.innerText()).includes("XX"));
await p.keyboard.press("Backspace"); await p.keyboard.press("Backspace");

// 2. modo presentacion
await p.click("#go");
await p.waitForTimeout(400);
ok("Presentar entra en modo presentacion", await p.evaluate(() => document.body.classList.contains("present")));
ok("solo se ve una lamina a la vez",
   (await p.evaluate(() => [...document.querySelectorAll(".slide")].filter(s => getComputedStyle(s).display !== "none").length)) === 1);
ok("la lamina no se sale de la pantalla", await p.evaluate(() => {
     const r = document.querySelector(".slide.on").getBoundingClientRect();
     return r.width <= innerWidth + 1 && r.height <= innerHeight + 1; }));
ok("las laminas no son editables mientras se presenta",
   (await p.getAttribute(".slide.on", "contenteditable")) === "false");
const w1 = await p.evaluate(() => document.querySelector(".pbar i").style.width);
await p.waitForTimeout(1800);
const w2 = await p.evaluate(() => document.querySelector(".pbar i").style.width);
ok("la barra de progreso avanza", parseFloat(w2) > parseFloat(w1 || "0"));
ok("la cuenta regresiva muestra segundos", /\d+s/.test(await p.innerText(".hud .t")));

// 3. avance automatico a los 20s (se comprueba acortando el paso)
await p.evaluate(() => { window.__n = document.querySelector(".hud .n").textContent; });
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(200);
ok("las flechas cambian de lamina", (await p.innerText(".hud .n")) !== (await p.evaluate(() => window.__n)));
await p.keyboard.press("Escape");
await p.waitForTimeout(200);
ok("Escape sale del modo presentacion", !(await p.evaluate(() => document.body.classList.contains("present"))));
ok("vuelve a ser editable al salir", (await p.getAttribute(".slide", "contenteditable")) === "true");

// 4. impresion limpia
await p.emulateMedia({ media: "print" });
ok("la barra de herramientas no sale al imprimir", await p.evaluate(() => getComputedStyle(document.querySelector(".edit-toolbar")).display === "none"));
ok("la barra de progreso no sale al imprimir", await p.evaluate(() => getComputedStyle(document.querySelector(".pbar")).display === "none"));
ok("las 20 laminas se imprimen", (await p.evaluate(() => [...document.querySelectorAll(".slide")].filter(s => getComputedStyle(s).display !== "none").length)) === 20);
ok("cada lamina rompe pagina", await p.evaluate(() => getComputedStyle(document.querySelector(".slide")).breakAfter === "page"));

await b.close();
console.log(out.join("\n"));
console.log(out.some(l => l.startsWith("FALLA")) ? "\n>>> HAY FALLAS" : "\n>>> todo pasa");
process.exit(out.some(l => l.startsWith("FALLA")) ? 1 : 0);
