---
name: sj-company
version: 3.4.0
description: |
  SJ Company 하네스 v3. PROJECT.md 기반 컨텍스트 지속성.
  인자 없이 호출하면 프로젝트 브리핑, 인자와 함께 호출하면 태스크 크기 자동 판정 후 실행.
  Tiny/Small: 즉시 구현. Medium: PM브리핑+TechLead+pw-loop. Large: PM+계획+단계별실행. xLarge: ultracode 멀티에이전트 워크플로우.
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
mkdir -p docs/sj-company docs/sj-company/.state

# RUN_ID — 이번 실행 식별자 (파이프라인 전체 추적용)
_RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
echo "$_RUN_ID" > docs/sj-company/.state/current-run.txt
echo "RUN_ID: $_RUN_ID"

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

### Step 0: Obsidian 문서 요청 감지 (최우선 체크)

태스크 텍스트가 Obsidian 문서화 요청인지 판단해라. 아래 키워드 중 하나라도 포함되면 Obsidian 경로를 실행하고 Case B 종료 (Step 0a로 넘어가지 않는다).

**감지 키워드:** 옵시디언, obsidian, 문서화, 노트로, 볼트, vault, 정리해줘 (문서/기능/프로젝트 앞에 붙은 경우), 기록해줘, obs

**Obsidian 경로:**
```
[Obsidian] 문서 작성 요청을 감지했습니다. obsidian-writer를 실행합니다.
```
`Skill("s-skills:obsidian-writer")` 호출 — 볼트 탐지·저장 위치 선택·문서 작성까지 obsidian-writer가 전담한다.

---

### Step 0-auto: PC 자동화 요청 감지

태스크 텍스트가 PC 자동화 또는 화면 조작 자동화 요청인지 판단해라. 해당하면 아래 경로를 실행하고 Case B 종료.

**UI 조작 자동화 감지 키워드** (화면 클릭·버튼·입력·화면인식 포함):
클릭, 버튼, 화면, 스크린, 입력해, UI, 자동 클릭, 이미지 인식, 화면 조작, 화면을, 창을, playwright, pyautogui, selenium, 웹 자동화, 브라우저 자동화, 로그인 자동화

→ 감지 시:
```
[UI 자동화] 화면 조작 자동화 요청을 감지했습니다. sj-ui-auto를 실행합니다.
```
`Skill("s-skills:sj-ui-auto")` 호출

---

**PC/시스템 자동화 감지 키워드** (스케줄·파일·앱·단축키 자동화):
자동화, 자동으로, 매일, 매주, 스케줄, 단축키, launchd, cron, 알림, 파일 이동, 폴더 정리, 앱 실행, 반복, 할 때마다, 되면 자동, shell, 스크립트

→ 감지 시 (단, UI 조작 키워드와 함께 감지된 경우 sj-ui-auto 우선):
```
[PC 자동화] 시스템 자동화 요청을 감지했습니다. sj-automation을 실행합니다.
```
`Skill("s-skills:sj-automation")` 호출

---

### Step 0-marketing: 마케팅 콘텐츠 요청 감지

태스크 텍스트가 SNS 마케팅·카피라이팅·캠페인 관련 요청인지 판단해라. 해당하면 아래 경로를 실행하고 Case B 종료.

**기술적 SEO 감지 키워드** (색인·Search Console·검색 노출 등록):
색인 등록, 검색 노출 안 돼, Search Console, 서치어드바이저, sitemap 제출, 구글 색인, 네이버 색인, 검색에 안 나와, 검색 노출 도와줘

→ 감지 시:
```
[SEO 색인] 기술적 SEO 요청을 감지했습니다. sj-seo를 실행합니다.
```
`Skill("s-skills:sj-seo")` 호출

---

**마케팅·콘텐츠 감지 키워드:**
마케팅, SNS, 캠페인, 카피, 게시글, 포스팅, 홍보, 인스타, 인스타그램, 스레드, threads, 링크드인, linkedin, 트위터, 광고 문구, 콘텐츠 작성, 컨텐츠, 카드뉴스, 슬라이드 포스팅, sns-start, 브랜드 카피, 마케팅 글, 네이버 블로그, 티스토리, 블로그 글, SEO 글, AEO, 블로그 콘텐츠, 상위노출 글

→ 감지 시 (기술적 SEO 키워드와 함께 감지된 경우 totaro-seo 우선):
```
[마케팅] SNS/블로그 마케팅 요청을 감지했습니다. sj-marketing을 실행합니다.
```
`Skill("s-skills:sj-marketing")` 호출

---

### Step 0-spec: 스펙/명세 작성 요청 감지

태스크 텍스트가 스펙·명세·PRD 작성 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
스펙, 명세, PRD, 기능 정의, 요구사항 정리, 스펙 만들어줘, 뭘 만들지 정리, 설계 문서, spec

