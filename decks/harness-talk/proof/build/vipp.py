import os
_HERE = os.path.dirname(os.path.abspath(__file__))
_P = lambda *p: os.path.normpath(os.path.join(_HERE, "..", *p))
# VIPP Search Harness deck — fuller walkthrough, sharing the exact base
# stylesheet of harness-proof-slides.html. Adds the note's missing content:
# parallel table, the three cited definitions, built-by-workflows, the trace
# (ReAct), two senses of skill, and the one-playbook drift map.
PROOF = _P("harness-proof-slides.html")
OUT   = _P("vipp-slides.html")

base = open(PROOF, encoding="utf-8").read()
head = base[: base.index("</style>")]
head = head.replace("Operators, Not Authors: How the Eval Harness Was Specified",
                    "VIPP Search Harness · Globant slides")
# Pin to the light Globant palette; never invert with the viewer's OS dark mode.
head = head.replace('<html lang="en">', '<html lang="en" data-theme="light">')

VIPP_CSS = '''
  /* ===== VIPP additions (shares the base stylesheet above) ===== */
  .vp-eqline{font-family:var(--font-mono);font-weight:700;font-size:19px;margin-top:20px;color:var(--ink);}
  .vp-eqline b{color:var(--signal);}
  .vp-chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px;}
  .vp-chip{font-family:var(--font-mono);font-size:12.5px;padding:6px 13px;border-radius:999px;
    border:1px solid var(--line-strong);color:var(--ink-soft);background:var(--sheet);}
  .vp-chip b{color:var(--ink);font-weight:650;}
  .vp-dwrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;}
  svg.vp-dia{width:100%;height:100%;display:block;}
  svg.vp-dia text{font-family:var(--font-mono);fill:var(--ink);}
  .vp-ztag{font-size:11px;font-weight:600;letter-spacing:.12em;}
  .vp-ztitle{font-weight:700;letter-spacing:-.01em;}
  .vp-zsub{font-size:11px;fill:var(--ink-soft);}
  .vp-ntitle{font-weight:650;fill:var(--signal);}
  .vp-nsub{font-size:11px;fill:var(--ink-soft);}
  .vp-enum{font-size:13px;font-weight:700;fill:var(--warn);}
  .vp-elabel{font-size:11px;fill:var(--ink-soft);}
  /* twin zoned panels */
  .vp-twin{display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;min-height:0;align-items:stretch;}
  .vp-zpanel{border-radius:14px;padding:22px;display:flex;flex-direction:column;justify-content:center;box-shadow:var(--shadow);}
  .vp-zpanel.fixed{background:rgba(0,41,46,.04);border:1.5px solid var(--line-strong);}
  .vp-zpanel.dyn{background:var(--signal-wash);border:1.5px solid var(--signal);}
  .vp-zph{font-family:var(--font-mono);font-size:15px;font-weight:700;}
  .vp-zpanel.fixed .vp-zph{color:var(--ink);}
  .vp-zpanel.dyn .vp-zph{color:var(--signal);}
  .vp-psub{font-family:var(--font-mono);font-size:12px;color:var(--ink-faint);margin:3px 0 0;}
  .vp-chain{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:20px;}
  .vp-cbox{font-family:var(--font-mono);font-size:13px;background:var(--sheet);border:1px solid var(--line-strong);border-radius:8px;padding:9px 13px;}
  .vp-carw{color:var(--ink-faint);font-family:var(--font-mono);}
  .vp-hub{display:flex;flex-direction:column;align-items:center;gap:14px;margin:20px 0;}
  .vp-hubnode{font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--signal);background:var(--sheet);
    border:1.5px solid var(--signal);border-radius:10px;padding:11px 18px;}
  .vp-fan{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
  .vp-sk{font-family:var(--font-mono);font-size:12.5px;color:var(--ink-soft);background:var(--agent-wash);
    border:1px solid var(--agent);border-radius:7px;padding:6px 11px;}
  .vp-znote{font-family:var(--font-mono);font-size:12px;color:var(--signal);margin-top:22px;}
  .vp-zpanel.fixed .vp-znote{color:var(--ink-faint);}
  /* skills */
  .vp-skills{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;flex:1;min-height:0;align-content:center;}
  .vp-skill{background:var(--sheet);border:1px solid var(--line);border-left:3px solid var(--signal);border-radius:11px;padding:15px 17px;box-shadow:var(--shadow);}
  .vp-skill.util{border-left-color:var(--warn);}
  .vp-skill.txt{border-left-color:var(--agent);}
  .vp-skill .sid{font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--signal);}
  .vp-skill.util .sid{color:var(--warn);}
  .vp-skill.txt .sid{color:var(--agent);}
  .vp-skill .schan{font-family:var(--font-mono);font-size:10.5px;color:var(--ink-faint);letter-spacing:.06em;text-transform:uppercase;margin:6px 0 9px;}
  .vp-skill .sdesc{font-size:13px;color:var(--ink-soft);line-height:1.5;}
  /* parallel table */
  .vp-tbl{width:100%;border-collapse:collapse;font-size:13px;}
  .vp-tbl th,.vp-tbl td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--line);vertical-align:top;}
  .vp-tbl thead th{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);border-bottom:1px solid var(--line-strong);}
  .vp-tbl thead th.mine{color:var(--signal);}
  .vp-tbl td.dim{color:var(--ink-faint);}
  .vp-tbl td.mine{color:var(--ink);}
  .vp-tbl .rh{font-family:var(--font-mono);font-weight:650;font-size:12px;color:var(--ink);}
  .vp-tbl code{font-family:var(--font-mono);font-size:.85em;color:var(--signal);}
  /* definitions */
  .vp-defs{display:grid;gap:12px;}
  .vp-def{background:var(--sheet);border:1px solid var(--line);border-radius:11px;padding:14px 18px;box-shadow:var(--shadow);}
  .vp-def.wf{border-left:3px solid var(--ink-faint);}
  .vp-def.ag{border-left:3px solid var(--signal);}
  .vp-def.hn{border-left:3px solid var(--warn);}
  .vp-def .term{font-family:var(--font-mono);font-size:13px;font-weight:700;}
  .vp-def.wf .term{color:var(--ink-faint);}
  .vp-def.ag .term{color:var(--signal);}
  .vp-def.hn .term{color:var(--warn);}
  .vp-def .dbody{font-size:13px;color:var(--ink-soft);margin-top:5px;line-height:1.5;}
  .vp-def .dbody .q{color:var(--ink);font-style:italic;}
  .vp-def cite{display:block;font-family:var(--font-mono);font-size:10px;color:var(--ink-faint);margin-top:6px;font-style:normal;letter-spacing:.02em;}
  /* build: construction vs investigation + callout */
  .vp-callout{margin-top:16px;border:1px solid var(--signal);border-left:3px solid var(--signal);background:var(--signal-wash);
    border-radius:10px;padding:14px 18px;font-family:var(--font-mono);font-size:14.5px;color:var(--ink);line-height:1.5;}
  .vp-callout b{color:var(--signal);}
  /* senses */
  .vp-senses{display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;min-height:0;align-content:center;}
  .vp-sense{background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:20px 22px;box-shadow:var(--shadow);}
  .vp-sense.tools{border-top:3px solid var(--signal);}
  .vp-sense.know{border-top:3px solid var(--warn);}
  .vp-sense .sh{font-family:var(--font-mono);font-size:15px;font-weight:700;}
  .vp-sense.tools .sh{color:var(--signal);}
  .vp-sense.know .sh{color:var(--warn);}
  .vp-sense .sb{font-size:13.5px;color:var(--ink-soft);margin-top:10px;line-height:1.55;}
  .vp-sense .sb em{color:var(--ink);font-weight:600;font-style:normal;}
  .vp-roadmap{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:11px;font-weight:600;
    color:var(--warn);background:var(--warn-wash);border:1px solid var(--warn);border-radius:999px;padding:4px 12px;margin-bottom:14px;}
  /* trace swimlane */
  .vp-trace{display:grid;gap:6px;flex:1;min-height:0;align-content:center;}
  .vp-tstep{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;}
  .vp-tstep .lane{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);text-align:right;}
  .vp-tc{display:flex;align-items:center;gap:11px;background:var(--sheet);border:1px solid var(--line);border-left:3px solid var(--line-strong);border-radius:8px;padding:8px 13px;box-shadow:var(--shadow);}
  .vp-tc .evn{font-family:var(--font-mono);font-size:12.5px;font-weight:650;}
  .vp-tc .note{font-family:var(--font-mono);font-size:12px;color:var(--ink-soft);}
  /* drift map */
  .vp-drift{display:grid;grid-template-columns:210px 1fr;gap:20px;align-items:center;flex:1;min-height:0;}
  .vp-canon{background:var(--sheet);border:1.5px solid var(--warn);border-radius:12px;padding:16px 18px;box-shadow:var(--shadow);}
  .vp-canon .cl{font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--warn);}
  .vp-canon .cf{font-family:var(--font-mono);font-size:14px;font-weight:700;margin-top:5px;color:var(--ink);}
  .vp-canon .cn{font-size:12px;color:var(--ink-soft);margin-top:8px;line-height:1.45;}
  .vp-surfaces{display:grid;gap:8px;}
  .vp-surf{display:flex;align-items:center;gap:11px;background:var(--sheet);border:1px solid var(--line);border-radius:8px;padding:9px 13px;font-family:var(--font-mono);font-size:12.5px;box-shadow:var(--shadow);}
  .vp-tag{font-family:var(--font-mono);font-size:9.5px;font-weight:700;letter-spacing:.05em;padding:3px 8px;border-radius:5px;white-space:nowrap;}
  .vp-tag.live{color:var(--signal);background:var(--signal-wash);border:1px solid var(--signal);}
  .vp-tag.gen{color:var(--warn);background:var(--warn-wash);border:1px solid var(--warn);}
  .vp-surf .sn{color:var(--ink);}
  .vp-surf .sw{color:var(--ink-faint);margin-left:auto;font-size:11px;}
  /* equation: Model + Harness = Agent */
  .vp-eqn{display:flex;align-items:stretch;gap:14px;}
  .vp-ebox{flex:1 1 210px;background:var(--sheet);border:1px solid var(--line-strong);border-radius:12px;padding:20px 22px;box-shadow:var(--shadow);display:flex;flex-direction:column;justify-content:flex-start;}
  .vp-ebox.model{border-top:3px solid var(--ink-faint);}
  .vp-ebox.harnessb{border-top:3px solid var(--signal);flex:1.7 1 300px;}
  .vp-ebox.agentb{border-top:3px solid var(--warn);background:var(--warn-wash);}
  .vp-eop{align-self:center;font-family:var(--font-mono);font-size:26px;font-weight:700;color:var(--ink-faint);flex:none;}
  .vp-ebox .lab{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-faint);}
  .vp-ebox .val{font-family:var(--font-mono);font-weight:700;margin-top:5px;font-size:16px;color:var(--ink);}
  .vp-ebox .esub{font-size:12.5px;color:var(--ink-soft);margin-top:7px;line-height:1.45;}
  .vp-echips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
  .vp-c2{font-family:var(--font-mono);font-size:11.5px;color:var(--ink-soft);background:var(--ground-2);border:1px solid var(--line);border-radius:6px;padding:4px 9px;}
  /* compact variants for the combined tell + equation slide */
  .vp-twin.compact{flex:none;}
  .vp-twin.compact .vp-zpanel{padding:15px 18px;}
  .vp-twin.compact .vp-hub{margin:12px 0;}
  .vp-twin.compact .vp-chain{margin-top:13px;}
  .vp-twin.compact .vp-znote{margin-top:13px;}
  .vp-eqn.compact{margin-top:16px;}
  .vp-eqn.compact .vp-ebox{padding:12px 16px;}
  .vp-eqn.compact .vp-ebox .val{font-size:13.5px;}
  .vp-eqn.compact .vp-ebox .esub{font-size:11.5px;margin-top:5px;}
  .vp-eqn.compact .vp-echips{margin-top:8px;gap:5px;}
  .vp-eqn.compact .vp-c2{font-size:10.5px;padding:3px 7px;}
  .vp-eqn.compact .vp-eop{font-size:22px;}
  /* compressed definitions (merged harness-not-workflow slide) */
  .vp-defrow{display:grid;gap:9px;margin-bottom:16px;}
  .vp-defline{display:grid;grid-template-columns:104px 1fr;gap:14px;align-items:baseline;font-size:13px;}
  .vp-defline .dt{font-family:var(--font-mono);font-size:12.5px;font-weight:700;}
  .vp-defline.wf .dt{color:var(--ink-faint);}
  .vp-defline.ag .dt{color:var(--signal);}
  .vp-defline.hn .dt{color:var(--warn);}
  .vp-defline .dd{color:var(--ink-soft);}
  .vp-defline .dd cite{font-family:var(--font-mono);font-size:10.5px;color:var(--ink-faint);font-style:normal;}
  /* merged skills slide: tight grid + senses strip + drift line */
  .vp-skills.tight{flex:none;gap:11px;}
  .vp-skills.tight .vp-skill{padding:12px 15px;}
  .vp-skills.tight .sdesc{font-size:12px;}
  .vp-skills.tight .schan{margin:5px 0 7px;}
  .vp-senstrip{display:flex;gap:14px;margin-top:16px;}
  .vp-senspill{flex:1;font-family:var(--font-mono);font-size:12px;border-radius:9px;padding:11px 15px;color:var(--ink-soft);}
  .vp-senspill b{font-weight:700;}
  .vp-senspill.tools{background:var(--signal-wash);border:1px solid var(--signal);}
  .vp-senspill.tools b{color:var(--signal);}
  .vp-senspill.know{background:var(--warn-wash);border:1px solid var(--warn);}
  .vp-senspill.know b{color:var(--warn);}
  .vp-driftline{font-family:var(--font-mono);font-size:12.5px;color:var(--ink-soft);margin-top:14px;text-align:center;}
  .vp-driftline b{color:var(--warn);}
'''

