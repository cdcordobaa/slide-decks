import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1400 } });
await p.goto(pathToFileURL(path.resolve("build/storyboard.html")).href, { waitUntil:"networkidle" });
await p.pdf({ path:"build/storyboard.pdf", printBackground:true, format:"A3",
              margin:{top:"11mm",right:"11mm",bottom:"11mm",left:"11mm"} });
const rows = await p.locator(".row").count();
const ov = await p.evaluate(()=>[...document.querySelectorAll(".row")]
  .filter(r=>r.scrollWidth>r.clientWidth+1).length);
const vacios = await p.evaluate(()=>[...document.querySelectorAll(".idea")].filter(e=>!e.textContent.trim()).length);
console.log(`filas: ${rows} | filas con desborde: ${ov} | ideas vacias: ${vacios}`);
await b.close();
