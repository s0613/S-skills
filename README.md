<p align="center">
  <img src="assets/banner.svg" alt="S-skills — 역할 기반 개발 오케스트레이터" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-3.1.0-7c6f4f?style=flat-square" alt="version"></a>
  <a href="https://github.com/s0613/S-skills"><img src="https://img.shields.io/badge/claude--plugin-install-3f3a2c?style=flat-square" alt="plugin"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-a99e7d?style=flat-square" alt="license"></a>
</p>

> **Claude Code용 역할 기반 개발 오케스트레이터.**  
> `/sj-company <태스크>` 하나로 모든 스킬이 자동 라우팅된다.  
> 문서화·리뷰·개발·QA·자동화·에이전트 설계까지 — 태스크를 설명하면 알아서 간다.

> 🆘 **막히거나 배포가 불안하면 `/outsource`** — 프로젝트 개요·맥락을 정리해 전문가(SongSeungJu)에게 넘길 수 있습니다. 메일 초안까지 자동 작성, 전송은 직접.

---

> ### 시작은 항상 하나
>
> ```
> /sj-company <원하는 것을 말로 설명>
> ```
>
> | 말하면 | 자동으로 |
> |--------|---------|
> | "로그인 기능 만들어줘" | PM → Tech Lead → QA 전체 파이프라인 |
> | "스펙 만들어줘" | 스펙 전문가 (5단계 정밀 명세) |
> | "이게 맞아? 코딩 전 확인" | Office Hours (6개 강제 질문 검증) |
> | "왜 이러지? 원인 파악" | 체계적 루트코즈 디버깅 |
> | "보안 점검해줘" | CSO (OWASP + STRIDE 감사) |
> | "PR 올려줘 / 배포해줘" | 릴리즈 자동화 (테스트→커버리지→PR) |
> | "회고해줘" | 주간 회고 (커밋·테스트·성장 지표) |
> | "배포 후 확인해줘" | Canary (프로덕션 상태 모니터링) |
> | "성능 측정해줘" | Benchmark (Core Web Vitals·Lighthouse) |
> | "목업 여러 개 보여줘" | Design Shotgun (4-6개 변형 병렬 생성) |
> | "옵시디언에 정리해줘" | Obsidian Writer |
> | "화면 클릭 자동화 만들어줘" | UI 자동화 전문가 (Playwright·PyAutoGUI) |
> | "매일 파일 정리 자동화" | PC 자동화 전문가 (launchd·shell) |
> | "인스타 포스팅 만들어줘" | SNS 마케팅 전문가 (카피·브랜드 검수) |
> | "네이버 블로그 SEO 글 써줘" | SNS 마케팅 전문가 (블로그·AEO·RCON) |
> | "구글 색인 등록해줘" | SEO (Search Console 브라우저 자동화) |
> | "코드 리뷰해줘" | 코드·문서·디자인 리뷰어 자동 선택 |
> | "에이전트 설계 도와줘" | 에이전트 개발 전문가 |
> | "에이전트 구조 점검해줘" | 에이전트 리뷰어 7축 심사 |

---

## 설치

```bash
# 플러그인 (권장)
claude plugin install s0613/S-skills
```

```bash
# 수동 심링크 (개발/로컬)
git clone https://github.com/s0613/S-skills.git ~/S-skills
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
```

업데이트: `cd ~/S-skills && git pull`

---

## 구조

