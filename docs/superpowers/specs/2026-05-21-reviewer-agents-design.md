# Reviewer Agents Design — 2026-05-21

## 개요

sj-company 워크플로우에 통합되는 3개의 무조건 비판적 리뷰어 에이전트를 만든다.
`/sj-company 리뷰해줘` 입력 시 변경 컨텍스트를 감지해 해당 리뷰어를 병렬 디스패치한다.

## 구조

```
agents/
  sj-reviewer-code.md      ← 신규
  sj-reviewer-doc.md       ← 신규
  sj-reviewer-design.md    ← 신규

skills/sj-company/
  SKILL.md                 ← "리뷰" 트리거 로직 추가
```

## 리뷰어 정의

| 에이전트 | 타겟 | 비판 기준 |
|----------|------|-----------|
| sj-reviewer-code | 구현 코드, git diff | 버그·성능·보안·컨벤션·테스트 누락 |
| sj-reviewer-doc | PRD·설계문서·SI 산출물·요구사항 | 모호함·누락·내부 모순·실현 불가 |
| sj-reviewer-design | UI 명세·컴포넌트·비주얼 방향 | UX 흐름·접근성·비주얼 일관성·반응형 |

## 공통 자세

- **무조건 비판적**: 문제가 없어 보여도 찾아낸다
- 칭찬 먼저 금지 — 문제부터
- "괜찮다"는 없음. 항상 개선점 제시

## 출력 형식

```markdown
## [Code/Doc/Design] Review — YYYY-MM-DD

### 판정: REQUEST_CHANGES | APPROVED_WITH_NOTES | NEEDS_REWORK

### 🔴 Critical (즉시 수정 — 이대로 진행 불가)
### 🟠 High (반드시 수정)
### 🟡 Medium (강력 권고)
### 개선 방향 요약
```

저장 위치: `docs/sj-company/.state/review-{code,doc,design}.md`

## sj-company 통합

리뷰 키워드(`리뷰`, `review`, `검토`) 감지 시:
- git diff 있음 → sj-reviewer-code
- docs/ 변경 있음 → sj-reviewer-doc
- design-context.md 변경 있음 → sj-reviewer-design
- 사용자 명시 시 해당 리뷰어만
