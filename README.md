<p align="center">
  <img src="assets/banner.svg" alt="S-skills" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-3.12.0-f7a521?style=flat-square&labelColor=0d0d0d" alt="version"></a>
  <a href="https://github.com/s0613/S-skills"><img src="https://img.shields.io/badge/claude--plugin-install-f7a521?style=flat-square&labelColor=0d0d0d" alt="plugin"></a>
  <a href="#옵시디언-연동--하네스의-장기-기억"><img src="https://img.shields.io/badge/Obsidian-long--term%20memory-7c3aed?style=flat-square&logo=obsidian&logoColor=white&labelColor=0d0d0d" alt="obsidian"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f7a521?style=flat-square&labelColor=0d0d0d" alt="license"></a>
</p>

<p align="center">
  <strong>🇰🇷 한국어</strong>
  &nbsp;·&nbsp;
  <a href="README.en.md">🇺🇸 English</a>
  &nbsp;·&nbsp;
  <a href="README.zh.md">🇨🇳 中文</a>
  &nbsp;·&nbsp;
  <a href="README.ja.md">🇯🇵 日本語</a>
</p>

<br>

<p align="center">
  <strong>혼자서도 기업처럼.</strong>
</p>

<p align="center">
  PM, 디자이너, 개발자, QA, 보안 전문가가<br>
  Claude Code 안에서 팀처럼 움직입니다.<br>
  <sub>그리고 모든 지식과 보고서는 옵시디언 볼트에 쌓입니다 — <strong>하네스 + 장기 기억</strong>.</sub>
</p>

<br>

---

## 무엇을 하는가

S-skills는 **역할 기반 AI 개발 오케스트레이터**입니다.

요구사항 분석부터 설계, 구현, 리뷰, 배포까지 — 태스크를 말로 설명하면 필요한 전문가가 자동으로 투입됩니다. 사람처럼 협력하고, 결과만 돌려줍니다.

그리고 세션이 끝나도 일은 사라지지 않습니다. 작업 전에는 옵시디언 볼트의 축적된 지식을 읽고, 작업 후에는 보고서를 볼트에 정리해 남깁니다 — **하네스가 실행하고, 옵시디언이 기억합니다.**

```
/sj-company 로그인 기능 만들어줘
```

```
[Medium] "로그인 기능 만들어줘"
필요한 역할: database, backend, security, frontend
디스패치 순서: 1) database  2) backend + security 병렬  3) frontend
```

---

## 핵심 역할

| 역할 | 하는 일 |
|------|--------|
| **PM** | 요구사항 분석, 리스크 검토, 우선순위 정의 |
| **Design** | 레퍼런스 DNA 기반 UI 설계, AI 티 제거 검수 |
| **Tech Lead** | 전문 서브에이전트 병렬 디스패치 + 결과 통합 |
| **Frontend** | UI·컴포넌트·접근성·반응형 구현 |
| **Backend** | API·서버·도메인 로직 구현 |
| **Security** | OWASP Top 10 + STRIDE 구현 + cross-cutting 리뷰 |
| **QA** | 독립 검증 — 구현자 산출물 참조 없이 직접 탐색 |

---

## 무엇이 다른가

**전문가 수준의 협업 프로토콜**

서브에이전트들은 Tech Lead를 거치지 않고 팀 채널에서 직접 조율합니다. Database가 "nullable 컬럼 주의"를 게시하면 Backend가 직접 읽고 처리합니다.

**취향이 쌓이는 디자인 시스템**

거부한 방향은 봉인되고, 승인한 방향은 누적됩니다. 시간이 지날수록 브랜드 정체성이 선명해집니다.

**QA 독립성 보장**

QA는 구현자가 작성한 요약 문서를 읽지 않습니다. PM 브리프와 실제 파일을 직접 탐색해 편향 없이 검증합니다.

**세션이 끝나도 남는 장기 기억**

작업 전에 옵시디언 볼트의 지식을 읽고, 작업 후에 보고서를 볼트에 남깁니다. 세션은 휘발되지만 이해는 축적됩니다.

---

## 하네스 설계 — gbrain에서 가져온 6가지

