// Verify how the embed slide looks in PRINT media (what the shared PDF renders).
import { chromium } from "playwright";
import path from "node:path";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto("file://" + path.resolve("build/deck.html"), { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });
await page.waitForTimeout(1500);
const slides = await page.$$(".slide");
await slides[15].screenshot({ path: "/tmp/print-16.png" }); // slide 16 = DaedalusArch embed
await browser.close();
console.log("wrote /tmp/print-16.png");
