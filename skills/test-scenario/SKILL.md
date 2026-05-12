---
name: test-scenario
version: 2.1.0
description: |
  기능별 테스트 시나리오 프롬프트를 생성하고, Claude Chrome 확장으로 실행한
  결과를 받아 기대 결과와 비교한다. 사이클 기반으로 반복하며 목표 통과율
  달성 시 완료. gstack 스타일 하네스.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
triggers:
  - /test-scenario
  - 테스트 시나리오
  - 시나리오 만들기
  - 시나리오 하네스
---

# test-scenario harness

기능 테스트 시나리오 생성 → Chrome 확장 실행 → 결과 평가 → 개선 반복.
사이클마다 통과율을 추적하고 목표 달성 시 종료.

---

## Preamble

스킬 시작 시 반드시 실행:

```bash
_TS_DIR="docs/test-scenarios"
_STATE_DIR="$_TS_DIR/.state"
mkdir -p "$_STATE_DIR"

# 현재 사이클
_CYCLE=$(cat "$_STATE_DIR/cycle.txt" 2>/dev/null || echo "0")
_THRESHOLD=$(cat "$_STATE_DIR/threshold.txt" 2>/dev/null || echo "80")
_SESSION_ID="$$-$(date +%s)"
_DATE=$(date +%Y-%m-%d)

# 시나리오 수
_SCENARIO_COUNT=$(ls "$_TS_DIR/scenarios/"*.md 2>/dev/null | wc -l | tr -d ' ')

# 하네스 모드 전달 (pending-mode.txt → 명시적 라우팅)
_PENDING_MODE=$(cat "$_STATE_DIR/pending-mode.txt" 2>/dev/null | tr -d ' ')
[ -n "$_PENDING_MODE" ] && rm -f "$_STATE_DIR/pending-mode.txt" && echo "PENDING_MODE: $_PENDING_MODE" || echo "PENDING_MODE: none"

# 현재 사이클 보고서만 카운트 — 누적 아님 (grep -rl: 파일 단위)
if [ "$_CYCLE" -gt 0 ]; then
  _LAST_PASS=$(grep -rl "판정: PASS" "$_TS_DIR/reports/" 2>/dev/null | grep -- "-c${_CYCLE}-" | wc -l | tr -d ' ')
  _LAST_FAIL=$(grep -rl "판정: FAIL" "$_TS_DIR/reports/" 2>/dev/null | grep -- "-c${_CYCLE}-" | wc -l | tr -d ' ')
  _LAST_PARTIAL=$(grep -rl "판정: PARTIAL" "$_TS_DIR/reports/" 2>/dev/null | grep -- "-c${_CYCLE}-" | wc -l | tr -d ' ')
else
  _LAST_PASS=0; _LAST_FAIL=0; _LAST_PARTIAL=0
fi
_TOTAL_REPORTS=$(( _LAST_PASS + _LAST_FAIL + _LAST_PARTIAL ))

echo "CYCLE: $_CYCLE"
echo "THRESHOLD: $_THRESHOLD%"
echo "SCENARIOS: $_SCENARIO_COUNT"
echo "REPORTS: $_TOTAL_REPORTS (PASS=$_LAST_PASS FAIL=$_LAST_FAIL PARTIAL=$_LAST_PARTIAL)"

# 통과율 계산
if [ "$_TOTAL_REPORTS" -gt 0 ]; then
  _PASS_RATE=$(( (_LAST_PASS * 100) / _TOTAL_REPORTS ))
  echo "PASS_RATE: ${_PASS_RATE}%"
else
  _PASS_RATE=0
  echo "PASS_RATE: n/a"
fi

# 완료 체크
if [ "$_PASS_RATE" -ge "$_THRESHOLD" ] && [ "$_TOTAL_REPORTS" -gt 0 ]; then
  echo "STATUS: COMPLETE"
else
  echo "STATUS: IN_PROGRESS"
fi
```

Preamble 출력을 읽고 현재 상태를 파악한 뒤 아래 모드 감지로 진입.

---

## 모드 감지

Preamble 출력과 유저 메시지를 보고 자동 판단:

| 조건 | 모드 |
|------|------|
| `PENDING_MODE` 값 있음 | **PENDING_MODE 값으로 직접 진입** — 하네스 라우팅 (추론 없음) |
| `SCENARIOS: 0` | **generate** — 시나리오 없음, 생성 시작 |
| 유저 메시지에 `[결과]...[/결과]` 포함 | **report** — 결과 처리 |
| `STATUS: COMPLETE` | **complete** — 목표 달성 보고 |
| 그 외 | AskUserQuestion으로 선택 |

