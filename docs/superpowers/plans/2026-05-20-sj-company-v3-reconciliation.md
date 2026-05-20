# sj-company v3 Reconciliation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sj-company v3의 "PROJECT.md 단일 소스" 룰을 실제로 강제하여, 4개 코어 스킬과 7개 dev 에이전트를 v3 모델로 정합화한다. 사이클 단위 산출물은 `.state/` 휘발 영역으로, 학습된 인사이트는 `*-context.md` 영속 영역으로 분리.

**Architecture:** 산출물 이중화 — `.state/{pm-brief,design-review,qa-verdict,dev-summary,dev/{role}}.md`는 사이클 단위 휘발성, `{pm,design,dev,qa}-context.md`는 영속 학습 누적, `PROJECT.md`는 현재 상태 단일 사실. 기존 `docs/sj-company/{pm,design,dev,qa}-output.md`, `report.md`, `.state/stage.txt`는 `archive/`로 이주 후 영구 폐기.

**Tech Stack:** Markdown SKILL files, Bash, Python3 (in-skill heredocs). 새 의존성 없음.

**Background reference:** `docs/reviews/2026-05-19-core-harness-review.md` — 본 계획의 근거가 된 진단 보고서.

---

## File Structure

**Modify:**
- `skills/sj-company/SKILL.md` — 룰 섹션 보강, Case A→B 명시, Large 경로 pw-loop 중복 제거, Medium HINT 매핑에 `si` 추가, preamble의 죽은 pm-output.md 참조 정리
- `skills/sj-pm/SKILL.md` — task.txt 출력을 `.state/pm-brief.md`로 변경(HINT 첫 줄), pm-context.md 누적 단계 추가, Step 4 번호 결손 수정
- `skills/sj-design/SKILL.md` — 명세 모드 삭제, 리뷰 모드만 유지. 호출 메커니즘을 sentinel 파일(`.state/design-review.req`) 감지로 전환. 출력을 `.state/design-review.md`로 변경. design-context.md 누적 추가
- `skills/sj-tech-lead/SKILL.md` — Step 1 `_HAS_PM` 보정 + `.state/pm-brief.md` HINT 읽기, Step 5 dev 디스패치 출력을 `.state/dev/{role}.md`로, Step 7b Design 리뷰 호출을 sentinel 파일 방식으로, Step 9 집계 출력을 `.state/dev-summary.md`로 + PROJECT.md 갱신, dev-context.md 누적 추가
- `skills/sj-qa/SKILL.md` — 출력을 `.state/qa-verdict.md`로, verdict 파싱을 헤더 정규식으로, pw-loop 호출 유지(중복은 sj-company 측에서 제거), qa-context.md 누적 추가
- `agents/sj-dev-frontend.md` — 입력 컨텍스트 + Step 1을 v3 (PROJECT.md + .state/pm-brief.md + .state/dev/{role}.md + *-context.md)로 교체
- `agents/sj-dev-backend.md` — 동일 패턴 적용
- `agents/sj-dev-database.md` — 동일 패턴 적용
- `agents/sj-dev-devops.md` — 동일 패턴 적용
- `agents/sj-dev-security.md` — 동일 패턴 적용 (MODE=review 분기는 sentinel 파일 + `.state/dev/*.md` 리뷰 대상 변경)
- `agents/sj-dev-data.md` — 동일 패턴 적용
- `agents/sj-dev-si.md` — `dev-output/si.md` → `.state/dev/si.md`만 변경, 나머지는 이미 v3 친화적이므로 최소 수정

**Create (one-shot migration artifact):**
- `docs/sj-company/archive/2026-05-20-v3-migration/{pm,design,dev,qa}-output.md`, `report.md`, `stage.txt` — 기존 v2 잔재 이주 위치

**No changes:**
- `docs/sj-company/PROJECT.md` — 포맷 그대로
- `docs/sj-company/{pm,design,dev,qa}-context.md` — 포맷 그대로 (이번 패치 이후 누적 메커니즘이 활성화될 뿐)
- `docs/reviews/2026-05-19-core-harness-review.md` — 참고 문서

---

## Sentinel File Convention (이 계획에서 도입)

`Skill` 도구가 환경변수·프롬프트 인자를 전달할 수 없는 한계를 우회하기 위해 sentinel 파일을 사용한다. 호출자가 sentinel 파일에 모드/요청 메타를 적고, 피호출 스킬이 Step 0에서 sentinel을 감지해 동작 분기.

| Sentinel 경로 | 호출자 → 피호출자 | 내용 예시 |
|--------------|-------------------|-----------|
| `docs/sj-company/.state/design-review.req` | sj-tech-lead → sj-design | `MODE=review\nTARGET=.state/dev/frontend.md\n` |

피호출 스킬 Step 0:
```bash
_REQ_FILE="docs/sj-company/.state/design-review.req"
if [ -f "$_REQ_FILE" ]; then
  _MODE=$(grep -E '^MODE=' "$_REQ_FILE" | cut -d= -f2)
  _TARGET=$(grep -E '^TARGET=' "$_REQ_FILE" | cut -d= -f2)
  rm -f "$_REQ_FILE"  # 소비 후 즉시 삭제
else
  _MODE="default"
fi
```

이 패턴은 Task 7(sj-design 리뷰), Task 11(Tech Lead → sj-design 호출)에서 사용한다.

---

## Tasks

### Task 1: 워크스페이스 이주 — v2 잔재 파일을 archive로 이동

**Files:**
- Move: `docs/sj-company/{pm,design,dev,qa}-output.md`, `docs/sj-company/report.md`, `docs/sj-company/.state/stage.txt`, `docs/sj-company/dev-output/` → `docs/sj-company/archive/2026-05-20-v3-migration/`

- [ ] **Step 1: 현 워크스페이스 백업 확인 (이주 전 증거 보존)**

Run:
```bash
ls -la /Users/songseungju/S-skills/docs/sj-company/ /Users/songseungju/S-skills/docs/sj-company/.state/ 2>/dev/null
```

Expected: `pm-output.md`, `design-output.md`, `dev-output.md`, `dev-output/`, `qa-output.md`, `report.md`, `.state/stage.txt`, `.state/task.txt` 등이 보임.

- [ ] **Step 2: archive 디렉토리 생성**

Run:
```bash
mkdir -p /Users/songseungju/S-skills/docs/sj-company/archive/2026-05-20-v3-migration
```

- [ ] **Step 3: v2 산출 파일 이동**

Run:
```bash
cd /Users/songseungju/S-skills/docs/sj-company
for f in pm-output.md design-output.md dev-output.md qa-output.md report.md; do
  [ -f "$f" ] && mv "$f" archive/2026-05-20-v3-migration/
done
[ -d "dev-output" ] && mv dev-output archive/2026-05-20-v3-migration/
[ -f ".state/stage.txt" ] && mv .state/stage.txt archive/2026-05-20-v3-migration/
echo "이주 완료:"
ls archive/2026-05-20-v3-migration/
```

Expected: archive 디렉토리에 v2 파일들이 보임. 루트(`docs/sj-company/`)에는 PROJECT.md, `*-context.md`, `.state/`만 남음.

- [ ] **Step 4: 이주 후 워크스페이스 확인**

Run:
```bash
ls /Users/songseungju/S-skills/docs/sj-company/
ls /Users/songseungju/S-skills/docs/sj-company/.state/
```

Expected:
- 루트: `PROJECT.md`, `pm-context.md`, `design-context.md`, `dev-context.md`, `qa-context.md`, `archive/`
- `.state/`: `task.txt`만

- [ ] **Step 5: 커밋**

```bash
cd /Users/songseungju/S-skills
git add docs/sj-company/
git commit -m "$(cat <<'EOF'
chore(sj-company): v3 마이그레이션 — v2 산출 파일 archive로 이주

pm-output.md, design-output.md, dev-output.md, qa-output.md, report.md,
.state/stage.txt, dev-output/ → archive/2026-05-20-v3-migration/

이후 패치에서 4개 스킬·7개 에이전트가 v3 모델(.state/ 휘발 +
*-context.md 영속)로 정합화됨.
EOF
)"
```

---

### Task 2: sj-company 룰 섹션 보강 — 이중화 정책 명시

**Files:**
- Modify: `skills/sj-company/SKILL.md:401-406` ("중요 규칙" 절)

- [ ] **Step 1: 현재 규칙 섹션 확인**

Run:
```bash
sed -n '400,410p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected 출력:
```
## 중요 규칙

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지
- `stage.txt` 업데이트 금지
- 모든 상태는 PROJECT.md에만 기록
- Design 단계 없음 (PM이 충분히 커버)
```

- [ ] **Step 2: 규칙 섹션 교체**

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
```
## 중요 규칙

- `pm-output.md`, `design-output.md`, `dev-output.md`, `qa-output.md`, `report.md` 생성 금지
- `stage.txt` 업데이트 금지
- 모든 상태는 PROJECT.md에만 기록
- Design 단계 없음 (PM이 충분히 커버)
```

new_string:
```
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
```

- [ ] **Step 3: 변경 확인**

Run:
```bash
sed -n '400,440p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected: 위 new_string의 내용이 보임.

- [ ] **Step 4: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-company/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-company): 산출물 이중화 정책 명시 — 휘발/영속/현재상태 3계층

휘발: .state/{pm-brief,design-review,dev/{role},dev-summary,qa-verdict}.md
영속: {pm,design,dev,qa}-context.md (히스토리 누적 의무)
현재: PROJECT.md 단일 사실

이후 패치에서 4개 스킬·7개 에이전트가 이 정책에 맞춰 재작성된다.
EOF
)"
```

---

### Task 3: sj-company — preamble 죽은 참조 제거 + Case A→B 명시 + Large pw-loop 중복 제거 + Medium HINT에 `si` 추가

**Files:**
- Modify: `skills/sj-company/SKILL.md:39,57-62` (preamble의 v2 잔재 참조 정리)
- Modify: `skills/sj-company/SKILL.md:158-161` (Case A→B 전이 명시)
- Modify: `skills/sj-company/SKILL.md:350-356` (Large pw-loop 호출 제거)
- Modify: `skills/sj-company/SKILL.md:325-333` (Medium HINT 매핑에 `si` 추가)

- [ ] **Step 1: preamble의 v2 잔재 참조 정리 — `_HAS_OLD` 판정**

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
```
_HAS_PROJECT=$([ -f "docs/sj-company/PROJECT.md" ] && echo "yes" || echo "no")
_HAS_OLD=$([ -f "docs/sj-company/.state/stage.txt" ] && echo "yes" || [ -f "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")
```

new_string:
```
_HAS_PROJECT=$([ -f "docs/sj-company/PROJECT.md" ] && echo "yes" || echo "no")
# v2 잔재 감지(자동 이주는 일회성 — 2026-05-20 이주 PR 이후 자동 분기는 비활성, 수동 마이그레이션만 안내)
_HAS_OLD=$([ -f "docs/sj-company/.state/stage.txt" ] && echo "yes" || [ -f "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")
```

(주: 자동 마이그레이션 블록은 그대로 유지. 신규 프로젝트에서 v2 잔재가 보이면 여전히 PROJECT.md 자동 생성. 다만 주석으로 일회성임을 알린다.)

- [ ] **Step 2: Case A — NEXT 시작 분기 명시화**

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
```
AskUserQuestion으로 사용자 입력 받기:
- A) 바로 시작 (NEXT 태스크로) → NEXT 값을 태스크로 Case B 실행
- B) 새 태스크 입력 → 입력값으로 Case B 실행

