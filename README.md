<p align="center">
  <img src="assets/banner.svg" alt="S-skills" width="720">
</p>

<p align="center">
  <a href="https://github.com/s0613/S-skills/releases"><img src="https://img.shields.io/badge/version-4.10.0-f7a521?style=flat-square&labelColor=0d0d0d" alt="version"></a>
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

## 세션 시작 시 자동 적용 — ADHD 출력 규칙

s-skills를 설치하면 **세션이 시작될 때마다** 출력 규칙 하나가 자동으로 켜집니다.
Claude가 답을 문단 속에 묻어두지 않고, **지금 할 행동부터** 쓰게 만드는 규칙입니다.

| 전 | 후 |
|---|---|
| "좋은 질문이에요! 인증 흐름을 보면 미들웨어와 토큰 검증, 쿠키 처리가 얽혀 있는데요… 도움이 되었길 바랍니다!" | `npm install jsonwebtoken@latest` 실행 후 `src/auth.ts:42` 수정 → 1. 파일 열기 2. `verifyToken` 교체 3. `npm test` |

### 출처

규칙 원문은 **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (Ayoub G., MIT)입니다.
s-skills가 만든 규칙이 아니라 **그 저장소의 `skills/i-have-adhd/SKILL.md`를 그대로 받아 씁니다.**
원 저작물은 J. Russell Ramsay · Anthony L. Rostain의 *The Adult ADHD Tool Kit*을 느슨하게 참고해,
사람의 하루 정리법이 아니라 **LLM이 답을 배치하는 방식**으로 각색한 것입니다.

10개 규칙 요약: ① 다음 행동부터 ② 여러 단계는 번호로 ③ 2분 안에 할 수 있는 다음 행동으로 끝 ④ 곁가지 억제
⑤ 매 턴 진행 상태 재고지 ⑥ 시간은 구체적 단위로 ⑦ 완료된 것을 보이게 ⑧ 오류는 담담하게 ⑨ 긴 목록은 그룹당 5개 목표로 순위화 ⑩ 서론·요약·맺음말 금지.

### 어떻게 동작하나

```
세션 시작
  └─ hooks/hooks.json (SessionStart)
       └─ hooks/adhd-bootstrap.mjs
            ├─ 끄기 플래그 있음        → 종료 (아무것도 안 함)
            ├─ 업스트림 플러그인 always-on → 종료 (중복 주입 방지)
            ├─ 캐시 없음               → git clone --depth 1
            ├─ 캐시 24시간 초과        → git pull --ff-only
            └─ SKILL.md 본문 + 출처·커밋 헤더를 컨텍스트에 주입
```

- **캐시**: `~/.claude/.cache/s-skills/i-have-adhd` — 네트워크는 **하루에 한 번만** 탑니다. 캐시가 있으면 50ms 안에 끝납니다.
- **비차단**: git이 없든, 네트워크가 끊겼든, 파일이 깨졌든 **전부 `exit 0`** 입니다. 세션 시작을 막지 않는 것이 규칙보다 우선입니다.
- **중복 방지**: 업스트림 플러그인을 직접 설치하고 `~/.claude/.i-have-adhd-always`를 만들어 두었다면, 그쪽 훅이 이미 주입하므로 s-skills는 아무것도 하지 않습니다.
- **외부 콘텐츠 표시**: 주입 헤더에 저장소 URL과 커밋 해시를 남깁니다 — 외부 문서는 지시가 아니라 데이터라는 원칙([untrusted-content](skills/_conventions/untrusted-content.md))에 따른 것입니다.

### 끄는 법

```bash
touch ~/.claude/.s-skills-adhd-off    # 영구 (훅이 즉시 무력화)
rm ~/.claude/.s-skills-adhd-off       # 다시 켜기
```

세션 중에만 끄려면 대화에서 `stop adhd mode`라고 말하면 됩니다.

---

## 보고서 다이어그램

완료 보고·조사 결과·보안 감사·회고·SI 문서에 **그림이 필요할 때**는
**[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design)** (Cathryn Lavery, MIT)으로 그립니다.
40종 에디토리얼 다이어그램 타입을 자립형 HTML + 인라인 SVG로 뽑는 스킬입니다 — 빌드도, CDN도, mermaid도 없습니다.

```bash
claude plugin marketplace add cathrynlavery/diagram-design
claude plugin install diagram-design@diagram-design
```

규칙 두 가지만 기억하면 됩니다.

1. **그림은 문장을 대체할 때만.** 컴포넌트 3개 이상의 호출 구조, 분기 있는 흐름, 시간축 계획, 역할×권한 같은 2차원 관계 — 이런 것만 그립니다. 파일 2개 고친 변경에 그림은 소음입니다. **보고서당 1~2개가 상한**입니다.
2. **포맷은 목적지가 정합니다.** 원본 자립형 HTML은 `docs/diagrams/{slug}.html`, 옵시디언 보고서엔 SVG 임베드, PR 본문엔 PNG (GitHub은 마크다운 안의 SVG를 렌더하지 않습니다).

