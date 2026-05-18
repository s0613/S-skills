# sj-company v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PM→Design→TechLead→QA 고정 4단계를 제거하고, PROJECT.md 기반 컨텍스트 지속성 + 태스크 크기 자동 감지 + pw-loop 검증으로 재설계한다.

**Architecture:** 각 프로젝트의 `docs/sj-company/PROJECT.md` 하나가 전체 상태를 담는 단일 진실 소스. `/sj-company`는 태스크 크기(Tiny/Small/Medium/Large)를 판정해 워크플로우 깊이를 결정. `/sj-secretary`는 모든 프로젝트의 PROJECT.md를 읽어 우선순위 브리핑 출력.

**Tech Stack:** Markdown skill files, Bash, Python3 (인라인), 기존 pw-loop 스킬 연동

---

## File Map

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `skills/sj-company/SKILL.md` | 전면 재작성 | 태스크 크기 판정 + 브리핑 + 실행 경로 |
| `skills/sj-secretary/SKILL.md` | 전면 재작성 | PROJECT.md 기반 아침 브리핑 |
| `skills/sj-pm/SKILL.md` | 부분 수정 | Medium/Large에서만 호출, PROJECT.md 연동 |
| `skills/sj-tech-lead/SKILL.md` | 부분 수정 | Design 의존성 제거, 단일 디스패치 우선 |
| `skills/sj-qa/SKILL.md` | 부분 수정 | pw-loop 연동 + PROJECT.md 업데이트 |

---

## Task 1: PROJECT.md 포맷 정의 + 샘플 생성

**Files:**
- Create: `docs/sj-company/PROJECT.md` (각 프로젝트 루트에 생성됨, 여기선 s-skills용 샘플)
- Create: `skills/sj-company/project-template.md` (참조용 템플릿)

- [ ] **Step 1: PROJECT.md 포맷 확정**

최종 포맷 (key: value, 사람이 직접 편집 가능):

```markdown
# {프로젝트명}

goal: {현재 스프린트/목표 한 줄}
stack: {주요 기술스택 쉼표 구분}
last_session: {YYYY-MM-DD} — {마지막 세션에서 완료한 것}
next: {다음에 할 것, 없으면 "없음"}
blockers: {없음 | 구체적 블로커}
pw_target: 80
status: active
```

status 허용값: `active` | `done` | `blocked`

- [ ] **Step 2: s-skills 프로젝트에 샘플 PROJECT.md 생성**

`/Users/songseungju/S-skills/docs/sj-company/PROJECT.md` 를 Write 툴로 작성:

```markdown
# S-skills

goal: sj-company v3 구현 — PROJECT.md 기반 워크플로우
stack: Markdown, Bash, Python3
last_session: 2026-05-18 — sj-company v3 설계 스펙 및 구현 계획 작성
next: Task 2부터 순서대로 스킬 파일 재작성
blockers: 없음
pw_target: 80
status: active
```

- [ ] **Step 3: Python 헬퍼 함수 (인라인, 재사용)**

아래 Python 스니펫은 여러 스킬에서 공통으로 쓴다. 계획 문서에 정의해둠:

```python
# PROJECT.md 읽기
def read_project_md(path="docs/sj-company/PROJECT.md"):
    try:
        text = open(path, encoding="utf-8").read()
        fields = {}
        for line in text.splitlines():
            if ": " in line and not line.startswith("#"):
                k, _, v = line.partition(": ")
                fields[k.strip()] = v.strip()
        return fields
    except:
        return {}

# PROJECT.md 특정 필드 업데이트 (나머지 보존)
def update_project_md(updates: dict, path="docs/sj-company/PROJECT.md"):
    import re
    text = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
    for k, v in updates.items():
        pattern = rf"^{re.escape(k)}:.*$"
        replacement = f"{k}: {v}"
        if re.search(pattern, text, re.MULTILINE):
            text = re.sub(pattern, replacement, text, flags=re.MULTILINE)
        else:
            text += f"\n{k}: {v}"
    open(path, "w", encoding="utf-8").write(text)
```

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add docs/sj-company/PROJECT.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): PROJECT.md 포맷 정의 및 s-skills 샘플 생성"
```

---

## Task 2: sj-company/SKILL.md — 브리핑 모드 (인자 없음)

**Files:**
- Modify: `skills/sj-company/SKILL.md` (Preamble + Case A 브리핑 섹션)

- [ ] **Step 1: Preamble 교체**

기존 `stage.txt` / `task.txt` 읽는 Preamble을 PROJECT.md 읽기로 교체:

```bash
# Preamble v3
mkdir -p docs/sj-company

