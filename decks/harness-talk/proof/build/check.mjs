// Verify a built deck: slide count, per-slide overflow, light-mode pin, em dashes.
// Run from decks/harness-talk/ so node resolves the local playwright:
//   node proof/build/check.mjs proof/vipp-slides.html [shots-prefix]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] ?? "");
if (!file) { console.error("usage: node proof/build/check.mjs <deck.html> [shots-prefix]"); process.exit(1); }
const shots = process.argv[3];

const emDashes = (readFileSync(file, "utf8").match(/—/g) ?? []).length;

// colorScheme dark on purpose: the deck must stay pinned to the light palette.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1380, height: 820 }, colorScheme: "dark" });
await page.goto("file://" + file);
await page.waitForTimeout(300);

const report = await page.evaluate(() => {
  const slides = [...document.querySelectorAll(".slide")];
  return {
    slides: slides.length,
    bg: slides.length ? getComputedStyle(slides[0]).backgroundColor : null,
    overflows: slides
      .map((s, i) => {
        const body = s.querySelector(".body") ?? s;
        return body.scrollHeight > body.clientHeight + 1 ? i + 1 : null;
      })
      .filter(Boolean),
  };
});

if (shots) {
  const els = await page.$$(".slide");
  for (let i = 0; i < els.length; i++) {
    await els[i].screenshot({ path: `${shots}-${String(i + 1).padStart(2, "0")}.png` });
  }
}
await browser.close();

const lightPinned = report.bg === "rgb(232, 237, 225)";
console.log(`slides: ${report.slides}`);
console.log(`overflows: ${report.overflows.length ? report.overflows.join(",") : "NONE"}`);
console.log(`light-pinned under dark OS: ${lightPinned ? "YES" : "NO (" + report.bg + ")"}`);
console.log(`em-dashes: ${emDashes}`);
if (report.overflows.length || !lightPinned || emDashes) process.exit(1);
