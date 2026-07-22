---
name: sj-company
version: 3.9.1
description: |
  SJ Company 하네스 v3. PROJECT.md 기반 컨텍스트 지속성.
  새 기능·수정·구현 태스크를 시작할 때, 또는 진행 중인 프로젝트를 이어서 진행할 때 사용.
  인자 없이 호출하면 프로젝트 브리핑, 인자와 함께 호출하면 태스크 실행.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
  - Agent
  - Workflow
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

> **컨벤션:** [RUN_ID 추적](../_conventions/run-id.md) — 아래 블록이 실행 식별자를 생성·기록하는 단일 생성점. 계약 본문은 컨벤션 파일.
> **컨벤션:** [프릭션 로그](../_conventions/friction-log.md) — 라우팅·디스패치 중 마찰(상태 감지 실패, 모호한 의도, 단계 전환 오류)을 만나면 한 줄 기록한다. 레시피는 컨벤션 파일.
> **컨벤션:** [옵시디언 지식 참조](../_conventions/obsidian-context.md) — 볼트가 있으면(아래 OBSIDIAN=present) 태스크 도메인의 지식 문서 1~3개를 파일 도구로 직접 읽고(`Read`/`Grep`, MCP 경유 금지) 디스패치에 `[OBSIDIAN: 경로]`로 전달한다. 볼트 없으면 비차단 진행. 도메인→폴더 맵은 컨벤션 파일.

```bash
mkdir -p docs/sj-company docs/sj-company/.state

# RUN_ID — 이번 실행 식별자 (파이프라인 전체 추적용)
_RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
echo "$_RUN_ID" > docs/sj-company/.state/current-run.txt
echo "RUN_ID: $_RUN_ID"

# 옵시디언 볼트 감지 (컨벤션: obsidian-context.md — 있으면 최상의 작업 능력, 없으면 비차단)
_VAULT="${OBSIDIAN_VAULT_DIR:-$HOME/obsidian-vaults/AI 에이전트}"
[ -d "$_VAULT" ] && echo "OBSIDIAN=present ($_VAULT)" || echo "OBSIDIAN=absent"

# 마이그레이션 감지: PROJECT.md 없고 구파일 있으면 자동 마이그레이션
_HAS_PROJECT=$([ -f "docs/sj-company/PROJECT.md" ] && echo "yes" || echo "no")
# v2 잔재 감지(아래 자동 이주 블록은 PROJECT.md가 없는 신규/구버전 워크스페이스에서만 일회성으로 트리거된다)
# 주의: && ||를 한 줄로 엮으면 좌결합 때문에 "yes"가 두 번 echo되는 버그가 있었다 — if로 풀어 쓴다
_HAS_OLD="no"
if [ -f "docs/sj-company/.state/stage.txt" ] || [ -f "docs/sj-company/pm-output.md" ]; then _HAS_OLD="yes"; fi

if [ "$_HAS_PROJECT" = "no" ] && [ "$_HAS_OLD" = "yes" ]; then
  echo "MIGRATION_NEEDED=yes"
else
  echo "MIGRATION_NEEDED=no"
fi

# context.md 큐레이션 점검 — 200줄 초과 파일만 통합 대상 (규칙 본문: 중요 규칙 > context.md 큐레이션 트리거)
for _C in pm design dev qa; do
  _CF="docs/sj-company/${_C}-context.md"
  if [ -f "$_CF" ] && [ "$(wc -l < "$_CF" | tr -d ' ')" -gt 200 ]; then echo "CURATE_NEEDED=$_CF"; fi
done
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
progress: 없음
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
# RUN_ID 추적 계약 유지: .state가 통째로 archive됐으므로 활성 위치에 current-run.txt 복원
# (복원하지 않으면 하위 스킬이 RUN_ID를 못 읽어 폴백 ID를 새로 만들고 "실행당 1회" 계약이 깨진다)
mkdir -p docs/sj-company/.state
cp "docs/sj-company/archive/.state/current-run.txt" "docs/sj-company/.state/current-run.txt" 2>/dev/null \
  || echo "$(date +%Y%m%d-%H%M%S)-$$" > docs/sj-company/.state/current-run.txt
echo "구파일 → archive/ 이동 완료 (current-run.txt 복원)"
```

