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

## Preamble — 프로젝트 상태 감지

```bash
mkdir -p docs/ai-company/.state

_STAGE=$(cat docs/ai-company/.state/stage.txt 2>/dev/null | tr -d '[:space:]')
_TASK=$(cat docs/ai-company/.state/task.txt 2>/dev/null)
_HAS_PM=$([ -f "docs/ai-company/pm-output.md" ] && echo "yes" || echo "no")
_HAS_DESIGN=$([ -f "docs/ai-company/design-output.md" ] && echo "yes" || echo "no")
_HAS_DEV=$([ -f "docs/ai-company/dev-output.md" ] && echo "yes" || echo "no")
_HAS_QA=$([ -f "docs/ai-company/qa-output.md" ] && echo "yes" || echo "no")

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
echo "{사용자 입력}" > docs/ai-company/.state/task.txt
echo "none" > docs/ai-company/.state/stage.txt
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
cat docs/ai-company/pm-output.md 2>/dev/null | head -5
cat docs/ai-company/qa-output.md 2>/dev/null | grep "판정:"
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
| 기능 추가, 새 기능, 구현 | `Skill("sj-company:pm")` → Design/Dev 판단 → `Skill("sj-company:qa")` |

메시지를 task.txt에 저장 후 라우팅:

```bash
echo "{메시지}" > docs/ai-company/.state/task.txt
```

---

## 스킬 호출 완료 후 귀환

각 서브스킬 완료 후:
1. 상태 재감지 (Preamble 재실행)
2. 완료된 결과물 요약 출력
3. 다음 단계 제안