PROJECT.md가 없는 경우 (신규 프로젝트):
1. AskUserQuestion으로 프로젝트 목표 입력 받기
2. 스택 자동 감지 (package.json / go.mod / requirements.txt)
3. PROJECT.md 생성:
```

new_string:
```
AskUserQuestion으로 사용자 입력 받기:
- A) 바로 시작 (NEXT 태스크로) → NEXT 값을 태스크로 두고 **이 시점부터 Case B Step 1(태스크 크기 판정)부터 실행**
- B) 새 태스크 입력 → 입력값을 태스크로 두고 **이 시점부터 Case B Step 1부터 실행**

PROJECT.md가 없는 경우 (신규 프로젝트):
1. AskUserQuestion으로 프로젝트 목표 입력 받기
2. 스택 자동 감지 (package.json / go.mod / requirements.txt)
3. PROJECT.md 생성:
```

- [ ] **Step 3: PROJECT.md 신규 생성 후 후속 행동 명시**

먼저 현재 상태 확인:
```bash
sed -n '190,200p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected 마지막 줄 부근:
```
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
```
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

new_string:
```
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

(파일 내용 변경 없음 — 다음 단계에서 후속 행동 줄을 추가)

직후에 새 단락 추가. 위 블록 종료 후 ` ``` ` 라인 다음에 다음 한 줄을 추가하는 Edit:

old_string:
```
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```
```

new_string:
```
open("docs/sj-company/PROJECT.md", "w").write(content)
print("PROJECT.md 생성 완료")
```

생성 직후, 사용자에게 "프로젝트가 등록됐습니다. 다음 태스크를 입력하세요"를 출력하고 새 태스크 입력을 받아 **Case B Step 1(태스크 크기 판정)부터 실행**한다.
```

- [ ] **Step 4: Medium HINT 매핑에 `si` 추가**

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
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

new_string:
```python
task_lower = "{태스크}".lower()
if any(k in task_lower for k in ["작업 개요", "제안서", "요구사항", "wbs", "데모", "결과보고서", "주간 보고서", "도메인 맵", "견적서", "si 문서"]):
    hint = "si"
elif any(k in task_lower for k in ["ui", "컴포넌트", "화면", "페이지", "css", "스타일"]):
    hint = "frontend"
elif any(k in task_lower for k in ["api", "서버", "백엔드", "db", "데이터베이스"]):
    hint = "backend"
else:
    hint = ""  # Tech Lead가 판단
print(f"HINT={hint}")
```

- [ ] **Step 5: Large 경로의 pw-loop 호출 제거 (sj-qa에 일임)**

Use Edit on `/Users/songseungju/S-skills/skills/sj-company/SKILL.md`:

old_string:
```
3. 단계별 Tech Lead 실행: `Skill("s-skills:sj-tech-lead")`
4. 각 단계 완료 후 빌드 확인
5. 전체 완료 후 pw-loop 실행 (Medium과 동일)
6. QA 실행: `Skill("s-skills:sj-qa")` — 구현 전체 검증 + PROJECT.md 업데이트 포함
   (sj-qa가 PROJECT.md를 업데이트하므로 Large 경로는 별도 PROJECT.md 업데이트 불필요)
```

new_string:
```
3. 단계별 Tech Lead 실행: `Skill("s-skills:sj-tech-lead")`
4. 각 단계 완료 후 빌드 확인
5. QA 실행: `Skill("s-skills:sj-qa")` — 구현 전체 검증 + pw-loop 호출 + PROJECT.md 업데이트 포함
   (Large 경로의 pw-loop는 sj-qa Step 6에서 수행하므로 sj-company는 직접 호출하지 않는다.
    sj-qa가 PROJECT.md를 업데이트하므로 Large 경로는 별도 PROJECT.md 업데이트 불필요)
```

- [ ] **Step 6: 변경 확인 — grep으로 dead reference 없는지**

Run:
```bash
grep -n "pm-output\|stage.txt 업데이트\|Case B 실행\|hint = \"si\"" /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected: `hint = "si"` 라인 1개, "Case B Step 1부터 실행" 라인 2~3개, 자동 마이그레이션 블록 내의 pm-output.md/stage.txt 참조(정상)만 보임.

- [ ] **Step 7: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-company/SKILL.md
git commit -m "$(cat <<'EOF'
fix(sj-company): Case A→B 전이 명시, Large pw-loop 중복 제거, SI HINT 추가

- Case A 두 분기 + 신규 프로젝트 분기 모두 "Case B Step 1부터 실행" 명시
- Large 경로의 pw-loop 직접 호출 제거 (sj-qa Step 6에 일임)
- Medium HINT 매핑에 si 키워드 추가 (작업개요/제안서/요구사항/WBS/데모 등)
EOF
)"
```

---

### Task 4: sj-pm 재작성 — `.state/pm-brief.md` 출력 + HINT 첫 줄 + pm-context.md 누적 + Step 번호 정합

**Files:**
- Rewrite: `skills/sj-pm/SKILL.md` (전체 약 162줄 → 약 170줄)

- [ ] **Step 1: 현재 sj-pm 본문 확인**

Run:
```bash
wc -l /Users/songseungju/S-skills/skills/sj-pm/SKILL.md
sed -n '108,162p' /Users/songseungju/S-skills/skills/sj-pm/SKILL.md
```

Expected: 162줄, Step 5(결과 저장)는 `.state/task.txt`에 덮어쓰는 로직.

- [ ] **Step 2: Step 5 (결과 저장) 섹션 교체 — `.state/pm-brief.md`로 변경 + HINT 첫 줄**

Use Edit on `/Users/songseungju/S-skills/skills/sj-pm/SKILL.md`:

old_string:
```
## Step 5: 결과 저장

`docs/sj-company/.state/task.txt`에 저장 (Tech Lead가 읽는 파일):

```markdown
PM Output — {태스크명}
생성일: {날짜}

요구사항 분석:
[분석 요약]

태스크 목록:
- [ ] {태스크1}
- [ ] {태스크2}

리스크:
- {리스크1}

Dev/QA에 전달할 핵심 지침:
[핵심 지침]
```

PROJECT.md 업데이트 (sj-company v3):

```bash
# sj-company v3: PROJECT.md goal/next 동기화
python3 - <<'PY'
import re, os

path = "docs/sj-company/PROJECT.md"
if not os.path.exists(path):
    print("PROJECT.md 없음, 스킵")
    exit(0)

# task.txt에서 첫 번째 태스크 추출
task_txt = open("docs/sj-company/.state/task.txt", encoding="utf-8").read() if os.path.exists("docs/sj-company/.state/task.txt") else ""
first_task = ""
m = re.search(r"- \[ \] (.+)$", task_txt, re.MULTILINE)
if m: first_task = m.group(1).strip()

text = open(path, encoding="utf-8").read()
def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", lambda m: f"{key}: {val}", t, flags=re.MULTILINE)

if first_task:
    text = upd("next", first_task, text)
open(path, "w", encoding="utf-8").write(text)
print(f"PROJECT.md next 업데이트: {first_task or '(태스크 없음)'}")
PY
```
```

new_string:
```
## Step 4: 역할 힌트 판단

태스크 내용에서 단일 디스패치 힌트를 추출한다(Tech Lead가 이 힌트로 단일 specialist만 호출).

```python
task_lower = "{태스크}".lower()
if any(k in task_lower for k in ["작업 개요", "제안서", "요구사항", "wbs", "데모", "결과보고서", "주간 보고서", "도메인 맵", "견적서", "si 문서"]):
    hint = "si"
elif any(k in task_lower for k in ["ui", "컴포넌트", "화면", "페이지", "css", "스타일"]):
    hint = "frontend"
elif any(k in task_lower for k in ["api", "서버", "백엔드", "db", "데이터베이스"]):
    hint = "backend"
elif any(k in task_lower for k in ["스키마", "마이그레이션", "쿼리"]):
    hint = "database"
elif any(k in task_lower for k in ["인증", "권한", "암호화", "토큰"]):
    hint = "security"
else:
    hint = ""  # Tech Lead가 Step 3에서 판단
print(f"HINT={hint}")
```

## Step 5: 결과 저장

`docs/sj-company/.state/pm-brief.md`에 저장 (Tech Lead가 읽는 파일).
**첫 줄은 반드시 `[HINT:single={hint}]` 형태로 시작**한다(빈 hint일 경우 `[HINT:single=]`).

```markdown
[HINT:single={hint}]
# PM Brief — {태스크명}
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

PROJECT.md 업데이트:

```bash
python3 - <<'PY'
import re, os

path = "docs/sj-company/PROJECT.md"
if not os.path.exists(path):
    print("PROJECT.md 없음, 스킵")
    exit(0)

brief_path = "docs/sj-company/.state/pm-brief.md"
brief_txt = open(brief_path, encoding="utf-8").read() if os.path.exists(brief_path) else ""
first_task = ""
m = re.search(r"^- \[ \] (.+)$", brief_txt, re.MULTILINE)
if m: first_task = m.group(1).strip()

text = open(path, encoding="utf-8").read()
def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", lambda m: f"{key}: {val}", t, flags=re.MULTILINE)

if first_task:
    text = upd("next", first_task, text)
open(path, "w", encoding="utf-8").write(text)
print(f"PROJECT.md next 업데이트: {first_task or '(태스크 없음)'}")
PY
```

## Step 6: pm-context.md 학습 누적

이번 사이클에서 **새로 알게 된 인사이트** 1~3줄을 `docs/sj-company/pm-context.md`의 `## 히스토리` 섹션 끝에 추가한다. 단순한 작업 기록이 아니라 "다음 사이클이 알면 좋을 사실"만 기록.

```python
import os, datetime

ctx_path = "docs/sj-company/pm-context.md"
if not os.path.exists(ctx_path):
    print("pm-context.md 없음, 스킵 (Step 1에서 생성됐어야 함)")
    exit(0)

today = datetime.date.today().strftime("%Y-%m-%d")
insight = "{이번 사이클에서 알게 된 사실 — 예: '결제 도메인은 idempotency key 패턴 사용', '디자인 시안은 모바일 우선'}"

text = open(ctx_path, encoding="utf-8").read()
# 마지막 줄이 빈 줄이면 보존하면서 append
if not text.endswith("\n"):
    text += "\n"
text += f"- {today}: {insight}\n"
open(ctx_path, "w", encoding="utf-8").write(text)
print(f"pm-context.md 누적: {insight}")
```

인사이트가 정말로 없으면 이 Step은 스킵 가능 (단순 작업이었다면 누적 가치 없음).
```

- [ ] **Step 3: Step 3 (자체 검토) 다음에 Step 4 누락 수정 — 위 변경에서 이미 Step 4(역할 힌트)를 추가했으므로 자체 검토는 Step 3 그대로. Step 7 (완료 보고)도 번호 맞추기**

Run:
```bash
grep -n "^## Step" /Users/songseungju/S-skills/skills/sj-pm/SKILL.md
```

Expected: Step 1, 2, 3, 4, 5, 6 — Step 7(완료 보고)이 없으면 누락된 것.

Use Edit on `/Users/songseungju/S-skills/skills/sj-pm/SKILL.md`:

old_string:
```
## Step 6: 완료 보고

