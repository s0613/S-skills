---
name: harness
version: 2.4.1
description: |
  S-skills 하네스. 프로젝트 상태를 감지하고 docs-organize, test-scenario, pw-loop 스킬을
  오케스트레이션한다. /s-skills 하나로 지금 무엇이 필요한지 판단해 적절한 스킬을 호출.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Agent
  - Skill
  - AskUserQuestion
triggers:
  - /s-skills
---

# S-skills Harness

프로젝트 상태를 읽고 docs-organize → test-scenario / pw-loop 흐름을 오케스트레이션한다.
각 스킬은 독립 호출도 가능하지만, 이 하네스가 "지금 무엇을 해야 하는가"를 판단한다.

---

## Preamble — 프로젝트 상태 감지

```bash
# ── 문서 상태 ──
_HAS_DOCS="no"
_DOC_SCORE="0"
if [ -f "docs/STATUS.md" ]; then
  _HAS_DOCS="yes"
  _DOC_SCORE_RAW=$(grep -m1 '^\*\*Score:' docs/STATUS.md 2>/dev/null | grep -oE '[0-9]+' | head -1)
  _DOC_SCORE="${_DOC_SCORE_RAW:-0}"
fi

# ── 테스트 시나리오 상태 ──
_HAS_SCENARIOS="no"
_TS_CYCLE="0"
_TS_PASS_RATE="0"
_TS_THRESHOLD="80"
_TS_STATUS="NOT_STARTED"
_SCENARIO_COUNT="0"

if [ -d "docs/test-scenarios" ]; then
  _HAS_SCENARIOS="yes"

  # 사이클 읽기 (숫자 검증)
  _TS_CYCLE_RAW=$(cat "docs/test-scenarios/.state/cycle.txt" 2>/dev/null)
  _TS_CYCLE="${_TS_CYCLE_RAW:-0}"
  case "$_TS_CYCLE" in ''|*[!0-9]*) _TS_CYCLE=0 ;; esac

  # 임계값 읽기 (숫자 검증)
  _TS_THRESHOLD_RAW=$(cat "docs/test-scenarios/.state/threshold.txt" 2>/dev/null)
  _TS_THRESHOLD="${_TS_THRESHOLD_RAW:-80}"
  case "$_TS_THRESHOLD" in ''|*[!0-9]*) _TS_THRESHOLD=80 ;; esac

  # 시나리오 파일 수
  _SCENARIO_COUNT=$(find "docs/test-scenarios/" -maxdepth 1 -name "*.md" ! -name "README.md" 2>/dev/null | wc -l | tr -d ' ')

  # 현재 사이클 보고서 카운트
  if [ "$_TS_CYCLE" -gt 0 ]; then
    _TOTAL=$(find "docs/test-scenarios/reports/" -maxdepth 1 -name "*-c${_TS_CYCLE}-*.md" 2>/dev/null | wc -l | tr -d ' ')
    _PASS=$(grep -rl "판정: PASS" "docs/test-scenarios/reports/" 2>/dev/null | grep -c -- "-c${_TS_CYCLE}-" || echo 0)
  else
    _TOTAL=0
    _PASS=0
  fi

  # 통과율 계산
  if [ "$_TOTAL" -gt 0 ]; then
    _TS_PASS_RATE=$(( (_PASS * 100) / _TOTAL ))
  fi

  # 상태 판정
  if [ "$_TS_PASS_RATE" -ge "$_TS_THRESHOLD" ] && [ "$_TOTAL" -gt 0 ]; then
    _TS_STATUS="COMPLETE"
  elif [ "$_TOTAL" -gt 0 ]; then
    _TS_STATUS="IN_PROGRESS"
  elif [ "$_SCENARIO_COUNT" -gt 0 ]; then
    _TS_STATUS="GENERATED"
  else
    _TS_STATUS="NOT_STARTED"
  fi
fi

# ── pw-loop 상태 ──
_PW_CYCLE="0"
_PW_RATE="0"
_PW_STATUS="NOT_STARTED"
_PW_THRESHOLD="80"

if [ -d "docs/pw-loop" ]; then
  _PW_CYCLE_RAW=$(cat "docs/pw-loop/.state/cycle.txt" 2>/dev/null)
  _PW_CYCLE="${_PW_CYCLE_RAW:-0}"
  case "$_PW_CYCLE" in ''|*[!0-9]*) _PW_CYCLE=0 ;; esac

  _PW_THRESHOLD_RAW=$(cat "docs/pw-loop/.state/threshold.txt" 2>/dev/null)
  _PW_THRESHOLD="${_PW_THRESHOLD_RAW:-80}"
  case "$_PW_THRESHOLD" in ''|*[!0-9]*) _PW_THRESHOLD=80 ;; esac

  if [ "$_PW_CYCLE" -gt 0 ]; then
    _PW_RATE_RAW=$(python3 -c "import json; d=json.load(open('docs/pw-loop/reports/cycle-${_PW_CYCLE}-summary.json')); print(d.get('rate',0))" 2>/dev/null || echo 0)
    _PW_RATE="${_PW_RATE_RAW:-0}"
    case "$_PW_RATE" in ''|*[!0-9]*) _PW_RATE=0 ;; esac

    if [ "$_PW_RATE" -ge "$_PW_THRESHOLD" ]; then
      _PW_STATUS="COMPLETE"
    else
      _PW_STATUS="IN_PROGRESS"
    fi
  fi
fi

# ── sj-company 상태 ──
_SJ_STAGE=$(cat "docs/sj-company/.state/stage.txt" 2>/dev/null | tr -d '[:space:]')
_SJ_STAGE="${_SJ_STAGE:-none}"
_SJ_TASK=$(cat "docs/sj-company/.state/task.txt" 2>/dev/null)

# ── Phase 0: 에이전트/스킬 생태계 감사 ──
_AGENT_COUNT=0
_AGENT_LIST=""
_LOCAL_SKILL_COUNT=0
_AGENT_MODE="INIT"

if [ -d ".claude/agents" ]; then
  _AGENT_COUNT=$(find ".claude/agents" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  _AGENT_LIST=$(find ".claude/agents" -maxdepth 1 -name "*.md" 2>/dev/null \
    | xargs -I{} basename {} .md 2>/dev/null | sort | tr '\n' ', ' | sed 's/, $//')
fi

if [ -d ".claude/skills" ]; then
  _LOCAL_SKILL_COUNT=$(find ".claude/skills" -maxdepth 2 -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
fi

if [ "$_AGENT_COUNT" -gt 0 ] || [ "$_LOCAL_SKILL_COUNT" -gt 0 ]; then
  _AGENT_MODE="EXISTS"
fi

echo "HAS_DOCS: $_HAS_DOCS"
echo "DOC_SCORE: $_DOC_SCORE"
echo "HAS_SCENARIOS: $_HAS_SCENARIOS"
echo "TS_CYCLE: $_TS_CYCLE"
echo "TS_PASS_RATE: $_TS_PASS_RATE%"
echo "TS_STATUS: $_TS_STATUS"
echo "SCENARIO_COUNT: ${_SCENARIO_COUNT:-0}"
echo "PW_CYCLE: $_PW_CYCLE"
echo "PW_PASS_RATE: $_PW_RATE%"
echo "PW_STATUS: $_PW_STATUS"
echo "SJ_STAGE: $_SJ_STAGE"
echo "SJ_TASK: ${_SJ_TASK:-없음}"
echo "AGENT_MODE: $_AGENT_MODE"
echo "AGENT_COUNT: $_AGENT_COUNT"
echo "LOCAL_SKILL_COUNT: $_LOCAL_SKILL_COUNT"
[ -n "$_AGENT_LIST" ] && echo "AGENTS: $_AGENT_LIST"

# ── 버전 확인 (best-effort, 3초 제한) ──
_SS_LOCAL_VER=$(find ~/.claude/plugins/cache/s-skills -name "VERSION" -maxdepth 6 2>/dev/null \
  | head -1 | xargs cat 2>/dev/null | tr -d '[:space:]')
_SS_LOCAL_VER="${_SS_LOCAL_VER:-unknown}"

_SS_REMOTE_VER=$(timeout 3 git ls-remote --tags \
  https://github.com/s0613/S-skills.git 2>/dev/null \
  | grep -oE 'refs/tags/[0-9]+\.[0-9]+\.[0-9]+$' \
  | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' \
  | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 || true)

echo "S_SKILLS_VERSION: ${_SS_LOCAL_VER}"
if [ -n "$_SS_REMOTE_VER" ] && [ "$_SS_REMOTE_VER" != "$_SS_LOCAL_VER" ]; then
  echo "UPGRADE_AVAILABLE: ${_SS_LOCAL_VER} → ${_SS_REMOTE_VER}"
fi
```

