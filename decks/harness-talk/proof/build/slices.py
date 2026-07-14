import os
_HERE = os.path.dirname(os.path.abspath(__file__))
_P = lambda *p: os.path.normpath(os.path.join(_HERE, "..", *p))
# Build a fixed 16:9 slide deck from the recolored proof page.
# Reuses the page's recolored <style> verbatim; adds a slide framework;
# reflows tall sections; strips em dashes from all copy.
SRC = _P("harness-proof.html")
OUT = _P("harness-proof-slides.html")

full = open(SRC, encoding="utf-8").read()
head_css = full[: full.index("</style>")]   # <head>..<body><title><style> + all component CSS

SLIDE_CSS = r"""
  /* ===== slide framework ===== */
  html, body { height: auto; overflow: auto; background: #c4cfb6; }
  .deck { padding: 34px 0 40px; }
  .slide {
    position: relative; width: 1280px; height: 720px; margin: 0 auto 26px;
    overflow: hidden; background: var(--ground);
    background-image:
      linear-gradient(var(--grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 34px 34px;
    border: 1px solid var(--line-strong);
    box-shadow: 0 10px 34px rgba(0,41,46,.14);
    padding: 44px 56px 48px; display: flex; flex-direction: column;
  }
  .slide .body { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; }
  .slide section { padding: 0; border: 0; }
  .slide .wrap { max-width: none; padding: 0; margin: 0; width: 100%; }
  .slide .sechead { margin: 0 0 18px; max-width: none; }
  .slide .sechead h2 { font-size: 28px; margin: 9px 0 0; }
  .slide .sechead p { font-size: 14px; margin: 9px 0 0; max-width: 96ch; }
  .slide .reveal { opacity: 1; transform: none; }
  /* chrome */
  .brand { position: absolute; top: 28px; right: 46px; font-family: var(--font-mono);
    font-weight: 700; font-size: 17px; color: var(--ink); letter-spacing: -.02em; z-index: 5; }
  .brand span { color: var(--signal-bright); }
  .foot { position: absolute; left: 56px; right: 56px; bottom: 17px; display: flex;
    justify-content: space-between; font-family: var(--font-mono); font-size: 10.5px;
    color: var(--ink-faint); letter-spacing: .1em; text-transform: uppercase; }
  /* cover */
  .slide.cover .body { justify-content: center; }
  .slide.cover h1 { font-family: var(--font-mono); font-weight: 700; font-size: 58px;
    line-height: 1.03; margin: 16px 0 0; letter-spacing: -.01em; }
  .slide.cover h1 .b { color: var(--signal); }
  .slide.cover .lead { font-size: 15.5px; margin-top: 18px; max-width: 78ch; color: var(--ink-soft); }
  .slide.cover .lead strong { color: var(--ink); font-weight: 600; }
  .slide.cover .statrow { margin-top: 24px; }
  /* model fits */
  .slide .model .node { padding: 16px 16px 18px; }
  .slide .model .desc { font-size: 12.5px; }
  /* timeline reflow: 2-col compact cards, no rail */
  .phgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
  .phgrid .ph { padding: 0; }
  .phgrid .ph .dot { display: none; }
  .phgrid .card { margin: 0; padding: 12px 15px; }
  .phgrid .decision { margin: 8px 0 0; font-size: 12.5px; }
  .phgrid .meta { margin-top: 9px; }
  .slide .legend { margin-bottom: 16px; }
  /* deploy compact */
  .slide .skill { padding: 8px 14px; }
  .slide .skill .sk-desc { font-size: 12px; margin-top: 2px; }
  .slide .skill-list { gap: 7px; }
  .slide .cloud { padding: 16px; gap: 11px; }
  /* capstone: codecard left, pipeline right */
  .slide .skillspec { grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
  .slide .codecard pre { font-size: 11.5px; line-height: 1.6; }
  .slide .autopipe { margin-top: 0; }
  .slide .autopipe li { padding: 9px 12px; }
  .slide .autopipe .txt { font-size: 12px; }
  /* principles fit */
  .slide .pr { padding: 15px 18px; }
  .slide .pr p { font-size: 12.5px; }
  /* opener: title + model + manual stacked on one slide */
  .slide.opener .sechead { margin-bottom: 13px; }
  .slide.opener .sechead h2 { font-size: 29px; }
  .slide.opener .sechead p { font-size: 13.5px; }
  .slide.opener .panel { margin-bottom: 13px; }
  .slide.opener .manual { margin-top: 0; }
  .slide.opener .model .node { padding: 12px 14px 14px; }
  .slide.opener .model .desc { font-size: 11.5px; margin-top: 6px; }
  .slide.opener .model .chip { padding-top: 9px; font-size: 11px; }
  .slide.opener .feedback { padding: 9px 16px; font-size: 11.5px; }
  .slide.opener .mcard { padding: 10px 13px; }
  .slide.opener .mcard .mdesc { font-size: 11px; margin-top: 6px; }
  /* one-slide phases: all cards compact, meta hidden */
  .phgrid--all { gap: 9px 14px; }
  .phgrid--all .card { padding: 9px 13px; }
  .phgrid--all .decision { font-size: 11.5px; margin-top: 5px; }
  .phgrid--all .pname { font-size: 14px; }
  .phgrid--all .meta { display: none; }
"""