FOR="#1f7a3d"; AGT="#6f8f16"; GLD="#a96a1f"; NVY="#00292e"; SHEET="#f6f9f0"; LINE="#cdd8bf"
# event tag colors mapped to Globant
EVC={"ctrl":"#6a7a6e","thought":"#6f8f16","call":"#1f7a3d","result":"#2c9e4f","error":"#b1483f","final":"#a9761f"}

def slide(cls, inner, n, total):
    return (f'<div class="slide {cls}"><span class="brand">Globant<span>&rsaquo;</span></span>'
            f'<div class="body">{inner}</div>'
            f'<div class="foot"><span>HARNESS ENGINEERING &middot; VIPP SEARCH HARNESS</span><span>{n} / {total}</span></div></div>')

DEFS=(f'<defs><marker id="ar" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
      f'<path d="M0,0 L10,5 L0,10 z" fill="{GLD}"/></marker></defs>')

S=[]

# 1 cover
S.append(('cover','''
  <span class="eyebrow">VIPP Search Harness &middot; Architecture Note</span>
  <h1>You don't write the search.<br>You <span class="b">orchestrate the agent</span> that runs it.</h1>
  <p class="lead">A <strong>harness</strong> turns the archive into skills an agent commands, and turns the team from
    search operators into agent orchestrators. Not a search box with an LLM bolted on, and not a workflow.
    It is an agent runtime whose skills happen to be retrieval.</p>
  <div class="vp-eqline">Agent = <b>Model</b> + <b>Harness</b></div>
  <div class="vp-chips">
    <span class="vp-chip"><b>6</b> retrieval skills</span>
    <span class="vp-chip"><b>8</b> event types</span>
    <span class="vp-chip">MCP over <b>stdio</b></span>
    <span class="vp-chip">Gemini <b>3.1 Pro</b> &middot; pluggable</span>
    <span class="vp-chip">&le; <b>12</b> turns / run</span>
  </div>'''))