---

## 상태 판단 및 액션 결정

Preamble 결과를 바탕으로 아래 순서로 판단한다.

> **판단 우선순위:** Case 0 → Case 7 → Case 5 → Case 6 → Case 1 → Case 2 → Case 3 → Case 4

### Case 0: 업그레이드 가능 (`UPGRADE_AVAILABLE` 감지 시)

다른 케이스보다 **먼저** 처리. AskUserQuestion:

```
s-skills {old} → {new} 업데이트가 있습니다.
```

옵션:
- A) 지금 업그레이드 (권장) → Bash로 아래 명령 실행 후 사용자에게 재호출 안내
- B) 이 세션은 스킵 → 현재 버전으로 계속 진행

A 선택 시:

```bash
# 플러그인으로 설치한 경우
claude plugin update s-skills

# 또는 직접 clone한 repo에서 (해당 디렉터리로 이동 후)
git pull origin main
```

실행 완료 후: "업그레이드 완료. `/s-skills`를 다시 호출하면 새 버전으로 시작됩니다."

B 선택 시: 바로 Case 1 판단으로 이동.

---

### Case 7: 에이전트 팀 감지 (`AGENT_MODE=EXISTS`)

Case 0 직후 체크. `.claude/agents/` 또는 `.claude/skills/`에 파일이 있으면 감사 옵션을 제시한다.

