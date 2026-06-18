# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [3.10.0] - 2026-06-18

GPT(OpenAI) 교차모델 자문을 하네스에 배선. 같은 모델의 렌즈는 훈련 분포가 같아 공통 맹점을 공유한다 — 다른 모델을 한 표 더하면 가장 강한 다양성이 생긴다. codex MCP(`codex mcp-server`)를 통해 위임하며, 단일 AI 리뷰어는 차단하지 않는다(보완재, 최종 게이트는 사람).

### Added
- **skills/sj-gpt** v1.0.0 — GPT 자문 위임 스킬. codex MCP `codex` 도구로 리서치·세컨드 오피니언·브레인스토밍·대안적 추론을 위임하고 Claude 관점과 교차 종합. 안전 기본값(`sandbox=read-only`·`approval-policy=never`), 리서치 시 `tools.web_search` 활성화, GPT 답을 덤프하지 않고 합의/이견을 신호로 드러냄. Bash 폴백(`codex exec`) 내장. 이미지 생성(DALL-E)·플러그인 브라우징 미지원 명시.
- **RESOLVER #24** — GPT 자문 라우팅 행(GPT·세컨드 오피니언·리서치·브레인스토밍 키워드, 이미지·이 레포 코드/버그는 비대상).

### Changed
- **sj-tech-lead** v2.5.0 — 7a-1 다관점 적대 검증(CRITICAL 영역 한정)에 `7a-1-gpt` 교차모델 렌즈 추가. Claude 3렌즈 + GPT = 최대 4표, 2명 이상 FAIL 시 재디스패치. GPT 단독 FAIL은 차단하지 않고 HIGH 기록(리뷰어 다양성 컨벤션). codex 불가 시 best-effort로 건너뛰고 미수행 로깅(누락 은폐 금지).
- **CLAUDE.md** — GPT 자문 스킬 등록, 버전 표기 동기화.

## [3.9.0] - 2026-06-15

DietrichGebert/ponytail(MIT)의 "lazy senior dev" 룰을 횡단 컨벤션으로 차용 + 하네스 전수 리뷰(5개 병렬 에이전트) 후속 수정. 가장 좋은 코드는 끝내 쓰지 않은 코드다 — 그리고 산문이 아니라 가드가 drift를 막는다.

### Added
- **skills/_conventions/minimal-code.md** — 최소 코드 사다리 컨벤션(YAGNI→표준 라이브러리→네이티브→설치된 의존성→한 줄→최소 코드). Tech Lead Dispatch Card `[BUILD]`로 서브에이전트에 전파, sj-company Tiny/Small·Step 6 리뷰에 배선. 의도된 단순화는 `ponytail:` 주석으로 표시.
- **skill-manifest.py 정합성 검사 #4** — `allowed-tools` ↔ 본문 도구 사용 가드. 본문이 호출하는 WebFetch/WebSearch/Skill(/Agent(/AskUserQuestion/Edit/Write가 frontmatter에 선언됐는지 검사(보수적 시그니처로 prose 오탐 회피).

### Fixed
- **sj-ship** v1.0.2 — 테스트 게이트 우회(`| tail`이 `$?`를 가려 실패해도 통과로 보이던) 수정 + `gh pr create` 전 `git push -u` 추가.
- **pw-loop** v2.0.1 — 존재하지 않는 `Skill("s-skills:sj-dev")` → `sj-tech-lead` (프로즈 참조 일괄 정정).
- **sj-design** v3.2.3 — `allowed-tools`에 WebFetch 추가(URL 레퍼런스 분석 기능이 미선언이던 문제).
- **harness** v2.4.2 — sj-agent-review "7가지 축" → "10가지 축".
- **sj-qa** v2.2.4 — 판정을 `archive/{RUN_ID}.qa-verdict.md`로 사본 저장(sj-retro 히스토리 glob이 항상 비던 문제) + Edit/Skill/AskUserQuestion 미선언 수정.
- **allowed-tools 가드가 적발한 미선언 수정** — sj-pm v2.1.3(+Edit,+AskUserQuestion), sj-investigate v1.0.1(+Edit,+AskUserQuestion), docs-organize v1.1.1(+Skill).

### Changed
- **sj-company** v3.8.0 / **sj-tech-lead** v2.3.0 — RUN_ID 컨벤션 역참조 복원, minimal-code 배선, 프릭션 로그 배선(sj-pm·sj-company), Result Card 재디스패치 트리거를 관찰 가능한 신호로 변경.
- **friction-log** — "모든 스킬" 과장 주장을 실제 기록 집합으로 정정.
- **CLAUDE.md** — 최소 코드 사다리 원칙 등록, 버전 표기 동기화.

## [3.8.0] - 2026-06-13

