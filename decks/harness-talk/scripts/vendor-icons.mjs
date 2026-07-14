#!/usr/bin/env node
/* vendor-icons.mjs — extract the Tabler outline icons we use into a committable
 * map (theme/tabler-icons.mjs), so the deck has no runtime dependency on the
 * @tabler/icons package (which stays in node_modules, gitignored).
 *   node scripts/vendor-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";

const SRC = "node_modules/@tabler/icons/icons/outline";
// concept -> Tabler icon file name
const MAP = {
  model: "cpu", tools: "tool", context: "stack-2", memory: "database", state: "server",
  permissions: "lock", evaluation: "circle-check", recovery: "refresh", safety: "shield",
  retry: "refresh", environment: "map-2", human: "user", specs: "file-text", improve: "trending-up",
  coordination: "arrows-split-2", git: "git-branch", terminal: "terminal-2", filesystem: "folder",
  tests: "checklist", browser: "world", api: "plug", custom: "puzzle", missing: "help",
  warning: "alert-triangle", ticket: "ticket", review: "search", workspace: "box", agent: "robot",
  runtime: "player-play", generic: "point",
};

const out = {};
const missing = [];
for (const [k, name] of Object.entries(MAP)) {
  const f = path.join(SRC, name + ".svg");
  if (!fs.existsSync(f)) { missing.push(`${k}:${name}`); continue; }
  const svg = fs.readFileSync(f, "utf8");
  const inner = svg.replace(/[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>[\s\S]*/, "");
  out[k] = inner.replace(/<path stroke="none"[^>]*\/>/g, "").replace(/\s+/g, " ").trim();
}
fs.mkdirSync("theme", { recursive: true });
fs.writeFileSync("theme/tabler-icons.mjs", "// Vendored Tabler outline icons (MIT). Regenerate: node scripts/vendor-icons.mjs\nexport const ICONS = " + JSON.stringify(out) + ";\n");
console.log(`wrote theme/tabler-icons.mjs with ${Object.keys(out).length} icons`);
if (missing.length) console.error("MISSING (fix names):", missing.join(", "));
