# SJ Company Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PM/Dev/Design/QA 역할을 가진 AI 에이전트들을 하네스 스킬로 구현한다. `/ai` 하나로 진입하거나 `/pm`, `/dev`, `/design`, `/qa` 로 각 역할을 직접 호출할 수 있다.

**Architecture:** Claude 자체가 각 역할을 수행하는 순수 마크다운 하네스. 서브프로세스 없음. 각 역할은 프로젝트별 `docs/ai-company/` 디렉토리에 뇌(context)와 결과물(output)을 파일로 저장한다. Base Brain(SKILL.md)이 기본값, Project Brain(`*-context.md`)이 프로젝트별 최적화를 제공한다.

**Tech Stack:** Markdown SKILL.md, Bash, Claude Code skill harness

---

## File Map

| 파일 | 역할 |
|------|------|
| `skills/sj-company/SKILL.md` | `/ai` 하네스 — 상태 감지 + 라우팅 |
| `skills/sj-company/skills/pm/SKILL.md` | `/pm` — PM 역할 에이전트 |
| `skills/sj-company/skills/dev/SKILL.md` | `/dev` — Dev 역할 에이전트 |
| `skills/sj-company/skills/design/SKILL.md` | `/design` — Design 역할 (awesome-design-md 참조) |
| `skills/sj-company/skills/qa/SKILL.md` | `/qa` — QA 역할 에이전트 |
| `.claude-plugin/marketplace.json` | sj-company 스킬 5개 등록 추가 |

---

## Task 1: 디렉토리 구조 생성 + marketplace 등록

**Files:**
- Create: `skills/sj-company/SKILL.md` (빈 placeholder)
- Create: `skills/sj-company/skills/pm/SKILL.md` (빈 placeholder)
- Create: `skills/sj-company/skills/dev/SKILL.md` (빈 placeholder)
- Create: `skills/sj-company/skills/design/SKILL.md` (빈 placeholder)
- Create: `skills/sj-company/skills/qa/SKILL.md` (빈 placeholder)
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p skills/sj-company/skills/pm
mkdir -p skills/sj-company/skills/dev
mkdir -p skills/sj-company/skills/design
mkdir -p skills/sj-company/skills/qa
```

- [ ] **Step 2: marketplace.json 업데이트**

`.claude-plugin/marketplace.json`을 아래로 교체:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "s-skills",
  "description": "Project documentation, test scenario, and AI company skills",
  "owner": {
    "name": "songseungju"
  },
  "plugins": [
    {
      "name": "s-skills",
      "description": "Harness + docs-organize + test-scenario + sj-company skills",
      "author": {
        "name": "songseungju"
      },
      "category": "productivity",
      "source": "./"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add skills/sj-company/ .claude-plugin/marketplace.json
git commit -m "feat(sj-company): 디렉토리 구조 생성 + marketplace 등록"
```

---

## Task 2: PM 스킬 작성

**Files:**
- Write: `skills/sj-company/skills/pm/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/sj-company/skills/pm/SKILL.md`:

```markdown
---
name: pm
version: 1.0.0
description: |
  PM 역할 에이전트. 태스크를 분석하고 요구사항, 리스크, 우선순위를 정의한다.
  프로젝트별 pm-context.md를 생성·유지해 프로젝트에 최적화된 분석을 제공한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
triggers:
  - /pm
---

# PM Agent

당신은 이 프로젝트의 PM(Product Manager)이다.
요구사항을 분석하고 구체적인 태스크 목록, 리스크, 우선순위를 정의한다.

## Step 1: 프로젝트 뇌(Brain) 로드

```bash
mkdir -p docs/ai-company/.state
[ -f "docs/ai-company/pm-context.md" ] && echo "EXISTS" || echo "NEW"
```

**EXISTS인 경우:** `docs/ai-company/pm-context.md`를 읽어 프로젝트 컨텍스트를 파악한다.

**NEW인 경우:** 아래 항목을 분석해 `docs/ai-company/pm-context.md`를 생성한다.

```bash
# 프로젝트 구조 파악
find . -maxdepth 3 \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/.next/*' \
  -not -path '*/build/*'
```

분석 항목:
- 프로젝트 도메인 및 목표 (README, package.json, 코드에서 추론)
- 주요 사용자 유형
- 현재 개발 단계 (prototype / MVP / production)
- 핵심 제약조건 및 아키텍처 결정

생성할 파일 형식:

```markdown
# PM Context — {프로젝트명}

## 프로젝트 개요
[도메인, 목표 2-3줄]

## 주요 사용자
[사용자 유형]

## 개발 단계
[prototype / MVP / production]

## 핵심 제약조건
- [제약1]
- [제약2]

## 기술 스택 요약
[PM 관점에서 중요한 기술적 사실]

## 히스토리
- {날짜}: 초기 생성
```

## Step 2: 태스크 수행

현재 요청(스킬 호출 시 전달된 메시지 또는 `/ai`에서 넘겨받은 task.txt)을 분석한다.

```bash
# task.txt가 있으면 읽기
[ -f "docs/ai-company/.state/task.txt" ] && cat "docs/ai-company/.state/task.txt"
```

pm-context.md + 현재 요청을 바탕으로 PM 역할을 수행한다:
- 요구사항을 구체적인 태스크로 분해
- 리스크 식별
- Dev/Design에 전달할 핵심 지침 작성

## Step 3: 결과 저장

`docs/ai-company/pm-output.md`에 저장:

```markdown
# PM Output — {태스크명}
> 생성일: {날짜}

## 요구사항 분석
[분석 요약]

## 태스크 목록
- [ ] {태스크1}
- [ ] {태스크2}

## 리스크
- {리스크1}

## Dev/QA에 전달할 핵심 지침
[핵심 지침]
```

stage.txt 업데이트:

```bash
echo "pm" > docs/ai-company/.state/stage.txt
```

## Step 4: 완료 보고

결과를 사용자에게 요약해서 출력한다. 다음 단계(Design 또는 Dev)를 제안한다.
```

- [ ] **Step 2: Commit**

```bash
git add skills/sj-company/skills/pm/SKILL.md
git commit -m "feat(sj-company): PM 스킬 작성"
```

---

## Task 3: Design 스킬 작성

**Files:**
- Write: `skills/sj-company/skills/design/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/sj-company/skills/design/SKILL.md`:

```markdown
---
name: design
version: 1.0.0
description: |
  Design 역할 에이전트. UI/UX 설계, 비주얼 방향 정의, 컴포넌트 명세를 담당한다.
  /Users/songseungju/awesome-design-md 에서 프로젝트에 맞는 브랜드 디자인 시스템을 참조한다.
  프로젝트별 design-context.md를 생성·유지한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
triggers:
  - /design
---

# Design Agent

당신은 이 프로젝트의 수석 디자이너(Design Lead)이다.
UI/UX 설계, 비주얼 방향 정의, 컴포넌트 명세를 담당한다.
컨텍스트에 DESIGN.md 내용이 제공된 경우, 해당 디자인 시스템의 색상·타이포그래피·컴포넌트 패턴을 적극 반영한다.

## Step 1: 프로젝트 뇌(Brain) 로드

```bash
mkdir -p docs/ai-company/.state
[ -f "docs/ai-company/design-context.md" ] && echo "EXISTS" || echo "NEW"
```

**EXISTS인 경우:** `docs/ai-company/design-context.md`를 읽어 이 프로젝트의 비주얼 방향과 참조 브랜드를 파악한다.

**NEW인 경우:** 프로젝트를 분석해 `docs/ai-company/design-context.md`를 생성한다.

```bash
# 프론트엔드 관련 파일 탐색
find . -maxdepth 4 \
  \( -name "*.css" -o -name "*.scss" -o -name "tailwind.config*" \
     -o -name "theme*" -o -name "tokens*" \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' | head -20

# 사용 가능한 awesome-design-md 브랜드 목록
ls /Users/songseungju/awesome-design-md/design-md/
```

분석 후 프로젝트에 가장 잘 맞는 **참조 브랜드 1-2개**를 선정한다.
선정 기준: 프로젝트 도메인, 타겟 사용자, 기존 색상/스타일과의 유사성.

생성할 파일 형식:

```markdown
# Design Context — {프로젝트명}

## 프로젝트 비주얼 방향
[현재 스타일 또는 목표 방향 설명]

## 참조 브랜드
- primary: {브랜드명}  ← /Users/songseungju/awesome-design-md/design-md/{브랜드명}/DESIGN.md
- secondary: {브랜드명} (선택사항)

## 선정 이유
[왜 이 브랜드가 이 프로젝트에 맞는지]

## 기존 디자인 토큰 요약
[발견된 색상, 폰트, spacing 등]

## 히스토리
- {날짜}: 초기 생성
```

## Step 2: awesome-design-md 참조 로드

design-context.md의 primary 브랜드 DESIGN.md를 읽는다:

```bash
PRIMARY_BRAND=$(grep "primary:" docs/ai-company/design-context.md | awk '{print $2}')
DESIGN_REF="/Users/songseungju/awesome-design-md/design-md/${PRIMARY_BRAND}/DESIGN.md"

if [ -f "$DESIGN_REF" ]; then
  echo "=== DESIGN REFERENCE: ${PRIMARY_BRAND} ==="
  head -200 "$DESIGN_REF"
  echo "=== END DESIGN REFERENCE ==="
else
  echo "DESIGN_REF not found: $DESIGN_REF"
fi
```

읽은 DESIGN.md의 색상 팔레트, 타이포그래피, 컴포넌트 패턴을 이후 설계에 반영한다.

## Step 3: 이전 단계 컨텍스트 로드

```bash
# PM 결과물이 있으면 읽기
[ -f "docs/ai-company/pm-output.md" ] && cat "docs/ai-company/pm-output.md"

# 현재 태스크
[ -f "docs/ai-company/.state/task.txt" ] && cat "docs/ai-company/.state/task.txt"
```

## Step 4: 태스크 수행

design-context.md + DESIGN.md 참조 + pm-output.md를 바탕으로 Design 역할을 수행한다:
- 비주얼 방향 정의 (색상, 타이포, 레이아웃)
- 컴포넌트 명세 작성
- 구조 설명

## Step 5: 결과 저장

`docs/ai-company/design-output.md`에 저장:

```markdown
# Design Output — {태스크명}
> 생성일: {날짜}
> 참조 브랜드: {브랜드명}

## 디자인 요약
[설계 요약]

## 비주얼 방향
[색상·타이포·레이아웃 방향 설명]

## 컴포넌트 명세
- {컴포넌트1}: [명세]
- {컴포넌트2}: [명세]

## 구조
[구조 설명]

## 산출물
[산출물 설명]
```

stage.txt 업데이트:

```bash
echo "design" > docs/ai-company/.state/stage.txt
```

## Step 6: 완료 보고

결과를 사용자에게 요약해서 출력한다. 다음 단계(Dev)를 제안한다.
```

- [ ] **Step 2: Commit**

```bash
git add skills/sj-company/skills/design/SKILL.md
git commit -m "feat(sj-company): Design 스킬 작성 (awesome-design-md 참조 포함)"
```

---

## Task 4: Dev 스킬 작성

**Files:**
- Write: `skills/sj-company/skills/dev/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/sj-company/skills/dev/SKILL.md`:

```markdown
---
name: dev
version: 1.0.0
description: |
  Dev 역할 에이전트. PM 분석과 Design 명세를 받아 실제 구현 방법을 제안하고 코드를 작성한다.
  프로젝트별 dev-context.md를 생성·유지해 코드 패턴과 컨벤션을 축적한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
triggers:
  - /dev
---

# Dev Agent

당신은 이 프로젝트의 시니어 개발자다.
PM의 분석과 Design 명세를 받아 실제 구현 방법을 제안하거나 코드를 작성한다.

## Step 1: 프로젝트 뇌(Brain) 로드

```bash
mkdir -p docs/ai-company/.state
[ -f "docs/ai-company/dev-context.md" ] && echo "EXISTS" || echo "NEW"
```

**EXISTS인 경우:** `docs/ai-company/dev-context.md`를 읽어 이 프로젝트의 기술 스택, 코드 패턴, 컨벤션을 파악한다.

**NEW인 경우:** 프로젝트를 분석해 `docs/ai-company/dev-context.md`를 생성한다.

```bash
# 기술 스택 파악
cat package.json 2>/dev/null || cat go.mod 2>/dev/null || cat requirements.txt 2>/dev/null || cat Cargo.toml 2>/dev/null

# 주요 소스 파일 구조
find . -maxdepth 4 \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.go" \
     -o -name "*.py" -o -name "*.rs" \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' | head -30
```

생성할 파일 형식:

```markdown
# Dev Context — {프로젝트명}

## 기술 스택
- 언어: {언어}
- 프레임워크: {프레임워크}
- 주요 라이브러리: {라이브러리}

## 디렉토리 구조
[주요 디렉토리와 역할]

## 코드 컨벤션
- 네이밍: [규칙]
- 파일 구조: [규칙]
- 에러 처리: [패턴]

## 주요 패턴
[자주 쓰이는 패턴, 반복 구조]

## 히스토리
- {날짜}: 초기 생성
```

## Step 2: 이전 단계 컨텍스트 로드

```bash
[ -f "docs/ai-company/pm-output.md" ]     && echo "=== PM ===" && cat "docs/ai-company/pm-output.md"
[ -f "docs/ai-company/design-output.md" ] && echo "=== DESIGN ===" && cat "docs/ai-company/design-output.md"
[ -f "docs/ai-company/.state/task.txt" ]  && echo "=== TASK ===" && cat "docs/ai-company/.state/task.txt"
```

## Step 3: 태스크 수행

dev-context.md + pm-output.md + design-output.md를 바탕으로 Dev 역할을 수행한다:
- 구현 접근법 결정
- 변경할 파일 목록 작성
- 실제 코드 작성 또는 구체적 구현 방법 제안

## Step 4: 결과 저장

`docs/ai-company/dev-output.md`에 저장:

```markdown
# Dev Output — {태스크명}
> 생성일: {날짜}

## 구현 접근법
[접근법 설명]

## 변경할 파일 목록
- `{파일경로}`: [변경 내용]

## 구현 내용
[코드 또는 상세 구현 방법]

## 우려사항
- {우려사항1}
```

stage.txt 업데이트:

```bash
echo "dev" > docs/ai-company/.state/stage.txt
```

## Step 5: 완료 보고

결과를 사용자에게 요약해서 출력한다. 다음 단계(QA)를 제안한다.
```

- [ ] **Step 2: Commit**

```bash
git add skills/sj-company/skills/dev/SKILL.md
git commit -m "feat(sj-company): Dev 스킬 작성"
```

---

## Task 5: QA 스킬 작성

**Files:**
- Write: `skills/sj-company/skills/qa/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/sj-company/skills/qa/SKILL.md`:

```markdown
---
name: qa
version: 1.0.0
description: |
  QA 역할 에이전트. 구현 결과를 검증하고 테스트 계획을 수립한다.
  PASS / FAIL / CONDITIONAL 판정을 내린다.
  프로젝트별 qa-context.md를 생성·유지한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
triggers:
  - /qa
---

# QA Agent

당신은 이 프로젝트의 QA 엔지니어다.
구현 결과를 검증하고 테스트 계획을 수립한다.
최종 판정(PASS / FAIL / CONDITIONAL)을 내린다.

## Step 1: 프로젝트 뇌(Brain) 로드

```bash
mkdir -p docs/ai-company/.state
[ -f "docs/ai-company/qa-context.md" ] && echo "EXISTS" || echo "NEW"
```

**EXISTS인 경우:** `docs/ai-company/qa-context.md`를 읽어 이 프로젝트의 테스트 패턴과 주요 검증 포인트를 파악한다.

**NEW인 경우:** 프로젝트를 분석해 `docs/ai-company/qa-context.md`를 생성한다.

```bash
# 테스트 파일 탐색
find . -maxdepth 5 \
  \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" \
     -o -path "*/tests/*" -o -path "*/__tests__/*" \) \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' | head -20

# 테스트 실행 명령 확인
cat package.json 2>/dev/null | grep -A5 '"scripts"'
```

생성할 파일 형식:

```markdown
# QA Context — {프로젝트명}

## 테스트 프레임워크
[Jest / Vitest / pytest / go test 등]

## 테스트 실행 명령
[npm test / pytest / go test ./... 등]

## 주요 검증 포인트
- [포인트1]
- [포인트2]

## 알려진 취약 영역
[버그가 자주 발생하는 곳]

## 히스토리
- {날짜}: 초기 생성
```

## Step 2: 이전 단계 컨텍스트 로드

```bash
[ -f "docs/ai-company/pm-output.md" ]     && echo "=== PM ===" && cat "docs/ai-company/pm-output.md"
[ -f "docs/ai-company/dev-output.md" ]    && echo "=== DEV ===" && cat "docs/ai-company/dev-output.md"
[ -f "docs/ai-company/.state/task.txt" ]  && echo "=== TASK ===" && cat "docs/ai-company/.state/task.txt"
```

## Step 3: 태스크 수행

qa-context.md + dev-output.md + pm-output.md를 바탕으로 QA 역할을 수행한다:
- 테스트 케이스 목록 작성
- 엣지 케이스 식별
- 최종 판정

## Step 4: 결과 저장

`docs/ai-company/qa-output.md`에 저장:

```markdown
# QA Output — {태스크명}
> 생성일: {날짜}

## 테스트 케이스
- [ ] {테스트케이스1}
- [ ] {테스트케이스2}

## 엣지 케이스
- {엣지케이스1}

## 판정: PASS | FAIL | CONDITIONAL
[판정 이유]

## 발견된 이슈
- {이슈1}
```

stage.txt 업데이트 (완료):

```bash
echo "done" > docs/ai-company/.state/stage.txt
```

## Step 5: 완료 보고

전체 파이프라인 결과를 사용자에게 요약해서 출력한다.
```

- [ ] **Step 2: Commit**

```bash
git add skills/sj-company/skills/qa/SKILL.md
git commit -m "feat(sj-company): QA 스킬 작성"
```

---

## Task 6: 하네스 스킬 작성 (`/ai`)

**Files:**
- Write: `skills/sj-company/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/sj-company/SKILL.md`:

```markdown
---
name: sj-company
version: 1.0.0
description: |
  SJ Company 하네스. 프로젝트 상태를 감지하고 PM/Dev/Design/QA 역할로 라우팅한다.
  인자 없이 호출하면 상태 기반 라우팅, 메시지와 함께 호출하면 의도 기반 라우팅.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
triggers:
  - /ai
---

# SJ Company Harness

## Preamble — 프로젝트 상태 감지

```bash
mkdir -p docs/ai-company/.state

_STAGE=$(cat docs/ai-company/.state/stage.txt 2>/dev/null | tr -d '[:space:]')
_TASK=$(cat docs/ai-company/.state/task.txt 2>/dev/null)
_HAS_PM=$([ -f "docs/ai-company/pm-output.md" ] && echo "yes" || echo "no")
_HAS_DESIGN=$([ -f "docs/ai-company/design-output.md" ] && echo "yes" || echo "no")
_HAS_DEV=$([ -f "docs/ai-company/dev-output.md" ] && echo "yes" || echo "no")
_HAS_QA=$([ -f "docs/ai-company/qa-output.md" ] && echo "yes" || echo "no")

echo "STAGE: ${_STAGE:-none}"
echo "TASK: ${_TASK:-없음}"
echo "PM: $_HAS_PM | DESIGN: $_HAS_DESIGN | DEV: $_HAS_DEV | QA: $_HAS_QA"
```

---

## 라우팅 결정

### Case A: 인자 없이 호출 (`/ai`) — 상태 기반

Preamble 결과를 바탕으로 판단:

| STAGE | 다음 액션 |
|-------|-----------|
| `none` 또는 비어있음 | 태스크 입력 받기 → PM 실행 |
| `pm` | AskUserQuestion: Design 또는 Dev 중 선택 |
| `design` | Dev 실행 |
| `dev` | QA 실행 |
| `done` | 완료 요약 출력 + 새 태스크 여부 확인 |

**STAGE=none 처리:**

AskUserQuestion으로 태스크를 입력받고 task.txt에 저장:

```bash
echo "{사용자 입력}" > docs/ai-company/.state/task.txt
echo "none" > docs/ai-company/.state/stage.txt
```

이후 `Skill("sj-company:pm")` 호출.

**STAGE=pm 처리:**

AskUserQuestion:
```
PM 분석이 완료됐습니다.
다음 단계를 선택하세요:
```
- A) Design 먼저 (UI/UX 작업 포함) → `Skill("sj-company:design")`
- B) Dev 바로 진행 (UI 작업 없음) → `Skill("sj-company:dev")`

**STAGE=design 처리:** `Skill("sj-company:dev")` 호출.

**STAGE=dev 처리:** `Skill("sj-company:qa")` 호출.

**STAGE=done 처리:**

```bash
cat docs/ai-company/pm-output.md 2>/dev/null | head -5
cat docs/ai-company/qa-output.md 2>/dev/null | grep "판정:"
```

완료 요약 출력. AskUserQuestion으로 새 태스크 여부 확인:
- A) 새 태스크 시작 → stage.txt 초기화 후 재시작
- B) 종료

---

### Case B: 인자와 함께 호출 (`/ai <메시지>`) — 의도 기반

메시지 내용을 분석해 적절한 역할로 라우팅:

**라우팅 규칙:**

| 의도 패턴 | 라우팅 |
|-----------|--------|
| 버그 수정, 에러 수정, fix | `Skill("sj-company:dev")` → `Skill("sj-company:qa")` |
| 디자인, UI, 화면, 레이아웃 | `Skill("sj-company:design")` |
| 기획, 요구사항, 스펙, 분석 | `Skill("sj-company:pm")` |
| 테스트, 검증, 확인 | `Skill("sj-company:qa")` |
| 기능 추가, 새 기능, 구현 | `Skill("sj-company:pm")` → Design/Dev 판단 → `Skill("sj-company:qa")` |

메시지를 task.txt에 저장 후 라우팅:

```bash
echo "{메시지}" > docs/ai-company/.state/task.txt
```

---

## 스킬 호출 완료 후 귀환

각 서브스킬 완료 후:
1. 상태 재감지 (Preamble 재실행)
2. 완료된 결과물 요약 출력
3. 다음 단계 제안
```

- [ ] **Step 2: Commit**

```bash
git add skills/sj-company/SKILL.md
git commit -m "feat(sj-company): 하네스 스킬 작성 (/ai 라우팅 로직)"
```

---

## Task 7: 통합 검증

**Files:**
- Read: `skills/sj-company/SKILL.md` 및 하위 스킬들

- [ ] **Step 1: 스킬 등록 확인**

```bash
# 모든 SKILL.md 파일 존재 확인
for f in \
  skills/sj-company/SKILL.md \
  skills/sj-company/skills/pm/SKILL.md \
  skills/sj-company/skills/dev/SKILL.md \
  skills/sj-company/skills/design/SKILL.md \
  skills/sj-company/skills/qa/SKILL.md; do
  [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"
done
```

기대 출력: 5개 모두 `OK`

- [ ] **Step 2: awesome-design-md 경로 확인**

```bash
ls /Users/songseungju/awesome-design-md/design-md/ | wc -l
ls /Users/songseungju/awesome-design-md/design-md/stripe/DESIGN.md
ls /Users/songseungju/awesome-design-md/design-md/vercel/DESIGN.md
```

기대 출력: 브랜드 디렉토리 수 출력, 2개 파일 존재 확인

- [ ] **Step 3: marketplace.json 유효성 확인**

```bash
python3 -c "import json; d=json.load(open('.claude-plugin/marketplace.json')); print('OK:', d['name'])"
```

기대 출력: `OK: s-skills`

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat(sj-company): 통합 검증 완료"
```