# 2 harness not workflow (compressed definitions + the tell)
S.append(('','''
  <div class="sechead">
    <span class="eyebrow">Harness, not workflow</span>
    <h2>Who owns the control flow: the code, or the model?</h2>
  </div>
  <div class="vp-defrow">
    <div class="vp-defline wf"><span class="dt">Workflow</span><span class="dd">orchestrated through predefined code paths; the route is authored in code. <cite>Anthropic</cite></span></div>
    <div class="vp-defline ag"><span class="dt">Agent</span><span class="dd">the LLM dynamically directs its own process and tools, choosing its own moves. <cite>Anthropic</cite></span></div>
    <div class="vp-defline hn"><span class="dt">Harness</span><span class="dd">the infrastructure around the model that manages everything except the reasoning. <cite>agent-harness engineering &middot; 2026</cite></span></div>
  </div>
  <div class="vp-twin compact">
    <div class="vp-zpanel fixed">
      <div class="vp-zph">Workflow &middot; fixed path</div>
      <div class="vp-psub">the code decides the route</div>
      <div class="vp-chain">
        <span class="vp-cbox">embed</span><span class="vp-carw">&rarr;</span>
        <span class="vp-cbox">vector search</span><span class="vp-carw">&rarr;</span>
        <span class="vp-cbox">rerank</span><span class="vp-carw">&rarr;</span>
        <span class="vp-cbox">fuse</span><span class="vp-carw">&rarr;</span>
        <span class="vp-cbox">answer</span>
      </div>
      <div class="vp-znote">identical path, every run &middot; no dial for depth</div>
    </div>
    <div class="vp-zpanel dyn">
      <div class="vp-zph">Harness &middot; the model steers</div>
      <div class="vp-psub">the model decides the route</div>
      <div class="vp-hub">
        <div class="vp-hubnode">model chooses &#8635;</div>
        <div class="vp-fan">
          <span class="vp-sk">vector</span><span class="vp-sk">text</span><span class="vp-sk">hybrid</span>
          <span class="vp-sk">transcription</span><span class="vp-sk">multimodal</span><span class="vp-sk">lookup</span>
        </div>
      </div>
      <div class="vp-znote">observe results &middot; decide again &middot; until it answers</div>
    </div>
  </div>
'''))