AskUserQuestion:

```
이 프로젝트에 에이전트 생태계가 감지되었습니다. (Phase 0 감사)
- 에이전트: {AGENT_COUNT}개  {AGENT_LIST}
- 로컬 스킬: {LOCAL_SKILL_COUNT}개
```

옵션:
- A) 에이전트 리뷰 → `Skill("s-skills:sj-agent-review")` 호출 (7가지 설계 축 기준 심사, PASS/WARN/FAIL 판정)
- B) 에이전트 확장 → `Skill("s-skills:sj-agent-dev")` 호출 (새 에이전트/스킬 추가 설계)
- C) 무시하고 계속 → Case 5 판단으로 이동

---

### Case 5: sj-company 진행 중 (`SJ_STAGE` = `pm` | `design` | `dev`)

Case 0 다음으로 **먼저** 확인. sj-company 파이프라인이 중단된 상태이면 이 케이스를 처리한다.

AskUserQuestion:

```
SJ Company 파이프라인이 진행 중입니다.
현재 스테이지: {SJ_STAGE}
태스크: {SJ_TASK}
```

옵션:
- A) 이어서 진행 (추천) → `Skill("s-skills:sj-company")` 호출
- B) 새 태스크 시작 → stage.txt / task.txt 초기화 후 `Skill("s-skills:sj-company")` 호출
- C) 무시하고 다른 작업 → Case 1 판단으로 이동

B 선택 시:

```bash
echo "none" > docs/sj-company/.state/stage.txt
echo "" > docs/sj-company/.state/task.txt
```

---

### Case 6: pw-loop 진행 중 (`PW_STATUS=IN_PROGRESS`)

Case 5 다음에 확인. pw-loop 사이클이 진행 중(목표 미달)이면 처리.

AskUserQuestion:

```
pw-loop Cycle {PW_CYCLE} 진행 중입니다.
현재 통과율: {PW_RATE}% / 목표: {PW_THRESHOLD}%
```

옵션:
- A) 이어서 진행 (추천) → `Skill("s-skills:pw-loop")` 호출
- B) 무시하고 다른 작업 → Case 1 판단으로 이동

---

### Case 1: 문서 없음 (`HAS_DOCS=no`)

AskUserQuestion으로 확인:

```
지금 이 프로젝트에 docs/가 없습니다.
먼저 docs-organize를 실행해 문서와 건강 점수를 만드는 걸 추천합니다.
```

옵션:
- A) docs-organize 실행 (추천) → Skill 도구로 `s-skills:docs-organize` 호출
- B) test-scenario 바로 시작 → ⚠️ 경고: docs/ 없이 시작하면 일부 기능이 제한됩니다. 계속 진행합니다. Case 3으로 이동
- C) 현황만 보기 → 현재 상태 요약 출력 후 종료

### Case 2: 문서 있음, 테스트 미시작 (`HAS_DOCS=yes` AND `TS_STATUS=NOT_STARTED` AND `PW_STATUS=NOT_STARTED`)

AskUserQuestion:

```
docs/가 있습니다. (점수: {DOC_SCORE}/100)
테스트 방식을 선택하세요:
```

