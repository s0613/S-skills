---
name: s-skills
version: 2.0.0
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
# 문서 상태
_HAS_DOCS="no"
_DOC_SCORE="n/a"
if [ -f "docs/STATUS.md" ]; then
  _HAS_DOCS="yes"
  _DOC_SCORE=$(grep -m1 "^\*\*Score:" docs/STATUS.md 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
fi

# 테스트 시나리오 상태
_HAS_SCENARIOS="no"
_TS_CYCLE="0"
_TS_PASS_RATE="0"
_TS_THRESHOLD="80"
_TS_STATUS="NOT_STARTED"
if [ -d "docs/test-scenarios" ]; then
  _HAS_SCENARIOS="yes"
  _TS_CYCLE=$(cat "docs/test-scenarios/.state/cycle.txt" 2>/dev/null || echo "0")
  _TS_THRESHOLD=$(cat "docs/test-scenarios/.state/threshold.txt" 2>/dev/null || echo "80")
  # 현재 사이클 보고서만 카운트 — 누적 아님 (카파시: 측정 대상을 명확히)
  if [ "$_TS_CYCLE" -gt 0 ]; then
    _TOTAL=$(ls "docs/test-scenarios/reports/"*"-c${_TS_CYCLE}-"*.md 2>/dev/null | wc -l | tr -d ' ')
    _PASS=$(grep -rl "판정: PASS" "docs/test-scenarios/reports/" 2>/dev/null | grep -- "-c${_TS_CYCLE}-" | wc -l | tr -d ' ')
  else
    _TOTAL=0
    _PASS=0
  fi
  if [ "$_TOTAL" -gt 0 ]; then
    _TS_PASS_RATE=$(( (_PASS * 100) / _TOTAL ))
  fi
  if [ "$_TS_PASS_RATE" -ge "$_TS_THRESHOLD" ] && [ "$_TOTAL" -gt 0 ]; then
    _TS_STATUS="COMPLETE"
  elif [ "$_TOTAL" -gt 0 ]; then
    _TS_STATUS="IN_PROGRESS"
  else
    _TS_STATUS="GENERATED"
  fi
fi

echo "HAS_DOCS: $_HAS_DOCS"
echo "DOC_SCORE: $_DOC_SCORE"
echo "HAS_SCENARIOS: $_HAS_SCENARIOS"
echo "TS_CYCLE: $_TS_CYCLE"
echo "TS_PASS_RATE: $_TS_PASS_RATE%"
echo "TS_STATUS: $_TS_STATUS"
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
- A) docs-organize 실행 (추천) → Skill 도구로 docs-organize 호출
- B) test-scenario 바로 시작 → Case 3으로 이동
- C) 현황만 보기 → 현재 상태 요약 출력 후 종료

### Case 2: 문서 있음, 시나리오 없음 (`HAS_DOCS=yes`, `HAS_SCENARIOS=no`)

AskUserQuestion:

```
docs/가 있습니다. (점수: {DOC_SCORE}/100)
다음 단계로 test-scenario를 시작해 기능 검증을 할 수 있습니다.
```

옵션:
- A) test-scenario generate 시작 (추천) → Skill 도구로 test-scenario 호출
- B) docs-organize 재실행 (문서 업데이트) → Skill 도구로 docs-organize 호출
- C) 현황만 보기 → 현재 상태 요약 출력 후 종료

### Case 3: 시나리오 진행 중 (`TS_STATUS=IN_PROGRESS` 또는 `GENERATED`)

AskUserQuestion:

```
테스트 사이클 {TS_CYCLE} 진행 중. 현재 통과율: {TS_PASS_RATE}% / 목표: {TS_THRESHOLD}%
```

옵션:
- A) 결과 보고 (결과 블록 붙여넣기) → pending-mode 기록 후 Skill("test-scenario") 호출
- B) 다음 사이클 시나리오 재생성 → pending-mode 기록 후 Skill("test-scenario") 호출
- C) 문서 업데이트 (docs-organize 재실행) → Skill("docs-organize") 호출
- D) 대시보드 보기 → pending-mode 기록 후 Skill("test-scenario") 호출
- E) 목표 통과율 변경 → pending-mode 기록 후 Skill("test-scenario") 호출

선택 후 Skill 호출 전 pending-mode 기록 (카파시: 모드는 명시적 상태로):

```bash
# A 선택 시
mkdir -p docs/test-scenarios/.state
echo "report" > docs/test-scenarios/.state/pending-mode.txt
# B 선택 시
mkdir -p docs/test-scenarios/.state
echo "generate" > docs/test-scenarios/.state/pending-mode.txt
# D 선택 시
mkdir -p docs/test-scenarios/.state
echo "dashboard" > docs/test-scenarios/.state/pending-mode.txt
# E 선택 시
mkdir -p docs/test-scenarios/.state
echo "threshold" > docs/test-scenarios/.state/pending-mode.txt
```

### Case 4: 완료 (`TS_STATUS=COMPLETE`)

```
모든 단계 완료.
- 문서 점수: {DOC_SCORE}/100
- 테스트 통과율: {TS_PASS_RATE}% ({TS_CYCLE}사이클)
```

AskUserQuestion:

옵션:
- A) docs-organize 재실행 (최신 상태 반영) → Skill("docs-organize") 호출
- B) test-scenario 새 사이클 시작 → pending-mode 기록 후 Skill("test-scenario") 호출
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
Skill("docs-organize")
Skill("test-scenario")
```

### 서브스킬 완료 후 귀환 절차 (카파시: 상태 기계는 명시적 전이를)

Skill 호출이 완료되면:

1. Preamble bash를 재실행해 최신 상태 읽기
2. 최종 상태 요약 출력 (아래 형식)
3. 종료

pending-mode.txt가 남아 있으면 삭제:

```bash
rm -f docs/test-scenarios/.state/pending-mode.txt 2>/dev/null || true
```

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