gbrain(garrytan/gbrain)의 `doctor --remediate --target-score` 패턴 차용 — docs 건강 점수를 목표까지 끌어올리는 치유 루프. 점수가 기계 검증 가능한 정지 조건이라 sj-loop 철학과 정확히 맞는다.

### Added
- **skills/docs-organize/REMEDIATE.md** — 점수 기반 치유 루프. 부족분을 자동/수동으로 분류하고(문서·env.example·README는 자동, 테스트 통과율은 개발 필요), `max_reachable` 천장을 계산해 자동 도달 불가 점수에서 멈춘다. 의존성 순서 치유 플랜 → 사람 승인 → 단계별 실행·재측정 → 정지(점수≥목표 OR 천장). 천장 초과분은 triage-inbox 기록 또는 sj-company 위임. 사람 게이트·archive-only 컨벤션 준수.
- **docs-organize** v1.1.0 — SKILL.md에 remediate 모드 분기 추가 (`remediate`/`점수 올려`/`치유`/`target` 감지 시 REMEDIATE.md 실행).

### Changed
- **RESOLVER #21** — 문서 정리 행에 remediate 모드 구분 추가.
- **CLAUDE.md** — docs-organize remediate 모드 설명 동기화.

## [3.7.0] - 2026-06-13

gbrain(garrytan/gbrain)의 manifest 패턴 차용 — 스킬 인벤토리를 frontmatter에서 파생시키고, 정합성을 기계가 검사한다. "규칙이 병을 만들었으니 가드가 치료한다."

### Added
- **scripts/skill-manifest.py** — SKILL.md frontmatter를 진실의 원천으로 한 정합성 검사·생성기. `--check`: frontmatter 유효성·name↔디렉토리·RESOLVER 디스패치 유효성·CLAUDE.md 버전 표기↔frontmatter·manifest 최신 (drift 시 exit 1). `--write`: manifest.json 재생성. PyYAML 비의존(표준 라이브러리만).
- **skills/manifest.json** — 24개 스킬 인벤토리(name/path/version/description/triggers). frontmatter에서 파생, 손편집 금지.

### Fixed
- **RESOLVER #2** — `Skill("s-skills:sj-ui-auto")` → `Skill("s-skills:sj-automation")`. sj-ui-auto는 sj-automation의 트리거 별칭일 뿐 실존 스킬이 아니라, 런타임에 실패할 잘못된 디스패치였다 (정합성 검사가 검출).
- **harness/SKILL.md** v2.4.1 — frontmatter `name: s-skills` → `harness` (디렉토리명·`s-skills:harness` 참조와 불일치했던 기존 버그, 정합성 검사가 검출).
- **CLAUDE.md 버전 표기** — sj-design v3.2.1→3.2.2, sj-tech-lead v2.2.1→2.2.3, sj-qa v2.2.1→2.2.3, sj-loop v1.0.3→1.0.4 (frontmatter와 drift, 정합성 검사가 검출).

### Changed
- **validate-skill-frontmatter 루프** — frontmatter name/description만 보던 검사를 `skill-manifest.py --check` 전체 정합성 검사로 확장. 정지 조건도 exit 0으로.
- **CLAUDE.md / README** — manifest 정합성 원칙 등록, scripts/·manifest.json 구조 반영.

## [3.6.0] - 2026-06-13

gbrain(garrytan/gbrain)의 `_brain-filing-rules.md`에서 컨텍스트 위생 두 가지 — notability 게이트와 인용 — 를 `*-context.md` 학습 누적에 적용. 컨텍스트 파일이 사이클을 거듭해도 읽을 가치를 유지하게 한다.

### Added
- **skills/_conventions/context-curation.md** — 컨텍스트 큐레이션 컨벤션 단일 정의. (1) notability 게이트 3문항(다음 사이클 의사결정에 도움? / 코드·git에서 못 얻나? / 재사용 패턴인가? — 의심되면 쓰지 않는다), (2) 인용 형식 `- {날짜} [run:{RUN_ID}]: {인사이트}` (RUN_ID는 current-run.txt 연결), (3) 모순은 덮지 말고 명시. "빠진 인사이트는 추가 가능하나 잡음은 읽기 품질을 망친다."

### Changed
- **sj-pm** v2.1.2 / **sj-tech-lead** v2.2.3 / **sj-qa** v2.2.3 / **sj-design** v3.2.2 — 각 context append 지점(Step 6 / 9c / Step 8 / Step R-4)에 notability 게이트 + 인용 형식 적용. 기존 `- {날짜}: {인사이트}` → `- {날짜} [run:{RUN_ID}]: {인사이트}`.
- **sj-company** — 학습 누적 의무를 컨텍스트 큐레이션 컨벤션 참조로 정리.
- **CLAUDE.md / RESOLVER / _conventions/README** — 컨텍스트 큐레이션 원칙 등록.

## [3.5.0] - 2026-06-13

