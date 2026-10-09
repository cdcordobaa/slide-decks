// Renders every slide (all gates approved, receipts on) to build/slides/NN.png and build/backup.pdf.
// Usage (from this folder): node scripts/render-backup.mjs   (needs playwright; NODE_PATH may point at another deck's node_modules)
import { chromium } from 'playwright';
import { mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(here, 'build', 'slides'); mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const n = await (async () => { await p.goto('file://' + path.join(here, 'deck.html')); return p.evaluate(() => document.querySelectorAll('.slide').length); })();
for (let i = 1; i <= n; i++) {
  await p.goto(`file://${path.join(here, 'deck.html')}?slide=${i}`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(out, `${String(i).padStart(2, '0')}.png`) });
}
// one PDF page per screenshot, 16:9
const imgs = readdirSync(out).filter(f => f.endsWith('.png')).sort().map(f => `<img src="file://${path.join(out, f)}">`).join('');
await p.setContent(`<style>@page{size:1280px 720px;margin:0}body{margin:0}img{display:block;width:1280px;height:720px;break-after:page}</style>${imgs}`, { waitUntil: 'load' });
await p.pdf({ path: path.join(here, 'build', 'backup.pdf'), width: '1280px', height: '720px', printBackground: true });
await b.close();
console.log(n, 'slides -> build/backup.pdf');