미설치면 그림 없이 보고서를 완성하고 `미수행: diagram-design 미설치` 한 줄을 남깁니다 — 그림 때문에 보고가 막히지 않습니다.

규칙 본문: [`_conventions/report-diagram.md`](skills/_conventions/report-diagram.md)

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
| `/convert` | Word·PPT·Excel·EPub·오디오 등 Read 툴이 못 읽는 문서를 Markdown으로 변환 |
| `/ref` | 유아이볼로 출시된 앱·웹 화면 레퍼런스 조회 (패턴·컴포넌트·문구·MAU) |

---

## 구조

```
hooks/
├── hooks.json            ← SessionStart 훅 선언
└── adhd-bootstrap.mjs    ← i-have-adhd 규칙 fetch + 주입 (비차단)
scripts/
└── skill-manifest.py ← SKILL.md ↔ manifest ↔ RESOLVER ↔ CLAUDE.md 정합성 검사 (--check/--write)
skills/
├── manifest.json     ← 스킬 인벤토리 (frontmatter에서 파생, 손편집 금지)
├── RESOLVER.md       ← 라우팅 단일 사실 (트리거 → 스킬 디스패치 테이블)
├── _conventions/     ← 횡단 규칙 단일 정의 (사람 게이트·PII·archive-only·Judge 독립성·RUN_ID·friction·context-curation)
├── sj-company/       ← 모든 스킬의 진입점 (Step 0이 RESOLVER.md를 읽어 디스패치)
├── sj-pm/            ← 요구사항 분석
├── sj-design/        ← UI 설계 + 디자인 리뷰
├── sj-seed/          ← 당근 SEED 디자인 시스템 (토큰·공식 컴포넌트로만 조립)
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
├── sj-convert/       ← 문서 변환 (markitdown — Read 툴이 못 읽는 포맷)
├── sj-ref/           ← 앱 레퍼런스 조회 (유아이볼 — 출시된 실제 화면)
├── sj-loop/          ← 루프 엔지니어링
└── sj-outsource/     ← 전문가 위임
```

---

## 출처 · 크레딧

s-skills는 남의 작업 위에 서 있습니다. 가져다 쓰는 것과 아이디어를 빌린 것을 나눠 적습니다.

### 통합해 쓰는 외부 도구

| 무엇 | 어디에 쓰나 | 라이선스 |
|------|------------|----------|
| [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) — Ayoub G. | SessionStart 훅이 받아 주입하는 출력 규칙 10개 | MIT |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) — Cathryn Lavery | 보고서·SI 문서의 다이어그램 40종 | MIT |
| [daangn/seed-design](https://github.com/daangn/seed-design) — 당근 | `/seed` — SEED 토큰·공식 컴포넌트로만 UI 조립 | Apache-2.0 |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) — Microsoft | `/convert` — docx·pptx·xlsx·epub·오디오를 Markdown으로 | MIT |
| [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen) | `/screencast` — 화면 설명 영상 녹화·편집·렌더 | MIT |
| [chrisryugj/korean-law-mcp](https://github.com/chrisryugj/korean-law-mcp) | `/law` — 법제처 법령·판례 원문 조회 | MIT |
| [유아이볼 (uibowl.io)](https://uibowl.io) MCP | `/ref` — 출시된 실제 앱·웹 화면 레퍼런스 조회 | 서비스 이용약관 |
| OpenAI Codex CLI (`codex mcp-server`) | `/gpt` — GPT 교차 자문·세컨드 오피니언 | 벤더 도구 |

### 설계를 빌린 곳

| 무엇 | 어디에 반영됐나 |
|------|----------------|
| **gbrain** | 얇은 디스패처 + 단일 컨벤션 구조, filing-rules(학습 환류 notability 게이트), friction 프로토콜, manifest 정합성 가드, `doctor --remediate` (→ `/docs-organize remediate`) |
| **ponytail** | 최소 코드 사다리(YAGNI→표준 라이브러리→…→최소 코드), 의도된 단순화 `ponytail:` 주석 |
| Geoffrey Litt, *Understanding is the new bottleneck* | 서술식 완료 보고(literate diff) — 배경→의도→읽기 순서→세부 |
| Self-Harness · AHE | 셀프-하네스 게이트 — 회귀 통과한 것만 "채택 후보", 채택은 사람 게이트 |
| AI 코드 리뷰어 한계 연구 | 리뷰어 다양성·심각도 보정 — 렌즈 분리, 사소한 이슈로 차단 금지 |
| Fable 5 시스템 프롬프트 | 외부 콘텐츠는 데이터 · 정직 산출 계약 · 인용 한도 |
| J. Russell Ramsay · Anthony L. Rostain, *The Adult ADHD Tool Kit* | i-have-adhd를 경유해 출력 규칙 10개의 근거 |

s-skills 자체는 [MIT](LICENSE)입니다. 위 도구들은 각자의 라이선스를 따르며, 이 저장소는 그 사본을 담지 않고 **런타임에 받아 씁니다**.

---

<p align="center">
  막히면 <code>/outsource</code> — 전문가가 이어받습니다.
</p>
