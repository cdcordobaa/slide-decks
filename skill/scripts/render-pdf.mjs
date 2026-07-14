#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function usage() {
  console.error(`Usage:
  node render-pdf.mjs input.html output.pdf [options]

Options:
  --width <value>          PDF width, default 13.333in
  --height <value>         PDF height, default 7.5in
  --screenshots <dir>      Save one PNG per slide
  --fail-on-overflow       Exit non-zero if likely overflow is detected
  --no-inspect             Skip overflow inspection
  --timeout <ms>           Navigation timeout, default 30000

Examples:
  node render-pdf.mjs deck.html deck.pdf
  node render-pdf.mjs deck.html deck.pdf --screenshots deck-shots --fail-on-overflow`);
}

function parseArgs(argv) {
  const args = [...argv];
  const positional = [];
  const options = {
    width: "13.333in",
    height: "7.5in",
    screenshots: "",
    failOnOverflow: false,
    inspect: true,
    timeout: 30000,
  };

  while (args.length) {
    const arg = args.shift();
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (arg === "--width") {
      options.width = args.shift();
    } else if (arg?.startsWith("--width=")) {
      options.width = arg.slice("--width=".length);
    } else if (arg === "--height") {
      options.height = args.shift();
    } else if (arg?.startsWith("--height=")) {
      options.height = arg.slice("--height=".length);
    } else if (arg === "--screenshots") {
      options.screenshots = args.shift();
    } else if (arg?.startsWith("--screenshots=")) {
      options.screenshots = arg.slice("--screenshots=".length);
    } else if (arg === "--fail-on-overflow") {
      options.failOnOverflow = true;
    } else if (arg === "--no-inspect") {
      options.inspect = false;
    } else if (arg === "--timeout") {
      options.timeout = Number(args.shift());
    } else if (arg?.startsWith("--timeout=")) {
      options.timeout = Number(arg.slice("--timeout=".length));
    } else if (arg?.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2) {
    usage();
    process.exit(2);
  }

  return {
    input: path.resolve(positional[0]),
    output: path.resolve(positional[1]),
    options,
  };
}

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    console.error(`Could not load Playwright.

Install it in the current project:
  npm install -D playwright

Or, in Codex desktop, call load_workspace_dependencies and run with:
  NODE_PATH=<bundled-node-modules> node render-pdf.mjs input.html output.pdf

Original error: ${error.message}`);
    process.exit(1);
  }
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const pendingImages = Array.from(document.images).filter((img) => !img.complete);
    await Promise.all(
      pendingImages.map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
      ),
    );
  });
}

async function inspectSlides(page) {
  return page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll(".slide"));
    return slides.map((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      const offenders = [];

      for (const el of Array.from(slide.querySelectorAll("*"))) {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") {
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          continue;
        }

        const overflow =
          rect.left < slideRect.left - 1 ||
          rect.top < slideRect.top - 1 ||
          rect.right > slideRect.right + 1 ||
          rect.bottom > slideRect.bottom + 1;

        if (overflow) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).slice(0, 80) : "",
            text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
          });
        }
      }

      return {
        index: index + 1,
        label: slide.getAttribute("aria-label") || slide.dataset.slideTitle || `Slide ${index + 1}`,
        scrollOverflow:
          slide.scrollHeight > slide.clientHeight + 1 || slide.scrollWidth > slide.clientWidth + 1,
        offenders: offenders.slice(0, 8),
      };
    });
  });
}

async function saveScreenshots(page, screenshotsDir) {
  const dir = path.resolve(screenshotsDir);
  fs.mkdirSync(dir, { recursive: true });

  const slides = await page.locator(".slide").all();
  for (let i = 0; i < slides.length; i += 1) {
    const file = path.join(dir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await slides[i].screenshot({ path: file });
  }
  console.error(`Saved ${slides.length} slide screenshots to ${dir}`);
}

async function main() {
  const { input, output, options } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(input)) {
    throw new Error(`Input HTML not found: ${input}`);
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    page.setDefaultTimeout(options.timeout);
    await page.goto(pathToFileURL(input).href, { waitUntil: "networkidle", timeout: options.timeout });
    await waitForAssets(page);
    await page.emulateMedia({ media: "print" });

    const slideCount = await page.locator(".slide").count();
    if (slideCount === 0) {
      throw new Error("No .slide elements found.");
    }
    console.error(`Found ${slideCount} slides.`);

    if (options.inspect) {
      const report = await inspectSlides(page);
      const risky = report.filter((slide) => slide.scrollOverflow || slide.offenders.length);
      if (risky.length) {
        console.error("Potential slide overflow:");
        for (const slide of risky) {
          console.error(`- ${slide.index}: ${slide.label}`);
          if (slide.scrollOverflow) console.error("  scroll overflow detected");
          for (const offender of slide.offenders) {
            console.error(`  ${offender.tag}.${offender.className}: ${offender.text}`);
          }
        }
        if (options.failOnOverflow) {
          process.exitCode = 1;
        }
      } else {
        console.error("No likely overflow detected.");
      }
    }

    if (options.screenshots) {
      await saveScreenshots(page, options.screenshots);
    }

    await page.pdf({
      path: output,
      printBackground: true,
      preferCSSPageSize: true,
      width: options.width,
      height: options.height,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    console.error(`Wrote PDF: ${output}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