TOTAL = 4
FOOTL = "HARNESS ENGINEERING · SPEC-DRIVEN PROOF"

def slide(cls, inner, n):
    return (f'<div class="slide {cls}">'
            f'<span class="brand">Globant<span>&rsaquo;</span></span>'
            f'<div class="body">{inner}</div>'
            f'<div class="foot"><span>{FOOTL}</span><span>{n} / {TOTAL}</span></div>'
            f'</div>')

S = []

# 1 — cover
S.append(('cover', '''
  <span class="eyebrow">MIP Evaluation Harness &middot; A Spec-Driven Build</span>
  <h1>We didn't write<br>the harness.<br><span class="b">We specified it.</span></h1>
  <p class="lead">The MIP evaluation harness (two-phase video-pipeline scoring, statistical rigor,
    a multimodal judge, cloud batch jobs) was grown as roughly <strong>ten written-down changes</strong>.
    The team never sat in the editor. It <strong>decomposed intent into discrete units of work</strong>,
    handed each unit to a coding agent, and steered by written record: a proposal, a design, a checklist.
    <strong>Authorship was the agent's job. Orchestration was ours.</strong></p>
  <div class="statrow">
    <div class="stat s"><div class="n">~10</div><div class="k">specified changes</div></div>
    <div class="stat s"><div class="n">7</div><div class="k">shipped</div></div>
    <div class="stat a"><div class="n">2</div><div class="k">active on cloud</div></div>
    <div class="stat w"><div class="n">1</div><div class="k">retired concept</div></div>
    <div class="stat d"><div class="n">1</div><div class="k">road not taken</div></div>
  </div>'''))

