# S-skills

Claude Code 커스텀 하네스 + 스킬 모음.

**하네스**(`harness`)가 프로젝트 상태를 감지해 어떤 스킬을 실행할지 오케스트레이션한다.
각 **스킬**(`docs-organize`, `test-scenario`)은 독립 호출도 가능하다.

```
skills/
├── harness/          ← 오케스트레이터. /s-skills 하나로 전체 흐름 제어
├── docs-organize/    ← 스킬. 문서 생성 + 건강 점수
├── test-scenario/    ← 스킬. 사이클 기반 테스트 하네스
├── sj-agent-dev/     ← 스킬. 비즈니스 에이전트 설계·구현 전문가
└── sj-agent-review/  ← 스킬. 비즈니스 에이전트 7축 리뷰어
```

---

## 설치

### 방법 1 — 플러그인 (권장)

```bash
claude plugin install s0613/S-skills
```

### 방법 2 — 수동 심링크 (개발/로컬)

```bash
# 1. 레포 클론
git clone https://github.com/s0613/S-skills.git ~/S-skills

# 2. 심링크 연결 (skills/ 하위 경로 기준)
ln -sf ~/S-skills/skills/harness ~/.claude/skills/s-skills
ln -sf ~/S-skills/skills/docs-organize ~/.claude/skills/docs-organize
ln -sf ~/S-skills/skills/test-scenario ~/.claude/skills/test-scenario
```

수동 설치 후 업데이트는 `cd ~/S-skills && git pull`만으로 반영.

---

## 구성 요소

| 종류 | 트리거 | 설명 |
|------|--------|------|
| **하네스** | `/s-skills` | 프로젝트 상태 감지 → docs-organize / test-scenario 오케스트레이션 |
| 스킬 | `/docs-organize` | 프로젝트 분석 → 표준 문서 생성 → 건강 점수 0–100 |
| 스킬 | `/test-scenario` | 사이클 기반 테스트 — 프롬프트 생성 → 결과 평가 → 목표 통과율 달성까지 반복 |
| 스킬 | `/sj-agent-dev` | 비즈니스 에이전트 개발 전문가 — 7가지 설계 축 기반 아키텍처 설계·구현 안내 |
| 스킬 | `/sj-agent-review` | 비즈니스 에이전트 리뷰어 — 파일·폴더 구조 분석 + 7축 점수(0~70) + PASS/WARN/FAIL 판정 |

### SJ Company (역할 기반 개발 워크플로우)

| 스킬 | 트리거 | 설명 |
|------|--------|------|
| sj-company | `/sj-company` | PM → Design → Tech Lead → QA 자동 라우터 |
| sj-pm | `/pm` | 요구사항·리스크·우선순위 분석 |
| sj-design | `/design` | UI/UX 명세 작성 + Frontend 시각 리뷰 |
| sj-tech-lead | `/tech-lead` | 전문 개발 서브에이전트 병렬 디스패치 및 통합 |
| sj-qa | `/qa` | 기능 검증 및 PASS/FAIL/CONDITIONAL 판정 |
| sj-secretary | `/secretary` | 프로젝트별 현황·다음 명령·KPI 요약 보고 |
| sj-dev-si | `/sj-dev-si` | SI 문서 전문가 (제안서·WBS·결과보고서 6종) |

---

## harness

### 역할

`/s-skills` 하나만 호출하면 현재 프로젝트 상태를 읽고 무엇을 해야 할지 판단한다.

```
┌─────────────────────────────────────────────┐
│                 /s-skills                   │
│                                             │
│  프로젝트 상태 감지 (preamble bash)          │
│    - docs/ 존재 여부 + STATUS.md 점수        │
│    - test-scenarios/ 사이클 + 통과율         │
│         ↓                                   │
│  상태에 따라 스킬 선택                        │
│    문서 없음    → docs-organize 추천          │
│    문서만 있음  → test-scenario 추천          │
│    테스트 진행  → 결과 보고 / 재생성 선택      │
│    모두 완료    → 완료 리포트                 │
│         ↓                                   │
│  선택된 스킬 호출 (Skill 도구)                │
└─────────────────────────────────────────────┘
```

### 상태 요약 출력 형식

```
S-skills 상태 요약
──────────────────
문서      : yes  (점수: 72/100)
시나리오  : IN_PROGRESS (사이클: 2, 통과율: 60%)
다음 추천 : 결과 블록 붙여넣기 → report 모드
```

---

## docs-organize

### 한 줄 설명

