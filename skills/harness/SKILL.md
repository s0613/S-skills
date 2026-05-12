---
name: s-skills
version: 2.1.0
description: |
  S-skills 하네스. 프로젝트 상태를 감지하고 docs-organize, test-scenario 스킬을
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

프로젝트 상태를 읽고 docs-organize → test-scenario 흐름을 오케스트레이션한다.
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

echo "HAS_DOCS: $_HAS_DOCS"
echo "DOC_SCORE: $_DOC_SCORE"
echo "HAS_SCENARIOS: $_HAS_SCENARIOS"
echo "TS_CYCLE: $_TS_CYCLE"
echo "TS_PASS_RATE: $_TS_PASS_RATE%"
echo "TS_STATUS: $_TS_STATUS"
echo "SCENARIO_COUNT: ${_SCENARIO_COUNT:-0}"
```

---

## 상태 판단 및 액션 결정

Preamble 결과를 바탕으로 아래 순서로 판단한다.

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

### Case 2: 문서 있음, 시나리오 미시작 (`HAS_DOCS=yes`, `TS_STATUS=NOT_STARTED`)

AskUserQuestion:

```
docs/가 있습니다. (점수: {DOC_SCORE}/100)
다음 단계로 test-scenario를 시작해 기능 검증을 할 수 있습니다.
```

옵션:
- A) test-scenario generate 시작 (추천) → Skill 도구로 `s-skills:test-scenario` 호출
- B) docs-organize 재실행 (문서 업데이트) → Skill 도구로 `s-skills:docs-organize` 호출
- C) 현황만 보기 → 현재 상태 요약 출력 후 종료

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

### Case 4: 완료 (`TS_STATUS=COMPLETE`)

```
모든 단계 완료.
- 문서 점수: {DOC_SCORE}/100
- 테스트 통과율: {TS_PASS_RATE}% ({TS_CYCLE}사이클)
```

AskUserQuestion:

옵션:
- A) docs-organize 재실행 (최신 상태 반영) → Skill 도구로 `s-skills:docs-organize` 호출
- B) test-scenario 새 사이클 시작 → pending-mode 기록 후 Skill 도구로 `s-skills:test-scenario` 호출
- C) 종료

B 선택 시 Skill 호출 전:

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
문서      : {HAS_DOCS}  (점수: {DOC_SCORE}/100)
시나리오  : {TS_STATUS} (사이클: {TS_CYCLE}, 통과율: {TS_PASS_RATE}%)
다음 추천 : {다음 액션 한 줄}
```