# 2 — operating model
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The operating model</span>
    <h2>The specification is the interface between human intent and machine work.</h2>
    <p>An operator states intent as a written spec. A coding agent reads it, together with the project's
      standing context, and implements it. Skills carry the work to the cloud. Every run feeds a result
      back into the next spec.</p>
  </div>
  <div class="panel">
    <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
    <div class="model">
      <div class="node">
        <div class="idx">01 &middot; Human</div><div class="role">Operator</div>
        <div class="desc">States the pain as a numbered problem list and draws the scope fence.</div>
        <div class="chip"><b>role:</b> orchestrator</div><div class="flow">&rarr;</div>
      </div>
      <div class="node spec">
        <div class="idx">02 &middot; Written record</div><div class="role">Specification</div>
        <div class="desc">proposal &middot; design &middot; tasks. The source of truth for <em>why</em> the code looks the way it does.</div>
        <div class="chip"><b>artifact:</b> openspec/changes/&lt;name&gt;</div><div class="flow">&rarr;</div>
      </div>
      <div class="node agent">
        <div class="idx">03 &middot; Coding harness</div><div class="role">Agent</div>
        <div class="desc">Implements against the checklist, ticks boxes, writes the tests named in the tasks.</div>
        <div class="chip"><b>reads:</b> the spec + standing context</div><div class="flow">&rarr;</div>
      </div>
      <div class="node">
        <div class="idx">04 &middot; Deploy &amp; run</div><div class="role">Skills &rarr; Cloud</div>
        <div class="desc">Skills operate the harness and fire Cloud Run Jobs; a real eval validates the change.</div>
        <div class="chip"><b>records:</b> result into the status line</div>
      </div>
      <div class="feedback">
        <span class="k">FEEDBACK &#8635;</span>
        <span>the validating result is written back into the spec, and it becomes the pain that surfaces the next change.</span>
      </div>
    </div>
  </div>'''))

# 3 — operating manual
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The operating manual</span>
    <h2>Set durable guidance once. Every agent starts from the same rules.</h2>
    <p>An orchestrator does not describe the work turn by turn. It sets <b>durable operating guidance once</b>,
      then hands over discrete units, so every agent, on every change, starts from the same rules without being
      re-told. That guidance lives in Markdown.</p>
  </div>
  <div class="manual">
    <div class="mgrid">
      <div class="mcard">
        <div class="mf">CLAUDE.md</div><div class="mrole">standing instructions</div>
        <div class="mdesc">The operating manual. Project and user rules the agent must follow, and that <em>override</em> its defaults. Read first, on every task.</div>
      </div>
      <div class="mcard">
        <div class="mf">memory/*.md</div><div class="mrole">durable decisions</div>
        <div class="mdesc">One fact per file: the candidate/baseline policy, &ldquo;N &ge; 30 for a decision,&rdquo; &ldquo;run everything on cloud.&rdquo; Preferences that survive the session.</div>
      </div>
      <div class="mcard">
        <div class="mf">openspec/config.yaml + specs</div><div class="mrole">the normative rules</div>
        <div class="mdesc">How a spec must be written: <em>SHALL / MUST</em>, one testable <em>Scenario</em> per requirement. The grammar of a valid unit of work.</div>
      </div>
      <div class="mcard ag">
        <div class="mf">SKILL.md</div><div class="mrole">named procedures</div>
        <div class="mdesc">Reusable operations the agent invokes by name (<em>propose a change</em>, <em>run the harness</em>, <em>sync a rubric</em>, <em>add a dimension</em>), so the flow is encoded once, not re-typed per run.</div>
      </div>
    </div>
  </div>'''))