결과를 사용자에게 요약해서 출력한다. 다음 단계(Design 또는 Tech Lead)를 제안한다.
```

new_string:
```
## Step 7: 완료 보고

결과를 사용자에게 요약해서 출력한다. 다음 단계(Tech Lead)를 제안한다.
(Design 명세 단계는 sj-company v3에서 제거됨 — Frontend가 들어가는 사이클에서만 Tech Lead가 sentinel로 Design 리뷰 호출)
```

- [ ] **Step 4: 버전 번호 및 description 갱신**

먼저 frontmatter 확인:
```bash
sed -n '1,15p' /Users/songseungju/S-skills/skills/sj-pm/SKILL.md
```

Use Edit:

old_string:
```
name: sj-pm
version: 1.1.0
description: |
  PM 역할 에이전트. 태스크를 분석하고 요구사항, 리스크, 우선순위를 정의한다.
  프로젝트별 pm-context.md를 생성·유지해 프로젝트에 최적화된 분석을 제공한다.
```

new_string:
```
name: sj-pm
version: 2.0.0
description: |
  PM 역할 에이전트. 태스크를 분석하고 요구사항, 리스크, 우선순위, 역할 힌트를 정의한다.
  결과는 .state/pm-brief.md(휘발)에, 학습 인사이트는 pm-context.md(영속)에 누적한다.
```

- [ ] **Step 5: 죽은 참조 확인**

Run:
```bash
grep -n "task.txt\|pm-output\|stage.txt" /Users/songseungju/S-skills/skills/sj-pm/SKILL.md
```

Expected: `task.txt` 참조는 Step 2(태스크 수행)의 "task.txt가 있으면 읽기" 라인만 남음 — 이건 Tech Lead가 단독 호출 시 fallback이라 유지. `pm-output`/`stage.txt` 0건이어야 함.

- [ ] **Step 6: Step 2의 task.txt 참조도 pm-brief.md로 정합**

Use Edit on `/Users/songseungju/S-skills/skills/sj-pm/SKILL.md`:

old_string:
```
## Step 2: 태스크 수행

현재 요청(스킬 호출 시 전달된 메시지 또는 `/ai`에서 넘겨받은 task.txt)을 분석한다.

```bash
# task.txt가 있으면 읽기
[ -f "docs/sj-company/.state/task.txt" ] && cat "docs/sj-company/.state/task.txt"
```
```

new_string:
```
## Step 2: 태스크 수행

현재 요청을 분석한다. 입력 우선순위:
1. 스킬 호출 시 전달된 메시지 (인자)
2. sj-company에서 작성한 `docs/sj-company/.state/task.txt` (Large 경로의 raw 태스크 텍스트)
3. PROJECT.md의 `next` 필드 (그것도 없으면 사용자에게 AskUserQuestion)

```bash
[ -f "docs/sj-company/.state/task.txt" ] && cat "docs/sj-company/.state/task.txt"
```
```

- [ ] **Step 7: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-pm/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-pm)!: v3 정합 — .state/pm-brief.md 출력 + HINT 첫 줄 + 학습 누적

BREAKING: task.txt 덮어쓰기 → .state/pm-brief.md 신규 생성
- 첫 줄에 [HINT:single={role}] 강제 (Tech Lead가 단일 디스패치 결정)
- Step 4(역할 힌트 판단) 신설로 Step 번호 결손 해소
- Step 6 학습 누적 단계 신설 — pm-context.md 히스토리 append
- description, version 2.0.0으로 갱신
EOF
)"
```

---

### Task 5: sj-design 재작성 — 명세 모드 삭제, 리뷰 모드만 유지, sentinel 트리거

**Files:**
- Rewrite: `skills/sj-design/SKILL.md` (전체 273줄 → 약 150줄)

- [ ] **Step 1: 현재 sj-design 본문 백업 (참고용)**

Run:
```bash
cp /Users/songseungju/S-skills/skills/sj-design/SKILL.md /tmp/sj-design-pre-v3.md
wc -l /tmp/sj-design-pre-v3.md
```

Expected: 273줄.

- [ ] **Step 2: 전체 파일 덮어쓰기 — 리뷰 전용 + sentinel + design-context 누적**

Use Write on `/Users/songseungju/S-skills/skills/sj-design/SKILL.md`:

```markdown
---
name: sj-design
version: 2.0.0
description: |
  Design 리뷰 전용 에이전트. Frontend 구현 결과를 design-context.md의 비주얼 방향 대비 검토한다.
  Tech Lead가 `.state/design-review.req` sentinel 파일로 트리거한다.
  /Users/songseungju/awesome-design-md 의 브랜드 참조를 활용한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
triggers:
  - /design
---

# Design Reviewer

당신은 이 프로젝트의 **Design 리뷰어**다. **이 스킬은 명세를 작성하지 않는다** — sj-company v3에서 Design 명세 단계는 PM에 흡수됐다.
Tech Lead가 Frontend 구현 후 호출하면, design-context.md의 비주얼 방향 대비 실제 구현 일치도를 검토한다.

## Base Guidelines (Karpathy)

1. **Think Before Coding** — 코드 수정 금지. 리뷰만.
2. **Simplicity First** — 명세에 없는 새 요구를 추가 금지.
3. **Surgical Changes** — design-context.md 자체를 리뷰 중에 수정 금지(누적은 Step R-4에서만).
4. **Goal-Driven Execution** — PASS/FAIL을 단호하게 판정한다.

## Step 0: Sentinel 감지

```bash
mkdir -p docs/sj-company/.state
_REQ_FILE="docs/sj-company/.state/design-review.req"
if [ -f "$_REQ_FILE" ]; then
  _MODE=$(grep -E '^MODE=' "$_REQ_FILE" | cut -d= -f2)
  _TARGET=$(grep -E '^TARGET=' "$_REQ_FILE" | cut -d= -f2)
  rm -f "$_REQ_FILE"
  echo "리뷰 요청 감지: MODE=$_MODE TARGET=$_TARGET"
else
  echo "sentinel 없음 — 단독 호출. AskUserQuestion으로 검토 대상을 물어본다."
fi
```

`_TARGET`이 비어 있으면 사용자에게 검토 대상 파일 경로를 묻고, 답이 없으면 종료.

## Step R-1: 컨텍스트 로드

```bash
# design-context.md — 이 프로젝트의 비주얼 방향(영속)
[ -f "docs/sj-company/design-context.md" ] && cat docs/sj-company/design-context.md

# 검토 대상 변경 파일 목록
[ -f "$_TARGET" ] && cat "$_TARGET"
```

`design-context.md`가 없으면 design-context.md를 먼저 생성한다(아래 보조 절차 — sj-design v1.1.0의 Step 1 NEW 분기와 동일하되 명세 모드 절차는 모두 제거):

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

분석 후 프로젝트에 맞는 참조 브랜드 1~2개를 선정해 `design-context.md` 생성:

```markdown
# Design Context — {프로젝트명}

## 프로젝트 비주얼 방향
[현재 스타일 또는 목표 방향]

## 참조 브랜드
- primary: {브랜드명}  ← /Users/songseungju/awesome-design-md/design-md/{브랜드명}/DESIGN.md
- secondary: {브랜드명} (선택)

## 선정 이유
[왜 이 브랜드가 이 프로젝트에 맞는지]

## 기존 디자인 토큰 요약
[발견된 색상·폰트·spacing]

## 히스토리
- {날짜}: 초기 생성
```

primary 브랜드 DESIGN.md를 읽어 색·타이포·컴포넌트 패턴을 리뷰 기준으로 삼는다.

```bash
PRIMARY_BRAND=$(grep "^- primary:" docs/sj-company/design-context.md | sed 's/^- primary:[[:space:]]*//' | awk '{print $1}')
DESIGN_REF="/Users/songseungju/awesome-design-md/design-md/${PRIMARY_BRAND}/DESIGN.md"
[ -f "$DESIGN_REF" ] && head -200 "$DESIGN_REF" || echo "DESIGN_REF not found: $DESIGN_REF"
```

## Step R-2: 시각·UX 리뷰 체크리스트

`_TARGET`에 명시된 변경 파일들을 읽고 다음을 검증:

**디자인 토큰 일치**
- [ ] design-context.md의 색상 팔레트가 구현된 CSS 변수·Tailwind config와 일치하는가?
- [ ] 타이포그래피(폰트 패밀리·웨이트·크기 스케일)가 맞는가?
- [ ] 간격 토큰(spacing scale) 일치? 임의 픽셀 값 없는가?

**레이아웃·구성**
- [ ] 컴포넌트 구조 일치? 명세 외 추가 또는 누락 없는가?
- [ ] 그리드·정렬·여백 비율 의도와 맞는가?
- [ ] 반응형 브레이크포인트가 명세된 동작?

**인터랙션**
- [ ] 호버·포커스·액티브 상태가 디자인됐는가? (브라우저 기본 방치 금지)
- [ ] 애니메이션·트랜지션 의도와 맞는가?
- [ ] 상태 전환(loading/empty/error) 모두 처리?

**디자인 시스템·브랜드 일관성**
- [ ] DESIGN.md 참조 브랜드 톤을 벗어나지 않는가?
- [ ] 안티 템플릿 정책 위반 없는가? (제네릭 카드 그리드, 의미 없는 그라데이션 등)

**접근성**
- [ ] 색상 대비 WCAG AA 이상?
- [ ] 포커스 링이 디자인적으로 보이는가?

## Step R-3: 결과 저장 — `.state/design-review.md`

```markdown
# Design Review — {태스크 요약}
> 작성: sj-design v2.0.0 · {날짜}
> 검토 대상: {_TARGET 경로}

## 판정: PASS | FAIL

## 명세 일치도
- 디자인 토큰: ✅ / ⚠️ / ❌
- 레이아웃: ...
- 인터랙션: ...
- 접근성: ...

## 발견 (HIGH / MEDIUM / LOW)

### HIGH — Frontend 재디스패치 필요
- [{파일}:{line}] {불일치} → {권장 수정}

### MEDIUM — 후속 작업 권장
- ...

### LOW — 선택적 개선
- ...

## Frontend에게 전달할 수정 지시
{Tech Lead가 그대로 frontend에 재디스패치할 수 있는 형태로 정리}
```

저장 경로: `docs/sj-company/.state/design-review.md` (휘발성 — 다음 사이클에서 덮어쓰기)

## Step R-4: design-context.md 학습 누적

이번 리뷰에서 **새로 정립된 비주얼 약속** 1~3줄을 design-context.md `## 히스토리` 끝에 append.

