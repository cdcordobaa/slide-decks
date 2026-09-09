// One-off: screenshot the DaedalusArch how-it-works.html after it animates,
// to use as the print/PDF poster for the embed slide.
import { chromium } from "playwright";
import path from "node:path";

const [, , input, out] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto("file://" + path.resolve(input), { waitUntil: "networkidle" });
await page.waitForTimeout(4500); // let the intro animation settle
await page.screenshot({ path: out });
await browser.close();
console.log("wrote", out);
