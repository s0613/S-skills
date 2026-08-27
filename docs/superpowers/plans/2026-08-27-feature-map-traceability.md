# 기능 지도·추적성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기능 간 연결성·영향 범위를 구현 전에 따지고, 고장 시 수정 지점을 문서에서 바로 찾을 수 있게 하는 `docs/FEATURE-MAP.md` 층을 하네스에 배선한다.

**Architecture:** 규칙 정본은 `skills/_conventions/feature-map.md` 하나. 나머지는 그 컨벤션을 참조하는 배선이며, 절차는 볼트 플레이북에, 경로 계약만 SKILL.md에 둔다(v4 얇은 디스패처 구조 유지). 지도는 대상 프로젝트 repo에 살고, 표가 정본이며 mermaid는 표에서 파생한다.

**Tech Stack:** Markdown + bash(awk/tr/grep) + `scripts/skill-manifest.py`. 새 런타임 의존성 없음.

**Spec:** `docs/spec/2026-08-27-feature-map-traceability.md`

## Global Constraints

스펙의 불변식 — 모든 태스크의 요구사항에 암묵적으로 포함된다.

- **지도 불일치는 FAIL이 아니라 경고(LOW).** 낡은 문서로 배포를 막으면 사람들이 지도를 우회하고, 그 순간 지도는 죽는다.
- **비차단 폴백.** 지도가 없는 프로젝트에서 어떤 스킬도 멈추지 않는다. `미수행: FEATURE-MAP 없음` 한 줄을 남기고 진행한다.
- **Judge 독립성 유지.** sj-qa는 지도를 *판정 근거*로 삼지 않는다 — 지도는 **검증 대상**이자 FAIL 시 **위치 지목 도구**일 뿐. 판정 근거는 pm-brief + 직접 탐색.
- **사람 게이트 불변.** PR 머지·배포 승인은 사람이 한다.
- **새 스크립트 0개.** drift 검사는 bash 한 줄. 대상 프로젝트마다 스크립트를 설치하지 않는다.
- **`docs-organize` 건강 점수 체계는 건드리지 않는다** (회귀 위험).
- 검증된 drift 검사 명령 (이 문자열을 그대로 사용):

```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

---

### Task 1: 컨벤션 신설 — 규칙 정본 + drift 검사 fixture

**Files:**
- Create: `skills/_conventions/feature-map.md`
- Create: `docs/superpowers/fixtures/sample-feature-map.md`
- Modify: `skills/_conventions/README.md` (규칙 목록 표 — `obsidian-output.md` 행 다음에 추가)

**Interfaces:**
- Produces: 규칙 파일 경로 `skills/_conventions/feature-map.md` — Task 2~5가 각 배선 지점에서 `[기능 지도](../_conventions/feature-map.md)` 형식으로 참조한다.
- Produces: fixture 경로 `docs/superpowers/fixtures/sample-feature-map.md` — Task 1 Step 2의 drift 검사 회귀 테스트가 사용한다.

- [ ] **Step 1: fixture 먼저 작성 (검사가 잡아야 할 것과 통과시켜야 할 것을 고정)**

`docs/superpowers/fixtures/sample-feature-map.md`:

````markdown
# Feature Map (fixture)
> drift 검사 회귀 테스트용. 실제 지도가 아니다.
> F01의 경로는 저장소에 실존하고, F02의 두 경로는 존재하지 않는다.

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 컨벤션 로딩 | `skills/_conventions/README.md` | `skills/_conventions/` | 없음 | — |
| F02 | 존재하지 않는 기능 | `skills/gone.md` | `skills/missing/` | 없음 | F01 |
````

- [ ] **Step 2: 검사가 실패하는 것을 먼저 확인 (fixture 기준 기대 출력 고정)**

Run:
```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/superpowers/fixtures/sample-feature-map.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

Expected (정확히 2줄, 순서 포함):
```
STALE: skills/gone.md
STALE: skills/missing/
```

F01의 두 경로(`skills/_conventions/README.md`, `skills/_conventions/`)가 출력에 **없어야** 한다 — 실존하므로. 출력이 다르면 fixture나 명령을 고친 뒤 재실행한다.

- [ ] **Step 3: 컨벤션 규칙 파일 작성**

`skills/_conventions/feature-map.md`:

`````markdown
# 기능 지도와 추적성

## 규칙

**프로젝트의 기능 목록과 서로의 연결은 `docs/FEATURE-MAP.md`에 산다. 코드와 같은 커밋에서 갱신된다.**

기능 하나를 깊게 명세하는 것(스펙)과, 기능들이 서로 어떻게 엮이는지(지도)는 다른 문서다.
지도가 답하는 질문은 하나다 — **"여기가 고장났으면 어디를 고쳐야 하나."**

## 형식

````markdown
# Feature Map
> 이 프로젝트의 기능 목록과 서로의 연결. 코드와 같은 커밋에서 갱신된다.
> 갱신 규칙: s-skills `skills/_conventions/feature-map.md`

## 흐름
```mermaid
flowchart LR
  F01[바이어 로그인] --> F02[견적 요청]
