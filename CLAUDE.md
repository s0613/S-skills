# s-skills

개발·마케팅·자동화·문서화·보안·SEO 등 **프로젝트 전 주기**를 커버하는 역할 기반 스킬 플러그인.
코드 없는 마케팅·SEO·자동화·Obsidian 문서·외주 핸드오프도 여기서 처리한다.

## 어디에 무엇이 있나

| 찾는 것 | 정본 |
|------|------|
| 스킬 하나의 동작·계약 | `skills/{name}/SKILL.md` (설명은 여기 다시 적지 않는다) |
| 스킬 인벤토리·버전 | `skills/manifest.json` — SKILL.md frontmatter에서 파생, **손편집 금지** |
| 라우팅 키워드·연결 표 | [skills/RESOLVER.md](skills/RESOLVER.md) |
| 횡단 규칙(사람 게이트·PII·정직 산출 등 24종) | [skills/_conventions/README.md](skills/_conventions/README.md) — 규칙 본문은 거기에만 |
| 외부 도구 설치 명령 | [skills/_conventions/external-tools.md](skills/_conventions/external-tools.md) |
| 서브에이전트 정의 | `agents/*.md` |
| 역할 스킬 12개의 절차 | 볼트 `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/{스킬}.md` |
| 역할→지식 폴더 맵 | 볼트 `00_SYSTEM/START-HERE.md` "하네스 역할 라우팅" |
| 세션 시작 훅 | `hooks/hooks.json` (ADHD 출력 규칙 주입, 끄기: `touch ~/.claude/.s-skills-adhd-off`) |
| 행동 픽스처(라우팅 회귀) | `docs/superpowers/fixtures/behavior/` |

## 스킬 전체 지도

| 영역 | 트리거 | 하는 일 |
|------|--------|---------|
| **상태 라우터** | `/s-skills` | 현재 프로젝트 상태 감지 → 적절한 스킬로 안내 |
| **문서화** | `/docs-organize`, `/obsidian` | 코드베이스 docs/ 생성, Obsidian 볼트 작성 |
| **테스트** | `/test-scenario`, `/pw-loop`, `/sj-e2e` | 시나리오 생성, Playwright 자동화 루프, 자연어 에이전트 E2E(웹·iOS·안드로이드) |
| **개발 파이프라인** | `/sj-company`, `/pm`, `/design`, `/tech-lead`, `/qa` | PM → 디자인 → 개발 → QA 전체 흐름 |
| **디자인 시스템** | `/seed` | 당근 SEED 디자인 시스템으로 UI 조립(토큰·공식 컴포넌트만) |
| **품질·보안·릴리즈** | `/spec`, `/investigate`, `/cso`, `/ship`, `/retro` | 스펙·디버깅·보안감사·배포·회고 |
| **마케팅** | `/marketing`, `/sns` | SNS 캠페인, 채널별 카피, 카드뉴스 |
| **SEO** | `/seo` | Google/Naver 색인 자동화, sitemap 제출 |
| **PC 자동화** | `/automation`, `/auto`, `/ui-auto` | 스크립트·UI 조작·네이티브 앱 제작 |
| **화면 영상** | `/screencast`, `/화면녹화` | 화면 설명 영상 녹화·줌·자막·MP4/GIF 렌더 |
| **문서 변환** | `/convert`, `/문서변환` | Word·PPT·Excel·EPub·오디오를 Markdown으로 변환해 읽게 만듦 |
| **모바일 실기기** | `/mobile`, `/안드로이드` | ARTEMIS로 안드로이드 실기기·에뮬레이터 조작·탐색·증거 수집 |
| **루프 엔지니어링** | `/sj-loop` | 루프 프롬프트 생성 + 드라이런·세션 반복·클라우드 스케줄 실행 |
| **에이전트 개발** | `/agent-dev`, `/agent-review` | AI 에이전트 설계·심사 |
| **모션그래픽 프롬프트** | `/motion`, `/모션그래픽` | 코드 렌더 브리프 또는 AI 영상 생성 프롬프트 |
| **판단 모델 배선** | `/jev`, `/typesafe` | Jev(System One)로 라우팅·가드레일·검증을 타입 있는 판단으로 |
| **GPT 자문** | `/gpt` | codex CLI로 GPT에 리서치·세컨드 오피니언 위임 |
| **법령 조회** | `/law` | 법제처 DB 원문 조회 + 인용 조문 실존 검증 |
| **외주 핸드오프** | `/outsource`, `/외주` | 막힌 작업 전문가 위임 리포트 생성 |
| **비서** | `/secretary` | 프로젝트 상태 보고(목표 대비 단계·다음 할 일) |
| **견적** | `/estimate`, `/견적` | 문의·RFP → 기능별 견적서·운영비 설계·회신 메일 초안 |
| **SI 문서** | `/sj-dev-si` | 제안서·WBS·결과보고서 6종 + 주간 보고서·견적서·도메인 맵 |
| **AX 문제 발굴** | `/ax`, `/문제발굴` | 현장 대화로 문제를 캐고 확인받은 뒤 에이전트 설계로 인계 |
| **리버스 엔지니어링** | `/rea`, `/리버스` | 소스 없는 앱·바이너리를 REA로 열어 동작을 증거로 설명 |
| **데이터 검증** | `/data-check`, `/데이터검증` | 수집 데이터를 사용/조건부/폐기로 분류, 정제 변경 로그 |