PROJECT_MD="docs/sj-company/PROJECT.md"
_HAS_PROJECT=$([ -f "$PROJECT_MD" ] && echo "yes" || echo "no")

if [ "$_HAS_PROJECT" = "yes" ]; then
  python3 -c "
import re, sys
text = open('$PROJECT_MD', encoding='utf-8').read()
def get(key):
    m = re.search(rf'^{key}:(.+)$', text, re.MULTILINE)
    return m.group(1).strip() if m else ''
print('GOAL=' + get('goal'))
print('STACK=' + get('stack'))
print('LAST=' + get('last_session'))
print('NEXT=' + get('next'))
print('BLOCKERS=' + get('blockers'))
print('STATUS=' + get('status'))
"
else
  echo "GOAL="
  echo "STATUS=new"
fi
```

- [ ] **Step 2: Case A (인자 없음) — 브리핑 출력**

PROJECT.md 있으면:
```
[{프로젝트명} 브리핑]
목표: {goal}
지난 세션: {last_session}
다음: {next}
블로커: {blockers}

바로 "{next}" 시작할까요? 아니면 다른 태스크를 입력하세요.
```

PROJECT.md 없으면 (신규 프로젝트):
```
이 프로젝트에 docs/sj-company/PROJECT.md가 없습니다.
프로젝트 목표를 한 줄로 알려주세요. (예: "AI 상담 기능 MVP 완성")
```

입력받은 후 PROJECT.md 생성:
```bash
cat > docs/sj-company/PROJECT.md << 'EOF'
# {프로젝트명}

goal: {사용자 입력}
stack: 분석 중
last_session: 없음
next: 없음
blockers: 없음
pw_target: 80
status: active
EOF
```

스택은 `package.json` / `go.mod` / `requirements.txt`를 읽어 자동 감지 후 채움.

- [ ] **Step 3: 검증**

`/Users/songseungju/S-skills`에서 `/sj-company` 호출 시 아래가 출력되면 성공:
```
[S-skills 브리핑]
목표: sj-company v3 구현 — PROJECT.md 기반 워크플로우
지난 세션: 2026-05-18 — sj-company v3 설계 스펙 및 구현 계획 작성
다음: Task 2부터 순서대로 스킬 파일 재작성
블로커: 없음
```

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-company/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): v3 브리핑 모드 — PROJECT.md 기반 상태 읽기"
```

---

## Task 3: sj-company/SKILL.md — 태스크 크기 판정 로직

**Files:**
- Modify: `skills/sj-company/SKILL.md` (Case B 태스크 실행 섹션)

- [ ] **Step 1: 크기 판정 Python 스니펫 작성**

`/sj-company <태스크>` 호출 시 태스크 텍스트를 분석:

```python
import sys
task = sys.argv[1] if len(sys.argv) > 1 else ""

TINY_KEYWORDS = ["수정", "변경", "텍스트", "스타일", "색상", "오타", "문구", "설정값", "상수", "fix typo"]
SMALL_KEYWORDS = ["컴포넌트", "버튼", "api", "엔드포인트", "훅", "hook", "함수", "util"]
LARGE_KEYWORDS = ["리팩토링", "refactor", "새 섹션", "모듈", "migration", "마이그레이션", "아키텍처"]

task_lower = task.lower()

if any(k in task_lower for k in TINY_KEYWORDS) and len(task) < 50:
    size = "Tiny"
elif any(k in task_lower for k in LARGE_KEYWORDS) or len(task) > 100:
    size = "Large"
elif any(k in task_lower for k in SMALL_KEYWORDS):
    size = "Small"
else:
    size = "Medium"  # 기본값: 불명확하면 Medium

print(f"SIZE={size}")
```

- [ ] **Step 2: 판정 결과 출력 + 이의 제기 허용**

```
[{SIZE}] "{태스크}" 로 판정했습니다.
크기가 맞지 않으면 조정하세요: Tiny / Small / Medium / Large
(그냥 엔터 치면 계속)
```

AskUserQuestion으로 크기 확인 (기본값: 자동 판정 크기).

- [ ] **Step 3: 검증**

