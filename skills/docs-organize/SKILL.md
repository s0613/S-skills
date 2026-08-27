---
name: docs-organize
version: 1.2.0
description: |
  Analyzes a project codebase, interviews the user for missing context, and
  generates a standardized docs/ structure: prd.md, architecture.md,
  UI_GUIDE.md (frontend only), STATUS.md, adr/, spec/.
  Also runs the test suite and scores the project 0-100.
  Invoke with /docs-organize in any project directory.
  remediate mode (/docs-organize remediate [목표점수]): 목표 점수까지 치유 플랜→승인→단계 실행.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Skill
triggers:
  - /docs-organize
  - docs 정리
  - 문서 정리
---

# docs-organize

Generate and maintain project documentation with a project health score.

## 모드 분기 (최우선)

인자에 `remediate`, `점수 올려`, `치유`, `target`, 또는 목표 점수 숫자(예: `90까지`)가 포함되면 → **Remediate 모드**: 이 스킬 베이스 디렉토리의 [`REMEDIATE.md`](REMEDIATE.md)를 읽고 그 로직을 실행한다 (아래 Phase 0–7은 건너뛴다). REMEDIATE는 목표 점수까지 치유 플랜을 짜고, 사람 승인 후 단계별로 실행하며, 자동 도달 불가 점수에서 멈춘다.

그 외(인자 없음 또는 일반 문서 정리 요청) → 아래 Phase 0–7(측정 + 생성)을 실행한다.

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

### Phase 1.5: Stale Document Detection

`docs/` 디렉터리가 존재하면 실행. 없으면 이 단계 건너뜀.

#### 탐지 기준

각 기존 docs 파일을 열어 다음을 확인:
- 파일에 언급된 **기능명·컴포넌트명·API 경로·용어**가 현재 코드베이스에 존재하는가?
- 파일의 목적이 현재 프로젝트 방향과 일치하는가?

탐지 방법:
```bash
# docs에서 고유 키워드 추출 후 코드에 존재하는지 확인 (예시)
# 실제로는 파일을 읽고 핵심 명사/경로를 추출해 grep으로 교차 검증
grep -r "{키워드}" --include="*.ts" --include="*.py" --include="*.go" --include="*.js" . \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l
```

#### 분류

각 docs 파일을 세 범주로 분류:

| 범주 | 기준 |
|------|------|
| **최신** | 내용이 현재 코드와 일치 |
| **부분 낡음** | 일부 용어/기능이 변경됐으나 구조는 유효 |
| **완전 낡음** | 참조하는 기능/용어가 코드에 더 이상 존재하지 않거나 목적 자체가 바뀜 |

#### 사용자에게 보고

낡은 파일이 발견되면 Phase 2 인터뷰 전에 먼저 보고:

```
⚠️  낡은 문서 발견

완전 낡음 (삭제 또는 아카이브 권장):
  - docs/old-feature-spec.md  → "결제 V1 API" 참조, 코드에 해당 모듈 없음
  - docs/adr/001-graphql.md   → GraphQL 제거됨, REST로 전환

부분 낡음 (업데이트 필요):
  - docs/architecture.md      → "UserService" 언급, 현재는 "AuthService"로 리네임됨
  - docs/prd.md               → "모바일 앱" 언급, 현재 웹 전용으로 범위 변경

처리 방법:
  A) 완전 낡음은 docs/archive/로 이동, 부분 낡음은 Phase 3에서 업데이트
  B) 완전 낡음 삭제 + 부분 낡음 업데이트
  C) 일단 모두 보존하고 Phase 3에서 업데이트만
```

AskUserQuestion으로 처리 방법 선택받기. 선택에 따라:
- **A (아카이브)**: `docs/archive/YYYY-MM-DD-{filename}` 으로 이동
- **B (삭제)**: 완전 낡음 파일 삭제 (`rm`)
- **C (보존)**: 삭제/이동 없이 Phase 3에서 업데이트

낡은 파일이 없으면 이 단계 조용히 통과.

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

#### docs/FEATURE-MAP.md

Phase 1 코드베이스 분석에서 식별한 기능을 표로 옮긴다. 규칙 정본: `skills/_conventions/feature-map.md`.

````markdown
# Feature Map
> 이 프로젝트의 기능 목록과 서로의 연결. 코드와 같은 커밋에서 갱신된다.
> 갱신 규칙: s-skills `skills/_conventions/feature-map.md`

## 흐름
[표의 의존 칸에서 생성한 mermaid flowchart LR]

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
[식별된 기능마다 1행. 진입점은 라우트·핸들러·페이지, 테스트가 없으면 "없음"]

## 미매핑
[기능으로 보이는데 확신이 없는 것만 나열. 유틸·설정은 여기 두지 않는다]
````

**작성 규칙**
- 라우트·엔트리포인트에서 출발한다. 유틸리티 함수는 기능이 아니다.
- 확신이 없으면 `## 미매핑`에 두고 사용자에게 묻는다 — 추측으로 행을 만들지 않는다.
- 작성 후 drift 검사를 돌려 `STALE:` 0줄을 확인한다 (명령은 규칙 파일 참조).
- 이미 `docs/FEATURE-MAP.md`가 있으면 **통째로 덮어쓰지 않는다.** 기존 행은 두고,
  코드에 있으나 표에 없는 기능만 `## 미매핑`에 후보로 추가한다 (archive-only 정신).

**건강 점수 체계는 건드리지 않는다** — Phase 5 점수 항목·배점에 FEATURE-MAP을 추가하지 않는다 (회귀 위험).

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

### Phase 7: 다음 단계 제안 (사람 게이트)

Final Report 출력 직후, **자동 투입하지 않는다.** "문서만 정리해줘"라는 요청이 매번 전체 개발 파이프라인 기동으로 이어지면 안 되고, harness가 이 스킬을 호출한 경우엔 harness로 돌아가야 라우팅이 이어진다.

AskUserQuestion으로 묻는다:

```
질문: "문서 정리가 끝났습니다. 다음은?"
옵션:
  A. 여기서 종료 — 문서만 필요했음 (추천)
  B. 낮은 점수 항목 치유 — remediate 모드로 목표 점수까지
  C. 개발 진행 — sj-company 투입
```

- A → 종료. **harness가 호출한 경우엔 A와 무관하게 harness로 복귀**하고 harness가 다음 액션을 판단한다.
- B → REMEDIATE.md 흐름 진입.
- C → `Skill("s-skills:sj-company")` 호출.