## 이 repo를 고칠 때의 불변식

코드·설정을 봐서는 알 수 없는 것만 적는다. 나머지는 위 표의 정본으로.

- **역할 스킬(v4) 구조**: sj-company·pm·design·tech-lead·qa·spec·investigate·ship·retro·secretary·marketing·dev-si 의 SKILL.md는 얇은 디스패처(플레이북 로드 커널 + 불변 산출물 계약 + 최소 계약 폴백, 80줄 이하). **절차 수정은 볼트 플레이북에서, 계약 수정은 SKILL.md에서.** 플레이북은 SKILL.md의 산출물 경로·사람 게이트를 뒤집을 수 없다. 나머지 도구 배선형 스킬은 SKILL.md가 정본.
- **릴리즈 전 `python3 scripts/skill-manifest.py --check` 통과 필수.** frontmatter·RESOLVER 디스패치·프로즈 참조(`s-skills:X` 실존)·manifest 최신을 본다. 재생성은 `--write`.
- **하네스 변경은 관찰된 약점에서만** — friction 로그·QA FAIL 반복 같은 증거 없이 SKILL.md를 고치지 않는다. 채택/기각 이력은 볼트 `40_프로젝트/S-skills/하네스-제안-원장.md`. 평가기·QA 판정 규칙·사람 게이트 문구는 편집 금지 표면 ([self-harness](skills/_conventions/self-harness.md)).
- **PR 머지·프로덕션 배포는 항상 사람이 한다.** 어떤 스킬·루프도 자동 실행하지 않는다 ([human-gate](skills/_conventions/human-gate.md)).
- **같은 단계 병렬 디스패치는 파일 소유권 분할이 기본**, 불가피한 동시 수정만 `isolation: worktree`.
- **새 횡단 규칙은 `_conventions/`에 파일 하나로** 만들고 README 표에 한 줄 추가한다. 이 CLAUDE.md에 규칙 본문을 다시 적지 않는다.
- 차용한 외부 패턴은 컨벤션·SKILL.md에 출처(repo·라이선스)를 남긴다.

## 사용법

어느 프로젝트에서든 `/s-skills`로 시작하면 상태를 감지해 안내한다. 새 태스크는 `/sj-company <태스크 설명>` — PM부터 자동 라우팅.

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DESIGN_REF_DIR` | `/Users/songseungju/awesome-design-md` | sj-design이 참조할 브랜드 DESIGN.md 루트 경로 |
| `OBSIDIAN_VAULT_DIR` | `$HOME/obsidian-vaults/AI 에이전트` | 하네스가 작업 전 참조하는 옵시디언 지식 볼트 경로 |

## Docs Reference

- [PRD](docs/prd.md) · [Architecture](docs/architecture.md) · [Status & Score](docs/STATUS.md) · [ADR](docs/adr/) · [Specs](docs/spec/) · [기능 지도](docs/FEATURE-MAP.md)
