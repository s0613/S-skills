# s-skills

개발·마케팅·자동화·문서화·보안·SEO 등 **프로젝트 전 주기**를 커버하는 역할 기반 스킬 플러그인.

> **개발 전용 도구가 아닙니다.** 코드 한 줄 없는 마케팅 캠페인, SEO 색인, 자동화 스크립트, Obsidian 문서 작성, 외주 핸드오프까지 모두 여기서 처리합니다.

## 스킬 전체 지도

| 영역 | 트리거 | 하는 일 |
|------|--------|---------|
| **상태 라우터** | `/s-skills` | 현재 프로젝트 상태 감지 → 적절한 스킬로 안내 |
| **문서화** | `/docs-organize`, `/obsidian` | 코드베이스 docs/ 생성, Obsidian 볼트 작성 |
| **테스트** | `/test-scenario`, `/pw-loop` | 시나리오 생성, Playwright 자동화 루프 |
| **개발 파이프라인** | `/sj-company`, `/pm`, `/design`, `/tech-lead`, `/qa` | PM → 디자인 → 개발 → QA 전체 흐름 |
| **품질·보안·릴리즈** | `/spec`, `/investigate`, `/cso`, `/ship`, `/retro` | 스펙·디버깅·보안감사·배포·회고 |
| **마케팅** | `/marketing`, `/sns` | SNS 캠페인, 채널별 카피, 카드뉴스 |
| **SEO** | `/seo` | Google/Naver 색인 자동화, sitemap 제출 |
| **PC 자동화** | `/automation`, `/auto`, `/ui-auto` | 스크립트·UI 조작·네이티브 앱 제작 |
| **에이전트 개발** | `/agent-dev`, `/agent-review` | AI 에이전트 설계·심사 |
| **외주 핸드오프** | `/outsource`, `/외주` | 막힌 작업 전문가 위임 리포트 생성 |
| **비서** | `/secretary` | 아침 브리핑, 우선순위 정렬 |
| **SI 문서** | `/sj-dev-si` | 제안서·WBS·결과보고서 6종 작성 |

---

## 상태 라우터 · 문서화 · 테스트

- **s-skills:harness** (`/s-skills`) — 프로젝트 상태 감지 후 적절한 스킬로 라우팅
- **s-skills:docs-organize** (`/docs-organize`) — 코드베이스 분석 및 docs/ 생성, 건강 점수 산출
- **s-skills:test-scenario** (`/test-scenario`) — 기능 검증 시나리오 생성 및 통과율 추적
- **s-skills:pw-loop** (`/pw-loop`) — 기능 단위 Playwright 반복 테스트 루프
- **s-skills:obsidian-writer** (`/obsidian`, `/obsidian-writer`) — Obsidian 문서 작성 전문가. 기능·작업·프로젝트 전체를 .md로 정리. iCloud/로컬 볼트 자동 탐지, 매 실행마다 저장 위치 선택

## 개발 파이프라인 (SJ Company)

PM → 디자인 → 개발 → QA → 배포까지 전체 흐름을 역할별로 처리한다.

- **s-skills:sj-company** (`/sj-company`) — 상태/의도 기반 라우터 v3.4.0. 17개 Step 0-* 키워드 블록으로 자동 감지. RUN_ID 파이프라인 추적. ship 호출 전 브랜치 확인 필수.
- **s-skills:sj-pm** (`/pm`) — 요구사항·리스크·우선순위 분석. AskUserQuestion 최대 1회, 모호해도 가정으로 진행. PII 마스킹 적용.
- **s-skills:sj-design** (`/design`, `/design-shotgun`) — 레퍼런스 DNA 기반 디자인 생성 v3.0.0. 브랜드 DESIGN.md에서 정확한 hex·font·spacing 추출 후 커밋 선언 → 코드 작성. "싫다/별로다" 거부 시 design-banned.md 봉인 + 반대 방향 강제 재설계. `DESIGN_REF_DIR` 환경변수로 참조 경로 설정.
- **s-skills:sj-tech-lead** (`/tech-lead`) — 전문 개발 서브에이전트를 병렬 디스패치하고 통합·리뷰 v2.2.0. RUN_ID 연결. learned 패턴 자동 로딩. [SPEC:] 참조 자동 인식. PII 마스킹 적용.
- **s-skills:sj-qa** (`/qa`, `/canary`, `/benchmark`) — 기능 검증 및 PASS/FAIL/CONDITIONAL 판정 v2.2.0. Judge 독립성 보장 — dev-summary.md 참조 금지, pm-brief + 실제 변경 파일 직접 탐색. 자체 검토 루프 최대 2회.
- **s-skills:sj-secretary** (`/secretary`) — 아침 브리핑 전문. 전체 프로젝트 PROJECT.md를 탐색해 긴급/진행/대기/완료별 우선순위 정렬 출력. 읽기 전용, 파일 수정 없음.
- **s-skills:sj-dev-si** (`/sj-dev-si`) — SI 문서 전문가. 작업 개요·제안서·요구사항·WBS·데모·결과보고서(6종) + 주간 보고서 + 도메인 맵 직접 작성

## 품질 · 보안 · 릴리즈

