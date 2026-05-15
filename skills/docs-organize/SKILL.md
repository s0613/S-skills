---
name: docs-organize
version: 1.0.0
description: |
  Analyzes a project codebase, interviews the user for missing context, and
  generates a standardized docs/ structure: prd.md, architecture.md,
  UI_GUIDE.md (frontend only), STATUS.md, adr/, spec/.
  Also runs the test suite and scores the project 0-100.
  Invoke with /docs-organize in any project directory.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - /docs-organize
  - docs 정리
  - 문서 정리
---

# docs-organize

Generate and maintain project documentation with a project health score.

## HARD RULE

Do NOT write any docs file until the interview phase is complete. Analysis first, gaps identified, interview done — then write.

## Execution Flow

Follow these phases in order. Do not skip.

### Phase 0: Save Existing Score (if any)

Before any writes: if `docs/STATUS.md` already exists, read and save the current **Score** line value (e.g. `72 / 100`). Use this saved value in Phase 5 delta calculation. If it doesn't exist, note `prev: n/a`.

### Phase 1: Codebase Analysis

Read the following in order:
1. Directory structure: `find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*'`
2. Package/dependency files: `package.json`, `go.mod`, `requirements.txt`, `Cargo.toml`, `build.gradle`, `pom.xml` — whichever exist
3. Existing `README.md` or `README*`
4. Existing `docs/` contents if present
5. Entry point files (index.ts, main.go, app.py, etc.)

From this analysis, extract:
- **Tech stack** (language, framework, key libs)
- **Project type** (web app / API / CLI / mobile / library)
- **Has frontend** (yes/no — determines if UI_GUIDE.md is needed)
- **Current stage** (prototype / MVP / production — infer from code maturity)
- **Existing ADRs or key decisions** visible in code or comments
- **What you cannot confidently infer** → these become interview questions

### Phase 2: Gap Interview

Before skipping this phase, you MUST be able to answer ALL four of the following from code analysis alone. If even one is unknown, ask it.

**Required checklist (must answer all before skipping):**
- [ ] Product purpose — can you state it in 1 sentence from README/code?
- [ ] Primary target user — developer tool? consumer app? internal tool?
- [ ] Current stage — is this a POC/prototype, MVP, or production system?
- [ ] At least one hard constraint or key architectural decision not obvious from code

Ask only what you cannot answer. One question at a time using AskUserQuestion. Maximum 5 questions. **Default: ask at least 1 question unless all four are unambiguously answered.**

### Phase 3: Document Generation

Write each file. If a file already exists in docs/, update it — do not overwrite content that looks intentional.

#### docs/prd.md

```markdown
# Product Requirements

## Problem
[What problem this solves — 2-3 sentences]

## Target Users
[Who uses this and why]

## Features (in scope)
[Bullet list of confirmed features, inferred from code + interview]

## Out of Scope
[What this explicitly does NOT do]

## Success Metrics
[How success is measured — infer or note "TBD with team"]
```

#### docs/architecture.md

```markdown
# Architecture

## Overview
[1 paragraph — what this system does and how]

## Tech Stack
| Layer | Technology |
|-------|-----------|
| [layer] | [tech] |

## Key Decisions
[Bullet list of major technical choices and why — infer from code]

## Data Flow
[Describe the main data flow in plain text or simple ASCII]

## Constraints
[Performance, security, compliance, or other hard constraints]
```

#### docs/UI_GUIDE.md (only if project has frontend)

```markdown
# UI Guide

## Design Direction
[Visual style / mood — infer from existing CSS/components or note "not yet defined"]

## Color Palette
[Infer from CSS variables, Tailwind config, or theme files. Format as CSS custom properties.]

## Typography
[Font families and scale — infer from config or CSS]

## Spacing & Layout
[Grid system and spacing tokens — infer from Tailwind/CSS config]

## Component Patterns
[Key components, their variants — infer from components directory]

## Motion
[Animation principles — infer from existing animations or note "not yet defined"]

## Do Not
[Anti-patterns specific to this project — infer from existing code style]
```

#### docs/STATUS.md

```markdown
# Project Status

**Last updated:** [YYYY-MM-DD]
**Score:** [X] / 100  _(prev: n/a)_

## Score Breakdown
| Dimension              | Score | Max | Notes |
|------------------------|-------|-----|-------|
| Documentation          | [X]   | 25  | [brief reason] |
| Feature completion     | [X]   | 25  | [test results] |
| Code quality           | [X]   | 25  | [brief reason] |
| Infra / deploy readiness | [X] | 25  | [brief reason] |
| **Total**              | **[X]** | **100** | |

## Test Results
Runner: [detected runner or "none found"]
Passed: X / Failed: X / Skipped: X

## Milestones
| Name | Target | Status |
|------|--------|--------|
| [infer from README or note "not defined"] | — | 🔴 todo |

## Features
| Feature | Status | Notes |
|---------|--------|-------|
[Populate from PRD features list — default all to "todo". Feature-level status requires manual update; test score reflects overall completion rate.]

## Technical Debt
| Item | Priority | Added |
|------|----------|-------|
[Scan code for TODO/FIXME comments and list them here. Max 10 items.]

## Infrastructure
| Item | Status |
|------|--------|
| CI/CD | [check for .github/workflows, .gitlab-ci.yml, etc.] |
| Env vars | [check for .env.example] |
| DB / storage | [infer from code] |
| Monitoring | [infer from code] |
```

