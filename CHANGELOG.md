# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [3.3.0] - 2026-06-11

### Added
- **sj-company** v3.6.0 — `Step 0-loop` 키워드 블록 추가: "루프 만들어", "반복 자동화", "주기적으로 실행" 등 루프 엔지니어링 요청을 감지하면 sj-loop로 자동 라우팅 (Step 0-* 블록 19개). Playwright 테스트 반복은 기존대로 Step 0-pw-loop가 우선 처리하도록 구분 규칙 명시.

### Changed
- **CLAUDE.md** — sj-company 설명을 v3.6.0 / 19개 Step 0-* 키워드 블록으로 동기화.

## [3.2.1] - 2026-06-11

독립 리뷰어 2종(문서·코드) 심사 결과 반영 패치.

### Fixed
- **sj-company** — `HINT=agent_dev` 분기(Tech Lead 우회)에서 PROJECT.md의 `progress`·`last_session`을 아무도 갱신하지 않던 구멍 수정: sj-company가 직접 `agent:` prefix로 갱신. Step 6 필드 목록에 누락됐던 `progress` 추가, Small 경로에 구버전 파일 폴백 문구 명시.
- **sj-secretary** v3.1.1 — 파서 견고화: `with open` + `errors="replace"` + 프로젝트 단위 예외 격리 (깨진 파일 1개가 전체 상태 보고를 중단시키지 않음, `[확인 불가]` 분류 신설). inbox 카운트가 중첩 체크박스를 집계하던 것을 평면 항목만으로 제한.
- **sj-loop** v1.0.1 — 정지 신호를 출력 문장(`LOOP_DONE`)에서 상태 파일의 `status: DONE` 줄로 변경 (기계 검증 원칙과 일치, 오탐 제거). 드라이런은 정지 조건을 평가하되 기록하지 않고 보고만. 사람 게이트 문구를 저장 전 grep으로 기계 확인. 루프 수명주기(archive·재실행 초기화) 정의. `loop`/`schedule`이 Claude Code 내장 스킬임을 명시하고 cron + `claude -p` 폴백 예시 추가.
- **README** — `/sj-agent-dev` 설명 7축 → 10축 (CLAUDE.md와 동기화).
- 3.2.0 항목의 progress 갱신 분담 서술 정정: sj-qa는 Large뿐 아니라 **xLarge**도 담당.

## [3.2.0] - 2026-06-11

### Added
- **sj-loop** (`/sj-loop`) — 루프 엔지니어링 스킬. 목적·1회 반복 작업·기계 검증 가능한 정지 조건·메모리(상태 파일)·가드레일을 갖춘 루프 프롬프트를 생성해 `docs/sj-company/loops/`에 저장하고, 드라이런·세션 내 반복(/loop)·클라우드 스케줄(/schedule) 중 선택해 실행. 사람 게이트(PR 머지·배포 금지) 문구 없는 루프 저장 금지.
- **PROJECT.md `progress` 필드** — 목표 대비 현재 단계 한 줄. sj-company(Tiny/Small)·sj-tech-lead(Medium)·sj-qa(Large)가 갱신, sj-secretary가 표시. 구버전 파일은 갱신 시 자동 추가.
- **pm-brief `## 완료 조건`** — PM이 기계 검증 가능한 완료 조건을 정의하고, sj-qa가 각 조건을 실제 실행·관찰해 1:1 대조 (판정의 1차 근거).
- **triage-inbox 규약** — 루프가 스스로 판단 못 한 항목을 `docs/sj-company/triage-inbox.md`에 기록, sj-secretary가 미처리 건수를 상태 보고에 표시.

### Changed
- **sj-secretary** v3.1.0 — "아침 브리핑" → "프로젝트 상태 보고"로 재정의. [긴급]/[주의]/[진행] 항목에 목표·현재 단계(progress, 폴백 last_session) 표시.
- **sj-tech-lead** — 같은 단계 병렬 디스패치 충돌 방지 규칙 추가 (파일 소유권 분할 → 의존 단계 직렬화 → 불가피 시 `isolation: worktree` + Tech Lead 병합 책임).
- **CLAUDE.md 아키텍처 원칙** — 사람 게이트(PR 머지·배포 승인은 항상 사람)·완료 조건 검증·병렬 충돌 방지 원칙 명문화.
- 버전 단일화: `package.json`·`skills/VERSION`·`marketplace.json`·README 배지를 모두 `3.2.0`으로 정렬 (skills/VERSION 3.1.0 드리프트 해소).

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
