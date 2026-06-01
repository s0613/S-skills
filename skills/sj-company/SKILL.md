---
name: sj-company
version: 3.0.0
description: |
  SJ Company 하네스 v3. PROJECT.md 기반 컨텍스트 지속성.
  인자 없이 호출하면 프로젝트 브리핑, 인자와 함께 호출하면 태스크 크기 자동 판정 후 실행.
  Tiny/Small: 즉시 구현. Medium: PM브리핑+TechLead+pw-loop. Large: PM+계획+단계별실행.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
triggers:
  - /sj-company
---

# SJ Company Harness v3

## Base Guidelines (Karpathy)

1. **Think Before Coding** — 가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러낸다.
2. **Simplicity First** — 태스크에 맞는 최소한의 워크플로우. 과정 의식 금지.
3. **Surgical Changes** — 꼭 필요한 것만 건드린다.
4. **Goal-Driven Execution** — PROJECT.md의 goal이 항상 기준.

---

## Preamble — 마이그레이션 감지 + 상태 읽기

```bash
mkdir -p docs/sj-company

# 마이그레이션 감지: PROJECT.md 없고 구파일 있으면 자동 마이그레이션
_HAS_PROJECT=$([ -f "docs/sj-company/PROJECT.md" ] && echo "yes" || echo "no")
# v2 잔재 감지(아래 자동 이주 블록은 PROJECT.md가 없는 신규/구버전 워크스페이스에서만 일회성으로 트리거된다)
_HAS_OLD=$([ -f "docs/sj-company/.state/stage.txt" ] && echo "yes" || [ -f "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")

if [ "$_HAS_PROJECT" = "no" ] && [ "$_HAS_OLD" = "yes" ]; then
  echo "MIGRATION_NEEDED=yes"
else
  echo "MIGRATION_NEEDED=no"
fi
```

**MIGRATION_NEEDED=yes인 경우:** 아래 Python으로 PROJECT.md 자동 생성 후 구파일 아카이브:

```python
import os, re, json

task = open("docs/sj-company/.state/task.txt").read().strip() if os.path.exists("docs/sj-company/.state/task.txt") else ""
stage = open("docs/sj-company/.state/stage.txt").read().strip() if os.path.exists("docs/sj-company/.state/stage.txt") else ""

last_completed = ""
if os.path.exists("docs/sj-company/report.md"):
    text = open("docs/sj-company/report.md").read()
    m = re.search(r"^completed:\s*(.+)$", text, re.MULTILINE)
    if m: last_completed = m.group(1).strip().strip('"')
    m = re.search(r"^task:\s*\"?(.+?)\"?\s*$", text, re.MULTILINE)
    if m: task = m.group(1).strip()

stack = "불명확"
if os.path.exists("package.json"):
    pkg = json.load(open("package.json"))
    deps = list((pkg.get("dependencies") or {}).keys())[:5]
    stack = ", ".join(deps) if deps else "Node.js"
elif os.path.exists("go.mod"):
    stack = "Go"
elif os.path.exists("requirements.txt"):
    stack = "Python"

project_name = os.path.basename(os.getcwd())
status = "done" if stage == "done" else "active"
next_task = "" if stage == "done" else task

content = f"""# {project_name}

goal: {task or '설정 필요'}
stack: {stack}
last_session: {last_completed or '없음'} — 마이그레이션 (구버전 sj-company)
next: {next_task or '없음'}
blockers: 없음
pw_target: 80
status: {status}
"""
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

```bash
mkdir -p docs/sj-company/archive
for f in pm-output.md design-output.md dev-output.md qa-output.md report.md; do
  [ -f "docs/sj-company/$f" ] && mv "docs/sj-company/$f" "docs/sj-company/archive/$f"
done
[ -d "docs/sj-company/.state" ] && mv "docs/sj-company/.state" "docs/sj-company/archive/.state"
echo "구파일 → archive/ 이동 완료"
```

사용자에게 알림:
```
[마이그레이션 완료] {프로젝트명}
PROJECT.md 생성됨. 구파일은 docs/sj-company/archive/에 보존.
goal과 next를 확인하세요: docs/sj-company/PROJECT.md
```

**이후 정상 Preamble 계속:**

`docs/sj-company/PROJECT.md`를 직접 읽어 goal, stack, last_session, next, blockers, status, 프로젝트명(첫 줄 `#` 헤더)을 파악해라. 파일이 없으면 신규 프로젝트로 처리한다.