→ 감지 시:
```
[스펙] 스펙 작성 요청을 감지했습니다. sj-spec을 실행합니다.
```
`Skill("s-skills:sj-spec")` 호출

---

### Step 0-investigate: 디버깅/원인 분석 요청 감지

태스크 텍스트가 버그 원인 추적·디버깅 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
왜 이러지, 원인 파악, 디버깅, 에러 원인, 버그 추적, investigate, 어디서 나는지, 루트코즈, root cause

→ 감지 시:
```
[조사] 원인 분석 요청을 감지했습니다. sj-investigate를 실행합니다.
```
`Skill("s-skills:sj-investigate")` 호출

---

### Step 0-cso: 보안 감사 요청 감지

태스크 텍스트가 보안 점검·취약점 검사 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
보안 점검, 보안 감사, 취약점, OWASP, STRIDE, 보안 리뷰, 보안 검사, cso, security audit

→ 감지 시:
```
[보안] 보안 감사 요청을 감지했습니다. sj-cso를 실행합니다.
```
`Skill("s-skills:sj-cso")` 호출

---

### Step 0-ship: 릴리즈/배포 요청 감지

태스크 텍스트가 릴리즈·PR·배포 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
배포해줘, PR 올려줘, 릴리즈, ship, 머지해줘, 배포 준비, PR 만들어, 커밋하고 push

**충돌 방지:** "배포 후 확인", "배포 모니터링", "잘 올라갔어", "canary", "프로덕션 체크" 포함 시 → ship이 아닌 canary(Step 0-canary)로 라우팅. ship은 push/PR **생성** 요청에만 반응.

→ 감지 시:

```bash
_SHIP_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "현재 브랜치: $_SHIP_BRANCH"
git log origin/main..HEAD --oneline 2>/dev/null | head -5
```

AskUserQuestion으로 사전 확인 (취소 불가 작업이므로 필수):
- "현재 브랜치: {브랜치명}. PR 생성 및 push를 진행할까요?"
- "예 → sj-ship 실행 / 아니오 → 취소"

확인 후:
```
[릴리즈] sj-ship을 실행합니다.
```
`Skill("s-skills:sj-ship")` 호출

---

### Step 0-retro: 회고 요청 감지

태스크 텍스트가 회고·retrospective 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
회고, retro, retrospective, 이번 주 정리, 지난주 리뷰, 한 주 돌아보기, 회고해줘

→ 감지 시:
```
[회고] 주간 회고 요청을 감지했습니다. sj-retro를 실행합니다.
```
`Skill("s-skills:sj-retro")` 호출

---

### Step 0-canary: 배포 모니터링 요청 감지

태스크 텍스트가 배포 후 상태 확인·canary 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
canary, 배포 후 확인, 프로덕션 체크, 상태 확인, 배포 모니터링, 잘 올라갔어?

→ 감지 시:
```
[Canary] 배포 후 모니터링 요청을 감지했습니다. sj-qa canary 모드를 실행합니다.
```
`Skill("s-skills:sj-qa")` 호출 (canary 모드)

---

### Step 0-benchmark: 성능 측정 요청 감지

태스크 텍스트가 성능 측정·벤치마크 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
성능 측정, 벤치마크, benchmark, Core Web Vitals, lighthouse, 로드 타임, 느린 이유

→ 감지 시:
```
[Benchmark] 성능 측정 요청을 감지했습니다. sj-qa benchmark 모드를 실행합니다.
```
`Skill("s-skills:sj-qa")` 호출 (benchmark 모드)

---

### Step 0-office-hours: 아이디어 검증 요청 감지

태스크 텍스트가 코딩 전 아이디어 검증·office hours 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
office hours, 아이디어 검증, 이게 맞아?, 코딩 전 확인, 이 기능 만들어야 할까, 방향 맞아?

→ 감지 시:
```
[Office Hours] 아이디어 검증 요청을 감지했습니다. sj-pm office hours 모드를 실행합니다.
```
`Skill("s-skills:sj-pm")` 호출 (office-hours 모드)

---

### Step 0-design-shotgun: 디자인 탐색 요청 감지

태스크 텍스트가 다수 디자인 변형 생성 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
목업 여러 개, 변형 생성, 디자인 탐색, 다양하게 보여줘, design shotgun, 여러 스타일, 디자인 아이디어

→ 감지 시:
```
[Design Shotgun] 디자인 변형 탐색 요청을 감지했습니다. sj-design shotgun 모드를 실행합니다.
```
`Skill("s-skills:sj-design")` 호출 (shotgun 모드)

---

### Step 0-secretary: 비서 보고 요청 감지