사용자에게 알림:
```
[마이그레이션 완료] {프로젝트명}
PROJECT.md 생성됨. 구파일은 docs/sj-company/archive/에 보존.
goal과 next를 확인하세요: docs/sj-company/PROJECT.md
```

**이후 정상 Preamble 계속:**

`docs/sj-company/PROJECT.md`를 직접 읽어 goal, stack, last_session, progress, next, blockers, status, 프로젝트명(첫 줄 `#` 헤더)을 파악해라. 파일이 없으면 신규 프로젝트로 처리한다.

---

## Case A: 인자 없이 호출 (`/sj-company`) — 브리핑

Preamble 결과를 바탕으로 브리핑 출력:

```
[{NAME} 브리핑]
목표: {GOAL}
진행 단계: {PROGRESS}
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
- A) 바로 시작 (NEXT 태스크로) → NEXT 값을 태스크로 두고 **이 시점부터 Case B Step 0(라우팅)부터 실행**
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
progress: 없음
next: 없음
blockers: 없음
pw_target: 80
status: active
"""
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

생성 직후, 사용자에게 "프로젝트가 등록됐습니다. 다음 태스크를 입력하세요"를 출력하고 새 태스크 입력을 받아 **Case B Step 0(라우팅)부터 실행**한다.

---

## Case B: 인자와 함께 호출 (`/sj-company <태스크>`) — 실행

### Step 0: 라우팅 (RESOLVER 단일 사실)

태스크 텍스트를 라우팅 테이블과 대조한다. 키워드·제외 조건·우선순위의 **단일 사실은 `skills/RESOLVER.md`**다 — Read 툴로 이 스킬의 베이스 디렉토리 기준 `../RESOLVER.md`를 읽어라 (예: 베이스가 `.../skills/sj-company`이면 `.../skills/RESOLVER.md`). 키워드 추가·수정도 이 SKILL.md가 아니라 RESOLVER.md에서 한다.

테이블을 **위에서 아래로** 평가해 첫 매치의 스킬을 디스패치하고 Case B를 종료한다.
디스패치 시 `[{라벨}] {감지 안내}. {스킬}을 실행합니다.` 한 줄을 출력한다.

분기:
- **매치 없음** → Step 1(태스크 크기 판정)로 진행
- **#10 릴리즈(ship) 매치** → 아래 "ship 사전 확인 프로토콜"을 수행한 뒤 디스패치
- **#20 PW Loop 매치인데 playwright.config가 없음** → "playwright 설정 파일이 없습니다" 출력 후 Tiny 경로로
- **#23 리뷰 매치** → Step R(리뷰 경로) 실행

#### ship 사전 확인 프로토콜

> **컨벤션:** [사람 게이트](../_conventions/human-gate.md) — push/PR 생성은 취소 불가 작업. 사전 확인 생략 금지.

```bash
_SHIP_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "현재 브랜치: $_SHIP_BRANCH"
git log origin/main..HEAD --oneline 2>/dev/null | head -5
```

AskUserQuestion으로 사전 확인 (필수):
- "현재 브랜치: {브랜치명}. PR 생성 및 push를 진행할까요?"
- "예 → sj-ship 실행 / 아니오 → 취소"

확인 후 `Skill("s-skills:sj-ship")` 호출.

---

### Step R: 리뷰 경로

RESOLVER #23(리뷰/검토/점검/검수)에서 라우팅된 경우 이 경로를 실행하고 Case B를 종료한다 (Step 1로 넘어가지 않는다).

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

리뷰 성격이 아닌데 이 경로로 온 경우(오라우팅) → Step 1(태스크 크기 판정)으로 진행.

---

### Step 1: 태스크 크기 판정

태스크 범위와 복잡도를 판단해 크기를 결정해라:

- **Tiny**: 1파일, 단순 값·텍스트 변경, 구조 변경 없음
- **Small**: 1~2파일, 단일 기능 추가·수정
- **Medium**: 여러 파일, PM 분석이 도움되는 복잡도
- **Large**: 아키텍처 변경, 다단계 실행 필요
- **xLarge**: 단일 세션·모델 주도 오케스트레이션으로는 한계인 대규모 작업 (대규모 마이그레이션, 코드베이스 전체 감사·리팩터, 수십 파일에 걸친 기능군). 멀티에이전트 워크플로우(ultracode) 필요.

확신이 없으면 Medium. xLarge는 명백히 대규모일 때만 (남발 금지).

판정 결과를 한 줄로 출력:
```
[{SIZE}] "{태스크}"
```

- **Tiny 판정** → 확인 없이 바로 실행한다. 오판이어도 diff가 작아 되돌리기 쉽다 (Simplicity First — 과정 의식 금지).
- **그 외** → AskUserQuestion으로 크기 확인. 첫 옵션은 자동 판정 크기 유지(권장), 나머지는 인접 크기.

### Step 2: 크기별 실행

---

#### Tiny 실행 경로

```
[Tiny] 바로 구현합니다.
```

1. 태스크에 맞는 파일 탐색 후 즉시 수정 — [최소 코드 사다리](../_conventions/minimal-code.md): 표준 라이브러리·네이티브·기존 의존성 먼저, 가장 짧은 동작 diff. 요청 안 한 추상화·보일러플레이트 금지.
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
Edit 툴로 `docs/sj-company/PROJECT.md`의 `last_session` 필드를 `{오늘날짜} — {완료 작업 한 줄 요약}`으로, `progress` 필드를 `{goal 대비 현재 단계 한 줄 — 예: "기본 CRUD 완료, 인증 미착수"}`로, `next` 필드를 `없음`으로 업데이트해라. `progress:` 줄이 없는 구버전 파일이면 `last_session` 줄 아래에 추가해라.

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

2. 구현 — [최소 코드 사다리](../_conventions/minimal-code.md) 적용: 안 써도 되는 길부터 따지고, 의도된 단순화는 `ponytail:` 주석으로 표시.
3. 빌드 확인 (Tiny와 동일)
4. pw-loop 필요 여부:

```bash
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then _HAS_PW="yes"; else _HAS_PW="no"; fi
```

`_HAS_PW=yes`이고 기능 변경이면: AskUserQuestion으로 pw-loop 실행 여부 확인
- Y → `Skill("s-skills:pw-loop")` 호출
- N → 완료

5. PROJECT.md 업데이트: Edit 툴로 `last_session`·`progress`·`next` 필드를 갱신해라 (Tiny와 동일 패턴 — `progress:` 줄이 없는 구버전 파일이면 `last_session` 줄 아래에 추가해라).

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
- 완료 조건: {기계 검증 가능한 조건 1~2개 — QA가 1:1 실행·대조한다}
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
- 완료 조건: {1에서 생성한 완료 조건}
```

