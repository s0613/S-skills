# Architecture

## Overview
S-skills는 Claude Code의 스킬/플러그인 시스템 위에서 동작하는 오케스트레이션 레이어다.
각 스킬은 `SKILL.md` 마크다운 파일로 정의되고, harness가 프로젝트 상태를 읽어 어떤 스킬을 실행할지 라우팅한다.
외부 의존성 없이 파일시스템 상태(`docs/`, `.state/`)만으로 사이클을 관리한다.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Claude Code Skill System |
| Skill definition | Markdown (SKILL.md) |
| State storage | 파일시스템 (txt, jsonl, md) |
| Orchestration | harness SKILL.md + Bash preamble |
| Package | Node.js (package.json, 진입점 없음) |
| Distribution | Claude Code Plugin (`claude plugin install`) |

## Key Decisions
- **마크다운 기반 스킬 정의**: SKILL.md 하나가 스킬의 전부 — 코드 없이 자연어 지시사항으로 동작
- **파일시스템 상태 관리**: DB 없이 `.state/*.txt`, `history.jsonl`로 사이클 상태 유지 — 설치 후 즉시 사용 가능
- **harness 라우팅 우선**: 사용자가 상태를 기억할 필요 없이 하네스가 현재 위치를 판단
- **서브스킬 분리**: pm/design/dev/qa를 독립 스킬로 분리해 역할별 독립 호출 가능

## Data Flow
```
사용자: /s-skills
  → harness preamble (bash) — docs/, .state/ 읽기
  → 상태 판단 (HAS_DOCS, TS_STATUS, SJ_STAGE)
  → AskUserQuestion — 다음 액션 선택
  → Skill 호출 (docs-organize / test-scenario / sj-company)
    → 각 스킬이 docs/ 하위에 파일 쓰기
    → .state/ 업데이트
  → harness 귀환 — 상태 재감지 → 요약 출력
```

## Constraints
- Claude Code 환경에서만 동작 (다른 AI 도구 미지원)
- 스킬 파일 크기: 각 SKILL.md는 컨텍스트 창 내에서 처리 가능한 크기여야 함
- 파일시스템 접근: 프로젝트 루트 기준 상대 경로로 상태 저장
