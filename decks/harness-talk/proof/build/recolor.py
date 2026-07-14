import os
_HERE = os.path.dirname(os.path.abspath(__file__))
_P = lambda *p: os.path.normpath(os.path.join(_HERE, "..", *p))
SRC=_P("sources", "artifact-0c361fc8-eval-harness.html")
OUT=_P("harness-proof.html")

text = open(SRC, encoding="utf-8").read()

# 1. Drop the claude.ai frame-runtime + outer head; give it a clean standalone head.
idx = text.index("<body>") + len("<body>")
rest = text[idx:]

# 2. Slice out the four :root variable blocks (from first "  :root {" up to the component CSS marker).
p = rest.index("  :root {")
marker = "\n  * { box-sizing: border-box; }"
q = rest.index(marker)
before = rest[:p]          # <title> + <style> open
after  = rest[q:]          # all component CSS + body + script

# 3. Fix the em dash in the <title> (standing no-em-dash rule).
before = before.replace("Operators, Not Authors — How", "Operators, Not Authors: How")

GLOBANT = """  :root {
    --ground: #e8ede1;
    --ground-2: #dbe4cf;
    --sheet: #f6f9f0;
    --ink: #00292e;
    --ink-soft: #3a4a41;
    --ink-faint: #6a7a6e;
    --line: #cdd8bf;
    --line-strong: #b1c19c;
    --grid: rgba(0, 41, 46, 0.05);
    --signal: #1f7a3d;
    --signal-bright: #2c9e4f;
    --signal-wash: rgba(31, 122, 61, 0.10);
    --agent: #6f8f16;
    --agent-wash: rgba(191, 215, 50, 0.20);
    --warn: #a96a1f;
    --warn-wash: rgba(169, 106, 31, 0.12);
    --dead: #b1483f;
    --dead-wash: rgba(177, 72, 63, 0.10);
    --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
    --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --shadow: 0 1px 2px rgba(0,41,46,.05), 0 8px 30px rgba(0,41,46,.07);
    --maxw: 1080px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ground: #0a1a1c; --ground-2: #0e2325; --sheet: #102a2d;
      --ink: #e7f0ea; --ink-soft: #a9bcb0; --ink-faint: #6c8279;
      --line: #1f3a3d; --line-strong: #2b4d50; --grid: rgba(191, 215, 50, 0.05);
      --signal: #4fb56a; --signal-bright: #6ccf85; --signal-wash: rgba(79, 181, 106, 0.12);
      --agent: #bfd732; --agent-wash: rgba(191, 215, 50, 0.14);
      --warn: #e0a44a; --warn-wash: rgba(224, 164, 74, 0.13);
      --dead: #e07b74; --dead-wash: rgba(224, 123, 116, 0.12);
      --shadow: 0 1px 2px rgba(0,0,0,.3), 0 14px 40px rgba(0,0,0,.35);
    }
  }
  :root[data-theme="light"] {
    --ground: #e8ede1; --ground-2: #dbe4cf; --sheet: #f6f9f0;
    --ink: #00292e; --ink-soft: #3a4a41; --ink-faint: #6a7a6e;
    --line: #cdd8bf; --line-strong: #b1c19c; --grid: rgba(0, 41, 46, 0.05);
    --signal: #1f7a3d; --signal-bright: #2c9e4f; --signal-wash: rgba(31, 122, 61, 0.10);
    --agent: #6f8f16; --agent-wash: rgba(191, 215, 50, 0.20);
    --warn: #a96a1f; --warn-wash: rgba(169, 106, 31, 0.12);
    --dead: #b1483f; --dead-wash: rgba(177, 72, 63, 0.10);
    --shadow: 0 1px 2px rgba(0,41,46,.05), 0 8px 30px rgba(0,41,46,.07);
  }
  :root[data-theme="dark"] {
    --ground: #0a1a1c; --ground-2: #0e2325; --sheet: #102a2d;
    --ink: #e7f0ea; --ink-soft: #a9bcb0; --ink-faint: #6c8279;
    --line: #1f3a3d; --line-strong: #2b4d50; --grid: rgba(191, 215, 50, 0.05);
    --signal: #4fb56a; --signal-bright: #6ccf85; --signal-wash: rgba(79, 181, 106, 0.12);
    --agent: #bfd732; --agent-wash: rgba(191, 215, 50, 0.14);
    --warn: #e0a44a; --warn-wash: rgba(224, 164, 74, 0.13);
    --dead: #e07b74; --dead-wash: rgba(224, 123, 116, 0.12);
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 14px 40px rgba(0,0,0,.35);
  }
"""

HEAD = ('<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n')

out = HEAD + before + GLOBANT + after
if "</body>" not in out[-400:]:
    out += "\n</body></html>\n"

open(OUT, "w", encoding="utf-8").write(out)
print("wrote", OUT, len(out), "bytes")
# sanity: confirm no leftover source palette hexes
for h in ("#0e8e86", "#5647c9", "#eef1f7", "#131c2b"):
    print("leftover", h, ":", out.count(h))