3b. QA 완료조건 게이트용 `pm-brief.md` 생성 (QA Step 3이 1:1 대조하는 정식 입력 — Medium도 Large와 동일 스키마를 갖춰야 QA가 PASS 판정 가능):

Write 툴로 `docs/sj-company/.state/pm-brief.md` 작성:
```markdown
# PM Brief — {태스크}

## 태스크 목록
- {요구사항을 검증 가능한 항목으로 분해}

## 완료 조건
- {1에서 생성한 완료 조건 — 기계 검증 가능하게}
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

6. PROJECT.md 갱신: **건드리지 않는다**. Medium 경로의 PROJECT.md 최종 갱신(`last_session`/`progress`/`next`/`blockers`/`status`)은 Tech Lead Step 9b가 책임진다. 역할-aware prefix(`si:` / `frontend:` / `dev:` …)도 거기서 결정됨. 여기서 다시 쓰면 prefix가 덮어써져 어떤 role이 참여했는지 추적할 수 없게 된다.

   **예외 — HINT=agent_dev**: Tech Lead를 우회했으므로 Step 9b가 실행되지 않는다. 이 경우에만 sj-company가 직접 갱신한다: `last_session`을 `{오늘날짜} — agent: {태스크 한 줄 요약}`으로, `progress`·`next`는 Tiny와 동일 패턴으로 (`progress:` 줄이 없는 구버전 파일이면 `last_session` 줄 아래에 추가).

---

#### Large 실행 경로

```
[Large] PM 분석 + 구현 계획 후 진행합니다.
```

0. **task.txt 갱신 (필수).** Large는 pm-brief.md를 주 입력으로 쓰지만, sj-pm·Tech Lead는 `task.txt`도 입력 계약으로 읽는다. 갱신하지 않으면 **직전 Medium 사이클의 `[HINT:]`·`[SPEC:]`가 이번 Dispatch Card에 그대로 주입**된다. Write 툴로 이번 태스크 한 줄만 남긴다 (HINT는 쓰지 않는다 — Large는 Tech Lead가 역할을 판단):

   ```
   {이번 태스크}
   ```

   sj-spec을 거쳤다면 `[SPEC: 경로]` 줄만 함께 남긴다.

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

#### xLarge 실행 경로

```
[xLarge] 대규모 작업입니다. 멀티에이전트 워크플로우(ultracode)로 진행합니다.
```

xLarge는 모델 주도 단계 실행의 한계를 넘는 작업이다. SKILL.md 프로즈를 순서대로 따라가는 대신 **결정론적 Workflow 스크립트**로 fan-out·수렴·resume을 보장한다. (하다 글의 Bun Zig→Rust 75만 줄 포팅이 이 케이스다.)

**1. ultracode opt-in 확인**

Workflow 도구는 사용자의 명시적 opt-in이 있어야 켜진다. 현재 턴에 `ultracode`가 활성화돼 있지 않으면(시스템 리마인더로 확인) 진행하지 않고 요청한다:

```
이 태스크는 xLarge라 멀티에이전트 워크플로우가 필요합니다.
프롬프트에 `ultracode`를 붙여 다시 요청해 주세요:
  /sj-company ultracode {태스크}
