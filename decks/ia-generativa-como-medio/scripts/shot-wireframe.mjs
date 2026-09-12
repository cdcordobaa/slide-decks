import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1200 } });
await p.goto(pathToFileURL(path.resolve("build/wireframe.html")).href, { waitUntil: "networkidle" });
await p.pdf({ path: "build/wireframe.pdf", printBackground: true, format: "A3", landscape: true,
              margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" } });
const n = await p.locator(".card").count();
const ov = await p.evaluate(() => [...document.querySelectorAll(".frame")]
  .filter(f => f.scrollWidth > f.clientWidth + 1 || f.scrollHeight > f.clientHeight + 1).length);
console.log(`laminas en el wireframe: ${n}`);
console.log(`marcos con desborde: ${ov}`);
await b.close();