gbrain(garrytan/gbrain)의 friction protocol 이식 — 스킬 실행 중 마찰을 만난 자리에서 한 줄로 기록하고, 주간 회고가 이를 개선 입력으로 소비하는 피드백 루프.

### Added
- **skills/_conventions/friction-log.md** — 프릭션 로그 컨벤션 단일 정의. 언제(friction/delight)·severity 가이드(blocker/error/confused/nit)·JSONL 스키마·기록 레시피(argv+heredoc JSON 안전)·조회 레시피. 기록 위치 `docs/sj-company/friction.jsonl` (영속·append-only, RUN_ID 연결). message는 PII 마스킹 후 기록.
- **sj-retro** v1.1.0 — Step 4b(프로세스 마찰 신호) 신설: friction.jsonl을 회고 범위로 필터해 severity 집계 + 반복 `skill/phase` Top5 추출. Step 5 Improve/Try와 Keep(delight)에 직접 반영 — 반복 마찰이 최우선 개선 후보. 보고서·retro-history에 friction 줄 추가. 파일 비대 시 archive-only 백업 후 절단.

### Changed
- **sj-tech-lead** v2.2.2 / **sj-qa** v2.2.2 / **sj-loop** v1.0.4 — 마찰 빈발 지점(디스패치·통합 / 검증 / 드라이런·반복 실행)에 프릭션 로그 컨벤션 참조 추가.
- **CLAUDE.md / README / RESOLVER / _conventions/README** — friction 프로토콜 등록 및 sj-retro 설명 동기화.

## [3.4.0] - 2026-06-12

gbrain(garrytan/gbrain)의 2층 라우팅(얇은 디스패처 + 온디맨드 상세)과 `_conventions` 단일 정의 패턴 차용.

### Added
- **skills/RESOLVER.md** — 트리거 → 스킬 라우팅의 단일 사실. 23개 라우팅 행(키워드·제외 조건·우선순위) + 모호성 해소 규칙. 키워드 추가·수정은 이 파일에서만 한다.
- **skills/_conventions/** — 횡단 규칙 단일 정의 5종: 사람 게이트(human-gate.md)·PII 마스킹(pii-masking.md)·archive-only 불변식(archive-only.md)·Judge 독립성(judge-independence.md)·RUN_ID 추적(run-id.md). 각 스킬은 한 줄 참조 + 실행 커널(정규식 등)만 인라인 유지, 커널 변경 시 grep 동기화 절차 명시.

### Changed
- **sj-company** v3.7.0 — Step 0-* 키워드 블록 19개(약 350줄)를 RESOLVER.md 참조 한 단계로 교체 (866줄 → 545줄). ship 사전 확인 프로토콜과 리뷰 경로(Step 0a → Step R)는 실행 로직이므로 SKILL.md에 유지. archive-only·학습 누적 의무에 컨벤션 참조 추가.
- **sj-pm** v2.1.1 / **sj-tech-lead** v2.2.1 — PII 마스킹 줄에 컨벤션 참조 추가.
- **sj-qa** v2.2.1 — Step 2에 Judge 독립성 컨벤션 참조 추가. Step 8(qa-context append)에 누락돼 있던 PII 마스킹 적용 추가 (컨벤션 단일화 과정에서 발견된 실제 갭).
- **sj-design** v3.2.1 — Step R-4(design-context append)에 누락돼 있던 PII 마스킹 적용 추가.
- **sj-loop** v1.0.3 / **sj-ship** v1.0.1 — 사람 게이트 컨벤션 참조 추가 (sj-ship은 "PR 생성까지가 영역, 머지·배포 승인은 사람" 경계 명시).
- **sj-outsource** v1.0.1 — Step 3 PII 마스킹에 컨벤션 참조 추가 (외부 문서이므로 확장 패턴 유지).
- **CLAUDE.md / README** — RESOLVER·_conventions 참조 추가, 스킬 버전 표기 동기화 (sj-design v3.0.0 → v3.2.1 기존 누락분 포함).

### Fixed
- sj-company 마케팅 라우팅의 낡은 스킬명 `totaro-seo` 참조를 RESOLVER 이전 과정에서 `sj-seo`로 정정.

## [3.3.1] - 2026-06-11

드라이런 실전 테스트(frontmatter 검증 루프 1사이클)에서 발견된 관찰 사항 반영 패치.

### Changed
- **sj-loop** v1.0.2 — 드라이런 보고 요건 2건 추가: (1) 정지 조건이 이미 전부 충족된 루프는 "무인 등록 시 첫 반복에서 즉시 DONE"임을 명시하고 등록 가치(상시 감시 vs 일회성 검사) 판단을 사용자에게 받음, (2) 경로 커버리지 보고 — "이번 반복에서 할 일" 중 실제 실행된 단계와 미실행 단계(예: 수정 대상 0건 → 수정·triage 경로 미검증)를 구분 표시.

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