```
A) 시나리오 생성 / 업데이트
B) 결과 보고서 저장 (Chrome 확장 실행 결과 붙여넣기)
C) 현황 대시보드
D) 목표 통과율 변경 (현재: {THRESHOLD}%)
```

`PENDING_MODE: threshold`이면 D(목표 통과율 변경) 모드로 직접 진입.

---

## Generate 모드

### Step 1: 다음 사이클 번호 증가

```bash
_NEXT_CYCLE=$(( _CYCLE + 1 ))
echo "$_NEXT_CYCLE" > docs/test-scenarios/.state/cycle.txt
echo "Cycle $_NEXT_CYCLE 시작"
```

### Step 2: 기능 목록 수집

우선순위 순서로 읽기:

1. `docs/test-scenarios/.state/features.txt` — 이전에 확정된 기능 목록
2. `docs/prd.md` Features 섹션
3. `docs/STATUS.md` Features 테이블
4. 코드 직접 분석 (라우트, API, 컴포넌트)

기능 목록을 유저에게 보여주고 확인:

```
Cycle N — 테스트 대상 기능 목록

신규 (시나리오 없음):
  1. 회원가입
  2. 로그인

재테스트 (이전 FAIL/PARTIAL):
  3. 비밀번호 찾기  [FAIL — Cycle N-1]

안정 (연속 PASS, 이번 사이클 스킵 가능):
  4. 메인 페이지 진입  [PASS × 2]

제외할 항목이 있으면 말씀해주세요.
```

확인 후 `docs/test-scenarios/.state/features.txt`에 확정 목록 저장.

### Step 3: 기능별 시나리오 프롬프트 생성

신규 + 재테스트 대상만 생성 또는 업데이트. 안정 기능은 스킵.

파일: `docs/test-scenarios/scenarios/YYYY-MM-DD-{feature-slug}.md`

**프롬프트 포맷:**

```markdown
# 테스트 시나리오: {기능명}

**생성일:** YYYY-MM-DD  
**버전:** 1.0  
**Cycle:** N  
**상태:** 미실행

---

## 목적
{이 테스트가 검증하는 것 — 1-2문장}

## 사전 조건
- URL: {테스트 시작 URL}
- 인증 상태: {필요 여부}
- 필요 데이터: {준비해야 할 데이터}

---

## 테스트 단계

### Step 1: {동작 설명}
**실행:** {구체적인 행동}
**입력값:** {테스트 데이터}
**기대 결과:** {나와야 하는 결과}
**실패 조건:** {이것이 나오면 실패}

### Step 2: ...

---

## 엣지 케이스

| 케이스 | 입력 | 기대 결과 |
|--------|------|-----------|
| 빈 입력 | "" | 에러 메시지 표시 |
| 잘못된 형식 | "abc" | 형식 오류 안내 |

---

## 종합 판정 기준

**PASS:** {모든 단계 통과 + 엣지 케이스 N개 이상}  
**PARTIAL:** {핵심 기능 동작, 일부 엣지 케이스 실패}  
**FAIL:** {핵심 단계 중 하나라도 실패}

---

## 결과 기록 양식

> Chrome 확장 실행 후 아래를 채워서 Claude Code 터미널에 `/test-scenario` 입력 후 붙여넣으세요.

\`\`\`
[결과]
기능: {기능명}
실행일: YYYY-MM-DD
cycle: N
판정: PASS / FAIL / PARTIAL
통과 단계: X / {전체 단계 수}
실제 결과:
- Step 1: (pass/fail) — 관찰 내용
- Step 2: (pass/fail) — 관찰 내용
엣지 케이스:
- {케이스명}: (pass/fail) — 관찰 내용
메모: {추가 관찰사항}
[/결과]
\`\`\`
```

### Step 4: 인덱스 업데이트

`docs/test-scenarios/README.md` 갱신:

```markdown
# 테스트 시나리오 현황

**현재 Cycle:** N  
**목표 통과율:** {THRESHOLD}%  
**마지막 업데이트:** YYYY-MM-DD

## 전체 현황

| 기능 | 최근 판정 | Cycle | 추이 | 시나리오 |
|------|-----------|-------|------|----------|
| 회원가입 | 미실행 | — | — | [링크] |
| 로그인 | FAIL | 1 | ❌ | [링크] |
| 대시보드 | PASS | 2 | ✅ | [링크] |

## 통과율 추이

| Cycle | PASS | FAIL | PARTIAL | 통과율 |
|-------|------|------|---------|--------|
| 1 | 2 | 3 | 1 | 33% |
| 2 | 4 | 2 | 0 | 67% |
```