프로젝트 디렉토리에서 실행하면 코드를 분석하고 질문 몇 가지를 통해 `docs/` 폴더에 표준 문서를 자동 생성한다. 실행할 때마다 테스트를 돌리고 프로젝트 건강 점수(0–100)를 업데이트한다.

### 언제 쓰나

- 새 프로젝트를 시작하거나 인수받았을 때
- PRD, 아키텍처 문서가 없거나 오래된 상태일 때
- 클로드에게 이 프로젝트를 빠르게 이해시키고 싶을 때
- 주기적으로 프로젝트 상태를 점검하고 싶을 때

### 사용법

```
# 아무 프로젝트 디렉토리에서
/docs-organize
```

자연어로도 동작:
```
docs 정리
문서 정리
```

처음 실행하면 코드 분석 후 최소 1개 질문을 한다. 이미 문서가 있으면 기존 내용을 유지하면서 병합한다.

### 실행 흐름

```
1. Phase 0  기존 점수 저장 (delta 계산용)
2. Phase 1  코드 분석 — tech stack, 프로젝트 타입, 프론트엔드 여부
3. Phase 2  인터뷰 — 코드로 알 수 없는 것만 질문 (최대 5개, 최소 1개)
4. Phase 3  문서 생성 — docs/ 하위 파일 작성
5. Phase 4  테스트 실행 — 테스트 러너 자동 감지 후 실행
6. Phase 5  점수 계산 — 4개 차원 채점 후 STATUS.md 업데이트
7. Phase 6  결과 보고
```

### 생성 파일 구조

```
{project}/
├── CLAUDE.md                       ← 이 프로젝트용 Claude 지시사항 (루트)
└── docs/
    ├── prd.md                      ← 제품 요구사항
    ├── architecture.md             ← 시스템 구조 & 기술 결정
    ├── UI_GUIDE.md                 ← UI 디자인 가이드 (프론트엔드만)
    ├── STATUS.md                   ← 구현 상태 + 프로젝트 건강 점수
    └── adr/
        └── YYYY-MM-DD-{title}.md  ← Architecture Decision Records (최대 3개)
```

> `docs/spec/`은 처음부터 생성하지 않음. 첫 spec 요청 시 생성됨.

### 인터뷰 방식

코드 분석 후 아래 4가지를 모두 확신할 수 없으면 질문한다 (최대 5개, **기본 최소 1개**):

| 항목 | 예시 |
|------|------|
| 제품 목적 | "중고차 수출 업무를 자동화하는 B2B SaaS" |
| 주요 타겟 유저 | 수출 딜러, 내부 운영팀 |
| 현재 단계 | POC / MVP / Production |
| 핵심 제약 | "외부 API 없이 자체 처리", "모바일 퍼스트" 등 |

### 문서별 포맷

**prd.md**
```
Problem / Target Users / Features (in scope) / Out of Scope / Success Metrics
```

**architecture.md**
```
Overview / Tech Stack / Key Decisions / Data Flow / Constraints
```

**UI_GUIDE.md** (프론트엔드만)
```
Design Direction / Color Palette / Typography /
Spacing & Layout / Component Patterns / Motion / Do Not
```

**STATUS.md**
```
Score: XX/100  (prev: XX → +/-N)
Score Breakdown (4개 차원)
Test Results
Milestones / Features / Technical Debt / Infrastructure
```

**adr/YYYY-MM-DD-{title}.md**
```
Status / Context / Decision / Consequences
```

**CLAUDE.md** (프로젝트 루트)
```
Project Summary / Tech Stack / Conventions / Do Not / Docs Reference
```

### 점수 시스템 (0–100)

| 차원 | 배점 | 채점 기준 |
|------|------|-----------|
| 문서 완성도 | 25 | prd / architecture / ADR / STATUS / CLAUDE.md 각 5pt |
| 기능 구현율 | 25 | 테스트 통과율. 테스트 없으면 코드 구조 분석 폴백 (3–20pt) |
| 코드 품질 | 25 | 테스트 파일 존재 5pt + 통과율 최대 10pt + TODO/FIXME 최대 10pt |
| 인프라 준비도 | 25 | CI/CD 8pt + .env.example 7pt + README 5pt + 모니터링 5pt |

점수는 매 실행마다 갱신되고 이전 점수와 비교한다:
```
Score: 72 / 100  (prev: 61 → +11)
```

**기능 구현율 폴백 (테스트 없는 POC 등):**
PRD 기능 대비 구현된 코드 비율로 채점. `STATUS.md`에 `Runner: none — scored via code structure analysis` 기록.