# 5 architecture (Symphony SVG)
def box(x,y,w,h,t,s):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="{SHEET}" stroke="{LINE}" stroke-width="1.3"/>'
            f'<text class="vp-ntitle" x="{x+16}" y="{y+26}" font-size="13">{t}</text>'
            f'<text class="vp-nsub" x="{x+16}" y="{y+45}">{s}</text>')
arch=f'''<svg class="vp-dia" viewBox="0 0 1160 580" role="img" aria-label="VIPP harness architecture: model plus harness equals agent, with an MCP tool server, six retrieval skills, and a run snapshot store, connected by a numbered loop.">
  {DEFS}
  <rect x="44" y="212" width="220" height="150" rx="14" fill="#eef2e7" stroke="{NVY}" stroke-width="1.8"/>
  <text class="vp-ztag" x="64" y="240" fill="#6a7a6e">MODEL</text>
  <text class="vp-ztitle" x="64" y="266" font-size="16" fill="{NVY}">Gemini 3.1 Pro</text>
  <text class="vp-nsub" x="64" y="288">stateless reasoning</text>
  <text class="vp-nsub" x="64" y="308" fill="#6a7a6e">pluggable &middot; LLM_PROVIDER</text>
  <rect x="308" y="40" width="452" height="490" rx="16" fill="rgba(31,122,61,0.07)" stroke="{FOR}" stroke-width="2"/>
  <text class="vp-ztitle" x="330" y="78" font-size="17" fill="{FOR}">HARNESS</text>
  <text class="vp-zsub" x="330" y="98">everything except the reasoning</text>
  {box(330,116,408,62,"agentLoop()","an async generator &middot; the loop")}
  {box(330,190,408,62,"tool dispatch &middot; MCP","stdio child &middot; tools/call")}
  {box(330,264,408,62,"result pool + sessions","cumulative, deduped memory")}
  {box(330,338,408,62,"verify + bounds","citations &middot; maxTurns = 12")}
  {box(330,412,408,62,"Run snapshot","runs/&lt;ulid&gt;.json &middot; replayable")}
  <rect x="800" y="66" width="320" height="120" rx="14" fill="rgba(191,215,50,0.16)" stroke="{AGT}" stroke-width="1.8"/>
  <text class="vp-ztag" x="820" y="94" fill="{AGT}">AGENT</text>
  <text class="vp-ztitle" x="820" y="120" font-size="16" fill="{NVY}">the investigator</text>
  <text class="vp-nsub" x="820" y="142">searches &middot; refines &middot; verifies &middot; cites</text>
  <text class="vp-nsub" x="820" y="162" fill="#6a7a6e">on its own path</text>
  <rect x="800" y="214" width="320" height="182" rx="14" fill="rgba(0,41,46,0.04)" stroke="#b1c19c" stroke-width="1.5"/>
  <text class="vp-ztag" x="820" y="240" fill="#6a7a6e">TOOL TRANSPORT</text>
  <text class="vp-ztitle" x="820" y="264" font-size="15" fill="{NVY}">stdio MCP server</text>
  <text class="vp-nsub" x="820" y="284" fill="#6a7a6e">spawned as a child &middot; tools/list</text>
  <text class="vp-ntitle" x="820" y="320" font-size="12.5">vector &middot; text &middot; hybrid</text>
  <text class="vp-ntitle" x="820" y="342" font-size="12.5">transcription &middot; multimodal &middot; lookup</text>
  <text class="vp-nsub" x="820" y="372" fill="#6a7a6e">6 retrieval skills</text>
  <rect x="800" y="428" width="320" height="102" rx="14" fill="rgba(169,106,31,0.09)" stroke="{GLD}" stroke-width="1.5"/>
  <text class="vp-ztag" x="820" y="454" fill="{GLD}">STATE</text>
  <text class="vp-ztitle" x="820" y="478" font-size="15" fill="{NVY}">Run snapshot store</text>
  <text class="vp-nsub" x="820" y="498" fill="#6a7a6e">runs/&lt;ulid&gt;.json &middot; replayable</text>
  <text x="286" y="295" text-anchor="middle" font-size="26" font-weight="700" fill="#6a7a6e">+</text>
  <text x="782" y="128" text-anchor="middle" font-size="24" font-weight="700" fill="#6a7a6e">=</text>
  <path d="M264,270 L306,258" fill="none" stroke="{GLD}" stroke-width="2" marker-end="url(#ar)"/>
  <text class="vp-enum" x="270" y="250">&#9312;</text><text class="vp-elabel" x="286" y="250">reasoning</text>
  <path d="M760,150 C784,150 784,130 800,130" fill="none" stroke="{GLD}" stroke-width="2" marker-end="url(#ar)"/>
  <text class="vp-enum" x="762" y="118">&#9313;</text>
  <path d="M760,221 C786,221 786,268 800,268" fill="none" stroke="{GLD}" stroke-width="2" marker-end="url(#ar)"/>
  <text class="vp-enum" x="766" y="212">&#9314;</text><text class="vp-elabel" x="782" y="212">tools/call</text>
  <path d="M800,300 C786,300 786,295 760,295" fill="none" stroke="{GLD}" stroke-width="1.8" stroke-dasharray="6 5" marker-end="url(#ar)"/>
  <text class="vp-enum" x="762" y="322">&#9315;</text>
  <path d="M760,443 C786,443 786,460 800,460" fill="none" stroke="{GLD}" stroke-width="2" marker-end="url(#ar)"/>
  <text class="vp-enum" x="766" y="437">&#9316;</text>
  <path d="M960,186 C960,560 156,560 156,362" fill="none" stroke="{GLD}" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#ar)"/>
  <text class="vp-elabel" x="558" y="552" text-anchor="middle" fill="{GLD}">&#8635; observe results &middot; decide again &middot; until it answers (&le; 12 turns)</text>
</svg>'''
S.append(('',f'''
  <div class="sechead"><span class="eyebrow">The architecture</span>
    <h2>Agent = Model + Harness, mapped to the code.</h2></div>
  <div class="vp-dwrap">{arch}</div>'''))