# 4 — unit of work
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The unit of work</span>
    <h2>Every feature is one change, and every change is the same three files.</h2>
    <p>A <em>change</em> moves the system from one agreed state to the next. Its shape is the heart of the
      method: the <em>why</em>, the <em>how</em>, and the <em>checklist</em>, written in that order before a line ships.</p>
  </div>
  <div class="artifacts">
    <div class="panel art"><span class="corner tl"></span><span class="corner br"></span>
      <div class="file"><span class="dot"></span>proposal.md</div>
      <div class="q">// why, and what changes?</div>
      <ul>
        <li>The pain, stated as a numbered problem list</li>
        <li>What changes: capabilities modified or new</li>
        <li>An explicit <b>Non-Goals</b> fence, drawn immediately</li>
      </ul>
      <div class="head-strip">Fenced non-goals later reopen as their <b>own scoped changes</b>: the fence becomes the roadmap.</div>
    </div>
    <div class="panel art"><span class="corner tl"></span><span class="corner br"></span>
      <div class="file"><span class="dot"></span>design.md</div>
      <div class="q">// how, the load-bearing decisions</div>
      <ul>
        <li>Numbered decisions, each with its rationale</li>
        <li>The <b>rejected alternatives</b>, named, with reasons</li>
        <li>A closing Deferred / Non-Goals list</li>
      </ul>
      <div class="head-strip">e.g. <b>&ldquo;keep our own ~100 lines&rdquo;</b> over a managed eval service: full prompt control, named and defended.</div>
    </div>
    <div class="panel art"><span class="corner tl"></span><span class="corner br"></span>
      <div class="file"><span class="dot"></span>tasks.md</div>
      <div class="q">// the checklist + its status</div>
      <ul>
        <li>A behavioral <b>Principle</b> stated <em>before</em> the tasks</li>
        <li>Numbered, checkable units, tests included</li>
        <li>A Status header carrying the <b>validating result</b></li>
      </ul>
      <div class="head-strip"><b>&ldquo;NO SIGNAL at N=5 despite a raw 10-vs-3 tally.&rdquo;</b> The proof, recorded in the spec.</div>
    </div>
  </div>'''))

# 5 — change loop (ring + steps)
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The cadence</span>
    <h2>One change runs this loop. The harness is ten of them in sequence.</h2>
    <p>A concrete pain surfaces from running the last version; it becomes a proposal, a design, a checklist;
      the agent implements; a real eval validates; the folder is archived, and its result seeds the next problem.</p>
  </div>
  <div class="ring-layout">
    <div class="ring-wrap">
      <svg class="ring" viewBox="0 0 600 600" role="img" aria-label="The change lifecycle loop: propose, design, tasks, implement, validate, archive, with a back-edge that supersedes and informs the next change.">
        <circle class="ring-track" cx="300" cy="300" r="210"/>
        <polygon class="arrow" points="510,300 498,293 498,307"/>
        <polygon class="arrow" points="405,481.9 411,469 397,470"/>
        <polygon class="arrow" points="195,481.9 203,470 189,469"/>
        <polygon class="arrow" points="90,300 102,307 102,293"/>
        <polygon class="arrow" points="195,118.1 189,131 203,130"/>
        <polygon class="arrow" points="405,118.1 397,130 411,131"/>
        <path class="backedge" d="M 118 195 C 150 120, 230 95, 292 118"/>
        <polygon class="backedge-arrow" points="300,90 289,110 304,105"/>
        <text class="back-label" x="196" y="150" text-anchor="middle">supersedes /</text>
        <text class="back-label" x="196" y="166" text-anchor="middle">informs</text>
        <g><circle class="node-c" cx="300" cy="90" r="50"/><text class="node-idx" x="300" y="80" text-anchor="middle">01</text><text class="node-verb" x="300" y="99" text-anchor="middle" font-size="15">Propose</text></g>
        <g><circle class="node-c" cx="481.9" cy="195" r="50"/><text class="node-idx" x="481.9" y="185" text-anchor="middle">02</text><text class="node-verb" x="481.9" y="204" text-anchor="middle" font-size="15">Design</text></g>
        <g><circle class="node-c" cx="481.9" cy="405" r="50"/><text class="node-idx" x="481.9" y="395" text-anchor="middle">03</text><text class="node-verb" x="481.9" y="414" text-anchor="middle" font-size="15">Tasks</text></g>
        <g><circle class="node-c" cx="300" cy="510" r="50"/><text class="node-idx" x="300" y="500" text-anchor="middle">04</text><text class="node-verb" x="300" y="519" text-anchor="middle" font-size="14">Implement</text></g>
        <g><circle class="node-c" cx="118.1" cy="405" r="50"/><text class="node-idx" x="118.1" y="395" text-anchor="middle">05</text><text class="node-verb" x="118.1" y="414" text-anchor="middle" font-size="14">Validate</text></g>
        <g><circle class="node-c" cx="118.1" cy="195" r="50"/><text class="node-idx" x="118.1" y="185" text-anchor="middle">06</text><text class="node-verb" x="118.1" y="204" text-anchor="middle" font-size="15">Archive</text></g>
        <text class="center-l" x="300" y="296" text-anchor="middle">THE</text>
        <text class="center-l" x="300" y="314" text-anchor="middle">CHANGE LOOP</text>
      </svg>
    </div>
    <ol class="steps">
      <li><span class="si">01</span><span><span class="sv">Propose</span><div class="sd">State the pain as a numbered list. <b>Draw the Non-Goals fence immediately.</b></div></span></li>
      <li><span class="si">02</span><span><span class="sv">Design</span><div class="sd">Make the load-bearing decisions, and <b>name the rejected alternatives</b> with reasons.</div></span></li>
      <li><span class="si">03</span><span><span class="sv">Tasks</span><div class="sd">Break it into checkable units. <b>State the behavioral principle first.</b></div></span></li>
      <li><span class="si">04</span><span><span class="sv">Implement</span><div class="sd">The agent ticks the boxes and writes the tests the tasks named.</div></span></li>
      <li><span class="si">05</span><span><span class="sv">Validate</span><div class="sd">Run a <b>real eval</b>; record the outcome in the status line. The result is part of the spec.</div></span></li>
      <li><span class="si">06</span><span><span class="sv">Archive</span><div class="sd">Move to <code>archive/&lt;date&gt;-&lt;name&gt;</code>. Its result seeds the next change.</div></span></li>
    </ol>
  </div>'''))