---

## test-scenario

### 한 줄 설명

사이클 기반 테스트 하네스 — 시나리오 생성 → Chrome 확장 실행(유저) → 결과 보고 → 목표 통과율(기본 80%) 달성까지 반복.

### 언제 쓰나

- 기능 구현 후 E2E 동작 검증을 사이클 단위로 관리하고 싶을 때
- 테스트 코드 없이 Claude Chrome 확장으로 E2E 테스트를 하는 프로젝트
- 개선 → 재검증 사이클을 추적하고 통과율 목표를 달성하고 싶을 때
- 어떤 기능이 안정적이고 어떤 기능이 반복 실패하는지 추이를 보고 싶을 때

### 하네스 루프 개요

```
┌─────────────────────────────────────────────────────┐
│                   /test-scenario                    │
│                                                     │
│  [generate]  PRD+코드 분석 → 시나리오 파일 생성       │
│      ↓                                              │
│  [유저]  Chrome 확장으로 시나리오 실행 → 결과 수령     │
│      ↓                                              │
│  [report]  결과 블록 붙여넣기 → 비교 보고서 저장      │
│      ↓                                              │
│  통과율 ≥ 목표?  ──Yes──→  [complete] 완료 리포트     │
│      │No                                            │
│      └── 다음 사이클 generate (실패 기능만 재생성)    │
└─────────────────────────────────────────────────────┘
```

### 사용법

#### 1단계 — 시나리오 생성

```
/test-scenario
```

처음 실행하면 generate 모드. PRD와 코드를 분석해 기능 목록을 보여주고 확인 후 `scenarios/` 파일들을 생성한다. 이전 사이클에서 연속 PASS한 안정적인 기능은 재생성 생략.

#### 2단계 — Chrome 확장으로 실행 (유저 직접)

```
docs/test-scenarios/scenarios/YYYY-MM-DD-{feature}.md 열기
→ 프롬프트 복사
→ Claude Chrome 확장에 붙여넣기
→ 결과 수령
```

각 시나리오 파일 하단의 **결과 기록 양식**을 채워서 다음 단계에 사용한다.

#### 3단계 — 결과 보고

```
/test-scenario
[결과]
기능: 로그인
실행일: 2026-05-12
판정: FAIL
통과 단계: 2 / 4
실제 결과:
- Step 1: pass — 로그인 폼 노출 확인
- Step 2: pass — 이메일/비밀번호 입력
- Step 3: fail — 로딩 후 에러 메시지 없이 화면 멈춤
- Step 4: fail — 대시보드 미진입
메모: 네트워크 탭에서 401 확인됨
[/결과]
```

결과 블록을 포함해 실행하면 report 모드로 자동 전환. 기대 결과와 비교해 보고서를 저장하고 통과율을 계산한다. 여러 기능 결과를 한 번에 붙여넣으면 병렬로 평가한다.

#### 현황 보기

```
/test-scenario dashboard
```

전체 기능 PASS/FAIL 현황, 사이클별 추이, 현재 통과율을 표시한다.

#### 목표 통과율 변경

```
/test-scenario threshold 90
```

기본값은 80%. 목표 통과율에 도달하면 하네스가 complete 모드로 전환된다.

### 동작 흐름 (모드별)

```
generate 모드
  .state/cycle.txt 읽기 → 사이클 번호 결정
  PRD + 코드 분석
    → 기능 목록 유저 확인 (AskUserQuestion)
    → 안정적 기능 제외 (연속 PASS)
    → 기능별 scenarios/YYYY-MM-DD-{feature}.md 생성
    → README.md 인덱스 업데이트

report 모드
  [결과]...[/결과] 블록 파싱
    → 2개 이상 시 Agent로 병렬 평가
    → 각 기능: scenarios/*.md에서 기대 결과 읽기
    → 단계별 기대 vs 실제 비교
    → reports/YYYY-MM-DD-{feature}-c{N}-report.md 저장
    → .state/history.jsonl 누적
    → 통과율 계산 → 목표 달성 시 complete 모드 전환

complete 모드
  최종 리포트 출력
    → 총 사이클 수, 기능별 PASS/FAIL 요약
    → 해결된 항목 vs 잔여 이슈
    → 다음 액션 제안

dashboard 모드
  현재 통과율, 사이클 번호, 기능별 최근 판정 표시
```

### 생성 파일 구조

