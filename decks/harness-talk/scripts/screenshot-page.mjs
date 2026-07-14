#!/usr/bin/env node
/* Full-page screenshot of any local HTML (used to preview the storyboard).
 *   NODE_PATH=./node_modules node scripts/screenshot-page.mjs build/storyboard.html build/storyboard.png [width]
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const [input, output, width = "1040"] = process.argv.slice(2);
if (!input || !output) { console.error("usage: screenshot-page.mjs <in.html> <out.png> [width]"); process.exit(2); }

const { chromium } = require("playwright");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: Number(width), height: 1200 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: "networkidle" });
await page.evaluate(async () => document.fonts?.ready);
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.error(`Wrote ${output}`);