#### CLAUDE.md (project root)

If CLAUDE.md already exists: append a `## Docs Reference` section only if it doesn't exist yet. Do not overwrite existing content.

If CLAUDE.md does not exist: create it.

```markdown
# [Project Name]

## Project Summary
[One paragraph — inferred from analysis + interview]

## Tech Stack
[List from architecture.md]

## Conventions
- [Infer from code: naming patterns, file structure, patterns in use]

## Do Not
- [Hard constraints visible in code or stated in interview]

## Docs Reference
- [PRD](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Status & Score](docs/STATUS.md)
- [UI Guide](docs/UI_GUIDE.md)   ← include only if frontend detected
- [ADR](docs/adr/)
- [Specs](docs/spec/) ← created on first spec request
```

#### docs/adr/

- Create the directory if it doesn't exist.
- If significant architectural decisions are visible in the code that aren't already in docs/adr/, create ADRs for at most 3 of the most significant decisions only.

#### docs/spec/

- Do NOT create this directory now. It will be created when the first spec file is needed.
- In CLAUDE.md Docs Reference, note it as `[Specs](docs/spec/) ← created on first /docs-organize spec request`.

### Phase 4: Test Run

Detect the test runner by checking (in order):
1. `package.json` → look for `scripts.test`, jest/vitest config
2. `pytest.ini` / `pyproject.toml` / `setup.cfg` → pytest
3. `go.mod` → go test
4. `Cargo.toml` → cargo test
5. `build.gradle` / `pom.xml` → gradle test / mvn test

Run the detected test suite. Capture:
- Total tests
- Passed
- Failed
- Skipped

If no test runner found: note "no tests found" in STATUS.md, feature score = 0.

If tests fail to run (compile error, missing deps): note the error, feature score = 0.

### Phase 5: Score Calculation

Calculate score for each dimension and update STATUS.md.

#### Documentation (max 25pts)
- docs/prd.md exists and has content in all sections: 5pts
- docs/architecture.md exists and has content in all sections: 5pts
- At least one ADR in docs/adr/: 5pts
- docs/STATUS.md exists: 5pts
- CLAUDE.md has project-specific content (not just template): 5pts

#### Feature Completion (max 25pts)

**If tests exist and ran:**
- Formula: `round(passed / total * 25)` where total = passed + failed
- Skipped tests do not count toward total
- If total = 0 (all skipped): use code structure fallback below

**If no test runner found (fallback — code structure analysis):**
Score based on how much of the PRD feature list is visibly implemented in code.
For each feature in PRD, check if corresponding code exists (routes, handlers, components, models):
- ≥ 80% of features have visible implementation: 20pts
- ≥ 50%: 13pts
- ≥ 25%: 7pts
- < 25% or cannot assess: 3pts (credit for existing codebase)
- Completely empty repo with no source files: 0pts

Add to STATUS.md Test Results section: `Runner: none — scored via code structure analysis`

#### Code Quality (max 25pts)
- Test files exist (any): 5pts
- Pass rate ≥ 50%: +5pts. Pass rate ≥ 80%: +10pts (not cumulative — use higher)
- TODO/FIXME count: ≤ 3 → 10pts, ≤ 10 → 5pts, > 10 → 0pts (use highest matching tier)
- Count with: `grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" --include="*.java" --include="*.kt" --include="*.swift" --include="*.rb" --include="*.php" . 2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l`

#### Infra / Deploy Readiness (max 25pts)
- CI config exists (.github/workflows/*.yml, .gitlab-ci.yml, Jenkinsfile, etc.): 8pts
- .env.example or equivalent exists: 7pts
- README.md with setup instructions exists: 5pts
- Monitoring/logging evident in code (grep for "logger", "sentry", "datadog", "winston", "pino", "zap"): 5pts

#### Delta
Read the previous score from STATUS.md before overwriting. Compute delta and write:
`**Score:** 72 / 100  _(prev: 61 → +11)_`

If no previous score: `_(prev: n/a)_`

### Phase 6: Final Report

After writing all files, output a summary to the user:

```
docs-organize complete.

📁 Files written:
  - docs/prd.md
  - docs/architecture.md
  - docs/UI_GUIDE.md   (if frontend detected)
  - docs/STATUS.md
  - CLAUDE.md          (created / updated)

🧪 Tests: X passed / X failed / X skipped
   Runner: [name]

📊 Score: XX / 100  (prev: XX → delta: +/-)
   Documentation:     XX / 25
   Feature comp.:     XX / 25
   Code quality:      XX / 25
   Infra readiness:   XX / 25

⚠️  Issues:
   [List any dimension that scored 0 with a one-line reason, or "none" if all scored]
```

### Phase 7: SJ Company 투입

Final Report 출력 직후, 자동으로 sj-company를 투입한다:

```
SJ Company를 투입합니다...
```

`Skill("s-skills:sj-company")` 호출.