### Step 5: 완료 보고

```
Cycle N 시나리오 생성 완료.

📋 생성/업데이트: N개
   신규: {기능 목록}
   재테스트: {기능 목록}
   스킵 (안정): {기능 목록}

📁 docs/test-scenarios/scenarios/

다음 단계:
1. scenarios/*.md 파일을 열어 프롬프트 확인
2. Claude Chrome 확장에 각 프롬프트 붙여넣기
3. 결과 받으면 Claude Code 터미널에 `/test-scenario` 입력 후 [결과]...[/결과] 붙여넣기
```

---

## Report 모드

유저가 `[결과]...[/결과]` 텍스트를 붙여넣으면 진입.

### Step 1: 결과 블록 파싱

메시지에서 모든 `[결과]...[/결과]` 블록 추출. 여러 기능 결과가 한 번에 오면 모두 처리.

각 블록에서 추출:
- 기능명, 실행일, cycle, 판정, 통과 단계, 실제 결과 (단계별), 엣지 케이스 결과, 메모

### Step 2: 병렬 평가 (서브에이전트)

결과 블록이 2개 이상이면 Agent 툴로 병렬 서브에이전트 dispatch.
각 서브에이전트에게:

```
기능 {기능명}의 테스트 결과를 평가한다.

시나리오 파일: docs/test-scenarios/scenarios/{feature-slug}.md
실제 결과:
{결과 블록 내용}

할 일:
1. 시나리오 파일에서 각 단계의 기대 결과를 읽는다
2. 실제 결과와 기대 결과를 단계별로 비교한다
3. 실패한 단계에 대해 코드 기반 원인을 추론한다
4. 아래 JSON 형식으로 결과를 출력한다:

{
  "feature": "기능명",
  "verdict": "PASS|FAIL|PARTIAL",
  "steps": [
    {"step": 1, "expected": "기대값", "actual": "실제값", "result": "pass|fail"}
  ],
  "failed_steps": ["Step N: 원인 추론"],
  "root_cause": "실패 원인 한 줄 요약 (FAIL/PARTIAL만)",
  "fix_suggestion": "구체적인 수정 방향 (코드 위치 포함)",
  "priority": "P1|P2|P3"
}
```

결과 블록이 1개면 서브에이전트 없이 직접 처리.

### Step 3: 보고서 저장

서브에이전트 결과를 취합해 `docs/test-scenarios/reports/YYYY-MM-DD-{feature-slug}-c{N}-report.md` 저장:

```markdown
# 테스트 결과 보고서: {기능명}

**실행일:** YYYY-MM-DD  
**Cycle:** N  
**판정:** PASS / FAIL / PARTIAL

---

## 단계별 결과

| 단계 | 기대 결과 | 실제 결과 | 판정 |
|------|-----------|-----------|------|
| Step 1 | {기대} | {실제} | ✅/❌/⚠️ |

## 엣지 케이스

| 케이스 | 기대 | 실제 | 판정 |
|--------|------|------|------|

## 실패 분석 (FAIL/PARTIAL만)

**실패 원인:** {root_cause}  
**추정 코드 위치:** {fix_suggestion}  
**우선순위:** P1/P2/P3

## 메모
{유저 메모}
```

### Step 4: 사이클 통과율 업데이트

이번 사이클의 모든 결과를 집계:

```bash
_C_PASS=$(grep -l "판정: PASS" docs/test-scenarios/reports/*-c${_CYCLE}-* 2>/dev/null | wc -l | tr -d ' ')
_C_FAIL=$(grep -l "판정: FAIL" docs/test-scenarios/reports/*-c${_CYCLE}-* 2>/dev/null | wc -l | tr -d ' ')
_C_PARTIAL=$(grep -l "판정: PARTIAL" docs/test-scenarios/reports/*-c${_CYCLE}-* 2>/dev/null | wc -l | tr -d ' ')
_C_TOTAL=$(( _C_PASS + _C_FAIL + _C_PARTIAL ))
[ "$_C_TOTAL" -gt 0 ] && _C_RATE=$(( (_C_PASS * 100) / _C_TOTAL )) || _C_RATE=0
echo "Cycle $_CYCLE: ${_C_RATE}% (${_C_PASS}/${_C_TOTAL})"
```

`docs/test-scenarios/.state/history.jsonl`에 추가:
```json
{"cycle": N, "date": "YYYY-MM-DD", "pass": N, "fail": N, "partial": N, "rate": N}
```