```
skills/
├── harness/          ← 프로젝트 상태 감지 오케스트레이터
├── sj-company/       ← ★ 모든 스킬의 진입점. 태스크 → 자동 라우팅
│
├── [개발 파이프라인]
│   ├── sj-pm/            ← 요구사항·리스크·우선순위 분석
│   ├── sj-design/        ← UI/UX 시각 리뷰 (AI 티 제거 체크 포함)
│   ├── sj-tech-lead/     ← 전문 서브에이전트 병렬 디스패치 + 통합
│   ├── sj-qa/            ← 기능 검증 및 PASS/FAIL/CONDITIONAL 판정
│   └── sj-secretary/     ← 프로젝트별 현황·KPI 요약 보고
│
├── [자동화]
│   ├── sj-automation/    ← PC 시스템 자동화 (launchd·shell·Python·AppleScript)
│   └── sj-ui-auto/       ← 화면 UI 조작 자동화 (Playwright·PyAutoGUI·cliclick)
│
├── [품질·보안·릴리즈]
│   ├── sj-spec/          ← 모호한 의도 → 실행 가능한 정밀 스펙 (5단계)
│   ├── sj-investigate/   ← 체계적 루트코즈 디버깅 (가설→검증 강제)
│   ├── sj-cso/           ← OWASP Top 10 + STRIDE 보안 감사
│   ├── sj-ship/          ← 릴리즈 자동화 (테스트→커버리지→PR 오픈)
│   └── sj-retro/         ← 주간 회고 (커밋·테스트·성장 지표)
│
├── [외주 연결]
│   └── sj-outsource/     ← 막혔을 때 전문가 위임 (개요+맥락 리포트 → 메일 앱 초안, 전송은 사용자)
│
├── [마케팅·SEO]
│   ├── sj-marketing/     ← SNS·블로그 캠페인·카피·브랜드 검수 (marketing_agent 연동)
│   └── sj-seo/           ← Google Search Console + Naver 색인 자동화 (브라우저 직접 제어)
│
├── [에이전트 개발]
│   ├── sj-agent-dev/     ← 비즈니스 에이전트 설계·구현 전문가
│   └── sj-agent-review/  ← 비즈니스 에이전트 7축 리뷰어
│
├── [문서·테스트]
│   ├── docs-organize/    ← 문서 생성 + 건강 점수 (0–100)
│   ├── test-scenario/    ← 사이클 기반 테스트 하네스
│   ├── pw-loop/          ← Playwright 반복 테스트 루프
│   ├── obsidian-writer/  ← Obsidian 볼트 문서 작성
│   └── sj-dev-si/        ← SI 문서 전문가 (제안서·WBS·결과보고서 6종)
```

---

## 스킬 목록

> 모든 스킬은 `/sj-company <태스크>` 로 자동 진입 가능. 직접 트리거도 지원.

| 트리거 | sj-company 자동 감지 키워드 | 역할 |
|--------|----------------------------|------|
| `/sj-company` | — | **전체 스킬 라우터** (항상 여기서 시작) |
| `/s-skills` | — | 프로젝트 상태 감지 → 오케스트레이션 추천 |
| `/spec` | 스펙, 명세, PRD, 기능 정의 | 모호한 의도 → 실행 가능한 정밀 스펙 |
| `/office-hours` | 아이디어 검증, 이게 맞아?, 코딩 전 확인 | 6개 강제 질문 아이디어 검증 |
| `/investigate` | 왜 이러지, 원인 파악, 디버깅, 루트코즈 | 체계적 루트코즈 디버깅 |
| `/cso` | 보안 점검, 취약점, OWASP, 보안 감사 | OWASP Top 10 + STRIDE 보안 감사 |
| `/ship` | 배포해줘, PR 올려줘, 릴리즈, 머지해줘 | 릴리즈 자동화 (테스트→커버리지→PR) |
| `/retro` | 회고, retrospective, 이번 주 정리 | 주간 회고 (커밋·테스트·성장 지표) |
| `/canary` | 배포 후 확인, 프로덕션 체크, 잘 올라갔어? | 배포 후 프로덕션 상태 모니터링 |
| `/benchmark` | 성능 측정, Core Web Vitals, lighthouse | 성능 기준 측정 (전후 비교) |
| `/design-shotgun` | 목업 여러 개, 변형 생성, 다양하게 보여줘 | 4-6개 디자인 변형 병렬 생성 |
| `/obsidian` | 옵시디언, 문서화, 볼트, 노트로 | Obsidian 볼트 문서 작성 |
| `/ui-auto` | 클릭, 버튼, 화면, 이미지 인식, 웹 자동화 | 화면 UI 조작 자동화 |
| `/auto` | 자동화, 매일, 스케줄, 단축키, 파일 이동 | PC 시스템 자동화 |
| `/sns` | 마케팅, SNS, 캠페인, 카피, 인스타, 게시글, 블로그 글 | SNS·블로그 마케팅 전문가 |
| `/seo` | 색인 등록, Search Console, 구글 색인, 검색에 안 나와 | 검색 색인 자동화 (브라우저 직접 제어) |
| `/docs-organize` | — | 코드 분석 → 표준 문서 생성 → 건강 점수 |
| `/test-scenario` | — | 시나리오 생성 → 목표 통과율 달성까지 반복 |
| `/pw-loop` | — | Playwright 기반 자동화 테스트 루프 |
| `/sj-agent-dev` | 에이전트 설계, 에이전트 만들어 | 7축 기반 에이전트 아키텍처 설계·구현 |
| `/sj-agent-review` | 에이전트 점검, 에이전트 리뷰 | 에이전트 7축 심사 (점수 + PASS/WARN/FAIL) |