```
docs/test-scenarios/
├── README.md                                    ← 전체 기능 PASS/FAIL 현황 인덱스
├── .state/
│   ├── cycle.txt                               ← 현재 사이클 번호
│   ├── threshold.txt                           ← 목표 통과율 (기본 80)
│   ├── features.txt                            ← 기능 목록 (줄바꿈 구분)
│   └── history.jsonl                           ← 사이클별 결과 누적 로그
├── scenarios/
│   └── YYYY-MM-DD-{feature}.md                ← Chrome 확장에 넣을 테스트 프롬프트
├── reports/
│   └── YYYY-MM-DD-{feature}-c{N}-report.md    ← 기대 vs 실제 비교 보고서 (사이클 태그)
└── improvement/
    └── YYYY-MM-DD-improvement.md              ← 미결/해결 개선 항목 누적
```

### 시나리오 프롬프트 구조

각 `scenarios/*.md`는 Chrome 확장에 바로 붙여넣을 수 있게 구성된다:

```
## 목적
## 사전 조건 (URL, 인증 상태, 필요 데이터)
## 테스트 단계
   Step N: 실행 + 기대 결과 + 실패 조건
## 엣지 케이스
## 종합 판정 기준 (PASS / FAIL / PARTIAL 조건)
## 결과 기록 양식  ← 이걸 채워서 /test-scenario에 붙여넣으면 됨
```

### 개선 추적 방식

`history.jsonl`로 사이클별 결과가 누적되고 `README.md` 인덱스에 추이가 쌓인다:

```
기능       | 사이클 | PASS | FAIL | PARTIAL | 추이
----------|--------|------|------|---------|------
로그인     |   3    |  2   |  1   |    0    | ↑ 개선중
회원가입   |   2    |  2   |  0   |    0    | ✅ 안정
```

연속 PASS 기능은 다음 사이클 generate에서 자동 제외(안정 처리).

---

## 새 스킬 추가하기

```bash
mkdir ~/S-skills/skills/my-skill
# SKILL.md 작성
ln -sf ~/S-skills/skills/my-skill ~/.claude/skills/my-skill
```

`SKILL.md` 최소 구조:

```markdown
---
name: my-skill
version: 1.0.0
description: |
  한 줄 설명
triggers:
  - /my-skill
---

# my-skill

스킬 지시사항...
```

---

## 자동 학습 (Auto-Learn)

하네스는 세션이 끝날 때마다 자동으로 패턴을 추출해 `~/.claude/skills/learned/`에 저장한다.

### 동작 방식

```
세션 종료 (Stop)
    ↓
asyncRewake 훅 발동
    ↓
Claude 자동 재기동 (컨텍스트 유지)
    ↓
판단: 이 세션에서 배울 게 있는가?
  ├─ 있음 → ~/.claude/skills/learned/패턴명.md 자동 저장
  └─ 없음 → 조용히 종료
```

재기동된 Claude가 세션 내용을 직접 검토해 재사용 가치 있는 패턴만 골라 저장한다. 사소한 수정이나 단순 작업은 저장하지 않는다.

### 설정 방법

`~/.claude/settings.json`의 `hooks.Stop` 배열 맨 앞에 추가:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'FLAG=~/.claude/.learning-rewake-flag; if [ -f \"$FLAG\" ]; then rm \"$FLAG\"; exit 0; else touch \"$FLAG\"; exit 2; fi'",
            "asyncRewake": true,
            "rewakeMessage": "세션이 종료되었습니다. 이 세션에서 재사용 가능한 비자명한 패턴(에러 해결, 디버깅 기법, 프로젝트별 발견)이 있었다면 ~/.claude/skills/learned/[pattern-name].md 파일을 직접 Write 툴로 저장해주세요. 사소한 수정이나 단순한 작업은 저장하지 마세요. 저장할 게 없으면 아무것도 하지 마세요.",
            "rewakeSummary": "세션 패턴 자동 학습",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

플래그 파일(`~/.claude/.learning-rewake-flag`)로 무한 루프를 방지한다. 일반 세션 → 재기동 → 종료의 2회 사이클로 끝난다.

### 쌓인 패턴 클러스터링

`~/.claude/skills/learned/`에 패턴이 쌓이면 `/evolve`로 한 번에 클러스터링해 스킬/커맨드로 승격할 수 있다.

```
/evolve           # 분석만
/evolve --generate  # 파일까지 생성
```

---

## 업데이트

```bash
cd ~/S-skills && git pull
```

심링크를 그대로 두면 pull만으로 즉시 반영.