---

## Case A: 인자 없이 호출 (`/sj-company`) — 브리핑

Preamble 결과를 바탕으로 브리핑 출력:

```
[{NAME} 브리핑]
목표: {GOAL}
지난 세션: {LAST}
다음: {NEXT}
블로커: {BLOCKERS}
```

NEXT가 "없음"이 아니면:
```
바로 "{NEXT}" 시작할까요? 아니면 다른 태스크를 입력하세요.
```

NEXT가 "없음"이면:
```
다음 태스크를 입력하세요.
```

AskUserQuestion으로 사용자 입력 받기:
- A) 바로 시작 (NEXT 태스크로) → NEXT 값을 태스크로 두고 **이 시점부터 Case B Step 0(리뷰 감지)부터 실행**
- B) 새 태스크 입력 → 입력값을 태스크로 두고 **이 시점부터 Case B Step 0부터 실행**

PROJECT.md가 없는 경우 (신규 프로젝트):
1. AskUserQuestion으로 프로젝트 목표 입력 받기
2. 스택 자동 감지 (package.json / go.mod / requirements.txt)
3. PROJECT.md 생성:

```bash
PROJECT_NAME=$(basename "$(pwd)")
```

```python
import os, json
stack = "불명확"
if os.path.exists("package.json"):
    pkg = json.load(open("package.json"))
    deps = list((pkg.get("dependencies") or {}).keys())[:5]
    stack = ", ".join(deps) if deps else "Node.js"
elif os.path.exists("go.mod"):
    stack = "Go"
elif os.path.exists("requirements.txt"):
    stack = "Python"

content = f"""# {os.path.basename(os.getcwd())}

goal: {"{사용자 입력}"}
stack: {stack}
last_session: 없음
next: 없음
blockers: 없음
pw_target: 80
status: active
"""
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

생성 직후, 사용자에게 "프로젝트가 등록됐습니다. 다음 태스크를 입력하세요"를 출력하고 새 태스크 입력을 받아 **Case B Step 0(리뷰 감지)부터 실행**한다.

---

## Case B: 인자와 함께 호출 (`/sj-company <태스크>`) — 실행

### Step 0: 리뷰 요청 감지 (크기 판정 전 먼저 체크)

태스크 텍스트가 리뷰/검토/점검/검수 성격인지 판단해라. 그렇다면 아래 리뷰 경로를 실행하고 Case B 종료 (Step 1로 넘어가지 않는다).

#### 리뷰 경로

1. 리뷰 대상 자동 감지:

```bash
mkdir -p docs/sj-company/.state

# 코드 변경 파일 수 (md 제외)
_CODE_CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -vE '\.md$' | wc -l | tr -d ' ')
# 문서 변경 파일 수
_DOC_CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep '\.md$' | wc -l | tr -d ' ')
# design-context 존재 여부
_HAS_DESIGN=$([ -f "docs/sj-company/design-context.md" ] && echo "1" || echo "0")

echo "CODE=$_CODE_CHANGED DOC=$_DOC_CHANGED DESIGN=$_HAS_DESIGN"
```

2. 디스패치 대상 결정:

태스크 텍스트와 git diff 결과를 보고 필요한 리뷰어를 판단해라:
- 코드 변경 → `sj-reviewer-code`
- 문서/명세 변경 → `sj-reviewer-doc`
- UI/디자인 변경 → `sj-reviewer-design`
- 에이전트 구조 리뷰 → `sj-agent-review`

아무것도 명확히 감지 안 되면 세 리뷰어 모두 실행한다.

3. 디스패치 알림:

```
[리뷰 시작] 다음 리뷰어를 디스패치합니다: {AGENTS}
```

`AGENTS` 목록을 처리:
- `sj-agent-review` 포함 시 → `Skill("s-skills:sj-agent-review")` 먼저 단독 호출 (에이전트 구조 전체 탐색 필요)
- 나머지(`sj-reviewer-code`, `sj-reviewer-doc`, `sj-reviewer-design`) → Agent 툴로 **병렬** 디스패치

Agent 툴 병렬 디스패치 시 각 에이전트 프롬프트에 포함:
- 현재 태스크 텍스트
- `docs/sj-company/PROJECT.md` 경로
- `docs/sj-company/.state/pm-brief.md` 경로 (파일이 있는 경우)

4. 모든 에이전트 완료 후 결과 집계:

```bash
for f in review-code review-doc review-design; do
  fp="docs/sj-company/.state/${f}.md"
  [ -f "$fp" ] && echo "=== $f ===" && head -6 "$fp" && echo ""