---

## Harness — 오케스트레이터

`/s-skills` 하나로 현재 프로젝트 상태를 읽고 무엇을 해야 할지 판단한다.

```
/s-skills
    │
    ├─ Phase 0 감사 ── .claude/agents/ + .claude/skills/ 스캔
    │       INIT    → 신규 에이전트 설계 제안
    │       EXISTS  → Case 7: 리뷰 또는 확장 선택
    │
    ├─ 업그레이드 확인 (Case 0)
    │
    ├─ sj-company 파이프라인 진행 중? (Case 5)
    │
    ├─ pw-loop 진행 중? (Case 6)
    │
    ├─ 문서 없음 (Case 1) → docs-organize 추천
    ├─ 문서 있음, 테스트 미시작 (Case 2) → pw-loop / test-scenario / sj-company 선택
    ├─ 테스트 진행 중 (Case 3) → 결과 보고 / 재생성
    └─ 완료 (Case 4) → 다음 개발 사이클 제안
```

상태 요약 출력:

```
S-skills 상태 요약
──────────────────
문서        : yes  (점수: 72/100)
test-scenario: IN_PROGRESS (사이클: 2, 통과율: 60%)
pw-loop     : NOT_STARTED
SJ Company  : dev  (태스크: 결제 기능 추가)
에이전트    : EXISTS (에이전트 3개 / 로컬 스킬 2개)
다음 추천   : 결과 블록 붙여넣기 → report 모드
```

---

## SJ Company — 역할 기반 개발 워크플로우

```
/sj-company <태스크>
        │
        ├─ Tiny/Small ──────────────────────→ 즉시 구현
        │
        ├─ Medium ──→ PM → Tech Lead ──────→ pw-loop
        │
        └─ Large ───→ PM → 단계 계획 → Tech Lead(단계별) → QA
```

### Tech Lead — 에이전트 팀 오케스트레이션

Tech Lead는 태스크를 분석해 필요한 전문 서브에이전트만 골라 병렬 디스패치한다.

```
Tech Lead
    │
    ├─ 1단계: Database (스키마 우선)
    ├─ 2단계: Backend + Security (병렬)
    └─ 3단계: Frontend (API 계약 확정 후)
              │
              └─ Security cross-review (항상)
              └─ Design 시각 리뷰 (Frontend 포함 시)
```

| 서브에이전트 | 모델 | 영역 |
|-------------|------|------|
| `sj-dev-frontend` | sonnet | UI·컴포넌트·a11y·반응형 |
| `sj-dev-backend` | sonnet | API·서버·도메인 로직 |
| `sj-dev-database` | sonnet | 스키마·마이그레이션·쿼리 |
| `sj-dev-devops` | haiku | CI/CD·배포·인프라 |
| `sj-dev-security` | opus | 보안 구현 + cross-cutting 리뷰 |
| `sj-dev-data` | sonnet | 데이터 파이프라인·ML |
| `sj-dev-si` | sonnet | SI 문서 6종 + 도메인 맵 |

### Work Card Protocol