옵션:
- A) pw-loop 시작 (Playwright 자동화, 추천) → Skill 도구로 `s-skills:pw-loop` 호출
- B) test-scenario 시작 (Chrome 확장 수동) → Skill 도구로 `s-skills:test-scenario` 호출
- C) sj-company 투입 (개발 작업) → Skill 도구로 `s-skills:sj-company` 호출
- D) docs-organize 재실행 (문서 업데이트) → Skill 도구로 `s-skills:docs-organize` 호출

### Case 3: 시나리오 진행 중 (`TS_STATUS=GENERATED` 또는 `IN_PROGRESS`)

AskUserQuestion:

```
테스트 사이클 {TS_CYCLE} 진행 중. 현재 통과율: {TS_PASS_RATE}% / 목표: {TS_THRESHOLD}%
```

옵션:
- A) 결과 보고 (결과 블록 붙여넣기)
- B) 다음 사이클 시나리오 재생성
- C) 문서 업데이트 (docs-organize 재실행)
- D) 대시보드 보기
- E) 목표 통과율 변경

선택 후 Skill 호출 전 pending-mode 기록:

```bash
mkdir -p docs/test-scenarios/.state

# A 선택 시
echo "report" > docs/test-scenarios/.state/pending-mode.txt

# B 선택 시
echo "generate" > docs/test-scenarios/.state/pending-mode.txt

# D 선택 시
echo "dashboard" > docs/test-scenarios/.state/pending-mode.txt

# E 선택 시
echo "threshold" > docs/test-scenarios/.state/pending-mode.txt
```

이후:
- A/B/D/E → Skill 도구로 `s-skills:test-scenario` 호출
- C → Skill 도구로 `s-skills:docs-organize` 호출 (pending-mode 기록 불필요)

### Case 4: 완료 (`TS_STATUS=COMPLETE` 또는 `PW_STATUS=COMPLETE`)

```
테스트 완료.
- 문서 점수: {DOC_SCORE}/100
- 테스트 통과율: {TS_PASS_RATE}% (test-scenario, {TS_CYCLE}사이클)
- Playwright 통과율: {PW_RATE}% (pw-loop, {PW_CYCLE}사이클)
```

AskUserQuestion:

옵션:
- A) sj-company 투입 (개발 작업) → Skill 도구로 `s-skills:sj-company` 호출
- B) pw-loop 새 사이클 시작 → Skill 도구로 `s-skills:pw-loop` 호출
- C) test-scenario 새 사이클 시작 → pending-mode 기록 후 Skill 도구로 `s-skills:test-scenario` 호출
- D) docs-organize 재실행 (최신 상태 반영) → Skill 도구로 `s-skills:docs-organize` 호출
- E) 종료

C 선택 시 Skill 호출 전:

```bash
mkdir -p docs/test-scenarios/.state
echo "generate" > docs/test-scenarios/.state/pending-mode.txt
```

---

## 스킬 호출 방식

각 스킬은 Agent 도구가 아닌 **Skill 도구**로 호출한다.
하네스는 컨텍스트를 유지한 채 스킬 실행을 위임하고 결과를 받아 다음 판단에 활용한다.

```
Skill("s-skills:docs-organize")
Skill("s-skills:test-scenario")
```

### 서브스킬 완료 후 귀환 절차

Skill 호출이 완료되면 아래를 **순서대로** 실행한다:

1. pending-mode 정리:

```bash
rm -f docs/test-scenarios/.state/pending-mode.txt 2>/dev/null || true
```

2. 상태 재감지 — 위 "Preamble — 프로젝트 상태 감지" 섹션의 bash 블록을 **그대로 다시 실행**한다.

3. 최종 상태 요약을 아래 형식으로 출력한다.

4. 추가 작업이 필요한지 AskUserQuestion으로 확인한다:
   - A) 계속 진행 → Case 판단으로 돌아가 다음 액션 수행
   - B) 종료

---

## 최종 상태 요약 출력 형식

어떤 케이스든 액션 완료 후 출력:

```
S-skills 상태 요약
──────────────────
문서        : {HAS_DOCS}  (점수: {DOC_SCORE}/100)
test-scenario: {TS_STATUS} (사이클: {TS_CYCLE}, 통과율: {TS_PASS_RATE}%)
pw-loop     : {PW_STATUS} (사이클: {PW_CYCLE}, 통과율: {PW_RATE}%)
SJ Company  : {SJ_STAGE}  (태스크: {SJ_TASK})
에이전트    : {AGENT_MODE} (에이전트 {AGENT_COUNT}개 / 로컬 스킬 {LOCAL_SKILL_COUNT}개)
다음 추천   : {다음 액션 한 줄}
```
