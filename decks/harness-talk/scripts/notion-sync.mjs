#!/usr/bin/env node
/*
 * notion-sync.mjs — headless bridge between Notion and the local specs/.
 *
 * Interactive use: Claude (this session) is the bridge via the Notion MCP —
 * it already pulled the talk/architecture pages and can push status back.
 * This script is the CI / no-agent path. It talks to the Notion REST API and
 * assumes the source page holds slide specs as ```yaml code blocks (the
 * "designer-agent handoff format" from the architecture doc).
 *
 *   NOTION_TOKEN=secret_xxx node scripts/notion-sync.mjs pull <pageId>
 *   NOTION_TOKEN=secret_xxx node scripts/notion-sync.mjs push-status <pageId> <slide_id> <status>
 *
 * pull        : write every yaml code block on the page to specs/pulled/*.yaml
 * push-status : find the yaml block whose text contains `slide_id: "<id>"`,
 *               rewrite its `status:` line, and update the block in Notion.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPECS = path.join(HERE, "..", "specs");
const VALID_STATUS = ["draft", "needs data", "ready for design", "designed", "reviewed"];

async function getClient() {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error(
      "NOTION_TOKEN is not set.\n" +
        "  Create an internal integration at https://www.notion.so/my-integrations,\n" +
        "  share the talk page with it, then:\n" +
        "    export NOTION_TOKEN=secret_xxx\n\n" +
        "  (Interactively, ask Claude to sync via the Notion MCP instead — no token needed.)"
    );
    process.exit(1);
  }
  let Client;
  try {
    ({ Client } = await import("@notionhq/client"));
  } catch {
    console.error("Missing dependency. Run:  npm install @notionhq/client");
    process.exit(1);
  }
  return new Client({ auth: token });
}

const plain = (rich) => (rich ?? []).map((r) => r.plain_text).join("");

async function fetchAllBlocks(notion, blockId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

function yamlCodeBlocks(blocks) {
  return blocks.filter((b) => b.type === "code" && b.code?.language === "yaml");
}

async function pull(pageId) {
  const notion = await getClient();
  const blocks = await fetchAllBlocks(notion, pageId);
  const yamlBlocks = yamlCodeBlocks(blocks);
  if (!yamlBlocks.length) {
    console.error("No ```yaml code blocks found on that page. Add slide specs as yaml code blocks first.");
    process.exit(1);
  }
  const outDir = path.join(SPECS, "pulled");
  fs.mkdirSync(outDir, { recursive: true });
  yamlBlocks.forEach((b, i) => {
    const text = plain(b.code.rich_text);
    const idMatch = text.match(/slide_id:\s*["']?([\w.]+)/);
    const name = idMatch ? `slide-${idMatch[1]}.yaml` : `block-${String(i + 1).padStart(2, "0")}.yaml`;
    fs.writeFileSync(path.join(outDir, name), `# pulled from Notion block ${b.id}\n${text}\n`);
  });
  console.log(`Pulled ${yamlBlocks.length} yaml block(s) → ${path.relative(process.cwd(), outDir)}/`);
  console.log("Review, then merge into specs/section-*.yaml.");
}

async function pushStatus(pageId, slideId, status) {
  if (!VALID_STATUS.includes(status)) {
    console.error(`Invalid status "${status}". Use one of: ${VALID_STATUS.join(", ")}`);
    process.exit(1);
  }
  const notion = await getClient();
  const blocks = await fetchAllBlocks(notion, pageId);
  const target = yamlCodeBlocks(blocks).find((b) =>
    new RegExp(`slide_id:\\s*["']?${slideId.replace(/\./g, "\\.")}\\b`).test(plain(b.code.rich_text))
  );
  if (!target) {
    console.error(`No yaml block found containing slide_id: ${slideId}`);
    process.exit(1);
  }
  const text = plain(target.code.rich_text);
  const next = /^status:/m.test(text)
    ? text.replace(/^status:.*$/m, `status: "${status}"`)
    : `${text.replace(/\s*$/, "")}\nstatus: "${status}"\n`;
  await notion.blocks.update({
    block_id: target.id,
    code: { language: "yaml", rich_text: [{ type: "text", text: { content: next } }] },
  });
  console.log(`Updated ${slideId} → status: "${status}" (block ${target.id})`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "pull" && args[0]) return pull(args[0]);
  if (cmd === "push-status" && args.length === 3) return pushStatus(args[0], args[1], args[2]);
  console.log(
    "Usage:\n" +
      "  node scripts/notion-sync.mjs pull <pageId>\n" +
      "  node scripts/notion-sync.mjs push-status <pageId> <slide_id> <status>"
  );
  process.exit(cmd ? 1 : 0);
}

main().catch((err) => {
  console.error(`notion-sync failed: ${err.message}`);
  process.exit(1);
});