- "버튼 색상 수정" → Tiny 판정
- "로그인 컴포넌트 추가" → Small 판정
- "AI 상담 플로우 구현" → Medium 판정
- "전체 인증 모듈 리팩토링" → Large 판정

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-company/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): v3 태스크 크기 자동 판정 로직"
```

---

## Task 4: sj-company/SKILL.md — Tiny/Small 실행 경로

**Files:**
- Modify: `skills/sj-company/SKILL.md` (Tiny/Small 실행 섹션)

- [ ] **Step 1: Tiny 실행 경로 작성**

```
[Tiny] 바로 구현합니다.

{태스크 설명에 맞는 파일 탐색 후 즉시 수정}

→ 빌드 확인:
```
```bash
# 빌드 명령 자동 감지
if [ -f "package.json" ]; then
  BUILD_CMD=$(node -e "const p=require('./package.json'); console.log(p.scripts?.build ? 'npm run build' : 'echo no-build')" 2>/dev/null)
elif [ -f "go.mod" ]; then
  BUILD_CMD="go build ./..."
else
  BUILD_CMD="echo '빌드 명령 없음, 스킵'"
fi
echo "빌드 명령: $BUILD_CMD"
$BUILD_CMD
```

빌드 성공 → PROJECT.md 업데이트 → 완료 보고
빌드 실패 → 에러 분석 후 수정 → 재빌드

- [ ] **Step 2: Small 실행 경로 작성**

```
[Small] 간단한 계획 후 구현합니다.

계획:
1. {파일명}: {변경 내용}
2. {파일명}: {변경 내용}

{구현}

→ 빌드 확인 (Tiny와 동일)
→ pw-loop 필요한가요? (기능 변경이면 권장)
  Y: /pw-loop 실행
  N: 완료
```

- [ ] **Step 3: 완료 후 PROJECT.md 업데이트**

두 경로 공통:
```python
import re, datetime, os
path = "docs/sj-company/PROJECT.md"
text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")
task_summary = "{완료한 작업 한 줄 요약}"

def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", f"{key}: {val}", t, flags=re.MULTILINE)

text = upd("last_session", f"{today} — {task_summary}", text)
text = upd("next", "없음", text)  # 사용자가 next를 말하지 않은 경우
open(path, "w", encoding="utf-8").write(text)
print("PROJECT.md 업데이트 완료")
```

next가 명확하면 사용자에게 확인 후 채움. 불명확하면 "없음"으로 두고 사용자 직접 편집 유도.

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-company/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): v3 Tiny/Small 실행 경로 + PROJECT.md 업데이트"
```

---

## Task 5: sj-company/SKILL.md — Medium/Large 실행 경로

**Files:**
- Modify: `skills/sj-company/SKILL.md` (Medium/Large 실행 섹션)

- [ ] **Step 1: Medium 실행 경로 작성**

```
[Medium] PM 브리핑 후 구현합니다.

PM 브리핑:
- 요구사항: {2~3줄}
- 엣지케이스: {1~2개}
- 리스크: {1개}

→ Tech Lead 실행: Skill("s-skills:sj-tech-lead") 호출
  힌트: "이 태스크는 {frontend|backend|둘 다} 작업입니다."
→ pw-loop 실행: Skill("s-skills:pw-loop") 호출
  목표: {pw_target}%
→ PROJECT.md 업데이트
```

PM 브리핑은 별도 파일에 저장하지 않고 컨텍스트 안에서만 처리. `pm-output.md` 생성 안 함.

- [ ] **Step 2: Large 실행 경로 작성**

```
[Large] PM 분석 + 구현 계획 후 진행합니다.

→ Skill("s-skills:sj-pm") 호출 (pm-output.md 대신 PROJECT.md의 goal/next 업데이트만)
→ 구현 계획 제시:
  1단계: {설명}
  2단계: {설명}
  (계속할까요?)
→ 단계별 Tech Lead 실행
→ 각 단계 완료 후 빌드 확인
→ 전체 완료 후 pw-loop 실행
→ PROJECT.md 업데이트
```

- [ ] **Step 3: Tech Lead 호출 시 단일 디스패치 힌트 전달**

현재 sj-tech-lead는 여러 서브에이전트를 기본 병렬 실행한다. Medium/Small 태스크에서는 불필요. 힌트를 전달하는 방식:

task.txt에 힌트 태그 삽입 후 Tech Lead가 읽게 함:
```bash
echo "[HINT:single=frontend] {태스크 내용}" > docs/sj-company/.state/task.txt
```

Tech Lead SKILL.md에서 `[HINT:single={role}]` 파싱해 해당 role만 디스패치 (Task 7에서 처리).

- [ ] **Step 4: sj-pm/SKILL.md — pm-output.md 대신 PROJECT.md 업데이트**