```python
import os, datetime

ctx_path = "docs/sj-company/design-context.md"
if not os.path.exists(ctx_path):
    print("design-context.md 없음, 스킵")
    exit(0)

today = datetime.date.today().strftime("%Y-%m-%d")
insight = "{새 약속 — 예: '모달은 backdrop-blur-md 고정', '버튼 hover는 100ms ease-out'}"

text = open(ctx_path, encoding="utf-8").read()
if not text.endswith("\n"):
    text += "\n"
text += f"- {today}: {insight}\n"
open(ctx_path, "w", encoding="utf-8").write(text)
print(f"design-context.md 누적: {insight}")
```

리뷰가 단순 PASS이고 새 약속이 없으면 이 Step 스킵.

## Step R-5: Tech Lead에게 보고

판정(PASS/FAIL) + HIGH 이슈 개수 + 어떤 수정이 필요한지 짧게 반환. FAIL이면 frontend 재디스패치가 필요함을 명시.

## 리뷰 모드에서 절대 하지 말 것

- 코드 직접 수정 금지 — Tech Lead가 Frontend 에이전트에 재디스패치
- `design-context.md`의 비주얼 방향 자체를 리뷰 중에 변경 금지 (히스토리 누적만 허용)
- 명세에 없는 새 요구사항 추가 금지
```

- [ ] **Step 3: 변경 확인**

Run:
```bash
wc -l /Users/songseungju/S-skills/skills/sj-design/SKILL.md
grep -n "MODE=spec\|design-output.md\|stage.txt\|pm-output.md" /Users/songseungju/S-skills/skills/sj-design/SKILL.md
```

Expected: 약 150줄, 위 4개 패턴 0건.

- [ ] **Step 4: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-design/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-design)!: v3 정합 — 명세 모드 삭제, 리뷰 전용으로 슬림화

BREAKING:
- 명세 모드(Step 1~7) 전면 삭제 — sj-company v3에서 PM에 흡수
- 호출 메커니즘: 환경변수 → .state/design-review.req sentinel 파일 감지
- 출력: design-output.md, stage.txt 제거 → .state/design-review.md (휘발)
- design-context.md 학습 누적 단계 신설(R-4)
- 273줄 → 약 150줄
- version 2.0.0
EOF
)"
```

---

### Task 6: sj-tech-lead — Step 1 보정 + Step 5 출력 경로 변경

**Files:**
- Modify: `skills/sj-tech-lead/SKILL.md:48-95` (Step 1)
- Modify: `skills/sj-tech-lead/SKILL.md:165-206` (Step 5 디스패치 템플릿)

- [ ] **Step 1: Step 1 (입력 컨텍스트 로드) 교체**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
## Step 1: 입력 컨텍스트 로드

```bash
mkdir -p docs/sj-company/.state docs/sj-company/dev-output

_TASK=$(cat docs/sj-company/.state/task.txt 2>/dev/null)
_HAS_PM=$([ -s "docs/sj-company/.state/task.txt" ] && echo "yes" || echo "no")
_HAS_DESIGN=$([ -s "docs/sj-company/design-output.md" ] && echo "yes" || echo "no")
_HAS_DEV_CTX=$([ -s "docs/sj-company/dev-context.md" ] && echo "yes" || echo "no")
_MODEL_POLICY=$(cat docs/sj-company/.state/model-policy.txt 2>/dev/null | tr -d '[:space:]')
_MODEL_POLICY="${_MODEL_POLICY:-auto}"

# [HINT:single={role}] 파싱 — sj-company v3에서 전달하는 단일 디스패치 힌트
_HINT_SINGLE=$(echo "$_TASK" | grep -oE 'HINT:single=[a-z]+' | cut -d= -f2 || echo "")
_TASK_CLEAN=$(echo "$_TASK" | sed 's/\[HINT:[^]]*\]//g' | xargs)
echo "SINGLE_HINT: ${_HINT_SINGLE:-없음}"

echo "TASK: ${_TASK:-없음}"
echo "PM: $_HAS_PM | DESIGN: $_HAS_DESIGN | DEV_CTX: $_HAS_DEV_CTX"
echo "MODEL_POLICY: $_MODEL_POLICY"
```

`_HINT_SINGLE` 값에 따라 디스패치 범위를 결정한다:
- `_HINT_SINGLE=frontend` → sj-dev-frontend 1개만 Agent 디스패치, 나머지 생략
- `_HINT_SINGLE=backend`  → sj-dev-backend 1개만
- `_HINT_SINGLE=si`       → sj-dev-si 1개만 (SI 문서 작성)
- `_HINT_SINGLE=없음`     → 기존 로직대로 (Step 3에서 specialist 식별)

```bash
if [ "$_HAS_PM" = "no" ]; then
  # PROJECT.md에서 goal을 폴백으로 사용 (sj-company v3에서 PM 단계 생략 가능)
  _PM_CONTEXT=$(grep "^goal:" docs/sj-company/PROJECT.md 2>/dev/null | cut -d: -f2- | xargs || echo "")
  if [ -n "$_PM_CONTEXT" ]; then
    echo "PM_CONTEXT (PROJECT.md goal): $_PM_CONTEXT"
  else
    echo "PM output 없고 PROJECT.md goal도 없음 — 태스크 텍스트만으로 진행"
  fi
fi
```

`docs/sj-company/dev-context.md`가 없으면 분석 후 생성한다(기존 `sj-dev` 스킬의 Step 1 절차와 동일):

```bash
# 기술 스택 / 디렉토리 구조 파악
cat package.json 2>/dev/null || cat go.mod 2>/dev/null \
  || cat requirements.txt 2>/dev/null || cat Cargo.toml 2>/dev/null
find . -maxdepth 3 -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | head -20
```
```

new_string:
```
## Step 1: 입력 컨텍스트 로드

```bash
mkdir -p docs/sj-company/.state docs/sj-company/.state/dev

# 입력 우선순위: .state/pm-brief.md(PM 거친 경우) > .state/task.txt(Medium 인라인 브리핑) > PROJECT.md goal
_BRIEF_FILE="docs/sj-company/.state/pm-brief.md"
_TASK_FILE="docs/sj-company/.state/task.txt"

if [ -s "$_BRIEF_FILE" ]; then
  _SOURCE="pm-brief"
  _TASK=$(cat "$_BRIEF_FILE")
  _HAS_PM="yes"
elif [ -s "$_TASK_FILE" ]; then
  _SOURCE="task.txt"
  _TASK=$(cat "$_TASK_FILE")
  _HAS_PM="no"  # Medium 인라인 브리핑은 PM 단계 정식 통과는 아님
else
  _SOURCE="project"
  _TASK=$(grep "^goal:" docs/sj-company/PROJECT.md 2>/dev/null | cut -d: -f2- | xargs)
  _HAS_PM="no"
fi

_HAS_DEV_CTX=$([ -s "docs/sj-company/dev-context.md" ] && echo "yes" || echo "no")
_MODEL_POLICY=$(cat docs/sj-company/.state/model-policy.txt 2>/dev/null | tr -d '[:space:]')
_MODEL_POLICY="${_MODEL_POLICY:-auto}"

# [HINT:single={role}] 파싱 — pm-brief.md 첫 줄 또는 task.txt 본문에서
_HINT_SINGLE=$(echo "$_TASK" | grep -oE 'HINT:single=[a-z]+' | head -1 | cut -d= -f2 || echo "")
_TASK_CLEAN=$(echo "$_TASK" | sed 's/\[HINT:[^]]*\]//g' | head -c 2000)
echo "SOURCE: $_SOURCE | HAS_PM: $_HAS_PM | HINT: ${_HINT_SINGLE:-없음} | MODEL: $_MODEL_POLICY"
```

`_HINT_SINGLE` 값에 따라 디스패치 범위를 결정한다:
- `_HINT_SINGLE=frontend` → sj-dev-frontend 1개만 Agent 디스패치, 나머지 생략
- `_HINT_SINGLE=backend`  → sj-dev-backend 1개만
- `_HINT_SINGLE=database` → sj-dev-database 1개만
- `_HINT_SINGLE=security` → sj-dev-security 1개만
- `_HINT_SINGLE=si`       → sj-dev-si 1개만 (SI 문서 작성)
- `_HINT_SINGLE=없음`     → Step 3에서 specialist 식별

`docs/sj-company/dev-context.md`가 없으면 분석 후 생성한다:

```bash
# 기술 스택 / 디렉토리 구조 파악
cat package.json 2>/dev/null || cat go.mod 2>/dev/null \
  || cat requirements.txt 2>/dev/null || cat Cargo.toml 2>/dev/null
find . -maxdepth 3 -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | head -20
```
```

- [ ] **Step 2: Step 5 디스패치 템플릿 — `.state/dev/{role}.md` 출력 경로 + pm-brief 입력 명시**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
### 디스패치 프롬프트 템플릿

각 서브에이전트에 다음 정보를 자체 완결적으로 전달한다 (서브에이전트는 컨버세이션 컨텍스트를 보지 못한다):

```
당신은 sj-dev-{role} 서브에이전트입니다.

태스크: {docs/sj-company/.state/task.txt 내용}

PM 분석 요약: {docs/sj-company/.state/task.txt에서 본인 영역 관련 부분 발췌}
Design 명세: {frontend 디스패치 시에만, design-output.md 요약}
선행 결과: {database/backend 결과가 있으면 경로 명시}

본인 SKILL 파일(`agents/sj-dev-{role}.md`)의 작업 절차를 따라:
1. 컨텍스트 로드
2. 구현
3. Self-Review 체크리스트 통과
4. `docs/sj-company/dev-output/{role}.md`에 결과 저장
5. 변경 파일·미해결 이슈를 보고

본인 영역 외 파일은 절대 수정하지 마세요.
```

Security를 리뷰어 모드로 호출할 때는 프롬프트에 `MODE=review`를 명시한다.
```

new_string:
```
### 디스패치 프롬프트 템플릿

각 서브에이전트에 다음 정보를 자체 완결적으로 전달한다 (서브에이전트는 컨버세이션 컨텍스트를 보지 못한다):

```
당신은 sj-dev-{role} 서브에이전트입니다.

태스크 본문: {_TASK_CLEAN — HINT 라인 제거된 본문, 최대 2KB}

PM Brief 경로: docs/sj-company/.state/pm-brief.md (있는 경우 — 본인이 직접 cat해서 본인 영역 부분 참고)
영속 컨텍스트: docs/sj-company/dev-context.md
선행 산출: docs/sj-company/.state/dev/{database,backend}.md (의존 관계가 있다면)

본인 SKILL 파일(`agents/sj-dev-{role}.md`)의 작업 절차를 따라:
1. 컨텍스트 로드 (위 경로들 cat)
2. 구현
3. Self-Review 체크리스트 통과
4. **결과를 `docs/sj-company/.state/dev/{role}.md`에 저장** (휘발 — 다음 사이클에서 덮어쓰기)
5. 변경 파일·미해결 이슈를 보고

