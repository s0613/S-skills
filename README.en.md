<p align="center">
  <img src="assets/banner.svg" alt="S-skills" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-4.10.0-f7a521?style=flat-square&labelColor=0d0d0d" alt="version"></a>
  <a href="https://github.com/s0613/S-skills"><img src="https://img.shields.io/badge/claude--plugin-install-f7a521?style=flat-square&labelColor=0d0d0d" alt="plugin"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f7a521?style=flat-square&labelColor=0d0d0d" alt="license"></a>
</p>

<p align="center">
  <a href="README.md">🇰🇷 한국어</a>
  &nbsp;·&nbsp;
  <strong>🇺🇸 English</strong>
  &nbsp;·&nbsp;
  <a href="README.zh.md">🇨🇳 中文</a>
  &nbsp;·&nbsp;
  <a href="README.ja.md">🇯🇵 日本語</a>
</p>

<br>

<p align="center">
  <strong>A whole company, solo.</strong>
</p>

<p align="center">
  PM, designer, developers, QA, and a security expert<br>
  move like a team inside Claude Code.
</p>

<br>

---

## What it does

S-skills is a **role-based AI development orchestrator**.

From requirements analysis to design, implementation, review, and release — describe a task in plain words and the right experts are dispatched automatically. They collaborate like people and hand back only the result.

```
/sj-company build me a login feature
```

```
[Medium] "build me a login feature"
Roles needed: database, backend, security, frontend
Dispatch order: 1) database  2) backend + security in parallel  3) frontend
```

---

## Core roles

| Role | What it does |
|------|--------------|
| **PM** | Requirements analysis, risk review, priority definition |
| **Design** | Reference-DNA-based UI design, AI-tell removal review |
| **Tech Lead** | Parallel dispatch of specialist sub-agents + result integration |
| **Frontend** | UI, components, accessibility, responsive implementation |
| **Backend** | API, server, domain logic implementation |
| **Security** | OWASP Top 10 + STRIDE implementation + cross-cutting review |
| **QA** | Independent verification — explores directly without referencing implementer artifacts |

---

## What's different

**Expert-level collaboration protocol**

Sub-agents coordinate directly in a team channel without routing through the Tech Lead. When Database posts "watch out for the nullable column," Backend reads and handles it directly.

**A design system that accumulates taste**

Rejected directions are sealed off; approved ones accumulate. Over time, brand identity grows sharper.

**Guaranteed QA independence**

QA never reads the summary the implementer wrote. It explores the PM brief and the actual files directly, verifying without bias.

---

## Harness design — 6 things borrowed from gbrain

