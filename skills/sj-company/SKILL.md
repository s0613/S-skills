---
name: sj-company
version: 1.0.0
description: |
  SJ Company 하네스. 프로젝트 상태를 감지하고 PM/Dev/Design/QA 역할로 라우팅한다.
  인자 없이 호출하면 상태 기반 라우팅, 메시지와 함께 호출하면 의도 기반 라우팅.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
triggers:
  - /ai
---

# SJ Company Harness

## Base Guidelines (Karpathy)

모든 역할(PM/Design/Dev/QA)에 적용되는 행동 원칙이다.

**1. Think Before Coding** — 가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러낸다.
- 불확실하면 명시적으로 가정을 밝히고 물어본다.
- 해석이 여러 개면 골라서 제시한다. 조용히 하나만 선택하지 않는다.
- 더 단순한 방법이 있으면 말한다. 필요하면 반론한다.

**2. Simplicity First** — 문제를 푸는 최소한의 코드. 추측성 코드 없음.
- 요청된 것 이상의 기능 추가 금지.
- 단일 사용 코드에 추상화 금지.
- 200줄로 쓸 수 있는 걸 50줄로 쓸 수 있으면 다시 쓴다.

**3. Surgical Changes** — 꼭 필요한 것만 건드린다. 자기가 만든 쓰레기만 치운다.
- 인접 코드, 주석, 포맷을 "개선"하지 않는다.
- 고장나지 않은 것은 리팩토링하지 않는다.
- 변경된 모든 줄은 사용자 요청으로 직접 추적 가능해야 한다.

**4. Goal-Driven Execution** — 성공 기준을 정의하고 검증될 때까지 루프한다.
- 태스크를 검증 가능한 목표로 변환한다.
- 멀티스텝 태스크는 간략한 플랜을 먼저 제시한다.

---

## Preamble — 프로젝트 상태 감지

```bash
mkdir -p docs/sj-company/.state

_STAGE=$(cat docs/sj-company/.state/stage.txt 2>/dev/null | tr -d '[:space:]')
_TASK=$(cat docs/sj-company/.state/task.txt 2>/dev/null)
_HAS_PM=$([ -s "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")
_HAS_DESIGN=$([ -s "docs/sj-company/design-output.md" ] && echo "yes" || echo "no")
_HAS_DEV=$([ -s "docs/sj-company/dev-output.md" ] && echo "yes" || echo "no")
_HAS_QA=$([ -s "docs/sj-company/qa-output.md" ] && echo "yes" || echo "no")

echo "STAGE: ${_STAGE:-none}"
echo "TASK: ${_TASK:-없음}"
echo "PM: $_HAS_PM | DESIGN: $_HAS_DESIGN | DEV: $_HAS_DEV | QA: $_HAS_QA"
```

---

## 라우팅 결정

### Case A: 인자 없이 호출 (`/ai`) — 상태 기반

Preamble 결과를 바탕으로 판단:

| STAGE | 다음 액션 |
|-------|-----------|
| `none` 또는 비어있음 | 태스크 입력 받기 → PM 실행 |
| `pm` | AskUserQuestion: Design 또는 Dev 중 선택 |
| `design` | Dev 실행 |
| `dev` | QA 실행 |
| `done` | 완료 요약 출력 + 새 태스크 여부 확인 |

**STAGE=none 처리:**

AskUserQuestion으로 태스크를 입력받고 task.txt에 저장:

```bash
echo "{사용자 입력}" > docs/sj-company/.state/task.txt
echo "none" > docs/sj-company/.state/stage.txt
```

이후 `Skill("sj-company:pm")` 호출.

**STAGE=pm 처리:**

AskUserQuestion:
```
PM 분석이 완료됐습니다.
다음 단계를 선택하세요:
```
- A) Design 먼저 (UI/UX 작업 포함) → `Skill("sj-company:design")`
- B) Dev 바로 진행 (UI 작업 없음) → `Skill("sj-company:dev")`

**STAGE=design 처리:** `Skill("sj-company:dev")` 호출.

**STAGE=dev 처리:** `Skill("sj-company:qa")` 호출.

**STAGE=done 처리:**

```bash
cat docs/sj-company/pm-output.md 2>/dev/null | head -5
cat docs/sj-company/qa-output.md 2>/dev/null | grep "판정:"
```

완료 요약 출력. AskUserQuestion으로 새 태스크 여부 확인:
- A) 새 태스크 시작 → stage.txt 초기화 후 재시작
- B) 종료

---

### Case B: 인자와 함께 호출 (`/ai <메시지>`) — 의도 기반

메시지 내용을 분석해 적절한 역할로 라우팅:

**라우팅 규칙:**

| 의도 패턴 | 라우팅 |
|-----------|--------|
| 버그 수정, 에러 수정, fix | `Skill("sj-company:dev")` → `Skill("sj-company:qa")` |
| 디자인, UI, 화면, 레이아웃 | `Skill("sj-company:design")` |
| 기획, 요구사항, 스펙, 분석 | `Skill("sj-company:pm")` |
| 테스트, 검증, 확인 | `Skill("sj-company:qa")` |
| 기능 추가, 새 기능, 구현 | `Skill("sj-company:pm")` 완료 후 AskUserQuestion으로 Design/Dev 선택 → `Skill("sj-company:qa")` |

메시지를 task.txt에 저장 후 라우팅:

```bash
echo "{메시지}" > docs/sj-company/.state/task.txt
```

> **참고:** "기능 추가" 라우팅에서 PM 완료 후 STAGE=pm과 동일한 AskUserQuestion을 제시한다 (Design 먼저 vs Dev 바로 진행).

---

## 스킬 호출 완료 후 귀환

각 서브스킬 완료 후:
1. 상태 재감지 (Preamble 재실행)
2. 완료된 결과물 요약 출력
3. 다음 단계 제안