```

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 바이어 로그인 | `src/app/(buyer)/login/page.tsx` | `src/lib/auth/` | `src/lib/auth/__tests__/login.test.ts` | — |

## 미매핑
- (코드에는 있으나 기능으로 등록되지 않은 것)
````

## 칸 규칙

- `ID` — `F{2자리}` 프로젝트별 순번. **삭제된 기능의 ID는 재사용 금지**. 과거 판정문·커밋의 참조가 깨지면 추적성이 무너진다. 폐기는 행을 지우지 말고 기능명에 `(폐기)` 표기.
- `진입점` — "여기부터 읽어라". 흐름이 시작되는 파일 1개.
- `핵심 파일` — "여기 안에서 고쳐라". 파일 또는 디렉토리, 최대 3개. 여러 개는 **공백 또는 쉼표로 구분**하고 디렉토리는 끝에 `/`를 붙인다 (drift 검사가 이 구분자로 쪼갠다).
- `테스트` — 이 기능의 회귀를 잡는 테스트 경로. 없으면 `없음` (빈칸 금지 — 없다는 사실이 신호다).
- `의존` — 이 기능이 **의존하는** 기능 ID. 역방향은 표에서 계산하므로 적지 않는다 (양방향 저장은 drift를 두 배로 만든다).
- `상태` 칸 없음 — PROJECT.md가 이미 갖는다.

**표가 정본, mermaid는 파생.** 의존 칸을 고치면 흐름도 블록을 표에서 다시 생성한다.

## 갱신 시점

| 시점 | 스킬 | 하는 일 |
|---|---|---|
| 스펙 | sj-spec | 지도를 읽고 스펙에 `## 영향 범위` 절 작성 — 의존 기능 + 역방향 의존 기능을 ID로 지목 |
| 구현 | sj-tech-lead | Dispatch Card에 영향 기능 전달, 구현 후 행 추가·갱신 + 흐름도 재생성 |
| 판정 | sj-qa | drift 검사 실행, FAIL 시 판정문에 의심 기능 ID + 파일 경로 명시 |
| 최초 생성 | docs-organize | 지도 1회 생성, 재실행 시 미매핑 후보 탐지 |

## drift 검사 (기계 검증)

```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

출력이 없으면 지도가 코드와 일치한다. `STALE:` 줄은 지도가 낡았다는 뜻이다.

역방향(코드엔 있으나 지도에 없는 기능)은 기계로 잡히지 않는다 — docs-organize 재실행 시 `## 미매핑`에 후보를 나열한다.

## 심각도

**지도 불일치는 FAIL이 아니라 경고(LOW)다.** 낡은 문서로 배포를 막으면 사람들이 지도를 우회하기 시작하고, 그 순간 지도는 죽는다. 심각도 보정 원칙(`reviewer-diversity.md`)과 같은 이유다.

## 폴백

지도가 없는 프로젝트에서 **어떤 스킬도 멈추지 않는다.** 산출물에 `미수행: FEATURE-MAP 없음` 한 줄을 남기고 진행한다 (`honest-report.md`, 볼트 부재 폴백과 같은 패턴).

## 이유

기능 하나씩은 정밀한데 기능 사이가 비어 있으면, QA가 FAIL을 내도 어디를 고칠지가 산출물에 없다. 사람도 AI도 매번 코드베이스를 재탐색한다.

지도를 볼트가 아니라 repo에 두는 이유: **틀린 지도는 탐색보다 나쁘다.** 코드와 같은 PR에서 함께 바뀌어야 drift가 diff로 드러난다. repo는 "지금 뭐가 뭘 부르나"(사실), 볼트는 "왜 그렇게 설계했나"(경험·ADR).
`````

- [ ] **Step 4: `_conventions/README.md` 규칙 표에 행 추가**

`| [obsidian-output.md](obsidian-output.md) | ... |` 행 **바로 다음 줄**에 삽입:

```markdown
| [feature-map.md](feature-map.md) | 기능 목록·연결·수정 지점은 `docs/FEATURE-MAP.md`에 — 표가 정본, 지도 불일치는 경고(FAIL 아님), 없으면 비차단 | sj-spec, sj-tech-lead, sj-qa, docs-organize |
```

- [ ] **Step 5: 검증 — 규칙 파일 존재 + README 행 + fixture 검사 재확인**

Run:
```bash
test -f skills/_conventions/feature-map.md && echo "OK: 규칙 파일"
grep -c "feature-map.md" skills/_conventions/README.md
python3 scripts/skill-manifest.py --check
```

Expected: `OK: 규칙 파일` / `1` 이상 / `정합성 검사 통과`

- [ ] **Step 6: 커밋**

`git add` 대상: `skills/_conventions/feature-map.md`, `skills/_conventions/README.md`, `docs/superpowers/fixtures/sample-feature-map.md`

커밋 메시지:
```
feat(conventions): 기능 지도·추적성 규칙 정본 신설