def ph(cls, idx, name, state, decision, meta):
    metas = "".join(f"<span>{m}</span>" for m in meta)
    return (f'<div class="ph {cls}"><div class="dot"></div><div class="card">'
            f'<div class="top"><span class="pidx">{idx}</span><span class="pname">{name}</span><span class="state">{state}</span></div>'
            f'<p class="decision">{decision}</p><div class="meta">{metas}</div></div></div>')

legend = ('<div class="legend">'
          '<span class="li"><span class="sw shipped"></span>shipped &amp; archived</span>'
          '<span class="li"><span class="sw active"></span>active, on cloud</span>'
          '<span class="li"><span class="sw reversal"></span>reversal, retired</span>'
          '<span class="li"><span class="sw abandoned"></span>road not taken</span></div>')

# 6 — phases I (0-4)
ph1 = "".join([
  ph("abandoned","PHASE 0","model-eval-scripts","abandoned","~250 lines on a laptop, no stats, no history. Rejected whole; <b>every non-goal became a feature.</b>",["0 / 22 tasks","never started"]),
  ph("shipped","PHASE 1","eval-framework","shipped","A <b>substrate-agnostic runner</b>: two GCS paths, indifferent to what is at each. Everything later plugged in without restructuring the judge.",["35 / 41","4 dimensions","35 tests"]),
  ph("shipped","PHASE 2","eval-statistical-rigor","shipped","Swap-and-average, sign test, BCa bootstrap CI, BH correction, and a <b>NO SIGNAL honesty gate</b>, plus a golden-vs-golden canary.",["34 / 34","0.65 bar","70 tests"]),
  ph("shipped","PHASE 3","eval-isolated-modes","shipped","A <em>mode</em> holds upstream artifacts constant, so a win is <b>attributable to one step</b>. The open dimensions parameter made this data, not code.",["22 / 24","setup &middot; trigger &middot; compare"]),
  ph("shipped","PHASE 4","eval-data-and-readonly-ui","shipped","Datastore history sink, a read-only dashboard, and <b>rubrics moved to GCS YAML</b> byte-for-byte.",["mip-eval-runs","rubric_sha in every report"]),
])
S.append(('', f'''
  <div class="sechead">
    <span class="eyebrow">The build, phase by phase</span>
    <h2>Grown, not designed. One specified decision at a time.</h2>
  </div>
  {legend}
  <div class="phgrid">{ph1}</div>'''))

# 7 — phases II (5-A2)
ph2 = "".join([
  ph("shipped","PHASE 5","eval-transcription-isolated","shipped","Go <b>multimodal</b>: the judge reads the video plus both transcripts, with a deterministic word-confidence side-channel.",["first multimodal judge"]),
  ph("shipped","PHASE 6","eval-batch-evaluation","shipped","Decouple generate from judge (shared only by <code>batch_id</code>); a fingerprint-keyed <b>cumulative cache</b> tightens CI as N grows.",["21 / 21","cumulative engine"]),
  ph("reversal","PHASE 7","eval-retire-preregistration","reversal","Spec-driven dev <b>catching its own redundancy</b>: delete pre-registration, keep the practice as a field. 169 tests green.",["13 / 14","deletion as an outcome"]),
  ph("active","ACTIVE &middot; A1","eval-batch-generation","active","Productionize Phase 1 as a <b>Cloud Run Job</b>: claim a slice, fire the workflow, poll, record.",["18 / 31","mip-eval-batch-runner"]),
  ph("active","ACTIVE &middot; A2","eval-phase2-job","active","Productionize Phase 2 as a <b>parallel Cloud Run Job</b> with a single finalize pass. The operator can step away.",["7 / 12","mip-eval-phase2-runner"]),
])
S.append(('', f'''
  <div class="sechead">
    <span class="eyebrow">The build, phase by phase &middot; continued</span>
    <h2>The last phase deletes a concept the method had outgrown.</h2>
  </div>
  {legend}
  <div class="phgrid">{ph2}</div>'''))