`skills/sj-pm/SKILL.md`의 Step 5 (결과 저장) 교체:

기존: `docs/sj-company/pm-output.md` 파일 생성
변경: PROJECT.md의 `goal`과 `next` 업데이트 + 간략한 요구사항을 컨텍스트로만 출력

```python
import re, os
path = "docs/sj-company/PROJECT.md"
if os.path.exists(path):
    text = open(path, encoding="utf-8").read()
    # goal 업데이트 (PM이 정제한 목표)
    text = re.sub(r"^goal:.*$", f"goal: {pm_goal}", text, flags=re.MULTILINE)
    # next 업데이트
    text = re.sub(r"^next:.*$", f"next: {first_task}", text, flags=re.MULTILINE)
    open(path, "w", encoding="utf-8").write(text)
    print("PROJECT.md goal/next 업데이트 완료")
```

`stage.txt` 업데이트 제거. PM 완료 후 sj-company가 직접 다음 단계 결정.

- [ ] **Step 5: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-company/SKILL.md skills/sj-pm/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company/sj-pm): v3 Medium/Large 경로 + PM 출력 PROJECT.md 연동"
```

---

## Task 6: sj-secretary/SKILL.md — 아침 브리핑으로 전면 재작성

**Files:**
- Modify: `skills/sj-secretary/SKILL.md` (전면 재작성)

- [ ] **Step 1: 디스커버리 로직 유지, 데이터 수집 교체**

기존 `report.md` 파싱 → `PROJECT.md` 파싱으로 교체:

```python
import json, os, sys, re

idx = json.load(open(sys.argv[1]))
out = []

for slug, path in idx.items():
    project_md = os.path.join(path, "docs/sj-company/PROJECT.md")
    info = {"slug": slug, "path": path, "has_project": os.path.isfile(project_md)}
    
    if not info["has_project"]:
        # 구버전 호환: report.md 있으면 레거시로 표시
        report = os.path.join(path, "docs/sj-company/report.md")
        info["legacy"] = os.path.isfile(report)
        out.append(info)
        continue
    
    text = open(project_md, encoding="utf-8").read()
    def get(key):
        m = re.search(rf"^{key}:(.+)$", text, re.MULTILINE)
        return m.group(1).strip() if m else ""
    
    info["goal"] = get("goal")
    info["last_session"] = get("last_session")
    info["next"] = get("next")
    info["blockers"] = get("blockers")
    info["status"] = get("status") or "active"
    info["pw_target"] = get("pw_target") or "80"
    
    # 프로젝트명: PROJECT.md 첫 번째 # 헤딩
    name_m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    info["name"] = name_m.group(1).strip() if name_m else os.path.basename(path)
    
    out.append(info)

print(json.dumps(out, ensure_ascii=False, indent=2))
```

- [ ] **Step 2: 우선순위 정렬 + 출력 포맷**

우선순위 기준:
1. `status=blocked` → [긴급]
2. `blockers != "없음"` → [주의]
3. `status=active` + `next != "없음"` → [진행]
4. `status=active` + `next = "없음"` → [대기]
5. `status=done` → [완료]
6. `has_project=False` + `legacy=True` → [레거시]
7. `has_project=False` + `legacy=False` → [미시작]

출력 포맷:
```
[아침 브리핑] {YYYY-MM-DD} · 프로젝트 {N}개

[긴급] {name} (`{slug}`)
  목표: {goal}
  블로커: {blockers}
  → /sj-company (블로커 해소 후)

[진행] {name} (`{slug}`)
  다음: {next}
  → /sj-company "{next}"

[대기] {name} (`{slug}`)
  다음 태스크 없음
  → /sj-company <새 태스크>

[레거시] {name} (`{slug}`)
  PROJECT.md 없음 (구버전 sj-company 사용)
  → /sj-company 첫 호출 시 자동 마이그레이션

오늘 어디서 시작할까요?
```

- [ ] **Step 3: 전체 KPI 제거**

WBS 에코, KPI 테이블 전부 제거. 대신 한 줄 요약만:
```
진행중 {N}개 · 블로커 {B}개 · 완료 {D}개
```

- [ ] **Step 4: 검증**

`/sj-secretary` 실행 시:
- upflow-ax: PROJECT.md 없으면 [레거시] 표시
- s-skills: PROJECT.md 있으면 [진행] 표시 + 다음 할 일 출력

- [ ] **Step 5: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-secretary/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-secretary): 아침 브리핑 모드로 전면 재작성 — PROJECT.md 기반"
```

