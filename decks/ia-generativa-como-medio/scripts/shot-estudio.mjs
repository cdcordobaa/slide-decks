import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(pathToFileURL(path.resolve("build/guia-de-estudio.html")).href, {waitUntil:"networkidle"});
await p.pdf({path:"build/guia-de-estudio.pdf", printBackground:true, format:"A4",
             margin:{top:"18mm",right:"16mm",bottom:"18mm",left:"16mm"}});
console.log("secciones:", await p.locator("h2").count(), "| láminas:", await p.locator("h4").count(),
            "| tablas:", await p.locator("table").count());
await b.close();