```

여기서 Case B를 종료한다. (사용자가 ultracode 붙여 재요청하면 2부터 진행.)

**2. PM 분석 선행**

먼저 Large와 동일하게 **`docs/sj-company/.state/task.txt`를 이번 태스크로 덮어쓴다** — 갱신하지 않으면 직전 Medium 사이클의 `[HINT:]`·`[SPEC:]`가 그대로 남아 sj-pm·서브에이전트 입력을 오염시킨다.

`Skill("s-skills:sj-pm")` 호출 — goal/next 갱신, 요구사항·리스크 도출. PM 브리핑을 워크플로우 입력으로 쓴다.

**3. Workflow 작성·실행**

Workflow 도구로 다음 구조의 스크립트를 작성해 실행한다:
- **Phase 1 (분해):** 태스크를 독립 작업 단위로 분해 (파일군·모듈·도메인 경계 기준)
- **Phase 2 (구현):** 각 단위를 `agentType: 'sj-dev-{role}'` 에이전트로 `pipeline` 실행. 파일 충돌 위험이 있으면 `isolation: 'worktree'`
- **Phase 3 (적대 검증):** 각 결과를 서로 다른 렌즈(correctness/security/contract)의 검증 에이전트로 다관점 검증, 2/3 이상 통과해야 채택 (Tech Lead Step 7a-1과 동일 철학)
- **Phase 4 (종합):** 통과한 변경을 `.state/dev-summary.md`로 집계

`.state/` 산출물을 체크포인트로 사용하고, 중단 시 `resumeFromRunId`로 재개한다.

**4. QA 실행:** `Skill("s-skills:sj-qa")` — 전체 검증 + PROJECT.md 갱신.

---

## 중요 규칙

### 산출물 이중화 정책

| 종류 | 위치 | 수명 | 목적 |
|------|------|------|------|
| 사이클 단위 휘발 | `.state/pm-brief.md`, `.state/design-review.md`, `.state/dev/{role}.md`, `.state/dev-summary.md`, `.state/qa-verdict.md` | 이번 태스크 한정. 다음 사이클이 시작되면 덮어쓰기 | 단계 간 데이터 패스 |
| 영속 학습 | `pm-context.md`, `design-context.md`, `dev-context.md`, `qa-context.md` | 영구 누적 | 다음 사이클이 이 프로젝트를 더 잘 이해하기 위한 brain |
| 현재 상태 | `PROJECT.md` | 영구 | `goal`/`progress`/`next`/`last_session`/`blockers`/`status` 단일 사실 |

### 금지

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지 (이주 완료)
- `docs/sj-company/dev-output/` 디렉토리 생성 금지 (→ `.state/dev/`로 통일)
- `.state/stage.txt` 업데이트 금지 (단계 추적은 PROJECT.md `last_session`·`progress`로)
- Design 명세 단계 없음 (PM이 커버). Design 리뷰는 Tech Lead가 sentinel 파일로 트리거.

### 학습 누적 의무

각 역할 스킬(`sj-pm`/`sj-design`/`sj-tech-lead`/`sj-qa`)은 사이클을 마칠 때 **이번 사이클에서 새로 알게 된 인사이트 1~3줄**을 자기 `*-context.md`의 `## 히스토리` 섹션에 append 한다. 사이클 산출이 모두 휘발해도 학습은 영속. append 규칙은 [컨텍스트 큐레이션](../_conventions/context-curation.md)을 따른다 — notability 게이트 통과 항목만, `- {날짜} [run:{RUN_ID}]: {인사이트}` 인용 형식, [PII 마스킹](../_conventions/pii-masking.md) 적용.