- **s-skills:sj-spec** (`/spec`, `/sj-spec`) — 스펙 작성 전문가. 모호한 의도를 5단계(why·scope·technical·draft·file)로 실행 가능한 정밀 스펙으로 변환
- **s-skills:sj-investigate** (`/investigate`, `/sj-investigate`) — 체계적 루트코즈 디버깅. 가설 수립→검증 강제, 조사 없는 수정 금지
- **s-skills:sj-cso** (`/cso`, `/sj-cso`) — CSO 보안 감사. OWASP Top 10 + STRIDE 위협 모델링, 8/10 이상 확신 취약점만 보고
- **s-skills:sj-ship** (`/ship`, `/sj-ship`) — 릴리즈 엔지니어 자동화. 테스트→커버리지 감사→PR 오픈까지 한 번에. sj-company 통해 호출 시 push 전 브랜치 확인 필수
- **s-skills:sj-retro** (`/retro`, `/sj-retro`) — 주간 회고. 커밋·테스트·QA 지표로 Keep/Improve/Try 도출

## 마케팅 · SEO · 성장

- **s-skills:sj-marketing** (`/sj-marketing`, `/marketing`, `/sns`) — SNS 마케팅 캠페인 전문가. 채널별 카피라이팅·브랜드 검수·카드뉴스 기획. marketing_agent 하네스 자동 연동, 없으면 독립 실행
- **s-skills:sj-seo** (`/sj-seo`, `/seo`) — Google Search Console + Naver Search Advisor 색인 자동화. 브라우저 직접 열고 sitemap 제출·URL 색인 요청까지 끝까지 자동 처리

## PC 자동화

- **s-skills:sj-automation** (`/sj-automation`, `/automation`, `/auto`, `/sj-ui-auto`, `/ui-auto`) — 자동화 + UI 조작 + 네이티브 앱 제작 통합 전문가 v2.0.0. OS 자동 감지(macOS·Linux·Windows) 후 최적 도구 선택. 스크립트 자동화(launchd·systemd·Task Scheduler)·UI 조작(Playwright·PyAutoGUI·AppleScript·xdotool·AutoHotkey)·네이티브 앱 제작(SwiftUI·WinForms·GTK·Tauri·customtkinter) 통합 구현

## 에이전트 개발

- **s-skills:sj-agent-dev** (`/sj-agent-dev`, `/agent-dev`) — 비즈니스 에이전트 개발 전문가. 런타임 루프·오케스트레이션·역할 분리·도구 계층화·컨텍스트 관리·가드레일·옵저버빌리티 7가지 축으로 실무 AI 에이전트 설계 및 구현 안내
- **s-skills:sj-agent-review** (`/sj-agent-review`, `/agent-review`) — 비즈니스 에이전트 리뷰어. 에이전트 파일·폴더 구조를 탐색하고 7가지 설계 축 준수 여부를 비판적으로 심사. 축별 점수(0~10)·PASS/WARN/FAIL 판정·개선 액션 아이템 산출

## 외주 핸드오프

- **s-skills:sj-outsource** (`/outsource`, `/외주`, `/handoff`) — 막혔을 때 전문가 위임. 프로젝트 개요·막힌지점·대화 맥락을 PII 마스킹해 로컬 `.md` 리포트로 정리하고, 사용자의 기본 메일 앱을 열어 `farchicken00@naver.com`(SongSeungJu)에게 보낼 초안을 채운다. **전송은 사용자가 직접** — 리포트 파일 첨부 후 전송 버튼. 자동 발송 절대 없음. sj-ship 반복 막힘 시 세션당 1회 부드럽게 제안.

## Sub-agents (Tech Lead가 디스패치)

- `sj-dev-frontend` — UI·컴포넌트·a11y·반응형 (sonnet)
- `sj-dev-backend` — API·도메인 로직 (sonnet)
- `sj-dev-database` — 스키마·마이그레이션·쿼리 (sonnet)
- `sj-dev-devops` — CI/CD·배포·인프라 (haiku)
- `sj-dev-security` — 보안 구현 + cross-cutting 리뷰 (opus)
- `sj-dev-data` — 데이터 파이프라인·ML (sonnet)
- `sj-dev-si` — SI 문서 전문 (작업 개요·제안서·요구사항·WBS·데모·결과보고서 6종 + DDD 도메인 맵) (sonnet)

## 사용법

어느 프로젝트에서든 `/s-skills`로 시작하면 현재 상태를 감지해 안내한다.
새 태스크는 `/sj-company <태스크 설명>`으로 시작하면 PM부터 자동 라우팅된다.

개발과 무관한 작업도 직접 트리거할 수 있다:
- 마케팅 캠페인 → `/marketing <내용>`
- SEO 색인 → `/seo`
- PC 자동화 → `/auto <작업 설명>`
- 문서 작성 → `/obsidian`

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DESIGN_REF_DIR` | `/Users/songseungju/awesome-design-md` | sj-design이 참조할 브랜드 DESIGN.md 루트 경로 |

## 아키텍처 원칙 (v3.4.0 기준)

- **RUN_ID**: sj-company 호출마다 `.state/current-run.txt`에 타임스탬프 ID 생성. 파이프라인 전체 추적 가능.
- **Judge 독립성**: sj-qa는 구현자(Tech Lead)가 작성한 dev-summary.md를 읽지 않음. pm-brief + 실제 파일 직접 탐색으로 독립 검증.
- **archive-only 불변식**: 영속 파일(PROJECT.md, *-context.md)은 통째 재작성 전 archive/ 백업 필수.
- **PII 마스킹**: *-context.md append 전 password/token/secret 패턴 `[REDACTED]` 치환.
- **spec 연속성**: sj-spec 저장 시 task.txt에 `[SPEC: 경로]` 자동 기록 → Tech Lead가 Dispatch Card에 포함.

## Docs Reference
- [PRD](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Status & Score](docs/STATUS.md)
- [ADR](docs/adr/)
- [Specs](docs/spec/) ← created on first spec request