기능 하나를 깊게 명세하는 스펙과, 기능들이 서로 엮이는 지도는 다른 문서다.
지도가 답하는 질문은 '여기가 고장났으면 어디를 고쳐야 하나' 하나다.
표가 정본이고 mermaid는 파생, 지도 불일치는 FAIL이 아니라 경고,
없는 프로젝트에서는 비차단. drift 검사는 bash 한 줄이며 fixture로 회귀 고정.
```

---

### Task 2: sj-spec 배선 — 구현 전 영향 분석

이 태스크가 이 계획의 핵심 산출이다. 하네스에 "구현 전에 기능 간 영향을 따지는 단계"가 처음 생긴다.

**Files:**
- Modify: `skills/sj-spec/SKILL.md` (`## 2. 산출물 계약` 절 — 마지막 불릿 다음)
- Modify: `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-spec.md` (Step 3 끝, Step 5 템플릿)

**Interfaces:**
- Consumes: Task 1의 `skills/_conventions/feature-map.md` 규칙과 drift 검사 명령.
- Produces: 스펙 파일의 `## 영향 범위` 절 — Task 3(sj-tech-lead)이 Dispatch Card에 옮겨 담는다. 형식은 `- {F##} {기능명} — {영향 내용}` 한 줄씩, 지도 부재 시 `미수행: FEATURE-MAP 없음`.

- [ ] **Step 1: SKILL.md 산출물 계약에 한 줄 추가**

`skills/sj-spec/SKILL.md`의 `## 2. 산출물 계약 (불변 — 플레이북보다 우선)` 절에서 마지막 불릿(`- 가정은 스펙 ...`) **다음 줄**에 삽입:

```markdown
- 스펙에 `## 영향 범위` 절 필수 — `docs/FEATURE-MAP.md`가 있으면 의존/역방향 의존 기능을 ID로
  지목하고, 없으면 `미수행: FEATURE-MAP 없음`을 기록한다 (정본: `../_conventions/feature-map.md`).
```

- [ ] **Step 2: 볼트 플레이북에 Step 3.5 신설**

`$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-spec.md`에서 `## Step 4: DRAFT` 헤딩 **바로 앞**에 삽입:

`````markdown
## Step 3.5: IMPACT — 영향 범위 분석

기능 지도를 읽고 이 기능이 건드리는 **다른 기능**을 찾는다. 정본: S-skills `skills/_conventions/feature-map.md`.

```bash
[ -f docs/FEATURE-MAP.md ] && echo "MAP=present" || echo "MAP=absent"
```

**absent** → 아래 절을 `미수행: FEATURE-MAP 없음` 한 줄로 대체하고 Step 4로 진행한다. **중단하지 않는다.**

**present** → 지도를 Read로 읽고 두 방향을 모두 확인한다:

1. **내가 의존하는 기능** — 이 기능이 호출·조회·전제하는 기능. 지도의 `의존` 칸에 적힐 값.
2. **나를 의존하는 기능 (역방향)** — 지도의 `의존` 칸에 이 기능 ID가 적힌 행들. 지도에 저장되지 않으므로 표를 훑어 계산한다. **이쪽이 회귀가 터지는 방향이므로 빠뜨리지 않는다.**

작성 형식:

````markdown
## 영향 범위

### 의존 (이 기능이 필요로 하는 것)
- F01 바이어 로그인 — 세션 토큰을 전제한다

### 역방향 (이 기능이 바뀌면 영향받는 것)
- F07 관리자 인박스 — 같은 `inquiries` 테이블을 읽는다. 스키마 변경 시 회귀 확인 필요

### 회귀 확인 대상 테스트
- `src/lib/sales/sales-agent-tools.test.ts` (F07)
````

역방향이 하나도 없으면 `- 없음 (신규 진입점, 기존 기능이 참조하지 않음)`이라고 명시한다 — 빈 절은 "분석 안 함"과 구별되지 않는다.
`````

- [ ] **Step 3: 볼트 플레이북 Step 5 파일 템플릿에 절 추가**

같은 파일 Step 5의 스펙 템플릿에서 `## 기술 명세` 헤딩 **바로 앞**에 삽입:

```markdown
## 영향 범위
{의존 / 역방향 / 회귀 확인 대상 테스트 — 지도 없으면 "미수행: FEATURE-MAP 없음"}
```

- [ ] **Step 4: 행동 테스트 (a) — 지도가 있을 때 영향 절을 쓰는가**

픽스처 프로젝트를 만든다:
```bash
T=$(mktemp -d)/mapped && mkdir -p "$T/docs" "$T/src/lib" && cd "$T"
touch src/lib/auth.ts src/lib/order.ts
cat > docs/FEATURE-MAP.md <<'EOF'
# Feature Map
## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 로그인 | `src/lib/auth.ts` | `src/lib/auth.ts` | 없음 | — |
| F02 | 주문 | `src/lib/order.ts` | `src/lib/order.ts` | 없음 | F01 |
EOF
echo "$T"
```

