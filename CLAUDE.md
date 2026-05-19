# s-skills

프로젝트 문서화·테스트·역할 기반 개발 워크플로우를 위한 스킬 플러그인.

## Skills

- **s-skills:harness** (`/s-skills`) — 프로젝트 상태 감지 후 적절한 스킬로 라우팅
- **s-skills:docs-organize** (`/docs-organize`) — 코드베이스 분석 및 docs/ 생성, 건강 점수 산출
- **s-skills:test-scenario** (`/test-scenario`) — 기능 검증 시나리오 생성 및 통과율 추적
- **s-skills:pw-loop** (`/pw-loop`) — 기능 단위 Playwright 반복 테스트 루프

### SJ Company (역할 기반 개발 워크플로우)

- **s-skills:sj-company** (`/sj-company`) — 상태/의도 기반 라우터. PM → Design → Tech Lead → QA
- **s-skills:sj-pm** (`/pm`) — 요구사항·리스크·우선순위 분석
- **s-skills:sj-design** (`/design`) — UI/UX 명세 작성 + Frontend 시각 리뷰
- **s-skills:sj-tech-lead** (`/tech-lead`) — 전문 개발 서브에이전트를 병렬 디스패치하고 통합·리뷰
- **s-skills:sj-qa** (`/qa`) — 기능 검증 및 PASS/FAIL/CONDITIONAL 판정
- **s-skills:sj-secretary** (`/secretary`) — 비서. 총괄(sj-company)이 사이클 완료 시 작성한 report.md를 읽어 프로젝트별 현황·다음 명령·KPI를 요약 보고 (비서는 요약·전달만, 보고서 작성은 총괄 담당)

### Sub-agents (Tech Lead가 디스패치)

- `sj-dev-frontend` — UI·컴포넌트·a11y·반응형 (sonnet)
- `sj-dev-backend` — API·도메인 로직 (sonnet)
- `sj-dev-database` — 스키마·마이그레이션·쿼리 (sonnet)
- `sj-dev-devops` — CI/CD·배포·인프라 (haiku)
- `sj-dev-security` — 보안 구현 + cross-cutting 리뷰 (opus)
- `sj-dev-data` — 데이터 파이프라인·ML (sonnet)
- `sj-dev-si` — SI 문서 전문 (작업 개요·제안서·요구사항·WBS·도메인 맵) (sonnet)

## 사용법

어느 프로젝트에서든 `/s-skills`로 시작하면 현재 상태를 감지해 안내한다.
새 태스크는 `/sj-company <태스크 설명>`으로 시작하면 PM부터 자동 라우팅된다.

## Docs Reference
- [PRD](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Status & Score](docs/STATUS.md)
- [ADR](docs/adr/)
- [Specs](docs/spec/) ← created on first spec request