# 8 — deployment (skills)
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The deployment layer</span>
    <h2>Skills are how the orchestrator operates: named procedures the agent invokes.</h2>
    <p>Each skill absorbs a unit of work the operator would otherwise repeat by hand. Invoke it by name;
      the flow ends on the cloud by standing rule.</p>
  </div>
  <div class="deploy-grid">
    <ul class="skill-list">
      <li class="skill"><div class="sk-name">openspec-propose</div><div class="sk-desc">Describe what you want; get proposal, design, and tasks ready to implement.</div></li>
      <li class="skill"><div class="sk-name">mip-eval-run</div><div class="sk-desc">Operate the harness end-to-end: generate candidate batches, evaluate against a baseline.</div></li>
      <li class="skill"><div class="sk-name">prompt-sync</div><div class="sk-desc">Pull live production prompts into a candidate config, so a prompt change is a clean, isolated arm.</div></li>
      <li class="skill"><div class="sk-name">rubric-sync</div><div class="sk-desc">Author and version a judge rubric; bump rubric_sha so the migration never changes verdicts.</div></li>
      <li class="skill"><div class="sk-name">dimension-add</div><div class="sk-desc">Scaffold a new judged dimension end-to-end: parameter, rubric, report, datastore entity.</div></li>
      <li class="skill"><div class="sk-name">dashboard-sync</div><div class="sk-desc">Publish the read-only dashboard and reconcile the run entities.</div></li>
    </ul>
    <div class="cloud">
      <h3>Skills fire Cloud Run Jobs</h3>
      <div class="job"><div class="jn">mip-eval-batch-runner</div><div class="jd">Phase 1: generate candidate assets; triggers the video-processing Cloud Workflow over a manifest slice.</div></div>
      <div class="job"><div class="jn">mip-eval-phase2-runner</div><div class="jd">Phase 2: judge two batches multimodally, aggregate, persist to the dashboard datastore.</div></div>
      <div class="rule"><b>STANDING RULE &middot;</b> both phases default to the cloud, never the laptop. Local runs die on sleep; cloud jobs survive and finish server-side.</div>
    </div>
  </div>'''))

# 9 — capstone skill
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">The capstone skill</span>
    <h2>One skill chains the whole toolkit into a single command.</h2>
    <p>Every run this program did by hand was the same choreography: scaffold a change, derive two arms,
      fire two cloud jobs, read the verdict, write it back, archive. <code>/eval-change</code> runs it all.</p>
  </div>
  <div class="skillspec">
    <div>
      <span class="proposed-flag">&#9671; The loop-closer &middot; propose &rarr; run &rarr; validate &rarr; archive</span>
      <div class="codecard">
        <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>.cursor/skills/eval-change/SKILL.md</span></div>
<pre><span class="c">---</span>
<span class="k">name</span>: eval-change
<span class="k">description</span>: <span class="s">Turn one hypothesis into a closed
  OpenSpec change: scaffold the unit of work, derive both
  arms, run both cloud jobs, write the verdict back, archive.</span>
<span class="k">reads</span>: [ CLAUDE.md, memory/*, openspec/config.yaml ]
<span class="k">chains</span>: [ prompt-sync, rubric-sync, mip-eval-run,
          dashboard-sync ]
<span class="k">enforces</span>: [ cloud-first, candidate=flash-lite,
            N&gt;=30-for-a-decision, principle-first ]
<span class="c">---</span></pre>
      </div>
    </div>
    <ol class="autopipe">
      <li><span class="stg">propose</span><span class="txt"><b>Scaffold the change</b>: <code>proposal &middot; design &middot; tasks</code>, pain + Non-Goals, the isolation-mode decision with its rejected alternative, a <b>principle-first</b> status header.</span></li>
      <li><span class="stg">generate</span><span class="txt"><b>Derive both arms</b> from the one-line hypothesis: the candidate <code>batch.yaml</code>, the <code>import-baseline</code> config, and the <code>EvalSpec</code>.</span></li>
      <li><span class="stg">run &middot; cloud</span><span class="txt"><b>Fire both Cloud Run Jobs</b> in order (Phase-1 generate, then Phase-2 judge) and poll. Never local.</span></li>
      <li><span class="stg">validate</span><span class="txt"><b>Read the verdict</b>: parse SIGNIFICANT / NO-SIGNAL per dimension straight from the report.</span></li>
      <li><span class="stg">archive</span><span class="txt"><b>Write it back</b>: fill the <code>tasks.md</code> status line with the result and stage the move to <code>archive/</code>. The loop closes itself.</span></li>
    </ol>
  </div>'''))

