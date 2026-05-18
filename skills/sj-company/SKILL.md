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

```bash
PROJECT_MD="docs/sj-company/PROJECT.md"

python3 - <<'PY'
import re, sys
text = open("docs/sj-company/PROJECT.md", encoding="utf-8").read()
def get(key):
    m = re.search(rf"^{key}:(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else ""
print("GOAL=" + get("goal"))
print("STACK=" + get("stack"))
print("LAST=" + get("last_session"))
print("NEXT=" + get("next"))
print("BLOCKERS=" + get("blockers"))
print("STATUS=" + get("status"))
name_m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
print("NAME=" + (name_m.group(1).strip() if name_m else ""))
PY
```

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
- A) 바로 시작 (NEXT 태스크로) → NEXT 값을 태스크로 Case B 실행
- B) 새 태스크 입력 → 입력값으로 Case B 실행

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

---

## Case B: 인자와 함께 호출 (`/sj-company <태스크>`) — 실행

### Step 1: 태스크 크기 판정

```python
import sys
task = "{전달된 태스크 텍스트}"

TINY_KW  = ["수정", "변경", "텍스트", "스타일", "색상", "오타", "문구", "설정값", "상수", "fix typo", "rename", "이름 변경"]
SMALL_KW = ["컴포넌트", "버튼", "api", "엔드포인트", "훅", "hook", "함수", "util", "추가", "페이지"]
LARGE_KW = ["리팩토링", "refactor", "새 섹션", "모듈", "migration", "마이그레이션", "아키텍처", "전체", "재설계"]

t = task.lower()

if any(k in t for k in TINY_KW) and len(task) < 50:
    size = "Tiny"
elif any(k in t for k in LARGE_KW) or len(task) > 100:
    size = "Large"
elif any(k in t for k in SMALL_KW):
    size = "Small"
else:
    size = "Medium"

print(f"SIZE={size}")
```

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
```python
import re, datetime, os
path = "docs/sj-company/PROJECT.md"
text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")
summary = "{완료한 작업 한 줄 요약}"
def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", f"{key}: {val}", t, flags=re.MULTILINE)
text = upd("last_session", f"{today} — {summary}", text)
open(path, "w", encoding="utf-8").write(text)
```

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
_HAS_PW=$([ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ] && echo "yes" || echo "no")
```

`_HAS_PW=yes`이고 기능 변경이면: AskUserQuestion으로 pw-loop 실행 여부 확인
- Y → `Skill("s-skills:pw-loop")` 호출
- N → 완료

5. PROJECT.md 업데이트 (Tiny와 동일 패턴)

---

#### Medium 실행 경로

```
[Medium] PM 브리핑 후 구현합니다.
```

1. PM 브리핑 (인라인, 파일 저장 없음):
```
PM 브리핑:
- 요구사항: {2~3줄}
- 엣지케이스: {1~2개}
- 리스크: {1개}
```

2. 역할 힌트 판단 (태스크 내용 기반):

```python
task_lower = "{태스크}".lower()
if any(k in task_lower for k in ["ui", "컴포넌트", "화면", "페이지", "css", "스타일"]):
    hint = "frontend"
elif any(k in task_lower for k in ["api", "서버", "백엔드", "db", "데이터베이스"]):
    hint = "backend"
else:
    hint = ""  # Tech Lead가 판단
print(f"HINT={hint}")
```

3. 힌트가 있으면 task.txt에 기록:
```bash
mkdir -p docs/sj-company/.state
echo "[HINT:single={hint}] {태스크}" > docs/sj-company/.state/task.txt
```

4. Tech Lead 실행: `Skill("s-skills:sj-tech-lead")`

5. pw-loop 실행:
```bash
_HAS_PW=$([ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ] && echo "yes" || echo "no")
_PW_TARGET=$(python3 -c "import re; text=open('docs/sj-company/PROJECT.md').read(); m=re.search(r'^pw_target:(.+)$', text, re.MULTILINE); print(m.group(1).strip() if m else '80')" 2>/dev/null || echo "80")
```

`_HAS_PW=yes`이면: `Skill("s-skills:pw-loop")` 호출 (목표: `$_PW_TARGET`%)
`_HAS_PW=no`이면: 빌드 확인으로 대체

6. PROJECT.md 업데이트:
```python
import re, datetime, os
path = "docs/sj-company/PROJECT.md"
text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")
summary = "{완료한 작업 한 줄 요약}"
def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", f"{key}: {val}", t, flags=re.MULTILINE)
text = upd("last_session", f"{today} — {summary}", text)
text = upd("next", "없음", text)
text = upd("blockers", "없음", text)
text = upd("status", "active", text)
open(path, "w", encoding="utf-8").write(text)
```

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
5. 전체 완료 후 pw-loop 실행 (Medium과 동일)
6. PROJECT.md 업데이트 (Medium과 동일)

---

## 중요 규칙

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지
- `stage.txt` 업데이트 금지
- 모든 상태는 PROJECT.md에만 기록
- Design 단계 없음 (PM이 충분히 커버)
