# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [Unreleased]

### Added
- **기능 지도·추적성 설계 스펙** — `docs/spec/2026-08-27-feature-map-traceability.md`. 기능 간 연결성·영향 범위를 구현 **전에** 따지고, 고장 시 수정 지점을 문서에서 바로 찾게 하는 `docs/FEATURE-MAP.md` 층 설계. 경쟁 하네스 4종(spec-kit 131k★·OpenSpec 66k★·BMAD 52k★·claude-code-harness 3k★) 조사 결과 포함 — 넷 다 "변경 하나"의 정합성만 보고 기능 간 영향은 다루지 않는다. **설계만, 구현 전** — 채택은 사람 게이트.
- **sj-design 에셋 라이선스 게이트** (취향 프로필 C15) — 폰트·아이콘·이미지를 저장소에 반입하기 전 라이선스를 파일에서 직접 확인한다(폰트는 name 테이블 ID 13·14). 상용 파운드리 EULA·출처 불명이면 구현하지 않고 OFL 대체안을 제안하며, 확인 근거는 에셋 디렉터리 README에 남긴다.

### Security
- `.gitignore`에 `docs/si/` 추가 — sj-dev-si 산출물(**대외비** 표기 SI 문서 5종)이 공개 저장소에 커밋되는 경로를 차단. 산출물은 클라이언트 프로젝트 저장소에 있어야 한다.

## [4.0.0] - 2026-08-07

**옵시디언 중심 하네스 전환** — 역할 스킬의 절차 정본을 SKILL.md에서 옵시디언 볼트로 옮긴 구조 전환(메이저). 지식·절차·경험이 볼트 한 곳에서 순환하고, 절차 수정은 재배포 없이 플레이북 편집으로 끝난다.

### Changed — 플레이북 구조 (breaking)
- **역할 스킬 13개를 얇은 디스패처로 전환** (sj-company v4.0.0 · sj-pm v3.0.0 · sj-design v4.0.0 · sj-tech-lead v3.0.0 · sj-qa v3.0.0 · sj-spec v2.0.0 · sj-investigate v2.0.0 · sj-cso v2.0.0 · sj-ship v2.0.0 · sj-retro v2.0.0 · sj-secretary v4.0.0 · sj-marketing v2.0.0 · sj-dev-si v2.0.0). SKILL.md 합계 약 4,600줄 → 약 700줄. 각 SKILL.md에는 플레이북 로드 커널 + 불변 산출물 계약 + 최소 계약 폴백(볼트 부재 시 비차단)만 남는다.
- **절차 정본은 볼트 `20_실행/플레이북/{스킬}.md`** (13개 신설, 기존 절차 충실 이관). 역할→플레이북+지식 폴더 라우팅은 볼트 `00_SYSTEM/START-HERE.md` "하네스 역할 라우팅" 섹션이 정본.
- **학습 환류 볼트 일원화** — `*-context.md`(pm/dev/qa/design) 신규 append 폐지(읽기만 허용). 인사이트는 볼트 `30_경험/검증된패턴|실패사례|ADR`(범용)·`40_프로젝트/{프로젝트}/`(프로젝트 한정)로. notability 게이트·`[run:RUN_ID]` 인용 형식·PII 마스킹 유지. tech-lead의 `~/.claude/skills/learned/` 신규 기록도 볼트 30_경험으로 통합(레거시는 폴백 읽기).
- **컨벤션 개정**: context-curation(볼트 일원화), obsidian-context(플레이북 로드 규칙 + 플레이북은 신뢰된 절차 문서 예외 — 단 SKILL.md 불변 계약을 뒤집을 수 없음), pii-masking(적용 지점 갱신).
- 불변: 파이프라인 계약(`.state/` 산출물 경로·형식, RUN_ID, Judge 독립성, 사람 게이트, archive-only), RESOLVER 라우팅 키워드, 도구 배선형 스킬 13개(law·gpt·seo·automation·loop·agent-* 등)는 기존 구조 유지.