에이전트 간 데이터 전달 규약. 모든 핸드오프는 이 스키마를 따른다.

**Dispatch Card** (Tech Lead → Sub-agent):

```
[PROJECT]  프로젝트명 · 경로 · 목표        ← 다중 프로젝트 혼동 방지
[TASK]     태스크 본문 (최대 2KB)
[CONTEXT_PATHS]  PM Brief / Dev Ctx / Prior 결과
[TEAM_CHANNEL]   시작 전 채널 읽기 + 완료 후 게시
[SCOPE]    담당 영역 · 허용 경로 · 금지 경로
[OUTPUT]   .state/dev/{role}.md 에 Result Card 저장
```

**Team Channel** (`.state/dev/_channel.md`):

에이전트들이 Tech Lead를 거치지 않고 직접 조율하는 공유 게시판.  
Database가 "nullable 컬럼 주의"를 게시하면 Backend가 직접 읽고 인지한다.

```
## [database] ✅ DONE
핵심 변경: users.oauth_provider 컬럼 추가 (nullable)
후속 에이전트 주의사항: WHERE oauth_provider IS NOT NULL 조건 필수
```

> 전체 규약: `skills/sj-tech-lead/references/work-card-protocol.md`

---

## Agent Development — 에이전트 설계 전문가

비즈니스 에이전트를 7가지 설계 축으로 검증한다.

| 축 | 핵심 질문 |
|----|----------|
| Runtime Loop | max_turns · 실패 조건 · human handoff가 코드 레벨에 있는가? |
| Orchestration | Manager는 조율만 하는가? 실행하지 않는가? |
| Role Separation | 각 Specialist의 입력·출력·권한이 좁고 분명한가? |
| Tool Hierarchy | 도구를 위험도별 5단계로 분류했는가? |
| State & Context | Work Card로 압축 전달하는가? 프롬프트에 모든 걸 넣지 않는가? |
| Guardrails | Loop 예산·circuit breaker·감정 신호 감지가 있는가? |
| Observability | run_id · structured log · 사후 재현이 가능한가? |

```bash
/sj-agent-dev    # 에이전트 설계 · 구현 안내
/sj-agent-review # 기존 에이전트 7축 심사 → 점수(0–70) + PASS/WARN/FAIL
```

---

## docs-organize

프로젝트 코드를 분석해 `docs/`를 자동 생성하고 건강 점수(0–100)를 계산한다.

```
Phase 0  기존 점수 저장
Phase 1  기술 스택 · 프로젝트 타입 분석
Phase 2  인터뷰 (코드로 알 수 없는 것만, 최대 5개)
Phase 3  docs/ 문서 생성
Phase 4  테스트 실행
Phase 5  점수 계산 → STATUS.md 업데이트
Phase 6  결과 보고
```

| 차원 | 배점 |
|------|------|
| 문서 완성도 | 25 |
| 기능 구현율 | 25 |
| 코드 품질 | 25 |
| 인프라 준비도 | 25 |

---

## test-scenario

사이클 기반 E2E 테스트 하네스. Chrome 확장으로 실행하고 목표 통과율(기본 80%)까지 반복한다.

```
generate → [유저: Chrome 확장 실행] → report → 통과율 ≥ 목표? → complete
                                          │No
                                          └── 다음 사이클 generate
```

---

## 자동 학습 (Auto-Learn)

세션 종료 시 재사용 가능한 비자명한 패턴을 `~/.claude/skills/learned/`에 자동 저장한다.

```
세션 종료 → asyncRewake 훅 → Claude 재기동 → 패턴 추출 → 저장 or 종료
```

`/evolve`로 축적된 패턴을 클러스터링해 스킬로 승격할 수 있다.

---

## 새 스킬 추가

```bash
mkdir ~/S-skills/skills/my-skill
# SKILL.md 작성 후
ln -sf ~/S-skills/skills/my-skill ~/.claude/skills/my-skill
```

`SKILL.md` 최소 구조:

```markdown
---
name: my-skill
version: 1.0.0
description: 한 줄 설명
triggers:
  - /my-skill
---
```