본인 영역 외 파일은 절대 수정하지 마세요.
중요: `docs/sj-company/{pm,design,dev,qa}-output.md` / `report.md` / `stage.txt` / `dev-output/` 절대 생성·수정 금지 (v3 룰).
```

Security를 리뷰어 모드로 호출할 때는 프롬프트에 `MODE=review`를 명시하고 검토 대상으로 `docs/sj-company/.state/dev/*.md`를 지정한다.
```

- [ ] **Step 3: 변경 확인**

Run:
```bash
grep -n "dev-output\|pm-output\|stage.txt" /Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md
```

Expected: `dev-output` 0건 (Step 9에서 추가 정리 예정), `pm-output` 0건, `stage.txt` 0건.

- [ ] **Step 4: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-tech-lead/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-tech-lead)!: Step 1·5 v3 정합 (1/2)

Step 1:
- 입력 소스 우선순위 명확화: pm-brief.md > task.txt > PROJECT.md goal
- _HAS_PM 판정을 brief 파일 존재로 정정 (이전엔 task.txt 비어있지 않으면 항상 yes)
- HINT 매핑에 database/security 추가

Step 5 디스패치 템플릿:
- 입력: pm-brief.md 직접 cat (Tech Lead 발췌 모호성 제거)
- 출력: dev-output/{role}.md → .state/dev/{role}.md
- 디스패치 프롬프트에 v3 금지 파일 명시 추가
EOF
)"
```

---

### Task 7: sj-tech-lead — Step 7b Design 리뷰 호출 sentinel 전환 + Step 9 집계 출력 변경

**Files:**
- Modify: `skills/sj-tech-lead/SKILL.md:245-260` (Step 7b)
- Modify: `skills/sj-tech-lead/SKILL.md:210-220` (Step 6 — dev-output/*.md 읽기)
- Modify: `skills/sj-tech-lead/SKILL.md:289-346` (Step 9 집계)

- [ ] **Step 1: Step 6 (Tech Lead 기술 리뷰) — dev-output 디렉토리 참조 정정**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
## Step 6: Tech Lead 기술 리뷰

서브에이전트들의 결과 파일을 모두 읽는다:

```bash
for f in docs/sj-company/dev-output/*.md; do
  echo "=== $f ==="
  cat "$f"
done
```
```

new_string:
```
## Step 6: Tech Lead 기술 리뷰

서브에이전트들의 결과 파일을 모두 읽는다(휘발성 위치):

```bash
for f in docs/sj-company/.state/dev/*.md; do
  [ -f "$f" ] || continue
  echo "=== $f ==="
  cat "$f"
done
```
```

- [ ] **Step 2: Step 7b — Design 시각 리뷰를 sentinel 방식으로**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
### 7b. Design 시각 리뷰 (Frontend 포함 시에만)

Frontend가 디스패치됐다면 Design 에이전트를 **리뷰 모드**로 호출한다:

```
Skill("s-skills:sj-design")  # MODE=review 환경 변수와 함께
```

또는 직접 프롬프트로:

```
docs/sj-company/dev-output/frontend.md의 변경 파일을 design-output.md 명세 대비 검토.
색·간격·타이포·인터랙션 의도 일치 여부 보고. 불일치 시 FAIL.
```

판정 `FAIL`이면 → Frontend 재디스패치.
```

new_string:
```
### 7b. Design 시각 리뷰 (Frontend 포함 시에만)

Frontend가 디스패치됐다면 `.state/design-review.req` sentinel을 작성한 후 sj-design을 호출한다:

```bash
cat > docs/sj-company/.state/design-review.req <<EOF
MODE=review
TARGET=docs/sj-company/.state/dev/frontend.md
EOF
```

이후:

```
Skill("s-skills:sj-design")
```

sj-design은 Step 0에서 sentinel을 감지·소비하고 리뷰 모드로 진입하여 `docs/sj-company/.state/design-review.md`를 생성한다.

리뷰 결과 읽기:

```bash
[ -f "docs/sj-company/.state/design-review.md" ] && cat docs/sj-company/.state/design-review.md
```

판정에 `FAIL`이 있으면 → Frontend 재디스패치 (Step 8).
```

- [ ] **Step 3: Step 9 (집계) — 출력 경로 + 템플릿 변경**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
## Step 9: dev-output.md 집계

모든 리뷰 통과 시 통합 요약을 작성한다.

`docs/sj-company/dev-output.md`:

```markdown
# Dev Output — {태스크 요약}
> Tech Lead 통합 · {날짜}

## 참여 역할
- frontend, backend, database, security (review-only), ...

## 모델 사용 내역
- frontend: sonnet
- backend: sonnet
- database: opus (스키마 변경으로 자동 승격)
- ...

## 통합 요약
[2-4줄로 이번 태스크의 핵심 변경 요약]

## 변경 파일 (역할별)
### Frontend (`dev-output/frontend.md`)
- `src/...`

### Backend (`dev-output/backend.md`)
- `api/...`

### Database (`dev-output/database.md`)
- `migrations/...`

## API 계약
[Backend.md에서 발췌]

## 배포·운영 영향
- 마이그레이션: ...
- 환경 변수: ...
- 롤백: ...

## 리뷰 결과
- Tech Lead 기술 리뷰: PASS (이슈 N건, 모두 해결)
- Security cross-review: PASS / N CRITICAL, 모두 해결
- Design 시각 리뷰: PASS / N/A (Frontend 없음)

## 재디스패치 이력
- 1회차: ...
- 2회차: ...

## 미해결 / 후속 작업
- ...
```

반복 카운터 초기화:

```bash
rm -f docs/sj-company/.state/review-iterations.txt
```
```

new_string:
```
## Step 9: 집계 — `.state/dev-summary.md` + PROJECT.md + dev-context.md

모든 리뷰 통과 시 통합 요약을 작성한다.

### 9a. 휘발성 요약: `.state/dev-summary.md`

`docs/sj-company/.state/dev-summary.md`:

```markdown
# Dev Summary — {태스크 요약}
> Tech Lead 통합 · {날짜}

## 참여 역할
- frontend, backend, database, security (review-only), ...

## 모델 사용 내역
- frontend: sonnet
- backend: sonnet
- database: opus (스키마 변경으로 자동 승격)

## 통합 요약
[2-4줄로 이번 태스크의 핵심 변경 요약]

## 변경 파일 (역할별)
### Frontend (`.state/dev/frontend.md`)
- `src/...`

### Backend (`.state/dev/backend.md`)
- `api/...`

### Database (`.state/dev/database.md`)
- `migrations/...`

## API 계약
[Backend 결과에서 발췌]

## 배포·운영 영향
- 마이그레이션: ...
- 환경 변수: ...
- 롤백: ...

## 리뷰 결과
- Tech Lead 기술 리뷰: PASS (이슈 N건, 모두 해결)
- Security cross-review: PASS / N CRITICAL, 모두 해결
- Design 시각 리뷰: PASS / N/A (Frontend 없음)
  - design-review.md 발견 시 HIGH 이슈 요약

## 재디스패치 이력
- 1회차: ...
- 2회차: ...

## 미해결 / 후속 작업
- ...
```

### 9b. PROJECT.md 갱신 (사용자에게 보이는 영속 상태)

```python
import re, datetime, os

path = "docs/sj-company/PROJECT.md"
if not os.path.exists(path):
    print("PROJECT.md 없음, 스킵")
    exit(0)

today = datetime.date.today().strftime("%Y-%m-%d")
summary = "{이번 태스크 한 줄 요약}"

text = open(path, encoding="utf-8").read()
def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", lambda m: f"{key}: {val}", t, flags=re.MULTILINE)

text = upd("last_session", f"{today} — Dev: {summary}", text)
open(path, "w", encoding="utf-8").write(text)
```

(QA가 뒤이어 실행되는 Large 경로에선 QA가 `last_session`을 한 번 더 덮어쓰므로 여기 갱신은 Medium 경로에서 의미가 큼.)

### 9c. dev-context.md 학습 누적

```python
import os, datetime

ctx_path = "docs/sj-company/dev-context.md"
if not os.path.exists(ctx_path):
    print("dev-context.md 없음, 스킵")
    exit(0)

today = datetime.date.today().strftime("%Y-%m-%d")
insight = "{새로 알게 된 코드 컨벤션·계약 — 예: 'API 응답은 envelope 형식', 'DB는 SERIAL 대신 IDENTITY 사용'}"

text = open(ctx_path, encoding="utf-8").read()
if not text.endswith("\n"):
    text += "\n"
text += f"- {today}: {insight}\n"
open(ctx_path, "w", encoding="utf-8").write(text)
```

### 9d. 반복 카운터 초기화

```bash
rm -f docs/sj-company/.state/review-iterations.txt
```
```

- [ ] **Step 4: Step 10 (완료 보고) — 경로 정정**

Use Edit on `/Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md`:

old_string:
```
## Step 10: 사용자에게 완료 보고

`dev-output.md`의 통합 요약 + 다음 단계(QA) 제안을 짧게 출력한다.

```
Tech Lead 완료. 참여 역할: backend, database, frontend
변경 파일 12개, 리뷰 1회 재디스패치 후 PASS.
다음 단계: QA 실행 (`Skill("s-skills:sj-qa")`)
```
```

new_string:
```
## Step 10: 사용자에게 완료 보고

`.state/dev-summary.md`의 통합 요약 + 다음 단계(Large 경로면 QA) 제안을 짧게 출력한다.

```
Tech Lead 완료. 참여 역할: backend, database, frontend
변경 파일 12개, 리뷰 1회 재디스패치 후 PASS.
요약: docs/sj-company/.state/dev-summary.md
다음 단계: QA 실행 (`Skill("s-skills:sj-qa")`) — Large 경로만
```
```

- [ ] **Step 5: 변경 확인**

Run:
```bash
grep -n "dev-output\|pm-output\|stage.txt\|design-output.md" /Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md
```

Expected: 0건.

- [ ] **Step 6: description 갱신**

Use Edit:

old_string:
```
name: sj-tech-lead
version: 1.1.0
description: |
  Tech Lead 역할. PM/Design output을 받아 필요한 전문 개발 서브에이전트
  (frontend/backend/database/devops/security/data)를 식별·병렬 디스패치하고,
  기술 리뷰·Security cross-review·Design 시각 리뷰를 거쳐 dev-output.md를 집계한다.
```

new_string:
```
name: sj-tech-lead
version: 2.0.0
description: |
  Tech Lead 역할. .state/pm-brief.md를 받아 필요한 전문 개발 서브에이전트
  (frontend/backend/database/devops/security/data/si)를 식별·병렬 디스패치하고,
  기술 리뷰·Security cross-review·Design 시각 리뷰(sentinel)를 거쳐 .state/dev-summary.md로 집계한다.
  결과는 PROJECT.md와 dev-context.md에 반영.
```

- [ ] **Step 7: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-tech-lead/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-tech-lead)!: Step 6·7b·9·10 v3 정합 (2/2)

Step 6: dev-output/*.md → .state/dev/*.md
Step 7b: Skill 환경변수 호출 → .state/design-review.req sentinel 작성 후 호출
Step 9: dev-output.md → .state/dev-summary.md (9a) + PROJECT.md 갱신(9b) + dev-context.md 누적(9c)
Step 10: dev-output.md 경로 안내 → .state/dev-summary.md
description, version 2.0.0
EOF
)"
```

---

### Task 8: sj-qa 재작성 — `.state/qa-verdict.md` 출력 + 헤더 정규식 + 학습 누적

**Files:**
- Rewrite: `skills/sj-qa/SKILL.md` (전체 190줄 → 약 210줄)

- [ ] **Step 1: 현재 sj-qa 본문 확인**

Run:
```bash
wc -l /Users/songseungju/S-skills/skills/sj-qa/SKILL.md
```

- [ ] **Step 2: Step 2 (이전 단계 컨텍스트 로드) 교체**

Use Edit on `/Users/songseungju/S-skills/skills/sj-qa/SKILL.md`:

old_string:
```
## Step 2: 이전 단계 컨텍스트 로드

```bash
[ -f "docs/sj-company/pm-output.md" ]     && echo "=== PM ===" && cat "docs/sj-company/pm-output.md"
[ -f "docs/sj-company/dev-output.md" ]    && echo "=== DEV ===" && cat "docs/sj-company/dev-output.md"
[ -f "docs/sj-company/.state/task.txt" ]  && echo "=== TASK ===" && cat "docs/sj-company/.state/task.txt"
```
```

new_string:
```
## Step 2: 이전 단계 컨텍스트 로드

```bash
[ -f "docs/sj-company/.state/pm-brief.md" ]   && echo "=== PM BRIEF ===" && cat "docs/sj-company/.state/pm-brief.md"
[ -f "docs/sj-company/.state/dev-summary.md" ] && echo "=== DEV SUMMARY ===" && cat "docs/sj-company/.state/dev-summary.md"
[ -f "docs/sj-company/.state/task.txt" ]      && echo "=== TASK (raw) ===" && cat "docs/sj-company/.state/task.txt"
[ -f "docs/sj-company/PROJECT.md" ]           && echo "=== PROJECT ===" && cat "docs/sj-company/PROJECT.md"
```
```

- [ ] **Step 3: Step 3 (태스크 수행)의 참조 정정**

Use Edit:

old_string:
```
## Step 3: 태스크 수행

qa-context.md + dev-output.md + pm-output.md를 바탕으로 QA 역할을 수행한다:
- 테스트 케이스 목록 작성
- 엣지 케이스 식별
- 최종 판정
```

new_string:
```
## Step 3: 태스크 수행

qa-context.md + `.state/dev-summary.md` + `.state/pm-brief.md`를 바탕으로 QA 역할을 수행한다:
- 테스트 케이스 목록 작성
- 엣지 케이스 식별
- 최종 판정 (PASS / FAIL / CONDITIONAL)
```

- [ ] **Step 4: Step 4 (자체 검토)의 참조 정정**

Use Edit:

old_string:
```
- [ ] PM 요구사항(pm-output.md)의 모든 태스크에 대응하는 테스트 케이스가 있는가?
```

new_string:
```
- [ ] PM 요구사항(`.state/pm-brief.md`의 태스크 목록)의 모든 항목에 대응하는 테스트 케이스가 있는가?
```

- [ ] **Step 5: Step 5 (결과 저장) — `.state/qa-verdict.md`로 변경 + 명시적 판정 헤더**

Use Edit:

old_string:
```
## Step 5: 결과 저장

`docs/sj-company/qa-output.md`에 저장:

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
```

new_string:
```
## Step 5: 결과 저장

`docs/sj-company/.state/qa-verdict.md`에 저장 (휘발성).
**판정 헤더는 반드시 한 줄에 `## 판정: <PASS|FAIL|CONDITIONAL>` 형식**으로 작성한다(파싱이 정규식으로 강건화됨).

```markdown
# QA Verdict — {태스크명}
> 생성일: {날짜}

## 테스트 케이스
- [ ] {테스트케이스1}
- [ ] {테스트케이스2}

## 엣지 케이스
- {엣지케이스1}

## 판정: PASS
[판정 이유 — 본문에 PASS/FAIL/CONDITIONAL 단어가 다시 등장해도 무방. 헤더만 파싱됨]

## 발견된 이슈
- {이슈1}
```
```

- [ ] **Step 6: Step 7 (PROJECT.md 업데이트) — 정규식 강건화 + 경로 변경**

Use Edit:

old_string:
```
## Step 7: PROJECT.md 업데이트

QA 완료 후:

```python
import re, datetime, os

path = "docs/sj-company/PROJECT.md"
if not os.path.exists(path):
    print("PROJECT.md 없음, 스킵")
    exit(0)

text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")

# QA 판정 읽기 (qa-output.md 또는 pw-loop 결과) — CONDITIONAL 먼저 체크
verdict = "확인필요"
for f in ["docs/sj-company/qa-output.md"]:
    if os.path.exists(f):
        content = open(f, encoding="utf-8").read()
        if "CONDITIONAL" in content: verdict = "CONDITIONAL"; break
        if "PASS" in content: verdict = "PASS"; break
        if "FAIL" in content: verdict = "FAIL"; break

def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", lambda m: f"{key}: {val}", t, flags=re.MULTILINE)

text = upd("last_session", f"{today} — QA {verdict}", text)
if verdict == "FAIL":
    text = upd("status", "blocked", text)
    text = upd("blockers", "QA FAIL — 재구현 필요", text)
elif verdict == "CONDITIONAL":
    text = upd("status", "active", text)
    text = upd("blockers", "QA CONDITIONAL — 조건부 통과, 후속 수정 필요", text)
elif verdict == "PASS":
    text = upd("status", "active", text)
    text = upd("blockers", "없음", text)

open(path, "w", encoding="utf-8").write(text)
print(f"PROJECT.md 업데이트: QA {verdict}")
```
```

new_string:
```
## Step 7: PROJECT.md 업데이트

QA 완료 후:

```python
import re, datetime, os

path = "docs/sj-company/PROJECT.md"
if not os.path.exists(path):
    print("PROJECT.md 없음, 스킵")
    exit(0)

text = open(path, encoding="utf-8").read()
today = datetime.date.today().strftime("%Y-%m-%d")

# QA 판정 — 헤더 정규식으로 강건하게 추출
verdict = "확인필요"
qa_file = "docs/sj-company/.state/qa-verdict.md"
if os.path.exists(qa_file):
    content = open(qa_file, encoding="utf-8").read()
    m = re.search(r"^## 판정:\s*(PASS|FAIL|CONDITIONAL)\b", content, re.MULTILINE)
    if m:
        verdict = m.group(1)
    else:
        print("경고: qa-verdict.md에 '## 판정: <PASS|FAIL|CONDITIONAL>' 헤더가 없음. 본문 fallback 시도")
        # Fallback: 본문 첫 매칭 — 헤더가 누락된 경우만
        for v in ("CONDITIONAL", "FAIL", "PASS"):
            if v in content:
                verdict = v
                break

def upd(key, val, t):
    return re.sub(rf"^{key}:.*$", lambda m: f"{key}: {val}", t, flags=re.MULTILINE)

text = upd("last_session", f"{today} — QA {verdict}", text)
if verdict == "FAIL":
    text = upd("status", "blocked", text)
    text = upd("blockers", "QA FAIL — 재구현 필요", text)
elif verdict == "CONDITIONAL":
    text = upd("status", "active", text)
    text = upd("blockers", "QA CONDITIONAL — 조건부 통과, 후속 수정 필요", text)
elif verdict == "PASS":
    text = upd("status", "active", text)
    text = upd("blockers", "없음", text)

open(path, "w", encoding="utf-8").write(text)
print(f"PROJECT.md 업데이트: QA {verdict}")
```
```

- [ ] **Step 7: Step 8 (완료 보고) 앞에 qa-context.md 누적 단계 추가**

Use Edit:

old_string:
```
## Step 8: 완료 보고

전체 파이프라인 결과를 사용자에게 요약해서 출력한다.
```

new_string:
```
## Step 8: qa-context.md 학습 누적

이번 사이클에서 **새로 알게 된 검증 포인트·취약 영역** 1~3줄을 `docs/sj-company/qa-context.md`의 `## 히스토리`에 append.

```python
import os, datetime

ctx_path = "docs/sj-company/qa-context.md"
if not os.path.exists(ctx_path):
    print("qa-context.md 없음, 스킵")
    exit(0)

today = datetime.date.today().strftime("%Y-%m-%d")
insight = "{새로 알게 된 사실 — 예: '결제 플로우는 idempotency 키 누락 시 무한 재시도', 'mobile safari에서 sticky 깨짐'}"

text = open(ctx_path, encoding="utf-8").read()
if not text.endswith("\n"):
    text += "\n"
text += f"- {today}: {insight}\n"
open(ctx_path, "w", encoding="utf-8").write(text)
```

## Step 9: 완료 보고

전체 파이프라인 결과를 사용자에게 요약해서 출력한다.
```

- [ ] **Step 8: description/version 갱신**

Use Edit:

old_string:
```
name: sj-qa
version: 1.1.0
description: |
  QA 역할 에이전트. 구현 결과를 검증하고 테스트 계획을 수립한다.
  PASS / FAIL / CONDITIONAL 판정을 내린다.
  프로젝트별 qa-context.md를 생성·유지한다.
```

new_string:
```
name: sj-qa
version: 2.0.0
description: |
  QA 역할 에이전트. .state/dev-summary.md + .state/pm-brief.md를 받아 검증하고 테스트 계획을 수립한다.
  PASS / FAIL / CONDITIONAL 판정을 .state/qa-verdict.md에 저장하고 PROJECT.md를 갱신한다.
  qa-context.md에 학습된 검증 포인트를 누적한다.
```

- [ ] **Step 9: 변경 확인**

Run:
```bash
grep -n "qa-output\|pm-output\|dev-output\." /Users/songseungju/S-skills/skills/sj-qa/SKILL.md
```

Expected: 0건.

- [ ] **Step 10: 커밋**

```bash
cd /Users/songseungju/S-skills
git add skills/sj-qa/SKILL.md
git commit -m "$(cat <<'EOF'
feat(sj-qa)!: v3 정합 — .state/qa-verdict.md + 헤더 정규식 + 학습 누적

BREAKING:
- 입력: pm-output.md/dev-output.md → .state/pm-brief.md/.state/dev-summary.md
- 출력: qa-output.md → .state/qa-verdict.md (휘발)
- verdict 파싱: substring 매칭 → ^## 판정:\s*(PASS|FAIL|CONDITIONAL) 정규식
- Step 8 학습 누적 단계 신설 — qa-context.md 히스토리 append
- pw-loop 호출은 유지 (sj-company Large는 직접 호출 안 함, 여기 일임)
- version 2.0.0
EOF
)"
```

---

### Task 9: 7개 dev 에이전트 입력 컨텍스트 v3화

**Files:**
- Modify: `agents/sj-dev-frontend.md`
- Modify: `agents/sj-dev-backend.md`
- Modify: `agents/sj-dev-database.md`
- Modify: `agents/sj-dev-devops.md`
- Modify: `agents/sj-dev-security.md`
- Modify: `agents/sj-dev-data.md`
- Modify: `agents/sj-dev-si.md` (최소 수정 — `dev-output/si.md` 1건만 변경)

각 에이전트의 변경 패턴:
1. "입력 컨텍스트" 절: pm-output.md → `.state/pm-brief.md`, design-output.md 제거(또는 design-context.md로), dev-output/*.md → `.state/dev/*.md`
2. "Step 1: 컨텍스트 로드"의 cat 명령들 동일하게 정정
3. 결과 저장 경로: `docs/sj-company/dev-output/{role}.md` → `docs/sj-company/.state/dev/{role}.md`

각 에이전트마다 별도 단계로 진행 (DRY 위반 의식적 — 엔지니어가 순서 무관하게 실행할 수 있도록).

- [ ] **Step 1: sj-dev-frontend 정정**

먼저 현재 상태 확인:
```bash
grep -n "pm-output\|design-output\|dev-output\|stage.txt" /Users/songseungju/S-skills/agents/sj-dev-frontend.md
```

Edit (입력 컨텍스트 절):

old_string:
```
Tech Lead가 다음 정보를 프롬프트로 전달한다:
- 태스크 설명 (`docs/sj-company/.state/task.txt`)
- PM 분석 (`docs/sj-company/pm-output.md`)
- Design 명세 (`docs/sj-company/design-output.md`)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md`)
- Backend 계약 (이미 작성된 API 스펙이 있다면 `docs/sj-company/dev-output/backend.md`)
```

new_string:
```
Tech Lead가 다음 정보를 프롬프트로 전달한다 (모두 휘발성 또는 영속 컨텍스트):
- 태스크 본문 (인라인 전달)
- PM Brief (`docs/sj-company/.state/pm-brief.md`)
- Design 비주얼 방향 (`docs/sj-company/design-context.md` — 영속)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md` — 영속)
- Backend 계약 (선행 디스패치된 경우 `docs/sj-company/.state/dev/backend.md`)
```

Edit (Step 1 cat 명령들):

old_string:
```
```bash
[ -f "docs/sj-company/.state/task.txt" ] && cat docs/sj-company/.state/task.txt
[ -f "docs/sj-company/pm-output.md" ] && cat docs/sj-company/pm-output.md
[ -f "docs/sj-company/design-output.md" ] && cat docs/sj-company/design-output.md
[ -f "docs/sj-company/dev-context.md" ] && cat docs/sj-company/dev-context.md
[ -f "docs/sj-company/dev-output/backend.md" ] && cat docs/sj-company/dev-output/backend.md
```
```

new_string:
```
```bash
[ -f "docs/sj-company/.state/pm-brief.md" ]    && cat docs/sj-company/.state/pm-brief.md
[ -f "docs/sj-company/design-context.md" ]    && cat docs/sj-company/design-context.md
[ -f "docs/sj-company/dev-context.md" ]       && cat docs/sj-company/dev-context.md
[ -f "docs/sj-company/.state/dev/backend.md" ] && cat docs/sj-company/.state/dev/backend.md
```
```

이후 "결과 저장" 또는 유사 절을 찾아 경로를 `.state/dev/frontend.md`로 정정 (현재 sj-dev-frontend.md에서 `dev-output/frontend.md` 출력 부분을 grep으로 확인 후 정정).

```bash
grep -n "dev-output/frontend\|dev-output\.md" /Users/songseungju/S-skills/agents/sj-dev-frontend.md
```

발견되는 모든 위치를 `.state/dev/frontend.md`로 Edit. (보통 1~2건)

- [ ] **Step 2: sj-dev-backend 정정**

Edit (입력 컨텍스트):

old_string:
```
Tech Lead가 다음을 전달한다:
- 태스크 (`docs/sj-company/.state/task.txt`)
- PM 분석 (`docs/sj-company/pm-output.md`)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md`)
- Database 스키마 (있다면 `docs/sj-company/dev-output/database.md`)
```

new_string:
```
Tech Lead가 다음을 전달한다:
- 태스크 본문 (인라인)
- PM Brief (`docs/sj-company/.state/pm-brief.md`)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md` — 영속)
- Database 스키마 (선행 디스패치된 경우 `docs/sj-company/.state/dev/database.md`)
```

Edit (Step 1 cat):

old_string:
```
```bash
[ -f "docs/sj-company/.state/task.txt" ] && cat docs/sj-company/.state/task.txt
[ -f "docs/sj-company/pm-output.md" ] && cat docs/sj-company/pm-output.md
[ -f "docs/sj-company/dev-context.md" ] && cat docs/sj-company/dev-context.md
[ -f "docs/sj-company/dev-output/database.md" ] && cat docs/sj-company/dev-output/database.md
```
```

new_string:
```
```bash
[ -f "docs/sj-company/.state/pm-brief.md" ]     && cat docs/sj-company/.state/pm-brief.md
[ -f "docs/sj-company/dev-context.md" ]        && cat docs/sj-company/dev-context.md
[ -f "docs/sj-company/.state/dev/database.md" ] && cat docs/sj-company/.state/dev/database.md
```
```

결과 저장 경로 정정:
```bash
grep -n "dev-output/backend\|dev-output\.md" /Users/songseungju/S-skills/agents/sj-dev-backend.md
```
발견 위치 모두 `.state/dev/backend.md`로 Edit.

- [ ] **Step 3: sj-dev-database 정정**

Edit (입력 컨텍스트):

old_string:
```
Tech Lead가 다음을 전달한다:
- 태스크 (`docs/sj-company/.state/task.txt`)
- PM 분석 (`docs/sj-company/pm-output.md`)
- Backend가 요구한 데이터 형상 (있다면 `docs/sj-company/dev-output/backend.md`)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md`)
```

new_string:
```
Tech Lead가 다음을 전달한다:
- 태스크 본문 (인라인)
- PM Brief (`docs/sj-company/.state/pm-brief.md`)
- Backend가 요구한 데이터 형상 (선행 디스패치된 경우 `docs/sj-company/.state/dev/backend.md`)
- Dev 컨텍스트 (`docs/sj-company/dev-context.md` — 영속)
```

Edit (Step 1 cat):

old_string:
```
[ -f "docs/sj-company/.state/task.txt" ] && cat docs/sj-company/.state/task.txt
[ -f "docs/sj-company/pm-output.md" ] && cat docs/sj-company/pm-output.md
[ -f "docs/sj-company/dev-output/backend.md" ] && cat docs/sj-company/dev-output/backend.md
```

new_string:
```
[ -f "docs/sj-company/.state/pm-brief.md" ]    && cat docs/sj-company/.state/pm-brief.md
[ -f "docs/sj-company/dev-context.md" ]       && cat docs/sj-company/dev-context.md
[ -f "docs/sj-company/.state/dev/backend.md" ] && cat docs/sj-company/.state/dev/backend.md
```

결과 저장 정정:
```bash
grep -n "dev-output/database\|dev-output\.md" /Users/songseungju/S-skills/agents/sj-dev-database.md
```
발견 위치 모두 `.state/dev/database.md`로 Edit.

- [ ] **Step 4: sj-dev-devops 정정**

먼저 현재 상태 확인:
```bash
grep -n "pm-output\|dev-output\|stage.txt" /Users/songseungju/S-skills/agents/sj-dev-devops.md
```

발견되는 각 패턴을 v3로 정정:
- `docs/sj-company/pm-output.md` → `docs/sj-company/.state/pm-brief.md`
- `docs/sj-company/dev-output/{role}.md` → `docs/sj-company/.state/dev/{role}.md`
- `docs/sj-company/dev-output/devops.md`(결과 저장) → `docs/sj-company/.state/dev/devops.md`

Edit 명령은 발견된 정확한 old_string에 맞춰 수행 (사전 grep 출력 보고 결정).

- [ ] **Step 5: sj-dev-security 정정**

먼저 현재 상태:
```bash
grep -n "pm-output\|dev-output\|stage.txt\|MODE=" /Users/songseungju/S-skills/agents/sj-dev-security.md
```

Edit (입력 컨텍스트 — 모드 분기 포함):

old_string:
```
Tech Lead가 다음을 전달한다:
- **모드**: `MODE=implement` 또는 `MODE=review`
- 태스크 (`docs/sj-company/.state/task.txt`)
- PM 분석 (`docs/sj-company/pm-output.md`)
- 리뷰 모드일 때: 검토 대상 파일 목록 (`docs/sj-company/dev-output/*.md`)
```

new_string:
```
Tech Lead가 다음을 전달한다:
- **모드**: `MODE=implement` 또는 `MODE=review` (프롬프트 본문에 명시)
- 태스크 본문 (인라인)
- PM Brief (`docs/sj-company/.state/pm-brief.md`)
- 리뷰 모드일 때: 검토 대상 파일 목록 (`docs/sj-company/.state/dev/*.md`)
```

Edit (Step 1 cat — security):

old_string:
```
[ -f "docs/sj-company/.state/task.txt" ] && cat docs/sj-company/.state/task.txt
[ -f "docs/sj-company/pm-output.md" ] && cat docs/sj-company/pm-output.md
[ -f "docs/sj-company/dev-output/backend.md" ] && cat docs/sj-company/dev-output/backend.md
```

new_string:
```
[ -f "docs/sj-company/.state/pm-brief.md" ]    && cat docs/sj-company/.state/pm-brief.md
[ -f "docs/sj-company/.state/dev/backend.md" ] && cat docs/sj-company/.state/dev/backend.md
```

결과 저장 정정:
```bash
grep -n "dev-output/security\|dev-output\.md" /Users/songseungju/S-skills/agents/sj-dev-security.md
```
발견 위치 모두 `.state/dev/security.md`로 Edit.

- [ ] **Step 6: sj-dev-data 정정**

먼저 현재 상태:
```bash
grep -n "pm-output\|dev-output\|stage.txt" /Users/songseungju/S-skills/agents/sj-dev-data.md
```

발견되는 각 패턴을 v3로 정정 (동일 패턴). 결과 저장 경로는 `.state/dev/data.md`.

- [ ] **Step 7: sj-dev-si 최소 정정**

```bash
grep -n "dev-output/si\|dev-output\.md\|pm-output" /Users/songseungju/S-skills/agents/sj-dev-si.md
```

Expected: `dev-output/si.md` 출력 경로 1~2건. PM 참조는 없거나 다른 패턴.

Edit (mkdir + 결과 저장):

old_string:
```
mkdir -p docs/sj-company/dev-output docs/si
```

new_string:
```
mkdir -p docs/sj-company/.state/dev docs/si
```

Edit (결과 저장 경로):

old_string:
```
Tech Lead 보고 요약을 `docs/sj-company/dev-output/si.md`에 저장:
```

new_string:
```
Tech Lead 보고 요약을 `docs/sj-company/.state/dev/si.md`에 저장:
```

(sj-dev-si.md 내에 추가로 `dev-output/si.md` 또는 `dev-output.md` 참조가 더 있으면 모두 정정.)

- [ ] **Step 8: 7개 에이전트 일괄 검증**

Run:
```bash
grep -rn "pm-output\|design-output\|dev-output/\|dev-output\.md\|stage\.txt" /Users/songseungju/S-skills/agents/
```

Expected: 0건.

- [ ] **Step 9: 커밋**

```bash
cd /Users/songseungju/S-skills
git add agents/
git commit -m "$(cat <<'EOF'
feat(agents)!: 7개 dev 에이전트 입력·출력 인터페이스 v3 정합화

입력:
- pm-output.md → .state/pm-brief.md
- design-output.md → design-context.md (영속, 리뷰는 .state/design-review.md)
- dev-output/{role}.md → .state/dev/{role}.md

출력:
- dev-output/{role}.md → .state/dev/{role}.md (휘발)

7개 에이전트 모두 정합화: frontend/backend/database/devops/security/data/si
EOF
)"
```

---

### Task 10: 최종 검증 — 죽은 참조 grep 스윕

**Files:**
- None (검증만)

- [ ] **Step 1: 전체 코어 스킬·에이전트에 v2 참조가 남아있지 않은지 grep**

Run:
```bash
cd /Users/songseungju/S-skills
echo "=== pm-output 참조 ==="
grep -rn "pm-output" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive | grep -v "marker\|구파일"
echo "=== design-output 참조 ==="
grep -rn "design-output" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive
echo "=== dev-output 참조 (디렉토리 또는 파일) ==="
grep -rn "dev-output" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive
echo "=== qa-output 참조 ==="
grep -rn "qa-output" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive
echo "=== stage.txt 참조 ==="
grep -rn "stage\.txt" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive | grep -v "마이그레이션\|구파일"
echo "=== report.md 참조 ==="
grep -rn "report\.md" skills/sj-company/ skills/sj-pm/ skills/sj-design/ skills/sj-tech-lead/ skills/sj-qa/ agents/ | grep -v archive | grep -v "마이그레이션"
```

Expected:
- `pm-output` 0건
- `design-output` 0건
- `dev-output` 0건 (디렉토리 참조도 없어야)
- `qa-output` 0건
- `stage.txt` 0건 (sj-company의 마이그레이션 감지 블록만 예외 — `grep -v` 필터에 잡혀야)
- `report.md` 0건 (sj-company의 마이그레이션 감지 블록만 예외)

만약 어떤 패턴이 남아있으면 해당 파일의 해당 라인을 v3 경로로 추가 Edit.

- [ ] **Step 2: 신규 v3 경로 일관성 확인**

Run:
```bash
cd /Users/songseungju/S-skills
echo "=== .state/pm-brief.md 참조처 ==="
grep -rln "\.state/pm-brief\.md" skills/ agents/
echo "=== .state/design-review.md 참조처 ==="
grep -rln "\.state/design-review" skills/ agents/
echo "=== .state/dev/ 참조처 ==="
grep -rln "\.state/dev/" skills/ agents/
echo "=== .state/dev-summary.md 참조처 ==="
grep -rln "\.state/dev-summary" skills/ agents/
echo "=== .state/qa-verdict.md 참조처 ==="
grep -rln "\.state/qa-verdict" skills/ agents/
```

Expected: 각 v3 경로가 최소 1개 이상의 파일에서 참조됨.
- `.state/pm-brief.md`: sj-pm(생산), sj-tech-lead(소비), sj-qa(소비), 7개 dev 에이전트(소비) → 약 10개 파일
- `.state/design-review.md`: sj-design(생산), sj-tech-lead(소비)
- `.state/dev/`: sj-tech-lead(생산·소비), sj-qa(소비), 7개 dev 에이전트(자기 파일 생산 + 의존 파일 소비)
- `.state/dev-summary.md`: sj-tech-lead(생산), sj-qa(소비)
- `.state/qa-verdict.md`: sj-qa(생산·소비)

- [ ] **Step 3: 검증 결과 정리**

검증 통과 시 다음 단계로. 잔여 이슈 있으면 해당 파일을 추가 수정 후 검증 재실행.

- [ ] **Step 4: 검증 통과 커밋 (변경 없으면 스킵)**

만약 Step 1에서 추가 수정이 있었다면:
```bash
cd /Users/songseungju/S-skills
git add -p  # 변경 확인 후 부분 추가
git commit -m "chore(harness): v3 정합 grep 스윕 잔여 정리"
```

---

### Task 11: 스모크 테스트 — 샘플 태스크로 전체 파이프라인 dry-run

**Files:**
- Test workspace: `/tmp/sj-smoke-test/` (격리)

- [ ] **Step 1: 격리 워크스페이스 생성**

Run:
```bash
mkdir -p /tmp/sj-smoke-test/docs/sj-company/.state
cd /tmp/sj-smoke-test

cat > docs/sj-company/PROJECT.md <<'EOF'
# sj-smoke-test

goal: v3 reconciliation 스모크 테스트
stack: Markdown
last_session: 없음
next: 없음
blockers: 없음
pw_target: 80
status: active
EOF

ls -la docs/sj-company/
```

Expected: PROJECT.md만 존재.

- [ ] **Step 2: sj-company Tiny 경로 시뮬레이션**

(실제 Skill 호출은 별도 Claude 세션에서. 여기선 SKILL.md를 따라 절차가 v3 룰을 위반하지 않는지 dry-read만 수행)

Run:
```bash
cd /tmp/sj-smoke-test
# Tiny 경로는 PM/Design/QA 없이 즉시 구현. 산출물은 PROJECT.md 갱신만.
# SKILL.md L237-275의 Tiny 경로 명령을 시각적으로 확인
sed -n '237,275p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected: Tiny 경로가 `pm-output.md`/`design-output.md`/`dev-output.md`/`qa-output.md`/`report.md`/`stage.txt`를 만들지 않는지 확인. PROJECT.md `last_session`/`next` 갱신만 보임.

- [ ] **Step 3: sj-company Medium 경로 시뮬레이션 — HINT 흐름 검증**

Run:
```bash
sed -n '308,358p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected:
- HINT 매핑에 `si`/`frontend`/`backend` 포함
- task.txt에 `[HINT:single={hint}] {태스크}` + PM 브리핑 형태로 작성됨
- pw-loop 호출만 있고 `dev-output.md` 생성 명령 없음

- [ ] **Step 4: sj-company Large 경로 시뮬레이션 — pw-loop 중복 없음 확인**

Run:
```bash
sed -n '376,400p' /Users/songseungju/S-skills/skills/sj-company/SKILL.md
```

Expected:
- Step 5: QA 실행만 (pw-loop 직접 호출 없음)
- Step 6 또는 그 이후에 별도 pw-loop 호출 없음

- [ ] **Step 5: sj-tech-lead → sj-design sentinel 흐름 검증**

Run:
```bash
grep -A 6 "design-review\.req" /Users/songseungju/S-skills/skills/sj-tech-lead/SKILL.md
grep -A 6 "design-review\.req\|Step 0" /Users/songseungju/S-skills/skills/sj-design/SKILL.md
```

Expected:
- sj-tech-lead Step 7b: `cat > docs/sj-company/.state/design-review.req <<EOF` 블록 보임
- sj-design Step 0: sentinel 감지 + `rm -f` 소비 로직 보임

- [ ] **Step 6: PROJECT.md verdict 파싱 강건성 검증**

Run:
```bash
mkdir -p /tmp/sj-smoke-test/docs/sj-company/.state
cat > /tmp/sj-smoke-test/docs/sj-company/.state/qa-verdict.md <<'EOF'
# QA Verdict

## 판정: CONDITIONAL

이전 사이클은 PASS였지만 이번엔 CONDITIONAL.

## 발견된 이슈
- 사소함
EOF

cd /tmp/sj-smoke-test
python3 - <<'PY'
import re
content = open("docs/sj-company/.state/qa-verdict.md").read()
m = re.search(r"^## 판정:\s*(PASS|FAIL|CONDITIONAL)\b", content, re.MULTILINE)
print(f"파싱 결과: {m.group(1) if m else 'NONE'}")
PY
```

Expected: `파싱 결과: CONDITIONAL` (본문에 "PASS"가 있어도 헤더만 정확히 매칭).

- [ ] **Step 7: 격리 워크스페이스 정리**

Run:
```bash
rm -rf /tmp/sj-smoke-test
```

- [ ] **Step 8: 스모크 테스트 결과 노트**

검증 결과를 한 줄 요약으로 보고하고 계획 종료. 별도 커밋 없음 (검증 자체가 산출).

---

## Self-Review

**1. Spec coverage:** 진단 보고서(`2026-05-19-core-harness-review.md`)의 패치 P1~P12 각각이 본 계획의 어떤 Task에 매핑되는지:

| 패치 | Task |
|------|------|
| P1 (룰 vs 구현 결단 — 옵션 A) | Task 1, 2 (전체 방향) |
| P2 (Design 명세 모드 처리) | Task 5 (sj-design 명세 모드 삭제) |
| P3 (PM HINT 일관화) | Task 4 (sj-pm Step 5에 HINT 첫 줄) |
| P4 (pw-loop 이중 호출 제거) | Task 3 Step 5 (sj-company Large) + Task 8 (sj-qa 유지) |
| P5 (Tech Lead Design 리뷰 메커니즘) | Task 7 Step 2 (sentinel 파일) |
| P6 (서브에이전트 입력 컨텍스트 v3화) | Task 9 (7개 에이전트) |
| P7 (`_HAS_PM` 판정 보정) | Task 6 Step 1 |
| P8 (sj-qa verdict 파싱 강건화) | Task 8 Step 6 (정규식 헤더 매칭) |
| P9 (sj-pm Step 번호 정합) | Task 4 Step 2 (Step 4 신설) + Step 3 (Step 7 추가) |
| P10 (Case A→B 전이 명시) | Task 3 Step 2 |
| P11 (잔여 가이드 정리) | Task 5 (sj-design 명세 모드 전면 삭제로 자연 해소), Task 6 Step 2 (Tech Lead "발췌" 모호성 해소 — pm-brief.md 직접 cat 지시) |
| P12 (design-review 통합 경로) | Task 7 Step 3 (Step 9 템플릿에 Design 리뷰 결과 섹션) |

12개 패치 모두 커버됨.

**2. Placeholder scan:** 본 계획에서 사용한 "{태스크명}", "{날짜}", "{이번 사이클에서 알게 된 사실 — 예: ...}" 등은 SKILL.md 템플릿의 placeholder로, 사용자가 실행 시점에 자연어로 채우는 자리표시자(skill 본문 일부). 본 계획의 *steps*는 placeholder 없이 모두 실제 명령·코드.

**3. Type consistency:**
- 경로 명명 일관: `.state/pm-brief.md`, `.state/design-review.md`, `.state/dev/{role}.md`, `.state/dev-summary.md`, `.state/qa-verdict.md` — 5개 휘발 파일 모두 본 계획 전체에서 동일 경로로 사용됨.
- sentinel 파일 명명: `.state/design-review.req` — sj-tech-lead Task 7 Step 2와 sj-design Task 5 Step 2에서 일치.
- HINT 형식: `[HINT:single=<role>]` — sj-company, sj-pm, sj-tech-lead에서 일치.
- 정규식: `^## 판정:\s*(PASS|FAIL|CONDITIONAL)\b` — sj-qa Step 5 템플릿(생산자)과 Step 7 파싱(소비자) 일치.

이슈 없음.

**4. Risk notes (실행 시 주의):**
- Task 1 (이주)을 가장 먼저 실행해야 sj-company가 v2 잔재를 다시 발견하지 않음.
- Task 9 (7개 에이전트)는 다른 Task들과 독립적이므로 병렬 가능.
- Task 6, 7은 같은 파일(`skills/sj-tech-lead/SKILL.md`)을 수정하므로 **순차** 실행 (Task 6 → Task 7).
- Task 10 (검증)은 Task 1~9 전부 완료 후에만 의미 있음.
- Task 11 (스모크)은 Task 10 통과 후.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-sj-company-v3-reconciliation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