# 10 — why it compounds
S.append(('', '''
  <div class="sechead">
    <span class="eyebrow">Why it compounds</span>
    <h2>What spec-driven orchestration actually bought us.</h2>
  </div>
  <div class="principles">
    <div class="panel pr"><span class="corner tl"></span><span class="corner br"></span>
      <div class="n">01</div><h3>The &ldquo;why&rdquo; is recoverable</h3>
      <p>Why swap-and-average, why the 0.65 bar, why import-baseline: each is one proposal away, with the rejected alternative named. New engineers inherit reasoning, not just code.</p>
    </div>
    <div class="panel pr"><span class="corner tl"></span><span class="corner br"></span>
      <div class="n">02</div><h3>Pre-shaping made features data</h3>
      <p>A parameter left open in one phase (<code>dimensions</code>, a <code>--mode</code> namespace, rubrics-as-YAML) let the next phase plug in as configuration, not a rewrite.</p>
    </div>
    <div class="panel pr"><span class="corner tl"></span><span class="corner br"></span>
      <div class="n">03</div><h3>The specs predicted the experiments</h3>
      <p>The canary written in Phase 2 <em>is</em> the A/A calibration study that ran months later. Writing the validation down first made it a plan, not an afterthought.</p>
    </div>
    <div class="panel pr"><span class="corner tl"></span><span class="corner br"></span>
      <div class="n">04</div><h3>Deletion is a legitimate outcome</h3>
      <p>Phase 7 retired its own abstraction once it stopped earning its keep: the cleanest result, reachable only because the overlap was written down and visible.</p>
    </div>
  </div>'''))

# Reshape: opener = cover title + operating model + operating manual (folded, no extra slide);
# then unit of work, change loop, one combined phases slide, and skills.
opener_header = '''
  <div class="sechead">
    <span class="eyebrow">MIP Evaluation Harness &middot; A Spec-Driven Build</span>
    <h2>We didn't write the harness. We specified it.</h2>
    <p>An operator states intent as a written spec; a coding agent implements it against the project's
      standing Markdown context; skills carry the work to the cloud; every run feeds a result back into the next spec.</p>
  </div>'''
_model = S[1][1]; _panel = _model[_model.index('<div class="panel">'):]
_manual = S[2][1]; _mgrid = _manual[_manual.index('<div class="manual">'):]
opener_inner = opener_header + _panel + _mgrid

phases_all = ('''
  <div class="sechead">
    <span class="eyebrow">The build, phase by phase</span>
    <h2>Grown, not designed. Ten specified decisions, one at a time.</h2>
  </div>
''' + legend + '<div class="phgrid phgrid--all">' + ph1 + ph2 + '</div>')

S = [('opener', opener_inner), S[3], S[4], ('', phases_all), S[7]]
TOTAL = len(S)
body = '<div class="deck">' + "".join(slide(cls, inner, i+1) for i, (cls, inner) in enumerate(S)) + '</div>'

out = head_css + SLIDE_CSS + "</style>\n" + body + "\n</body></html>\n"

# hard guard: no em dashes anywhere
assert "—" not in out, "em dash present!"
open(OUT, "w", encoding="utf-8").write(out)
print("wrote", OUT, len(out), "bytes; slides:", len(S), "; em-dashes:", out.count("—"))