done
```

사용자에게 요약:

```
[리뷰 완료]
{실행된 리뷰어별 판정 한 줄 요약}

상세 보고서:
- docs/sj-company/.state/review-code.md   (코드, 있는 경우)
- docs/sj-company/.state/review-doc.md    (문서, 있는 경우)
- docs/sj-company/.state/review-design.md (디자인, 있는 경우)
```

**IS_REVIEW=no이면** → 기존 Step 1(태스크 크기 판정)으로 진행.

---

### Step 1: 태스크 크기 판정

태스크 범위와 복잡도를 판단해 크기를 결정해라:

- **Tiny**: 1파일, 단순 값·텍스트 변경, 구조 변경 없음
- **Small**: 1~2파일, 단일 기능 추가·수정
- **Medium**: 여러 파일, PM 분석이 도움되는 복잡도
- **Large**: 아키텍처 변경, 다단계 실행 필요

확신이 없으면 Medium.

판정 결과를 한 줄로 출력:
```
[{SIZE}] "{태스크}"
크기가 다르면 조정: Tiny / Small / Medium / Large (엔터: 그대로 진행)
```

AskUserQuestion으로 크기 확인 (기본값: 자동 판정).

### Step 2: 크기별 실행

---

#### Tiny 실행 경로

```
[Tiny] 바로 구현합니다.
```

1. 태스크에 맞는 파일 탐색 후 즉시 수정
2. 빌드 확인:

```bash
if [ -f "package.json" ]; then
  BUILD_CMD=$(node -e "try{const p=require('./package.json');console.log(p.scripts&&p.scripts.build?'npm run build':'echo no-build')}catch(e){console.log('echo no-build')}" 2>/dev/null || echo "echo no-build")
elif [ -f "go.mod" ]; then
  BUILD_CMD="go build ./..."
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  BUILD_CMD="echo 'Python: 빌드 스킵'"
else
  BUILD_CMD="echo '빌드 명령 없음, 스킵'"
fi
echo "빌드: $BUILD_CMD"
eval "$BUILD_CMD"
```

3. 빌드 성공 → PROJECT.md 업데이트 → 완료 보고
4. 빌드 실패 → 에러 분석 후 수정 → 재빌드

PROJECT.md 업데이트 (Tiny 완료 후):
Edit 툴로 `docs/sj-company/PROJECT.md`의 `last_session` 필드를 `{오늘날짜} — {완료 작업 한 줄 요약}`으로, `next` 필드를 `없음`으로 업데이트해라.

---

#### Small 실행 경로

```
[Small] 간단한 계획 후 구현합니다.
```

1. 구현 계획 2줄 제시:
```
계획:
1. {파일명}: {변경 내용}
2. {파일명}: {변경 내용}
```

2. 구현
3. 빌드 확인 (Tiny와 동일)
4. pw-loop 필요 여부:

```bash
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then _HAS_PW="yes"; else _HAS_PW="no"; fi
```

`_HAS_PW=yes`이고 기능 변경이면: AskUserQuestion으로 pw-loop 실행 여부 확인
- Y → `Skill("s-skills:pw-loop")` 호출
- N → 완료

5. PROJECT.md 업데이트: Edit 툴로 `last_session`과 `next` 필드를 갱신해라 (Tiny와 동일 패턴).

---

#### Medium 실행 경로

```
[Medium] PM 브리핑 후 구현합니다.
```

1. PM 브리핑 생성:
```
PM 브리핑:
- 요구사항: {2~3줄}
- 엣지케이스: {1~2개}
- 리스크: {1개}
```

2. 역할 힌트 판단 (태스크 내용 기반):

태스크 성격을 파악해 단일 specialist로 귀결되면 힌트를 결정해라:
- SI 문서(작업 개요·제안서·WBS·결과보고서 등) → `si`
- 에이전트 설계·구현·오케스트레이션 → `agent_dev`
- UI·컴포넌트·화면·스타일 전용 → `frontend`
- API·서버·도메인 로직 전용 → `backend`
- 스키마·마이그레이션·쿼리 전용 → `database`
- 인증·권한·암호화 전용 → `security`
- 여러 영역에 걸치면 → 힌트 없음 (Tech Lead가 판단)

3. HINT와 PM 브리핑을 task.txt에 함께 기록 (Tech Lead가 서브에이전트에 전달):

Write 툴로 `docs/sj-company/.state/task.txt` 작성:
```
[HINT:single={hint}] {태스크}