### archive-only 불변식 (영속 파일 보호)

> **컨벤션:** [archive-only](../_conventions/archive-only.md) — 규칙 본문의 단일 정의. 아래는 실행 커널.

`PROJECT.md`·`*-context.md` 등 **영속 파일을 통째로 재생성(Write로 덮어쓰기)** 하기 직전에는, 반드시 직전 버전을 `docs/sj-company/archive/`로 보존한 뒤 덮어쓴다. 필드 단위 수정(Edit)은 해당 없음 — 통째 재작성·마이그레이션·리셋에만 적용.

```bash
# 영속 파일을 Write로 통째 덮어쓰기 직전 1회 실행
mkdir -p docs/sj-company/archive
_F="docs/sj-company/PROJECT.md"   # 또는 *-context.md
[ -f "$_F" ] && cp "$_F" "docs/sj-company/archive/$(basename "$_F").$(date +%Y%m%d-%H%M%S).bak"
```

**절대 삭제하지 않는다 — archive만 한다.** 컨텍스트는 복구 가능해야 한다. (Hermes curator의 "never auto-delete, archive only" 불변식과 동일 철학.)

### context.md 큐레이션 트리거 (지연 발동)

영속 학습 파일은 무한 누적된다. **임계값을 넘기 전까지는 손대지 않는다.** 점검 커널은 Preamble bash 블록에 있다(`CURATE_NEEDED` 출력) — 여기는 규칙 본문만 둔다.

`CURATE_NEEDED`가 출력된 파일만: archive-only 불변식으로 백업한 뒤, `## 히스토리`의 오래된 항목을 **요약 1~3줄로 압축**하고 중복·낡은 인사이트를 통합한다. 200줄 이하 파일은 **건드리지 않는다**(오버엔지니어링 금지).
