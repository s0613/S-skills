# S-skills Resolver — 라우팅 단일 사실

이 파일이 **트리거 → 스킬 라우팅의 단일 사실(single source of truth)**이다.
sj-company Step 0이 런타임에 이 테이블을 읽어 디스패치하고, CLAUDE.md·README는 이 파일을 참조한다.
키워드를 추가·수정할 때는 **이 파일만** 고친다.

> gbrain의 2층 패턴 차용: 얇은 디스패처(이 파일) + 두꺼운 스킬 본문(온디맨드 로드).
> 디스패치 전 반드시 해당 SKILL.md를 읽고 행동한다.

## 평가 규칙

1. **위에서 아래로** 평가한다. 첫 매치에서 디스패치하고 평가를 멈춘다 (순서가 우선순위다).
2. 제외 조건에 걸리면 그 행은 매치 실패로 보고 다음 행으로 내려간다.
3. 아무 행에도 매치되지 않으면 → sj-company **Step 1 (태스크 크기 판정)**으로 진행한다.
4. 디스패치 시 사용자에게 `[{라벨}] {감지 안내}. {스킬}을 실행합니다.` 한 줄을 출력한다.

## 라우팅 테이블

| # | 라벨 | 감지 키워드 | 제외 / 구분 조건 | 디스패치 |
|---|------|------------|------------------|----------|
| 1 | Obsidian | 옵시디언, obsidian, 노트로, 볼트, vault, 기록해줘, obs | Obsidian 전용 단어가 있을 때만. "문서 정리해줘"·"문서화해줘"만으로는 트리거하지 않음 → #21 | `Skill("s-skills:obsidian-writer")` |
| 2 | UI 자동화 | 클릭, 버튼, 화면, 스크린, 입력해, UI, 자동 클릭, 이미지 인식, 화면 조작, 화면을, 창을, pyautogui, selenium, 웹 자동화, 브라우저 자동화, 로그인 자동화 | `playwright 테스트`, `playwright 설정`, `e2e 테스트`, `테스트 실행` 포함 시 건너뜀 (테스트 요청) | `Skill("s-skills:sj-ui-auto")` |
| 3 | PC 자동화 | 자동화, 자동으로, 매일, 매주, 스케줄, 단축키, launchd, cron, 알림, 파일 이동, 폴더 정리, 앱 실행, 반복, 할 때마다, 되면 자동, shell, 스크립트 | UI 조작 키워드(#2)와 동시 감지 시 #2 우선 | `Skill("s-skills:sj-automation")` |
| 4 | SEO 색인 | 색인 등록, 검색 노출 안 돼, Search Console, 서치어드바이저, sitemap 제출, 구글 색인, 네이버 색인, 검색에 안 나와, 검색 노출 도와줘 | | `Skill("s-skills:sj-seo")` |
| 5 | 마케팅 | 마케팅, SNS, 캠페인, 카피, 게시글, 포스팅, 홍보, 인스타, 인스타그램, 스레드, threads, 링크드인, linkedin, 트위터, 광고 문구, 콘텐츠 작성, 컨텐츠, 카드뉴스, 슬라이드 포스팅, sns-start, 브랜드 카피, 마케팅 글, 네이버 블로그, 티스토리, 블로그 글, SEO 글, AEO, 블로그 콘텐츠, 상위노출 글 | `기술 블로그`, `개발 블로그`, `개발자 블로그`, `기술 문서` 포함 시 건너뜀 (개발 문서 요청). SEO 키워드(#4)와 동시 감지 시 #4 우선 | `Skill("s-skills:sj-marketing")` |
| 6 | 스펙 | 스펙, 명세, PRD, 기능 정의, 요구사항 정리, 스펙 만들어줘, 뭘 만들지 정리, 설계 문서, spec | | `Skill("s-skills:sj-spec")` |
| 7 | 조사 | 왜 이러지, 원인 파악, 디버깅, 에러 원인, 버그 추적, investigate, 어디서 나는지, 루트코즈, root cause | | `Skill("s-skills:sj-investigate")` |
| 8 | Agent Dev | 에이전트 만들어줘, 에이전트 설계, AI 에이전트, agent 개발, 오케스트레이션 구현, 멀티에이전트, multi-agent, 에이전트 아키텍처, agent-dev, 런타임 루프, 역할 분리 에이전트 | "에이전트 리뷰"·"에이전트 점검" 포함 시 → #23 (리뷰 경로) | `Skill("s-skills:sj-agent-dev")` |
| 9 | 보안 | 보안 점검, 보안 감사, 취약점, OWASP, STRIDE, 보안 리뷰, 보안 검사, cso, security audit | | `Skill("s-skills:sj-cso")` |
| 10 | 릴리즈 | 배포해줘, PR 올려줘, 릴리즈, ship, 머지해줘, 배포 준비, PR 만들어, 커밋하고 push | "배포 후 확인", "배포 모니터링", "잘 올라갔어", "canary", "프로덕션 체크" 포함 시 → #13. ship은 push/PR **생성** 요청에만 반응 | **ship 사전 확인 프로토콜** (sj-company Step 0 참조 — 브랜치 확인 + 사용자 승인, [사람 게이트](_conventions/human-gate.md)) 후 `Skill("s-skills:sj-ship")` |
| 11 | 외주 | 외주, outsource, handoff, 전문가에게, 맡기고 싶어, 대신 해줄 사람, SongSeungJu, 넘기고 싶어, 도와줄 사람 연결 | | `Skill("s-skills:sj-outsource")` |
| 12 | 회고 | 회고, retro, retrospective, 이번 주 정리, 지난주 리뷰, 한 주 돌아보기, 회고해줘 | | `Skill("s-skills:sj-retro")` |
| 13 | Canary | canary, 배포 후 확인, 프로덕션 체크, 상태 확인, 배포 모니터링, 잘 올라갔어? | | `Skill("s-skills:sj-qa")` (canary 모드) |
| 14 | Benchmark | 성능 측정, 벤치마크, benchmark, Core Web Vitals, lighthouse, 로드 타임, 느린 이유 | | `Skill("s-skills:sj-qa")` (benchmark 모드) |
| 15 | Office Hours | office hours, 아이디어 검증, 코딩 전 확인, 이 기능 만들어야 할까, 이 기능 필요할까, 제품 방향 맞아?, 이 접근법 맞아?, 만들기 전에 확인 | 코드 레벨 질문("이 코드 맞아?", "이 로직 맞아?", "이게 에러야?")은 비대상 — 제품·기능·방향 수준 결정에만 반응 | `Skill("s-skills:sj-pm")` (office-hours 모드) |
| 16 | Design | 디자인 만들어줘, 화면 만들어줘, UI 만들어줘, 페이지 디자인, 컴포넌트 만들어줘, 스타일 잡아줘, 레이아웃 만들어줘, 디자인해줘, 화면 구성, 디자인 구현, UI 구현 | "다양하게", "여러 스타일", "목업 여러 개" 포함 시 → #17 | `Skill("s-skills:sj-design")` |
| 17 | Design Shotgun | 목업 여러 개, 변형 생성, 디자인 탐색, 다양하게 보여줘, design shotgun, 여러 스타일, 디자인 아이디어 | | `Skill("s-skills:sj-design")` (shotgun 모드) |
| 18 | 비서 | 비서, secretary, 현황 보고, 요약 보고, 보고서 봐줘, 진행 상황 알려줘, 지금 어때, 프로젝트 현황, 뭐가 완료됐어 | | `Skill("s-skills:sj-secretary")` |
| 19 | 테스트 시나리오 | 테스트 시나리오, 검증 시나리오, test scenario, 기능 검증 목록, 테스트 케이스 만들어줘, 시나리오 작성, 통과율 추적 | | `Skill("s-skills:test-scenario")` |
| 20 | PW Loop | playwright 테스트, playwright 실행, e2e 테스트 실행, e2e 돌려줘, 테스트 통과율, pw-loop, pw 실행, 테스트 돌려줘 | 전제: `playwright.config.ts`/`.js` 존재. 없으면 "playwright 설정 파일이 없습니다" 출력 후 Tiny 경로 | `Skill("s-skills:pw-loop")` |
| 21 | 문서 정리 | 문서 정리, docs 구조, docs 만들어줘, 문서 스코어, health score, docs 정리, 코드베이스 분석 문서, docs-organize | | `Skill("s-skills:docs-organize")` |
| 22 | Loop | 루프 만들어, 루프 돌려, 루프 프롬프트, 루프 설계, 반복 자동화, 계속 돌려줘, 야간에 알아서, 주기적으로 실행, 무인으로 돌려, 스케줄로 돌려, sj-loop | Playwright 테스트 반복은 #20이 먼저 매치되므로 여기 오지 않음 | `Skill("s-skills:sj-loop")` |
| 23 | 리뷰 | 리뷰/검토/점검/검수 성격의 태스크 | | sj-company **리뷰 경로 (Step R)** — 대상 자동 감지 후 리뷰어 병렬 디스패치 |

## 모호성 해소 규칙

여러 행이 동시에 매치될 수 있을 때:

1. **테이블 순서가 우선순위다** — 첫 매치가 이긴다 (UI 자동화 > PC 자동화, SEO > 마케팅, pw-loop > loop).
2. **더 구체적인 스킬을 선호한다** — 같은 행 안에서 구분 조건이 명시돼 있으면 그것을 따른다 (agent 리뷰 → 리뷰 경로, design 다중 변형 → shotgun).
3. **확신이 없으면 매치하지 않는다** — 크기 판정(Step 1)으로 내려가 일반 파이프라인을 타는 쪽이 잘못된 전문 스킬 디스패치보다 싸다.

## 횡단 컨벤션

모든 스킬에 적용되는 공통 규칙은 [`_conventions/`](_conventions/README.md)에 단일 정의돼 있다:

- [사람 게이트](_conventions/human-gate.md) — PR 머지·프로덕션 배포는 항상 사람이 승인
- [PII 마스킹](_conventions/pii-masking.md) — 영속 파일 기록 전 민감 정보 치환
- [archive-only 불변식](_conventions/archive-only.md) — 영속 파일은 삭제 금지, 백업 후 덮어쓰기
- [Judge 독립성](_conventions/judge-independence.md) — QA는 구현자 자기 평가를 읽지 않는다
- [RUN_ID 추적](_conventions/run-id.md) — 파이프라인 실행 식별자 계약