이 디렉토리에서 `/spec 로그인에 2단계 인증 추가`를 실행한 뒤 검증:
```bash
grep -A15 "## 영향 범위" docs/sj-company/spec-*.md
```

Expected: `## 영향 범위` 절이 존재하고, **역방향에 F02가 지목되어 있다** (F02의 의존 칸이 F01이므로). F02가 빠지면 Step 2의 역방향 지시가 작동하지 않은 것 — 플레이북 문구를 고치고 재실행한다.

- [ ] **Step 5: 행동 테스트 (b) — 지도가 없을 때 멈추지 않는가**

```bash
T=$(mktemp -d)/unmapped && mkdir -p "$T/src" && cd "$T" && touch src/a.ts && echo "$T"
```

이 디렉토리에서 `/spec 새 기능 추가`를 실행한 뒤 검증:
```bash
grep -c "미수행: FEATURE-MAP 없음" docs/sj-company/spec-*.md
ls docs/sj-company/spec-*.md && echo "OK: 중단 없이 스펙 생성됨"
```

Expected: `1` / `OK: 중단 없이 스펙 생성됨`. 스킬이 사용자에게 지도를 만들라고 요구하며 멈췄다면 **실패** — 비차단 폴백 불변식 위반이다.

- [ ] **Step 6: 커밋**

`git add` 대상: `skills/sj-spec/SKILL.md`

커밋 메시지:
```
feat(sj-spec): 구현 전 영향 범위 분석 단계 배선

하네스에 기능 간 영향을 구현 전에 따지는 단계가 처음 생긴다.
Step 3.5(IMPACT)에서 지도의 의존 칸을 양방향으로 읽는다 — 역방향
(나를 의존하는 기능)이 회귀가 터지는 방향이라 이쪽을 강제한다.
지도 없으면 미수행 기록 후 비차단 진행. 절차는 볼트 플레이북,
SKILL.md에는 계약 한 줄.
```

볼트 플레이북은 이 저장소가 아니므로 커밋 대상이 아니다. 변경 사실만 커밋 메시지에 남긴다.

---

### Task 3: sj-tech-lead 배선 — 영향 전달 + 지도 갱신

**Files:**
- Modify: `skills/sj-tech-lead/SKILL.md` (`## 2. 산출물 계약` 절)
- Modify: `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-tech-lead.md` (Dispatch Card 스키마, Step 9)

**Interfaces:**
- Consumes: Task 2가 만든 스펙의 `## 영향 범위` 절.
- Produces: 갱신된 `docs/FEATURE-MAP.md` 행 — Task 4(sj-qa)의 drift 검사가 이 행의 경로를 검증한다.

- [ ] **Step 1: SKILL.md 산출물 계약에 한 줄 추가**

`skills/sj-tech-lead/SKILL.md`의 `## 2. 산출물 계약` 절에서 `- 학습 인사이트는 ...` 불릿 **바로 앞**에 삽입:

```markdown
- `docs/FEATURE-MAP.md`가 있으면 구현 후 해당 기능 행(진입점·핵심 파일·테스트·의존)을 갱신하고
  흐름도를 표에서 재생성한다. 없으면 dev-summary.md에 `미수행: FEATURE-MAP 없음`
  (정본: `../_conventions/feature-map.md`).
```

- [ ] **Step 2: Dispatch Card에 영향 기능 전달 필드 추가**

`$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-tech-lead.md`의 `### Dispatch Card (Tech Lead → Sub-agent)` 스키마에서 `[BUILD]` 항목 **다음 줄**에 삽입:

```markdown
[IMPACT] 이 작업이 영향을 주는 기존 기능 (스펙 `## 영향 범위`에서 옮김):
  - F07 관리자 인박스 — 같은 테이블 사용, 회귀 확인 대상: src/lib/sales/tools.test.ts
  이 파일들을 깨뜨리지 않는지 구현 중 확인한다. 영향 기능이 없으면 "없음".
```

- [ ] **Step 3: Step 9에 지도 갱신 절 추가**

같은 파일 `### 9c. 볼트 학습 환류` 헤딩 **바로 앞**에 삽입:

`````markdown
### 9b-2. 기능 지도 갱신

```bash
[ -f docs/FEATURE-MAP.md ] && echo "MAP=present" || echo "MAP=absent"
```

**absent** → `dev-summary.md`에 `미수행: FEATURE-MAP 없음` 한 줄. 진행.

**present** → 이번 구현을 반영한다:

1. 신규 기능이면 행을 추가한다. ID는 표의 최대 번호 + 1 — **삭제된 ID는 재사용하지 않는다.**
2. 기존 기능을 고쳤으면 `핵심 파일`·`테스트` 칸을 실제 변경 파일로 갱신한다.
3. `의존` 칸이 바뀌었으면 `## 흐름`의 mermaid 블록을 **표에서 다시 생성한다** (표가 정본).
4. drift 검사를 돌려 0줄을 확인한다:

```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

`STALE:` 줄이 나오면 그 경로를 실제 파일로 고친 뒤 다시 돌린다. 지도는 코드와 같은 커밋에서 갱신된다.
`````

- [ ] **Step 4: 검증**

Task 2 Step 4의 `mapped` 픽스처에서 `/tech-lead`를 실행한 뒤:
```bash
grep -c "F0" docs/FEATURE-MAP.md
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

Expected: 행 수가 유지되거나 늘어나고, drift 출력 0줄.

- [ ] **Step 5: 커밋**

`git add` 대상: `skills/sj-tech-lead/SKILL.md`

커밋 메시지:
```
feat(sj-tech-lead): 영향 기능 전달 + 구현 후 지도 갱신

Dispatch Card에 [IMPACT]를 실어 서브에이전트가 회귀 대상을 알고
구현하게 한다. Step 9b-2에서 지도 행을 실제 변경 파일로 갱신하고
drift 0을 확인한다 — 지도는 코드와 같은 커밋에서 움직인다.
```

---

### Task 4: sj-qa 배선 — drift 검사 + FAIL 시 위치 지목

**Files:**
- Modify: `skills/sj-qa/SKILL.md` (`## 2. 산출물 계약` 절)
- Modify: `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-qa.md` (Step 3, Step 5 템플릿)

**Interfaces:**
- Consumes: Task 3이 갱신한 `docs/FEATURE-MAP.md` 행.
- Produces: `qa-verdict.md`의 `## 의심 지점` 절 (FAIL/CONDITIONAL일 때만).

- [ ] **Step 1: SKILL.md 산출물 계약에 한 줄 추가**

`skills/sj-qa/SKILL.md`의 `## 2. 산출물 계약` 절에서 `- 심각도 보정 ...` 불릿 **바로 앞**에 삽입:

```markdown
- `docs/FEATURE-MAP.md`가 있으면 drift 검사를 실행하고, **FAIL/CONDITIONAL 시 `## 의심 지점` 절에
  기능 ID + 파일 경로를 명시**한다. 지도 불일치 자체는 FAIL 사유가 아니라 경고(LOW)이며, 지도는
  판정 근거가 아니라 검증 대상이다 (정본: `../_conventions/feature-map.md`,
  [judge-independence](../_conventions/judge-independence.md) 유지).
```

- [ ] **Step 2: 볼트 플레이북 Step 3에 검사 추가**

`$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-qa.md`의 `## Step 4: 자체 검토` 헤딩 **바로 앞**에 삽입:

`````markdown
### Step 3-map: 기능 지도 대조

**Judge 독립성 유지** — 지도는 구현자가 갱신한 문서이므로 **판정 근거가 아니다.** 두 가지 용도로만 쓴다:
① 지도가 실제와 일치하는지 검사(검증 대상) ② FAIL 시 수정 지점 지목(위치 도구).

```bash
[ -f docs/FEATURE-MAP.md ] || echo "MAP=absent"
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md 2>/dev/null \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

- `MAP=absent` → `qa-verdict.md`에 `미수행: FEATURE-MAP 없음` 한 줄. 판정은 정상 진행.
- `STALE:` 출력 있음 → **LOW 이슈로만 기록한다.** 지도가 낡은 것은 실제 결함이 아니다.
  이것만으로 FAIL을 내지 않는다 (심각도 보정).
- 판정이 FAIL 또는 CONDITIONAL이면, 깨진 완료 조건과 관련된 기능을 지도에서 찾아
  `## 의심 지점` 절에 ID와 파일 경로를 적는다.
`````

- [ ] **Step 3: Step 5 판정 템플릿에 절 추가**

같은 파일 Step 5의 `qa-verdict.md` 템플릿에서 `## 발견된 이슈` 헤딩 **바로 앞**에 삽입:

```markdown
## 의심 지점
{FAIL·CONDITIONAL일 때만. 지도에서 찾은 기능 ID + 파일 경로를 그대로 적어 사용자가 바로 열 수 있게 한다.}
- F02 견적 요청 — `src/lib/sales/sales-inquiry.ts` (완료 조건 3 실패: 응답에 request_type 누락)
- 회귀 확인 대상: `src/lib/sales/sales-agent-tools.test.ts`
```

- [ ] **Step 4: 검증 — 의도적으로 깨진 지도로 LOW 처리 확인**

```bash
T=$(mktemp -d)/qatest && mkdir -p "$T/docs" && cd "$T" && touch docs/real.ts
cat > docs/FEATURE-MAP.md <<'EOF'
# Feature Map
## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 있는 기능 | `docs/real.ts` | `docs/real.ts` | 없음 | — |
| F02 | 낡은 행 | `docs/deleted.ts` | `docs/deleted.ts` | 없음 | F01 |
EOF
echo "$T"
```