태스크 텍스트가 비서 보고·현황 요약 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
비서, secretary, 현황 보고, 요약 보고, 보고서 봐줘, 진행 상황 알려줘, 지금 어때, 프로젝트 현황, 뭐가 완료됐어

→ 감지 시:
```
[비서] 현황 보고 요청을 감지했습니다. sj-secretary를 실행합니다.
```
`Skill("s-skills:sj-secretary")` 호출

---

### Step 0-test-scenario: 테스트 시나리오 요청 감지

태스크 텍스트가 테스트 시나리오 생성·검증 시나리오 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
테스트 시나리오, 검증 시나리오, test scenario, 기능 검증 목록, 테스트 케이스 만들어줘, 시나리오 작성, 통과율 추적

→ 감지 시:
```
[테스트 시나리오] 시나리오 생성 요청을 감지했습니다. test-scenario를 실행합니다.
```
`Skill("s-skills:test-scenario")` 호출

---

### Step 0-docs-organize: 문서 정리 요청 감지

태스크 텍스트가 문서 구조 정리·docs 생성·health score 요청인지 판단해라. 해당하면 실행하고 Case B 종료.

**감지 키워드:**
문서 정리, docs 구조, docs 만들어줘, 문서 스코어, health score, docs 정리, 코드베이스 분석 문서, docs-organize

→ 감지 시:
```
[문서 정리] 문서 구조 정리 요청을 감지했습니다. docs-organize를 실행합니다.
```
`Skill("s-skills:docs-organize")` 호출

---

### Step 0a: 리뷰 요청 감지 (크기 판정 전 먼저 체크)

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

**IS_REVIEW=no이면** → Step 1(태스크 크기 판정)으로 진행.

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
크기가 다르면 조정: Tiny / Small / Medium / Large / xLarge (엔터: 그대로 진행)
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
| 현재 상태 | `PROJECT.md` | 영구 | `goal`/`next`/`last_session`/`blockers`/`status` 단일 사실 |

### 금지

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지 (이주 완료)
- `docs/sj-company/dev-output/` 디렉토리 생성 금지 (→ `.state/dev/`로 통일)
- `.state/stage.txt` 업데이트 금지 (단계 추적은 PROJECT.md `last_session`으로)
- Design 명세 단계 없음 (PM이 커버). Design 리뷰는 Tech Lead가 sentinel 파일로 트리거.

### 학습 누적 의무

각 역할 스킬(`sj-pm`/`sj-design`/`sj-tech-lead`/`sj-qa`)은 사이클을 마칠 때 **이번 사이클에서 새로 알게 된 인사이트 1~3줄**을 자기 `*-context.md`의 `## 히스토리` 섹션에 날짜와 함께 append 한다. 사이클 산출이 모두 휘발해도 학습은 영속.

### archive-only 불변식 (영속 파일 보호)

`PROJECT.md`·`*-context.md` 등 **영속 파일을 통째로 재생성(Write로 덮어쓰기)** 하기 직전에는, 반드시 직전 버전을 `docs/sj-company/archive/`로 보존한 뒤 덮어쓴다. 필드 단위 수정(Edit)은 해당 없음 — 통째 재작성·마이그레이션·리셋에만 적용.

```bash
# 영속 파일을 Write로 통째 덮어쓰기 직전 1회 실행
mkdir -p docs/sj-company/archive
_F="docs/sj-company/PROJECT.md"   # 또는 *-context.md
[ -f "$_F" ] && cp "$_F" "docs/sj-company/archive/$(basename "$_F").$(date +%Y%m%d-%H%M%S).bak"
```

**절대 삭제하지 않는다 — archive만 한다.** 컨텍스트는 복구 가능해야 한다. (Hermes curator의 "never auto-delete, archive only" 불변식과 동일 철학.)

### context.md 큐레이션 트리거 (지연 발동)

영속 학습 파일은 무한 누적된다. **임계값을 넘기 전까지는 손대지 않는다.** Preamble에서 크기를 점검하고, 임계 초과 시에만 통합(consolidate)한다.

```bash
# Preamble 또는 사이클 종료 시 점검
for _C in pm design dev qa; do
  _CF="docs/sj-company/${_C}-context.md"
  [ -f "$_CF" ] || continue
  _N=$(wc -l < "$_CF" | tr -d ' ')
  [ "$_N" -gt 200 ] && echo "CURATE_NEEDED=$_CF ($_N줄)"
done
```

`CURATE_NEEDED`가 출력된 파일만: archive-only 불변식으로 백업한 뒤, `## 히스토리`의 오래된 항목을 **요약 1~3줄로 압축**하고 중복·낡은 인사이트를 통합한다. 200줄 이하 파일은 **건드리지 않는다**(오버엔지니어링 금지).
