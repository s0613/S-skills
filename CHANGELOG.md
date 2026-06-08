# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [3.1.0] - 2026-06-08

### Added
- **sj-outsource** (`/outsource`, `/외주`, `/handoff`) — 막혔을 때 전문가 위임 스킬. 프로젝트 개요·막힌 지점·대화 맥락을 PII 마스킹해 로컬 `.md` 리포트로 정리하고, 사용자의 기본 메일 앱을 열어 초안까지 자동 작성. **전송은 사용자가 직접** (자동 발송 없음).
- README 상단에 `/outsource` 외주 안내 한 줄 추가.
- `LICENSE` 파일 추가 (MIT) — 공개 배포에 필요한 라이선스 명시.

### Changed
- harness 자가 업데이트 안내를 하드코딩 경로 대신 `claude plugin update s-skills` / `git pull origin main`로 일반화 — 다른 사용자 환경에서도 동작.
- 버전 단일화: `package.json`·`skills/VERSION`·`marketplace.json`·README 배지를 모두 `3.1.0`으로 정렬.

## [3.0.0] - 2026-06-08

### Added
- **gstack 영감 5개 스킬** 추가 + 기존 3개 스킬 강화.
- **sj-design** 레퍼런스 DNA 기반 디자인 생성 + 거부 프로토콜 — 브랜드 DESIGN.md에서 정확한 hex·font·spacing 추출 후 커밋 선언, "싫다/별로다" 거부 시 반대 방향 강제 재설계.
- **sj-seo** (`/seo`) — Google Search Console + Naver Search Advisor 색인 자동화.
- **sj-marketing** (`/marketing`) — SNS·블로그 채널별 마케팅 캠페인 + sj-company 라우팅 연동.
- **sj-automation** / **sj-ui-auto** — PC 자동화 및 화면 UI 조작 자동화 전문 스킬.
- **obsidian-writer** (`/obsidian`) — Obsidian 문서 작성 전문가 스킬.

### Changed
- sj-company 라우팅에 secretary·test-scenario·docs-organize·자동화 스킬 자동 감지(Step 0-*) 통합.
- CLAUDE.md 스킬 버전 및 아키텍처 원칙(RUN_ID·Judge 독립성·archive-only·PII 마스킹) 업데이트.

### Fixed
- 에이전트 리뷰 지적 사항 10개 수정 (CRITICAL 3 + HIGH 4 + MEDIUM 3).

## [2.9.0] - 2026-06-01

### Added
- **sj-agent-dev** / **sj-agent-review** — 비즈니스 에이전트 설계·리뷰 전문 스킬 (설계 축 7→10 확장: Memory·Evaluation·Graph Topology).
- **sj-reviewer-code/design/doc** — 무조건 비판적 병렬 리뷰어 에이전트 3종.
- harness Phase 0 에이전트 생태계 감사 로직.
- sj-tech-lead 팀 채널 기반 직접 조율 + 에이전트 간 데이터 전달 프로토콜.

### Changed
- **BREAKING**: 7개 dev 에이전트 입력·출력 인터페이스 v3 정합화 (`.state/` 기반 파이프라인).
- **BREAKING**: sj-pm·sj-qa·sj-tech-lead·sj-design v3 정합 — `.state/pm-brief.md`·`qa-verdict.md` 출력 표준화, Judge 독립성 보장.
- 다중 프로젝트 혼동 방지 — 에이전트 시작 시 프로젝트 신원 명시.

---

이전 버전(2.8.0 이하)의 상세 이력은 [git 커밋 히스토리](https://github.com/s0613/S-skills/commits/main)를 참고하세요.

[3.1.0]: https://github.com/s0613/S-skills/releases/tag/v3.1.0
[3.0.0]: https://github.com/s0613/S-skills/compare/v2.9.0...v3.1.0
[2.9.0]: https://github.com/s0613/S-skills/compare/v2.4.4...v2.9.0