이 디렉토리에서 `/qa` 실행 후 검증:
```bash
grep -i "STALE\|낡\|LOW" docs/sj-company/.state/qa-verdict.md
grep "^## 판정:" docs/sj-company/.state/qa-verdict.md
```

Expected: 지도 낡음이 **LOW로 기록**되고, 판정 줄이 지도 때문에 `FAIL`이 되지 **않는다**. FAIL이 나오면 심각도 불변식 위반 — 플레이북 문구를 고치고 재실행한다.

- [ ] **Step 5: 커밋**

`git add` 대상: `skills/sj-qa/SKILL.md`

커밋 메시지:
```
feat(sj-qa): 지도 drift 검사 + FAIL 시 수정 지점 지목

FAIL을 내면서 어디를 고칠지 안 알려주는 판정문을 없앤다.
qa-verdict에 '## 의심 지점'(기능 ID + 파일 경로)을 적어 사용자가
바로 열 수 있게 한다. 지도는 판정 근거가 아니라 검증 대상이라
Judge 독립성은 유지되고, 지도 낡음은 LOW로만 기록해 배포를 막지 않는다.
```

---

### Task 5: docs-organize 배선 — 최초 생성 + 미매핑 탐지

**Files:**
- Modify: `skills/docs-organize/SKILL.md` (Phase 3 문서 생성 — `#### docs/STATUS.md` 항목 앞)

**Interfaces:**
- Consumes: Task 1의 규칙 형식.
- Produces: 기존 프로젝트의 초기 `docs/FEATURE-MAP.md` — Task 2~4의 배선이 소비한다.

- [ ] **Step 1: Phase 3에 생성 항목 추가**

`skills/docs-organize/SKILL.md`의 `#### docs/STATUS.md` 헤딩 **바로 앞**에 삽입:

````markdown
#### docs/FEATURE-MAP.md

Phase 1 코드베이스 분석에서 식별한 기능을 표로 옮긴다. 규칙 정본: `skills/_conventions/feature-map.md`.

```markdown
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
```

**작성 규칙**
- 라우트·엔트리포인트에서 출발한다. 유틸리티 함수는 기능이 아니다.
- 확신이 없으면 `## 미매핑`에 두고 사용자에게 묻는다 — 추측으로 행을 만들지 않는다.
- 작성 후 drift 검사를 돌려 `STALE:` 0줄을 확인한다 (명령은 규칙 파일 참조).
- 이미 `docs/FEATURE-MAP.md`가 있으면 **통째로 덮어쓰지 않는다.** 기존 행은 두고,
  코드에 있으나 표에 없는 기능만 `## 미매핑`에 후보로 추가한다 (archive-only 정신).

**건강 점수 체계는 건드리지 않는다** — Phase 5 점수 항목·배점에 FEATURE-MAP을 추가하지 않는다 (회귀 위험).
````

- [ ] **Step 2: 검증 — 점수 체계 비간섭 확인**

```bash
git diff skills/docs-organize/SKILL.md | grep -c "^+.*pts"
grep -n "FEATURE-MAP" skills/docs-organize/SKILL.md | head
```

Expected: 점수(`pts`) 추가 라인 `0`, FEATURE-MAP 언급이 Phase 3에만 존재.

- [ ] **Step 3: 커밋**

`git add` 대상: `skills/docs-organize/SKILL.md`

커밋 메시지:
```
feat(docs-organize): 기존 프로젝트에 기능 지도 최초 생성

라우트·엔트리포인트에서 출발해 표를 만들고, 확신 없는 것은
미매핑에 두고 사용자에게 묻는다. 기존 지도는 덮어쓰지 않고
미매핑 후보만 추가(archive-only 정신).
건강 점수 배점은 건드리지 않는다 — 회귀 위험.
```

---

### Task 6: 도그푸딩 — S-skills 자신의 지도

하네스가 자기 자신에게 적용되지 않으면 다른 프로젝트에 권할 수 없다.

**Files:**
- Create: `docs/FEATURE-MAP.md` (이 저장소)

**Interfaces:**
- Consumes: Task 1~5의 전체 배선.
- Produces: 스펙 완료 조건 7의 증거.

- [ ] **Step 1: 스킬 인벤토리 확인**

```bash
ls skills/
grep -n "sj-pm\|sj-tech-lead\|sj-qa\|sj-ship" skills/RESOLVER.md | head -20
```

기능 = 스킬 1개. 진입점 = `skills/{name}/SKILL.md`, 핵심 파일 = 그 디렉토리, 테스트 = `scripts/skill-manifest.py`(공통 가드), 의존 = 그 스킬이 호출·전제하는 다른 스킬.

- [ ] **Step 2: `docs/FEATURE-MAP.md` 작성**