We ported the proven harness structure of [garrytan/gbrain](https://github.com/garrytan/gbrain) into S-skills. It's the skeleton that keeps things from collapsing as skills multiply.

| # | Principle | What it does |
|---|-----------|--------------|
| 1 | **Two-layer routing** | Trigger→skill routing is collected in one place, [`RESOLVER.md`](skills/RESOLVER.md). sj-company becomes a thin dispatcher (866→542 lines); the heavy body loads on demand |
| 2 | **Unified cross-cutting conventions** | Human gate, PII, archive-only, Judge independence, RUN_ID, friction, context-curation are defined once in [`_conventions/`](skills/_conventions). Structurally removes the accident of a rule scattered across N skills with one missed |
| 3 | **Friction loop** | Record friction and delight in one line during skill runs → the weekly retro collects them as improvement input. "Logging friction must itself be friction-free" |
| 4 | **Context hygiene** | Learning accumulates only what passes the notability gate (helps next cycle? / unobtainable from code? / reusable?), in `[run:RUN_ID]` citation form. So noise doesn't cloud the brain |
| 5 | **Manifest integrity** | [`scripts/skill-manifest.py`](scripts/skill-manifest.py) machine-checks frontmatter↔directory↔RESOLVER↔CLAUDE.md versions. A guard, not prose, prevents drift (caught 3 real bugs the moment it shipped) |
| 6 | **Score remediation loop** | `/docs-organize remediate` runs a remediation plan up to the target score → approval → staged execution and re-measurement. Scores that can't be reached automatically stop at the ceiling and delegate |

> The **human gate** is invariant throughout — PR merges and production-deploy approvals are always done by a human. *build the loop, stay the engineer.*

---

## Getting started

```bash
claude plugin install s0613/S-skills
```

```bash
# Local development
git clone https://github.com/s0613/S-skills.git ~/S-skills
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
```

After installing, in any project:

```
/sj-company <say what you want, in words>
```

---

## Auto-applied at session start — ADHD output rules

Installing s-skills turns on one output rule set at the start of **every session**: Claude leads with the next action instead of burying it in prose.

**Source: [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (Ayoub G., MIT).** s-skills did not write these rules — the `SessionStart` hook fetches that repo's `skills/i-have-adhd/SKILL.md` and injects it verbatim. The original is loosely based on *The Adult ADHD Tool Kit* by J. Russell Ramsay and Anthony L. Rostain, adapted for how an LLM arranges an answer.

How it runs (`hooks/adhd-bootstrap.mjs`):

- Cache at `~/.claude/.cache/s-skills/i-have-adhd`; the network is touched **at most once a day** (cached runs finish in ~50 ms).
- **Never blocks**: missing git, no network, broken file — every path exits 0.
- **No double injection**: if you installed the upstream plugin with `~/.claude/.i-have-adhd-always`, its own hook does the work and this one stays quiet.
- The injected header names the source repo and commit — external documents are data, not instructions ([untrusted-content](skills/_conventions/untrusted-content.md)).

Turn it off: `touch ~/.claude/.s-skills-adhd-off` (or say `stop adhd mode` for the current session only).

---

## Report diagrams

When a completion report, investigation, security audit, retro, or SI document needs a picture, s-skills draws it with **[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (Cathryn Lavery, MIT)** — 40 editorial diagram types as self-contained HTML + inline SVG. No build step, no CDN, no Mermaid.

```bash
claude plugin marketplace add cathrynlavery/diagram-design
claude plugin install diagram-design@diagram-design
```

Two rules: **draw only when the picture replaces sentences** (3+ components calling each other, branching flow, time-axis plan, two-dimensional relations) with a cap of 1–2 per report; and **the destination picks the format** — source HTML in `docs/diagrams/`, SVG embedded in Obsidian reports, PNG in PR bodies (GitHub does not render SVG inside markdown). Not installed means the report ships without the picture plus a `미수행: diagram-design 미설치` line — never a blocked report.

Rule text: [`_conventions/report-diagram.md`](skills/_conventions/report-diagram.md)

---

## Key commands

| Command | Description |
|---------|-------------|
| `/sj-company <task>` | **The start of everything** — describe a task and it auto-routes to the right experts |
| `/spec` | Ambiguous intent → a 5-stage, executable precise spec |
| `/design` | Reference-brand-DNA-based UI design — confirm 3 HTML drafts (dynamic/restrained/balanced) in the browser, then pick a direction |
| `/design-shotgun` | Parallel exploration of 4–6 directions, then select |
| `/investigate` | Hypothesis-first → verification enforced, no speculative fixes |
| `/cso` | OWASP + STRIDE security audit |
| `/ship` | Test → coverage → PR automation |
| `/retro` | Weekly retro on commits, tests, process friction, and growth metrics |
| `/sj-agent-dev` | 10-axis-based business agent design |
| `/sj-loop` | Generate loop prompts + run as dry-run / in-session repeat / cloud schedule |
| `/outsource` | Delegate to an expert when stuck — auto-writes a context report + email draft |
| `/convert` | Convert Word/PPT/Excel/EPub/audio — formats the Read tool can't open — into Markdown |

---

## Structure

```
scripts/
└── skill-manifest.py ← checks SKILL.md ↔ manifest ↔ RESOLVER ↔ CLAUDE.md integrity (--check/--write)
skills/
├── manifest.json     ← skill inventory (derived from frontmatter, no hand-editing)
├── RESOLVER.md       ← single source of routing truth (trigger → skill dispatch table)
├── _conventions/     ← single definition of cross-cutting rules (human gate, PII, archive-only, Judge independence, RUN_ID, friction, context-curation)
├── sj-company/       ← entry point for all skills (Step 0 reads RESOLVER.md and dispatches)
├── sj-pm/            ← requirements analysis
├── sj-design/        ← UI design + design review
├── sj-seed/          ← Karrot SEED design system (tokens + official components only)
├── sj-tech-lead/     ← sub-agent orchestration
├── sj-qa/            ← independent verification
├── sj-spec/          ← precise spec
├── sj-investigate/   ← root-cause debugging
├── sj-cso/           ← security audit
├── sj-ship/          ← release automation
├── sj-automation/    ← PC system automation + on-screen UI automation (`/sj-ui-auto` is a trigger alias)
├── sj-marketing/     ← SNS & blog marketing
├── sj-seo/           ← search indexing automation
├── sj-agent-dev/     ← agent design
├── sj-agent-review/  ← agent review
├── sj-convert/       ← document conversion (markitdown — formats the Read tool can't open)
├── sj-ref/           ← app UI references (uibowl — real shipped screens)
├── sj-loop/          ← loop engineering
└── sj-outsource/     ← expert delegation
```

---

## Credits

s-skills stands on other people's work. Integrated tools first, borrowed ideas second.

| Tool | Used by | License |
|------|---------|---------|
| [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) — Ayoub G. | SessionStart output rules | MIT |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) — Cathryn Lavery | Report and SI diagrams | MIT |
| [daangn/seed-design](https://github.com/daangn/seed-design) | `/seed` | Apache-2.0 |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | `/convert` | MIT |
| [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen) | `/screencast` | MIT |
| [chrisryugj/korean-law-mcp](https://github.com/chrisryugj/korean-law-mcp) | `/law` | MIT |
| [uibowl.io](https://uibowl.io) MCP | `/ref` | Service ToS |
| OpenAI Codex CLI (`codex mcp-server`) | `/gpt` | Vendor tool |

**Ideas borrowed:** **gbrain** (thin dispatchers + single conventions dir, filing rules, friction protocol, manifest guard, `doctor --remediate`) · **ponytail** (minimal-code ladder, `ponytail:` markers) · Geoffrey Litt, *Understanding is the new bottleneck* (literate reports) · Self-Harness / AHE (harness change gate) · research on AI code-reviewer limits (reviewer diversity, severity calibration) · Fable 5 system prompt (external content is data, honest reporting, citation limits) · J. Russell Ramsay & Anthony L. Rostain, *The Adult ADHD Tool Kit* (via i-have-adhd).

s-skills itself is [MIT](LICENSE). The tools above keep their own licenses; this repository ships no copies of them and **fetches them at runtime**.

Full table (Korean): [README.md](README.md#출처--크레딧)

---

<p align="center">
  Stuck? <code>/outsource</code> — an expert takes over.
</p>