### Added — 자기개선 하네스 원칙 (Lilian Weng harness engineering 반영)
- **self-harness 컨벤션 확장**: 약점의 단일 파일 귀속(AHE 구성 요소 관찰 가능성), 편집 기록 5필드(실패 증거·추정 원인·수정 대상·예상 개선·회귀 위험), **제안 원장**(볼트 `40_프로젝트/S-skills/하네스-제안-원장.md` — 기각 후보도 보존, 재제안 금지), **편집 금지 표면**(평가기·QA 판정 규칙·사람 게이트 문구는 루프 밖 — 보상 해킹 차단).
- **sj-qa Fail-closed 게이트**: 실행 못 한 완료 조건 항목이 하나라도 있으면 PASS 불가 — `미수행: {이유}` 명시 후 CONDITIONAL 상한. 불완전한 검사가 전체 성공으로 보고되는 경로 차단.

## [3.14.0] - 2026-07-31

### Added — sj-law (한국 법령 조회)
- **sj-law** v1.0.0 — [korean-law MCP](https://github.com/chrisryugj/korean-law-mcp)(법제처 42개 API → 10개 도구) 연동 스킬. 법령·판례·행정규칙·자치법규·조약·해석례를 원문으로 조회한다.
  - **환각 게이트가 설계 중심**: LLM이 법률 도메인에서 내는 가장 비싼 오류는 "그럴듯한 조문 번호"다. 산출물에 나가는 인용은 내보내기 전 `legal_analysis(mode=verify_citations)`를 통과시키고, `✗ NOT_FOUND`는 번호를 고쳐 재시도하지 않고 문장을 지운 뒤 원 조문을 다시 조회한다. **`⚠ 법령명 불명확`을 통과로 읽지 않는다** — 검증 실패보다 검증 미가동이 위험하다(upstream v4.9.0이 같은 진단으로 표기 3종을 고쳤다).
  - **판례 생사 확인**: 근거로 인용하는 판례는 `cite_check`로 변경·폐기 여부 확인. 조례는 `ordinance_radar`로 근거 상위법 개정 대조.
  - **라우팅 비용 규약**: 조문 하나 질문에 체인 도구(`legal_research`)를 부르지 않는다 — `search_law`+`get_law_text` 2콜로 끝낸다.
  - **인용 한도 예외 명문화**: [citation-limits](skills/_conventions/citation-limits.md)의 15단어 제한을 법령·판결·고시 **원문에는 적용하지 않는다**(저작권법 제7조 비보호 대상, 축약이 오히려 위험). 법률 해설서·논문·뉴스 등 2차 저작물에는 그대로 적용.
  - **키 취급**: 법제처 인증키(LAW_OC)를 대화로 받지 않고 사용자가 터미널에서 직접 등록 — 전사 로그 잔류 방지. 미등록 시 발급·등록 안내 후 정지하며, 추측으로 대신 답하지 않는다.
  - 면책 문구 필수 — 1차 자료 조회이지 법률 자문이 아니다.
- **RESOLVER** #25 추가. #24(GPT 자문)에 제외 조건 — "법령 리서치 해줘"는 GPT가 아니라 법제처 DB로 간다.

## [3.13.0] - 2026-07-22

전체 스킬 리뷰(2026-07-22, 61건 발견)의 HIGH 14건 + 주요 MEDIUM을 수정. 진단된 공통 원인은 **층간 drift** — 스킬 본문은 진화했는데 그것을 참조하는 주변부(라우터 키워드, 상태 파일 경로, frontmatter, 가드 스크립트)가 따라가지 못한 것. 이번 릴리즈는 그 drift를 메우고, 같은 drift가 다시 생기지 않도록 가드를 넓혔다.

### Fixed — 파이프라인 계약
- **sj-tech-lead** v2.9.0 — 7a-1 적대 검증 3렌즈가 모두 `.state/dev/security.md`에 써서 서로를 덮어쓰고, security가 구현자로도 참여한 사이클이면 Result Card(변경 파일 목록)까지 소실되던 문제. 리뷰 산출을 `_review-security[-{lens}].md`로 분리하고, `.state/dev/`의 `_` 프리픽스 파일은 Result Card가 아니라는 규약을 명문화(Result Card 순회·참여 역할 집계·재진입 스킵·sj-qa 참조 모두 반영).
- **sj-company** v3.9.1 — Large·xLarge 경로가 `task.txt`를 갱신하지 않아 직전 Medium 사이클의 `[HINT:]`·`[SPEC:]`가 이번 Dispatch Card에 주입되던 문제. 두 경로 모두 태스크 시작 시 갱신 단계 추가.
- **work-card-protocol.md** — dev-summary 소비자로 sj-qa를 명시해 Judge 독립성 컨벤션과 모순되던 표 수정 + `_` 프리픽스 규약·리뷰 산출 파일 등재.

### Fixed — harness 상태 감지
- **harness** v2.5.0 — (1) pw-loop 상태를 존재하지 않는 `cycle.txt`에서 읽어 항상 `NOT_STARTED`이던 문제를 pw-loop v2 계약(기능·시나리오 단위)으로 재배선. (2) 원격 태그 regex가 `v` 프리픽스 태그(실제 전부)를 못 잡아 업그레이드 감지가 죽어 있던 문제 수정 — 실측 검증. (3) 시나리오 카운트가 `maxdepth 1`을 봐서 `GENERATED` 상태에 도달 불가하던 문제를 `scenarios/scenarios.md` 단일 파일 계약으로 수정. (4) `grep -c … || echo 0` 이중 출력 제거.
- **skills/VERSION** — 3.3.1에 정체돼 설치 버전을 오보고하던 파일을 릴리즈 범프 대상으로 편입.

### Fixed — 라우팅
- **RESOLVER** — (1) sj-loop(#22) 트리거가 상위 PC 자동화(#3)에 항상 선점돼 도달 불가하던 문제: #3에 루프 제외 조건 + 두 행의 구분 기준(일회성 스크립트 vs 판단하며 반복하는 루프) 명시. (2) #13 Canary의 "상태 확인"이 과광범해 "프로젝트 상태 확인"이 프로덕션 모니터링으로 가던 문제: 배포·프로덕션 맥락 한정으로 축소하고 #18(비서)에 이관.
- **sj-marketing** v1.2.1 — frontmatter가 폐기된 totaro-seo로 라우팅을 선언해 본문·RESOLVER와 어긋나던 문제 수정.

### Fixed — 계약 충돌·도구 선언
- **sj-design** v3.5.0 — (1) 거부 프로토콜 REJ-2가 다크 방향을 강제해 "라이트 고정" 프로필과 정면 충돌하던 문제: 대비를 라이트 안에서 만들도록 수정. (2) preserve 모드가 판별만 하고 실행 경로가 없어 무조건 타 브랜드 DNA 3종 시안(C12 덧씌우기 금지 위반)으로 흐르던 문제: 공식 API 내 최소 변경 3안 경로 추가. (3) 신규 요청 "새로 디자인해줘"가 거부로 오인돼 `design-banned.md`를 오염시키던 문제: 선행 시안 존재를 전제 조건으로 명시.
- **sj-seo** v1.1.0 — allowed-tools에 브라우저 계열이 없어 "브라우저 열고 클릭·제출"이 도구 계약상 실행 불가하던 문제: 선언 보강 + MCP 도구 런타임 로드(ToolSearch) 절차 명시, 실패 시 수동 절차 전환.
- **obsidian-writer** v1.1.0 — 하네스 정본 볼트(`$OBSIDIAN_VAULT_DIR`)를 탐지 후보에 넣지 않아 읽기(obsidian-context)와 쓰기가 다른 볼트를 향하던 순환 단절 수정.
- **docs-organize** v1.2.0 — Phase 7이 승인 없이 sj-company를 자동 투입해 "문서만 정리해줘"가 매번 전체 파이프라인을 기동하고 harness 귀환과 충돌하던 문제: 사람 게이트(종료/치유/개발 3지 선택)로 전환.

### Fixed — 정직성·안전
- **sj-cso** v1.2.0 — 보고서에 `## 미수행 검사` 슬롯이 없어 스킵이 통과처럼 읽히던 문제(정직 산출 계약 커널 ② 미배선) 수정.
- **sj-qa** v2.5.0 — (1) canary/benchmark 모드에 최우선 진입 게이트가 없어 Step 1~9를 먼저 탈 위험 제거. (2) Canary Step 3 콘솔 체크가 env 미전달·모듈 해석·top-level await 3중 문제로 죽은 코드이던 것을 실행 가능하게 수정하고 미수행 보고 경로 추가.
- **sj-investigate** v1.1.1 — 커밋되는 영속 파일 `investigate-log.md`에 PII 마스킹이 미배선이라 토큰이 git 이력에 영구 잔류할 수 있던 문제 수정.
- **untrusted-content 배선** — README가 선언한 5개 중 실제 참조는 2개뿐이던 공백을 메움: test-scenario(외부 `[결과]` 블록 파싱), pw-loop(DOM·콘솔), sj-marketing(레퍼런스 수집), sj-tech-lead 7a-1-gpt(GPT 응답은 1표와 결함 목록만, 결함은 저장소에서 실재 확인 후 기록).
- **friction-log** — redact()가 `private_key`·`Bearer` 토큰을 놓치던 패턴 보강.

### Fixed — 문구·구조
- **sj-secretary** v3.1.2 — "어떤 파일도 수정하지 않는다" 오버클레임 정정(자체 인덱스 캐시는 예외로 명시).
- **sj-ship** v1.2.0 — 존재하지 않는 `/sj-canary` 안내를 `/canary`로 정정, 정의되지 않던 "ship 로그" 실체 지정(`ship-log.md`), sj-qa canary와 중복인 도달 불가 canary 섹션 제거.
- **sj-spec** v1.1.0 — 6문항을 AskUserQuestion 1회로 받게 해 도구 한도(4문항)상 실행 불가하던 절차를 평문 제시 + 필요 시 4문항 확인으로 수정.
- **sj-automation** v2.0.1 — `uname -s`로 Windows를 감지하려던 오류를 `platform.system()` 우선으로 수정.
- **sj-retro** v1.4.1 — Step 5b가 `loops/*-state.md`(루프 런타임 상태)를 "과거 통과 시나리오"로 착각하던 경로 수정.

### Fixed — 중복·블로트 (LOW)
- **sj-dev-si 이중 관리 해소** — `skills/sj-dev-si/SKILL.md`와 `agents/sj-dev-si.md`가 각각 850줄짜리 문서 템플릿 사본을 들고 있었고, 2026-05-21의 두 갈래 커밋이 한쪽에만 적용되며 같은 문서 유형의 스키마가 갈렸다(`a5da54a`는 agent에만 → requirements 필드 확장·demo 핀 어노테이션·SLA, `9a94a02`+`3f9baf2`는 skill에만 → 결과보고서 재구성·내부 경로 노출 방지, `f91b9cf`는 skill에만 → 견적서). 커밋 출처대로 통합해 `skills/sj-dev-si/references/document-templates.md` 단일 사실로 추출하고 양쪽이 참조하도록 변경. 함께 어긋나 있던 Self-Review 체크리스트도 같은 파일로 통합 — 템플릿과 체크리스트는 같이 움직이는 지식이다. 두 파일 합계 2110줄 → 283줄.
- **sj-automation 인라인 템플릿 추출** — Step 3의 OS별 구현 템플릿 459줄을 `references/templates-{script,ui,native-app}.md`로 분리하고 카테고리별 라우터만 남김(745줄 → 298줄). Swift 5.6에서 제거된 `swift package generate-xcodeproj` 정정.
- **Result Card 헤더 스키마 이원화** — 명세(`# {role} Result —`, `## 미해결 이슈`)와 실제 에이전트 7종이 쓰는 형식(`# {Role} Output —`, `## 알려진 제약 / 후속 작업`)이 달라, Tech Lead 재디스패치 판단이 존재하지 않는 섹션을 찾고 있었다. 명세를 실물에 맞추고, 그 섹션이 없던 4개 에이전트(data·database·security·si)에 추가해 계약을 실재하게 만듦.
- **sj-dev-security 리뷰어 모드 독립성** — 리뷰 대상 로드가 `security.md`만 제외해, 새로 분리된 `_review-security-{lens}.md`를 읽으면 7a-1 3렌즈가 서로의 결론을 보게 되는 앵커링 위험. `_` 프리픽스 전체 제외로 수정.
- **sj-design `/review` 트리거 충돌** — 범용 `/review`(GitHub PR 리뷰)와 이름이 겹쳐 디자인 리뷰 의도가 빨려가던 것을 `/design-review`로 변경.
- **sj-retro 회고 창 계산** — (1) `HEAD~7`은 "커밋 7개 전"이지 "7일 전"이 아니라 회고 기간과 어긋나던 것을 기간 경계 커밋 기준으로 수정. (2) `git --since`가 시각 없는 날짜를 "그 날짜의 현재 시각"으로 해석해 경계일 오전 커밋이 통째로 누락되던 문제를 자정 고정으로 수정(실측 재현·검증). (3) 정의되지 않은 채 보고서 템플릿에만 있던 `{PW_TARGET}`을 PROJECT.md `pw_target`에서 읽도록 정의.
- **sj-agent-dev** — 빈 `scripts/`·`assets/` 디렉토리 제거.
- **CLAUDE.md** — sj-dev-si 설명 3곳에서 누락돼 있던 견적서·주간 보고서 보강.

### Added
- **scripts/skill-manifest.py** — `skills/VERSION` ↔ `package.json` 정합 검사 추가. 이번 리뷰에서 발견된 drift 중 가드 사각지대였던 항목부터 메움.
- **.gitignore** — 루프 런타임 상태·디자인 드래프트·archive 백업을 무시 대상에 추가(그동안 untracked 방치).
- **CHANGELOG** — 누락돼 있던 v3.12.0 항목을 릴리즈 커밋에서 복원.

## [3.12.0] - 2026-07-15

사람이 읽는 산출물의 품질을 계약으로 만든 릴리즈. 완료 보고가 diff 나열이면 사람 게이트는 고무도장이 되고, 판정·회고가 `.state/`에만 남으면 다음 사이클이 그걸 못 읽는다.

### Added
- **literate-report 컨벤션** — 완료 보고·PR 본문은 배경(변경 전 동작)→의도(한 문장)→읽기 순서→세부 순으로 쓴다. sj-tech-lead Step 10·sj-ship PR 본문 배선.
- **obsidian-output 컨벤션** — 사용자가 읽는 보고서형 산출물을 볼트 `40_프로젝트/{프로젝트}/보고서/`에 정리본으로 저장. 기존 프로젝트 폴더 매칭(영문↔한글 표기 차이 포함) 우선, 없으면 신규 생성. sj-tech-lead·sj-qa·sj-retro·sj-investigate·sj-cso·sj-ship 배선.
- **sj-investigate Step 4b 이해 도구 옵션(마이크로월드)** — 상태 변화 추적형 문제·검증 반복 실패 시 사람이 직접 탐색할 일회용 도구 제작을 1회 제안.
- **sj-design v3.4.0** — 볼트 취향 프로필을 실행 계약으로 필수 선행, 리뷰 모드에 프로필 §5 게이트.
- **sj-retro v1.4.0 Step 4c** — 취향 프로필 신선도 점검(이번 주 디자인 거부/승인의 프로필 승격 후보 나열, 편집은 사람 게이트).

### Changed
- README에 옵시디언 배지 + "하네스 + 옵시디언(읽기/쓰기 순환)" 정체성 반영.
- 버전: tech-lead 2.8.0 / qa 2.4.0 / retro 1.4.0 / ship·investigate·cso 1.1.0.

> 이 항목은 v3.13.0 작업 중 누락이 확인되어 릴리즈 커밋(`6b34432`)에서 복원했다.

## [3.11.0] - 2026-06-20

codex(GPT) 교차모델 리뷰로 하네스를 전수 점검하고, 발견을 Claude가 코드로 검증해 실재하는 파이프라인 계약 빈틈을 수정. 핵심 진단: 원칙은 문서에 있으나 **기계로 강제되지 않던** 지점들 — 완료조건 게이트·PII 마스킹·RUN_ID 추적·커버리지 차단이 산문 선언에 그쳤다. 산문이 아니라 가드가 계약을 지킨다.

### Fixed
- **sj-company** v3.8.1 — (1) Medium 경로가 `pm-brief.md`(완료 조건 포함)를 생성하지 않아 QA 완료조건 게이트가 통째로 스킵되던 문제 수정 — 이제 Large와 동일 스키마로 생성. (2) 마이그레이션 블록이 `.state`를 통째 archive하며 방금 만든 `current-run.txt`까지 삭제해 RUN_ID 추적이 끊기던 문제 — archive 후 활성 위치에 복원.
- **sj-qa** v2.3.1 — (1) `pm-brief`/완료 조건이 없으면 PASS 불가(CONDITIONAL 상한) 게이트 추가 — 검증 기준 없는 PASS 차단. (2) verdict를 pw-loop보다 먼저 확정해 Playwright 실패가 판정에 반영되지 않던 문제 — pw 결과→verdict 역전이(미달=CONDITIONAL, 실패=FAIL, archive 재생성) 강제.
- **sj-ship** v1.0.3 — "커버리지 미달 시 예외 없이 block" 선언과 실제 "그냥 진행 묻기"가 정면 충돌하던 문제 — 커버리지 수치 파싱(파싱 실패=미달 간주) + 기본 차단 + 예외는 사람 승인·사유 기록 시에만 진행으로 선언·실행 일치.
- **sj-retro** v1.2.1 — "기본은 현재 프로젝트"라면서 `find ~`로 홈 전체를 탐색하던 모순 — 기본 cwd 한정, `/retro global`일 때만 홈 탐색(프라이버시·성능).
- **_conventions/friction-log** — PII 마스킹이 주석 선언만 있고 canonical 레시피 코드엔 없던 문제 — 실제 `redact()`(Bearer·secret·token·JWT·email) 삽입, message/hint에 강제 적용.

### Changed
- **sj-gpt** v1.0.1 — `allowed-tools`에 `ToolSearch`·`mcp__codex__codex` 선언 추가(본문 주경로가 MCP인데 Bash만 선언돼 있던 drift 해소).
- **sj-company** — `allowed-tools`에 `Agent`·`Workflow` 추가(리뷰 경로 병렬 디스패치·xLarge 워크플로우가 미선언이던 문제).
- **_conventions/context-curation** — "통과 항목 없으면 0줄 append가 정상" 우선 규칙 명시(형식 채우기용 학습 로그 방지, 개별 스킬 append 단계보다 우선).
- **_conventions/run-id** — `current-run.txt` 동시·스케줄 실행 덮어쓰기 한계 + 마이그레이션 복원 계약 문서화.
- **CLAUDE.md / 버전 표기** — 변경 스킬 버전 동기화, plugin 3.10.0 → 3.11.0.

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