[garrytan/gbrain](https://github.com/garrytan/gbrain)의 검증된 하네스 구조를 S-skills에 이식했습니다. 스킬이 늘어도 무너지지 않게 하는 골격입니다.

| # | 원칙 | 무엇을 하는가 |
|---|------|--------------|
| 1 | **2층 라우팅** | 트리거→스킬 라우팅을 [`RESOLVER.md`](skills/RESOLVER.md) 한 곳에 모음. sj-company는 얇은 디스패처가 되고(866→542줄), 두꺼운 본문은 온디맨드 로드 |
| 2 | **횡단 컨벤션 단일화** | 사람 게이트·PII·archive-only·Judge 독립성·RUN_ID·friction·context-curation을 [`_conventions/`](skills/_conventions)에 단일 정의. 규칙이 N개 스킬에 흩어져 하나만 빠뜨리는 사고를 구조적으로 제거 |
| 3 | **프릭션 루프** | 스킬 실행 중 마찰·기쁨을 한 줄 기록 → 주간 회고가 모아 개선 입력으로 소비. "마찰을 기록하는 일 자체에 마찰이 없어야" |
| 4 | **컨텍스트 위생** | 학습 누적은 notability 게이트(다음 사이클에 도움?/코드에서 못 얻나?/재사용?) 통과분만, `[run:RUN_ID]` 인용 형식으로. 잡음이 brain을 흐리지 않게 |
| 5 | **manifest 정합성** | [`scripts/skill-manifest.py`](scripts/skill-manifest.py)가 frontmatter↔디렉토리↔RESOLVER↔CLAUDE.md 버전을 기계 검사. 산문이 아니라 가드가 drift를 막음 (도입 즉시 실제 버그 3건 검출) |
| 6 | **점수 치유 루프** | `/docs-organize remediate`가 목표 점수까지 치유 플랜→승인→단계 실행·재측정. 자동 도달 불가 점수는 천장에서 멈추고 위임 |

> 전 과정에서 **사람 게이트**는 불변입니다 — PR 머지·프로덕션 배포 승인은 항상 사람이 합니다. *build the loop, stay the engineer.*

---

## 옵시디언 연동 — 하네스의 장기 기억

**옵시디언 볼트가 있을 때 이 하네스는 최상의 작업 능력을 냅니다.**

세션은 휘발되지만 볼트는 남습니다. 하네스와 볼트는 양방향으로 순환합니다:

```
        ┌── 읽기 (작업 전) ──  도메인 지식 1~3개 참조 → 산출물에 [OBSIDIAN: 경로]
하네스 ─┤
        └── 쓰기 (작업 후) ──  보고서 정리본 저장 → 40_프로젝트/{프로젝트}/보고서/
```

**읽기** — 작업을 시작하기 전에 볼트에서 태스크 도메인의 축적된 지식(디자인 시스템, 설계 원칙, 기술 결정 가이드, 프로젝트 경험)을 먼저 읽습니다. 매 작업이 과거의 결정과 지식 위에서 시작됩니다.

| 역할 | 작업 전 참조하는 볼트 폴더 |
|------|---------------------------|
| 라우팅·기술 스택 판단 (sj-company) | `00_SYSTEM/` — 프로젝트 라우터, 기술 결정 가이드 |
| 요구사항·기획 (sj-pm) | `10_지식/02_기획`, `40_프로젝트` |
| 디자인 (sj-design) | `10_지식/04_디자인` — 축적된 디자인 시스템·스타일 문서 |
| 구현 (sj-tech-lead) | `10_지식/03_설계` + 해당 도메인(프론트엔드~인프라) |

**쓰기** — 사용자가 읽는 보고서는 전부 볼트에 그 자체로 읽히는 정리본으로 저장됩니다. 나중에 찾아 읽고, 위키링크로 연결하고, 팀(미래의 나 포함)이 같은 정신 모형을 다시 로드할 수 있습니다.

| 역할 | 볼트에 남기는 보고서 |
|------|---------------------|
| Tech Lead | 완료 보고 — 서술식(배경→의도→읽기 순서→세부) |
| QA | 판정 정리본 (PASS/FAIL/CONDITIONAL + 완료 조건 대조) |
| Retro | 주간 회고 |
| Investigate | 조사 결과 (루트코즈·증거·재발 방지) |
| CSO | 보안 감사 요약 |
| Ship | 릴리즈 보고 |

- 볼트 경로는 `OBSIDIAN_VAULT_DIR` 환경 변수로 지정합니다 (기본: `$HOME/obsidian-vaults/AI 에이전트`).
- 볼트 접근은 파일 도구(Read/Grep)로 직접 — MCP를 경유하지 않아 멈춤 없이 빠릅니다.
- **볼트가 없어도 하네스는 정상 동작합니다** — 참조·저장만 건너뛰고 산출물에 `미수행:`으로 정직하게 기록합니다. 다만 장기 기억 없이 일하는 셈이라, 볼트를 갖추는 것을 권장합니다.
- 지식 문서를 직접 작성하는 것은 `/obsidian`(obsidian-writer)의 몫 — 읽기(전 스킬)·보고서 쓰기(자동)·지식 쓰기(obsidian-writer)가 순환하며 하네스가 점점 똑똑해집니다.

규칙 본문: [`_conventions/obsidian-context.md`](skills/_conventions/obsidian-context.md) (읽기) · [`_conventions/obsidian-output.md`](skills/_conventions/obsidian-output.md) (쓰기)

---

## 시작하기

```bash
claude plugin install s0613/S-skills
```

```bash
# 로컬 개발
git clone https://github.com/s0613/S-skills.git ~/S-skills
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
```

설치 후 어느 프로젝트에서나:

```
/sj-company <원하는 것을 말로>
```

---

## 주요 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/sj-company <태스크>` | **모든 것의 시작점** — 태스크를 설명하면 적절한 전문가로 자동 라우팅 |
| `/spec` | 모호한 의도 → 5단계 실행 가능한 정밀 명세 |
| `/design` | 레퍼런스 브랜드 DNA 기반 UI 설계 — 역동/절제/균형 3개 시안 HTML 브라우저 확인 후 방향 선택 |
| `/design-shotgun` | 4–6개 방향 병렬 탐색 후 선택 |
| `/investigate` | 가설 수립 → 검증 강제, 추측성 수정 금지 |
| `/cso` | OWASP + STRIDE 보안 감사 |
| `/ship` | 테스트 → 커버리지 → PR 자동화 |
| `/retro` | 커밋·테스트·프로세스 마찰(friction)·성장 지표 주간 회고 |
| `/sj-agent-dev` | 10축 기반 비즈니스 에이전트 설계 |
| `/sj-loop` | 루프 프롬프트 생성 + 드라이런·세션 반복·클라우드 스케줄 실행 |
| `/outsource` | 막혔을 때 전문가 위임 — 맥락 리포트 + 메일 초안 자동 작성 |

---

## 구조

```
scripts/
└── skill-manifest.py ← SKILL.md ↔ manifest ↔ RESOLVER ↔ CLAUDE.md 정합성 검사 (--check/--write)
skills/
├── manifest.json     ← 스킬 인벤토리 (frontmatter에서 파생, 손편집 금지)
├── RESOLVER.md       ← 라우팅 단일 사실 (트리거 → 스킬 디스패치 테이블)
├── _conventions/     ← 횡단 규칙 단일 정의 (사람 게이트·PII·archive-only·Judge 독립성·RUN_ID·friction·context-curation)
├── sj-company/       ← 모든 스킬의 진입점 (Step 0이 RESOLVER.md를 읽어 디스패치)
├── sj-pm/            ← 요구사항 분석
├── sj-design/        ← UI 설계 + 디자인 리뷰
├── sj-tech-lead/     ← 서브에이전트 오케스트레이션
├── sj-qa/            ← 독립 검증
├── sj-spec/          ← 정밀 명세
├── sj-investigate/   ← 루트코즈 디버깅
├── sj-cso/           ← 보안 감사
├── sj-ship/          ← 릴리즈 자동화
├── sj-automation/    ← PC 시스템 자동화 + 화면 UI 자동화 (`/sj-ui-auto`는 트리거 별칭)
├── sj-marketing/     ← SNS·블로그 마케팅
├── sj-seo/           ← 검색 색인 자동화
├── sj-agent-dev/     ← 에이전트 설계
├── sj-agent-review/  ← 에이전트 리뷰
├── sj-loop/          ← 루프 엔지니어링
└── sj-outsource/     ← 전문가 위임
```

---

<p align="center">
  막히면 <code>/outsource</code> — 전문가가 이어받습니다.
</p>