---

## Task 7: sj-tech-lead/SKILL.md — 단일 디스패치 힌트 파싱

**Files:**
- Modify: `skills/sj-tech-lead/SKILL.md` (Step 1 힌트 파싱 추가)

- [ ] **Step 1: task.txt에서 힌트 파싱**

기존 Step 1 (입력 컨텍스트 로드) 직후에 추가:

```bash
_TASK=$(cat docs/sj-company/.state/task.txt 2>/dev/null)

# [HINT:single={role}] 파싱
_HINT_SINGLE=$(echo "$_TASK" | grep -oP '(?<=\[HINT:single=)\w+(?=\])' || echo "")
_TASK_CLEAN=$(echo "$_TASK" | sed 's/\[HINT:[^]]*\]//g' | xargs)

echo "SINGLE_HINT: ${_HINT_SINGLE:-없음}"
echo "TASK: $_TASK_CLEAN"
```

- [ ] **Step 2: 단일 힌트 있으면 1명만 디스패치**

```
_HINT_SINGLE=frontend → sj-dev-frontend 1개만 Agent 디스패치
_HINT_SINGLE=backend  → sj-dev-backend 1개만
_HINT_SINGLE=없음     → 기존 로직대로 (필요한 에이전트 판단 후 디스패치)
```

기존 "필요한 에이전트 판단" 로직은 유지. 힌트가 없을 때만 작동.

- [ ] **Step 3: Design 단계 의존성 제거**

기존: `_HAS_PM=no`이면 멈춤.
변경: `_HAS_PM=no` 체크 제거. PROJECT.md의 goal이 있으면 그걸 컨텍스트로 사용.

```bash
# PM output 없으면 PROJECT.md에서 goal 읽기
if [ "$_HAS_PM" = "no" ]; then
  _PM_CONTEXT=$(grep "^goal:" docs/sj-company/PROJECT.md 2>/dev/null | cut -d: -f2- | xargs)
  echo "PM_CONTEXT (from PROJECT.md): ${_PM_CONTEXT:-없음}"
fi
```

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-tech-lead/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-tech-lead): 단일 디스패치 힌트 파싱 + Design 의존성 제거"
```

---

## Task 8: sj-qa/SKILL.md — pw-loop 연동 + PROJECT.md 업데이트

**Files:**
- Modify: `skills/sj-qa/SKILL.md`

- [ ] **Step 1: pw-loop 호출 추가**

기존 QA (코드 리뷰 기반) 뒤에 pw-loop 연동:

```bash
# pw-loop 지원 여부 확인
_HAS_PW=$([ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ] && echo "yes" || echo "no")
_PW_TARGET=$(grep "^pw_target:" docs/sj-company/PROJECT.md 2>/dev/null | cut -d: -f2 | xargs || echo "80")
```

`_HAS_PW=yes`이면: `Skill("s-skills:pw-loop")` 호출, 목표 `$_PW_TARGET%`
`_HAS_PW=no`이면: 빌드 확인으로 대체

- [ ] **Step 2: QA 완료 후 PROJECT.md 업데이트**

```python
import re, datetime, os

path = "docs/sj-company/PROJECT.md"
text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")

# pw-loop 결과에서 판정 읽기
qa_result = open("docs/sj-company/qa-output.md", encoding="utf-8").read() if os.path.exists("docs/sj-company/qa-output.md") else ""
verdict = "PASS" if "PASS" in qa_result else ("FAIL" if "FAIL" in qa_result else "확인필요")

def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", f"{key}: {val}", t, flags=re.MULTILINE)

text = upd("last_session", f"{today} — QA {verdict}", text)
if verdict == "PASS":
    text = upd("status", "active", text)
elif verdict == "FAIL":
    text = upd("status", "blocked", text)
    text = upd("blockers", "QA FAIL — 재구현 필요", text)

open(path, "w", encoding="utf-8").write(text)
print(f"PROJECT.md 업데이트: QA {verdict}")
```

- [ ] **Step 3: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-qa/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-qa): pw-loop 연동 + PROJECT.md 업데이트"
```

---

## Task 9: 마이그레이션 로직

**Files:**
- Modify: `skills/sj-company/SKILL.md` (Preamble 앞에 마이그레이션 감지 추가)

- [ ] **Step 1: 구버전 감지**