# (removed: built-by-workflows slide)

# 7 the trace (ReAct realized)
def tstep(lane, ev, evcolor, note):
    return (f'<div class="vp-tstep"><div class="lane">{lane}</div>'
            f'<div class="vp-tc" style="border-left-color:{evcolor}"><span class="evn" style="color:{evcolor}">{ev}</span><span class="note">{note}</span></div></div>')
S.append(('',f'''
  <div class="sechead">
    <span class="eyebrow">The trace</span>
    <h2>Two channels, one verification, a cited answer: the ReAct pattern, realized.</h2>
    <p>One probe, every step a real event from a snapshot on disk. The model tries a vector search, reformulates for
      the text channel, verifies its best hit, then answers.</p>
  </div>
  <div class="vp-trace">
    {tstep("LOOP","tools.loaded",EVC["ctrl"],"6 skills offered to the model")}
    {tstep("LLM","thought",EVC["thought"],"&ldquo;I&rsquo;ll start semantic, then confirm by keyword.&rdquo;")}
    {tstep("&rarr; MCP","tool.call",EVC["call"],"scene_desc_vector_search(&quot;reporter &hellip; wildfire&quot;)")}
    {tstep("SKILL","tool.result",EVC["result"],"10 candidates &middot; 3873 ms")}
    {tstep("&rarr; MCP","tool.call",EVC["call"],"scene_desc_text_search(&quot;reporter evacuation orders wildfire&quot;)")}
    {tstep("SKILL","tool.result",EVC["result"],"10 candidates &middot; pool now deduped to 19")}
    {tstep("&rarr; MCP","tool.call",EVC["call"],"lookup_scene_metadata(&quot;16366763..._scene24&quot;)")}
    {tstep("SKILL","tool.result",EVC["result"],"full scene doc &middot; verified")}
    {tstep("LLM","final",EVC["final"],"&ldquo;...a reporter in a charred field, Level 3 evacuation orders... (scene24)&rdquo;")}
  </div>'''))