`skills/_conventions/feature-map.md`의 형식을 그대로 따른다. 최소 포함 대상: 역할 스킬 13개 + `harness` + `docs-organize`. 도구 배선형 스킬은 의존이 없으면 `—`.

의존은 RESOLVER·sentinel에서 실제로 확인한 관계만 적는다. 예상되는 것:
- `sj-company` → `sj-pm`, `sj-tech-lead`, `sj-qa`, `sj-ship` (RESOLVER 디스패치)
- `sj-tech-lead` → `sj-design` (`design-review.req` sentinel)
- `sj-retro` → friction 로그 생산자들

- [ ] **Step 3: drift 검사 통과 확인**

```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

Expected: 출력 0줄. `STALE:`이 나오면 경로 오타 — 고치고 재실행.

- [ ] **Step 4: mermaid 블록이 표와 일치하는지 육안 대조**

표의 모든 `의존` 값이 mermaid 화살표로 존재하고, mermaid에 표에 없는 노드가 없어야 한다.

- [ ] **Step 5: 커밋**

`git add` 대상: `docs/FEATURE-MAP.md`

커밋 메시지:
```
docs: S-skills 자신의 기능 지도 (도그푸딩)

하네스가 자기 자신에게 적용되지 않으면 다른 프로젝트에 권할 수 없다.
스킬 = 기능, 의존은 실제 라우팅·sentinel 관계. drift 검사 0줄 확인.
```

---

### Task 7: 제안 원장 기록 + 릴리즈

**Files:**
- Modify: `$OBSIDIAN_VAULT_DIR/40_프로젝트/S-skills/하네스-제안-원장.md`
- Modify: `CHANGELOG.md` (`## [Unreleased]` → `## [4.1.0] - 2026-08-27`)
- Modify: `skills/VERSION`, `.claude-plugin/marketplace.json`, `CLAUDE.md`
- Modify: `skills/manifest.json` (재생성)

**Interfaces:**
- Consumes: Task 1~6의 모든 변경.

- [ ] **Step 1: 원장에 제안 5건 기록**

`하네스-제안-원장.md` 끝에 append. 각 건은 5필드 + 판정:

```markdown
## 2026-08-27 — 기능 지도·추적성 층 (사용자 직접 지시 = 사람 게이트 통과)

### 제안 1: 기능 지도 컨벤션 신설
- 실패 증거: grep 확인 — "영향 범위" sj-investigate 1건(사후), "의존 관계" sj-tech-lead 1건(에이전트 호출 순서), 추적성 0건. QA FAIL 시 수정 지점이 산출물에 없음
- 추정 원인: 기능 하나의 정밀도(수직)만 규정하고 기능 간 관계(수평)를 규정한 규칙이 없음
- 수정 대상: `skills/_conventions/feature-map.md` (신설)
- 예상 개선: 수정 지점을 문서에서 즉시 찾음, drift가 기계 검증 가능
- 회귀 위험: 낮음 (규칙 추가만, 지도 없으면 비차단)
- **판정: 채택** (manifest --check 녹색, 행동 테스트 2케이스 통과, 사용자 지시)

### 제안 2: sj-spec 영향 범위 분석 (Step 3.5)
- 실패 증거: 제안 1과 동일 — 구현 전 영향 분석 단계가 파이프라인에 존재하지 않음
- 추정 원인: 스펙 절차가 단일 기능 내부(에러·엣지·수용 기준)만 다룸
- 수정 대상: 볼트 `20_실행/플레이북/sj-spec.md` + `skills/sj-spec/SKILL.md` 계약 한 줄
- 예상 개선: 역방향 의존(회귀가 터지는 방향)을 구현 전에 지목
- 회귀 위험: 낮음 (지도 없으면 미수행 기록 후 진행 — 행동 테스트 (b)로 확인)
- **판정: 채택**

### 제안 3: sj-tech-lead 영향 전달 + 지도 갱신
- 실패 증거: 제안 1과 동일. 구현자가 회귀 대상을 모르고 구현
- 추정 원인: 지도를 갱신할 주체가 지정되지 않으면 지도는 반드시 낡는다
- 수정 대상: 볼트 `20_실행/플레이북/sj-tech-lead.md` + `skills/sj-tech-lead/SKILL.md` 계약 한 줄
- 예상 개선: 지도가 코드와 같은 커밋에서 움직임
- 회귀 위험: 낮음
- **판정: 채택**

### 제안 4: sj-qa drift 검사 + 의심 지점 지목
- 실패 증거: 판정문에 "어디를 고쳐야 하는지"가 없어 사람도 AI도 재탐색
- 추정 원인: 완료 조건 대조는 있으나 실패를 코드 위치로 되돌리는 경로가 없음
- 수정 대상: 볼트 `20_실행/플레이북/sj-qa.md` + `skills/sj-qa/SKILL.md` 계약 한 줄
- 예상 개선: FAIL 판정이 곧 수정 지시가 됨
- 회귀 위험: **중** — FAIL 조건이 넓어지면 사소한 이슈로 배포가 막힌다. 지도 불일치를 LOW로 고정해 차단(Task 4 Step 4로 검증)
- **판정: 채택**

### 제안 5: docs-organize 최초 생성
- 실패 증거: 기존 프로젝트에 지도가 없으면 위 4건이 전부 미수행 폴백으로 떨어짐
- 추정 원인: 생성 주체 부재
- 수정 대상: `skills/docs-organize/SKILL.md` Phase 3
- 예상 개선: 기존 프로젝트도 지도를 갖게 됨
- 회귀 위험: 낮음 (점수 체계 비간섭 명시, 기존 지도 덮어쓰기 금지)
- **판정: 채택**
```