PM 브리핑:
- 요구사항: {1에서 생성한 요구사항}
- 엣지케이스: {1에서 생성한 엣지케이스}
- 리스크: {1에서 생성한 리스크}
```

4. 실행 분기:
   - **HINT=agent_dev** → `Skill("s-skills:sj-agent-dev")` 직접 호출 (Tech Lead 우회. 에이전트 아키텍처 설계·구현 전담)
   - **그 외** → `Skill("s-skills:sj-tech-lead")` 호출

5. pw-loop 실행:
```bash
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then _HAS_PW="yes"; else _HAS_PW="no"; fi
```

`_HAS_PW=yes`이면: `docs/sj-company/PROJECT.md`의 `pw_target` 필드를 읽어 목표 수치를 파악하고 (없으면 80) `Skill("s-skills:pw-loop")` 호출.
`_HAS_PW=no`이면: 빌드 확인으로 대체.

6. PROJECT.md 갱신: **건드리지 않는다**. Medium 경로의 PROJECT.md 최종 갱신(`last_session`/`next`/`blockers`/`status`)은 Tech Lead Step 9b가 책임진다. 역할-aware prefix(`si:` / `frontend:` / `dev:` …)도 거기서 결정됨. 여기서 다시 쓰면 prefix가 덮어써져 어떤 role이 참여했는지 추적할 수 없게 된다.

---

#### Large 실행 경로

```
[Large] PM 분석 + 구현 계획 후 진행합니다.
```

1. `Skill("s-skills:sj-pm")` 호출
   - PM이 PROJECT.md의 goal/next를 업데이트

2. 구현 계획 제시 (AskUserQuestion으로 확인 후 진행):
```
구현 계획:
1단계: {설명}
2단계: {설명}
계속할까요?
```

3. 단계별 Tech Lead 실행: `Skill("s-skills:sj-tech-lead")`
4. 각 단계 완료 후 빌드 확인
5. QA 실행: `Skill("s-skills:sj-qa")` — 구현 전체 검증 + pw-loop 호출 + PROJECT.md 업데이트 포함
   (Large 경로의 pw-loop는 sj-qa Step 6에서 수행하므로 sj-company는 직접 호출하지 않는다.
    sj-qa가 PROJECT.md를 업데이트하므로 Large 경로는 별도 PROJECT.md 업데이트 불필요)

---

## 중요 규칙

### 산출물 이중화 정책

| 종류 | 위치 | 수명 | 목적 |
|------|------|------|------|
| 사이클 단위 휘발 | `.state/pm-brief.md`, `.state/design-review.md`, `.state/dev/{role}.md`, `.state/dev-summary.md`, `.state/qa-verdict.md` | 이번 태스크 한정. 다음 사이클이 시작되면 덮어쓰기 | 단계 간 데이터 패스 |
| 영속 학습 | `pm-context.md`, `design-context.md`, `dev-context.md`, `qa-context.md` | 영구 누적 | 다음 사이클이 이 프로젝트를 더 잘 이해하기 위한 brain |
| 현재 상태 | `PROJECT.md` | 영구 | `goal`/`next`/`last_session`/`blockers`/`status` 단일 사실 |

### 금지

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지 (이주 완료)
- `docs/sj-company/dev-output/` 디렉토리 생성 금지 (→ `.state/dev/`로 통일)
- `.state/stage.txt` 업데이트 금지 (단계 추적은 PROJECT.md `last_session`으로)
- Design 명세 단계 없음 (PM이 커버). Design 리뷰는 Tech Lead가 sentinel 파일로 트리거.

### 학습 누적 의무

각 역할 스킬(`sj-pm`/`sj-design`/`sj-tech-lead`/`sj-qa`)은 사이클을 마칠 때 **이번 사이클에서 새로 알게 된 인사이트 1~3줄**을 자기 `*-context.md`의 `## 히스토리` 섹션에 날짜와 함께 append 한다. 사이클 산출이 모두 휘발해도 학습은 영속.