# 5 the skills (grid + two senses strip + one-playbook line)
def sk(cls, sid, chan, desc):
    return f'<div class="vp-skill {cls}"><div class="sid">{sid}</div><div class="schan">{chan}</div><div class="sdesc">{desc}</div></div>'
S.append(('',f'''
  <div class="sechead"><span class="eyebrow">The skills</span>
    <h2>Six tools the agent commands over MCP; a playbook layer next.</h2></div>
  <div class="vp-skills tight">
    {sk("vec","vector_search","dense embeddings","Semantic nearest-neighbour over the archive. The default probe when phrasing is loose.")}
    {sk("txt","text_search","lexical / BM25","Exact-term matching for names, codes, and quoted phrases the model must not paraphrase.")}
    {sk("","hybrid_search","vector + lexical","Fuses dense and sparse signals: meaning and exact matches in one call.")}
    {sk("txt","transcription_search","spoken content","Searches transcripts, to find a moment by what was said, not just shown.")}
    {sk("","multimodal_search","vision + text","Searches the frames themselves, to retrieve a scene by what it looks like.")}
    {sk("util","scene_lookup","direct fetch","Resolves a known id straight to its scene, the cheap move once the target is pinned.")}
  </div>
  <div class="vp-senstrip">
    <div class="vp-senspill tools"><b>Capabilities</b> &middot; the tools it calls (frozen schemas, always available)</div>
    <div class="vp-senspill know"><b>Agent Skills</b> &middot; the know-how it reads (playbooks, loaded when relevant, next)</div>
  </div>
  <div class="vp-driftline"><b>One canonical</b> investigation.md; every surface reads it live or is a hash-verified copy.</div>'''))