- [ ] **Step 2: CHANGELOG Unreleased → 4.1.0 확정**

`## [Unreleased]`를 `## [4.1.0] - 2026-08-27`로 바꾸고, 기존 "설계만, 구현 전" 문구를 실제 구현 내용으로 교체한다. 배선된 스킬 4개와 신설 컨벤션 1개를 명시한다.

- [ ] **Step 3: 버전 범프 + manifest 재생성**

```bash
echo "4.1.0" > skills/VERSION
sed -i '' 's/"version": "4.0.0"/"version": "4.1.0"/' .claude-plugin/marketplace.json
python3 scripts/skill-manifest.py --write
python3 scripts/skill-manifest.py --check
```

Expected: `정합성 검사 통과`. 실패하면 `CLAUDE.md`의 스킬 버전 표기와 SKILL.md frontmatter 불일치 — 검사 메시지가 지목하는 파일을 맞춘다.

- [ ] **Step 4: CLAUDE.md 아키텍처 원칙에 한 줄 추가**

```markdown
- **기능 지도·추적성**: 기능 목록·연결·수정 지점은 대상 repo `docs/FEATURE-MAP.md`에 — 표가 정본이고 mermaid는 파생. sj-spec이 구현 전 영향 범위(역방향 포함)를 지목, sj-tech-lead가 구현 후 행을 갱신, sj-qa가 drift 검사 후 FAIL 시 의심 지점(기능 ID + 파일 경로)을 판정문에 명시, docs-organize가 기존 프로젝트에 최초 생성. 지도 불일치는 FAIL이 아니라 경고이며 지도가 없으면 비차단 (정본: [skills/_conventions/feature-map.md](skills/_conventions/feature-map.md)).
```

- [ ] **Step 5: 최종 검증 — 스펙 완료 조건 8개 전부 대조**

```bash
test -f skills/_conventions/feature-map.md && echo "1 OK"
grep -c "FEATURE-MAP" skills/sj-spec/SKILL.md skills/sj-tech-lead/SKILL.md skills/sj-qa/SKILL.md
grep -c "FEATURE-MAP" skills/docs-organize/SKILL.md
python3 scripts/skill-manifest.py --check
test -f docs/FEATURE-MAP.md && echo "7 OK"
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

Expected: `1 OK` / 세 파일 모두 1 이상 / 1 이상 / `정합성 검사 통과` / `7 OK` / drift 0줄. 조건 3(볼트 플레이북)·6(행동 테스트)·8(원장)은 각 태스크에서 확인된 것을 재확인한다.

- [ ] **Step 6: 커밋**

`git add` 대상: `CHANGELOG.md`, `skills/VERSION`, `.claude-plugin/marketplace.json`, `skills/manifest.json`, `CLAUDE.md`

커밋 메시지:
```
chore(release): v4.1.0 — 기능 지도·추적성 층

기능 하나의 정밀도(수직)는 있었지만 기능 간 관계(수평)가 비어 있었다.
docs/FEATURE-MAP.md를 대상 repo에 두고 sj-spec(구현 전 영향 범위)·
sj-tech-lead(구현 후 갱신)·sj-qa(drift 검사 + 의심 지점 지목)·
docs-organize(최초 생성)로 배선했다. 지도 불일치는 경고이고
지도가 없으면 비차단. 제안 5건은 원장에 5필드로 기록.
```

- [ ] **Step 7: 푸시는 사람 게이트**

푸시 전 사용자에게 변경 요약을 보고하고 승인을 받는다. 승인 없이 `git push` 하지 않는다.

---

## 실행 순서 주의

- Task 1은 나머지 전부의 선행이다 (규칙 정본과 검증된 drift 명령이 여기서 나온다).
- Task 2~5는 서로 독립이므로 순서를 바꿔도 되고 병렬로 진행해도 된다.
- Task 6은 Task 1~5 완료 후에만 의미가 있다 — 도그푸딩은 배선이 다 있어야 증거가 된다.
- Task 7은 마지막.
- **볼트 플레이북 변경은 이 저장소의 커밋 대상이 아니다** — 볼트는 별도 저장소다. 변경 사실만 커밋 메시지에 남긴다.
