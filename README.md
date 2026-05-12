# S-skills

Claude Code 커스텀 스킬 모음. 각 스킬은 `SKILL.md` 하나로 구성되며, 클로드가 호출 시 해당 파일의 지시사항을 따른다.

---

## 설치

```bash
# 1. 레포 클론
git clone https://github.com/s0613/S-skills.git ~/S-skills

# 2. 스킬 심링크 연결
ln -sf ~/S-skills/docs-organize ~/.claude/skills/docs-organize
ln -sf ~/S-skills/test-scenario ~/.claude/skills/test-scenario
```

새 맥이나 다른 환경에서도 위 두 줄이면 세팅 완료. 이후 업데이트는 `cd ~/S-skills && git pull`만으로 반영.

---

## 스킬 목록

| 스킬 | 트리거 | 설명 |
|------|--------|------|
| [docs-organize](#docs-organize) | `/docs-organize` | 프로젝트 분석 → 표준 문서 생성 → 건강 점수 0–100 |
| [test-scenario](#test-scenario) | `/test-scenario` | 사이클 기반 테스트 하네스 — 프롬프트 생성 → 결과 평가 → 목표 통과율 달성까지 반복 |

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
mkdir ~/S-skills/my-skill
# SKILL.md 작성
ln -sf ~/S-skills/my-skill ~/.claude/skills/my-skill
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

## 업데이트

```bash
cd ~/S-skills && git pull
```

심링크를 그대로 두면 pull만으로 즉시 반영.