```bash
_HAS_PROJECT=$([ -f "docs/sj-company/PROJECT.md" ] && echo "yes" || echo "no")
_HAS_OLD=$([ -f "docs/sj-company/.state/stage.txt" ] || [ -f "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")

if [ "$_HAS_PROJECT" = "no" ] && [ "$_HAS_OLD" = "yes" ]; then
  echo "MIGRATION_NEEDED=yes"
else
  echo "MIGRATION_NEEDED=no"
fi
```

- [ ] **Step 2: 자동 마이그레이션 — PROJECT.md 생성**

`MIGRATION_NEEDED=yes`이면:

```python
import os, re, json

# 기존 파일에서 정보 추출
task = open("docs/sj-company/.state/task.txt").read().strip() if os.path.exists("docs/sj-company/.state/task.txt") else ""
stage = open("docs/sj-company/.state/stage.txt").read().strip() if os.path.exists("docs/sj-company/.state/stage.txt") else ""

# report.md에서 마지막 완료 정보
last_completed = ""
if os.path.exists("docs/sj-company/report.md"):
    text = open("docs/sj-company/report.md").read()
    m = re.search(r"^completed:\s*(.+)$", text, re.MULTILINE)
    if m: last_completed = m.group(1).strip().strip('"')
    m = re.search(r"^task:\s*\"?(.+?)\"?\s*$", text, re.MULTILINE)
    if m: task = m.group(1).strip()

# 스택 감지
stack = "불명확"
if os.path.exists("package.json"):
    pkg = json.load(open("package.json"))
    deps = list((pkg.get("dependencies") or {}).keys())[:5]
    stack = ", ".join(deps) if deps else "Node.js"
elif os.path.exists("go.mod"):
    stack = "Go"

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
print("PROJECT.md 생성 완료 (마이그레이션)")
```

- [ ] **Step 3: 구파일 아카이브**

```bash
mkdir -p docs/sj-company/archive
for f in pm-output.md design-output.md dev-output.md qa-output.md report.md; do
  [ -f "docs/sj-company/$f" ] && mv "docs/sj-company/$f" "docs/sj-company/archive/$f"
done
[ -d "docs/sj-company/.state" ] && mv "docs/sj-company/.state" "docs/sj-company/archive/.state"
echo "구파일 → docs/sj-company/archive/ 이동 완료"
```

사용자에게 마이그레이션 결과 출력:
```
[마이그레이션] {프로젝트명}
PROJECT.md 생성됨. 구파일은 docs/sj-company/archive/에 보존.
goal, next를 직접 확인하고 수정하세요: docs/sj-company/PROJECT.md
```

- [ ] **Step 4: 커밋**

```bash
git -C /Users/songseungju/S-skills add skills/sj-company/SKILL.md
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): v3 구버전 자동 마이그레이션 로직"
```

---

## Task 10: 통합 검증

**Files:** 없음 (수동 검증)

- [ ] **Step 1: s-skills에서 브리핑 테스트**

```bash
cd /Users/songseungju/S-skills
# /sj-company 호출 → PROJECT.md 읽어 브리핑 출력 확인
```

기대: Task 1에서 만든 PROJECT.md 내용이 브리핑으로 출력됨

- [ ] **Step 2: Tiny 태스크 테스트**

```
/sj-company README.md 오타 수정
```

기대:
- "[Tiny] 바로 구현합니다." 출력
- PM 단계 없음
- 빌드 확인 후 PROJECT.md last_session 업데이트

- [ ] **Step 3: /sj-secretary 테스트**

```bash
# 모든 프로젝트 PROJECT.md 읽어 아침 브리핑 출력
```

기대: WBS 테이블 없음, 우선순위 정렬된 한 줄씩 출력

- [ ] **Step 4: 레거시 프로젝트 마이그레이션 테스트**

upflow-ax에서 `/sj-company` 첫 호출:
- PROJECT.md 자동 생성 확인
- 구파일 archive/ 이동 확인
- 생성된 PROJECT.md 내용 확인

- [ ] **Step 5: 최종 커밋**

```bash
git -C /Users/songseungju/S-skills add -A
git -C /Users/songseungju/S-skills commit -m "feat(sj-company): v3 통합 검증 완료"
```

---

## 실행 순서 요약

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5  (sj-company 핵심)
                                              ↓
Task 6 (sj-secretary) ← 병렬 가능 → Task 7 (sj-tech-lead)
                                              ↓
                                        Task 8 (sj-qa)
                                              ↓
                                        Task 9 (마이그레이션)
                                              ↓
                                        Task 10 (통합 검증)
```

Task 6, 7은 Task 5 완료 후 병렬 실행 가능.