### Step 5: improvement.md 업데이트

`docs/test-scenarios/improvement/improvement.md`를 생성하거나 업데이트:

```markdown
# 개선 방향

**업데이트:** YYYY-MM-DD (Cycle N)

## 미결 항목

| 기능 | 실패 단계 | 원인 | 우선순위 | 발견 Cycle |
|------|-----------|------|----------|------------|
| {기능} | {단계} | {원인} | P1 | C1 |

## P1 개선 제안

### {기능명}
**증상:** {무엇이 잘못됨}  
**원인:** {추정 원인}  
**수정 방향:** {구체적인 코드 위치 또는 로직}  
**검증:** 수정 후 Cycle {N+1}에서 이 시나리오 재실행

## 해결된 항목

| 기능 | 해결 Cycle | 내용 |
|------|-----------|------|
```

### Step 6: README 인덱스 업데이트

최신 결과를 README 표에 반영.

### Step 7: 완료 게이트 체크

```bash
if [ "$_C_RATE" -ge "$_THRESHOLD" ]; then
  echo "GATE: PASS — 목표 통과율 달성"
else
  echo "GATE: IN_PROGRESS — ${_C_RATE}% / 목표 ${_THRESHOLD}%"
fi
```

### Step 8: 결과 보고

```
Cycle N 결과 저장 완료.

📊 이번 사이클 결과:
   PASS:    N개
   PARTIAL: N개
   FAIL:    N개
   통과율:  N% (목표: THRESHOLD%)

📈 추이: Cycle 1→2→3 = 33%→67%→N%

❌ P1 수정 필요:
   - {기능}: {실패 단계} — {원인 한 줄}

📁 보고서: docs/test-scenarios/reports/
📋 개선 방향: docs/test-scenarios/improvement/

{GATE: PASS이면}
🎉 목표 통과율 달성! /test-scenario 완료.

{GATE: IN_PROGRESS이면}
다음 단계: P1 항목 수정 후 Cycle {N+1} 시작 → /test-scenario
```

---

## Complete 모드

`STATUS: COMPLETE`이면:

```
✅ 테스트 하네스 완료

목표 통과율 {THRESHOLD}% 달성.

최종 결과:
  총 기능: N개
  PASS: N개 (N%)
  PARTIAL: N개
  FAIL: N개

사이클 이력:
  Cycle 1: 33%
  Cycle 2: 67%
  Cycle 3: 85% ← 달성

완전한 기능 목록:
  ✅ {기능 1}
  ✅ {기능 2}
  ⚠️ {기능 3} (PARTIAL — 허용됨)

보고서: docs/test-scenarios/reports/
```

목표를 높이고 계속하려면:

```
/test-scenario
→ D) 목표 통과율 변경
```

---

## 대시보드 모드

현재까지 누적된 모든 결과를 읽어 요약 출력:

```bash
cat docs/test-scenarios/.state/history.jsonl 2>/dev/null
ls docs/test-scenarios/reports/ 2>/dev/null
cat docs/test-scenarios/improvement/improvement.md 2>/dev/null
```

출력 포맷:

```
테스트 하네스 현황 (YYYY-MM-DD)
목표 통과율: THRESHOLD%  |  현재: N%  |  Cycle: N

기능별 최근 판정:
기능           | C1    | C2    | C3    | 최근
-------------|-------|-------|-------|------
회원가입       | FAIL  | PASS  | PASS  | ✅ PASS
로그인         | FAIL  | FAIL  | PASS  | ✅ PASS
비밀번호 찾기  | —     | FAIL  | FAIL  | ❌ FAIL

미결 P1: N개  |  해결: N개
```

---

## 목표 통과율 변경 모드

```bash
echo "{새 값}" > docs/test-scenarios/.state/threshold.txt
```

확인:
```
목표 통과율을 {이전}% → {새 값}%로 변경했습니다.
```

---

## 상태 파일 구조

```
docs/test-scenarios/
├── .state/
│   ├── cycle.txt          ← 현재 사이클 번호
│   ├── threshold.txt      ← 목표 통과율 (기본 80)
│   ├── features.txt       ← 확정된 테스트 기능 목록
│   └── history.jsonl      ← 사이클별 통과율 이력
├── README.md              ← 전체 현황 인덱스 + 추이 테이블
├── scenarios/
│   └── YYYY-MM-DD-{feature}.md
├── reports/
│   └── YYYY-MM-DD-{feature}-c{N}-report.md
└── improvement/
    └── improvement.md
```