# eqn slide (Agent = Model + Harness, mapped to this repo) -> inserted as slide 4
eqn_inner = '''
  <div class="sechead">
    <span class="eyebrow">Agent = Model + Harness</span>
    <h2>The formula lands cleanly on the code.</h2>
    <p>The model supplies reasoning; the harness supplies everything else. Because the model is pluggable, a better
      model expands what the harness can do, it does not replace it.</p>
  </div>
  <div class="vp-eqn">
    <div class="vp-ebox model">
      <div class="lab">Model</div>
      <div class="val">Gemini 3.1 Pro</div>
      <div class="esub">stateless reasoning &middot; pluggable via <span class="mono">LLM_PROVIDER</span></div>
    </div>
    <div class="vp-eop">+</div>
    <div class="vp-ebox harnessb">
      <div class="lab">Harness</div>
      <div class="val">everything except the reasoning</div>
      <div class="vp-echips">
        <span class="vp-c2">loop &middot; agent-loop.ts</span>
        <span class="vp-c2">tool dispatch &middot; MCP</span>
        <span class="vp-c2">memory &middot; pool + sessions</span>
        <span class="vp-c2">context &middot; carryover</span>
        <span class="vp-c2">guardrails &middot; verify + bounds</span>
        <span class="vp-c2">state &middot; snapshots</span>
      </div>
    </div>
    <div class="vp-eop">=</div>
    <div class="vp-ebox agentb">
      <div class="lab">Agent</div>
      <div class="val">the investigator</div>
      <div class="esub">a model that searches, refines, verifies, and cites, on its own path</div>
    </div>
  </div>'''
TOTAL=len(S)
body = '<div class="deck">' + "".join(slide(cls, inner, i+1, TOTAL) for i,(cls,inner) in enumerate(S)) + '</div>'
out = head + VIPP_CSS + "</style>\n" + body + "\n</body></html>\n"
assert "—" not in out, "em dash present!"
open(OUT,"w",encoding="utf-8").write(out)
print("wrote", OUT, len(out), "bytes; slides:", TOTAL, "; em-dashes:", out.count("—"))
