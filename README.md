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
| [test-scenario](#test-scenario) | `/test-scenario` | 기능별 테스트 프롬프트 생성 → 결과 비교 → 개선 방향 누적 |

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

기능별 테스트 시나리오 프롬프트를 만들고, Claude Chrome 확장으로 실행한 결과를 받아 기대 결과와 비교해 보고서를 쌓는다. 실패 항목을 추적해 점진적으로 개선하는 것이 목표.

### 언제 쓰나

- 기능 구현 후 동작 검증을 체계적으로 하고 싶을 때
- 테스트 코드 없이 Chrome 확장으로 E2E 테스트를 하는 프로젝트
- 어떤 기능이 잘 동작하고 어떤 기능이 안 되는지 추이를 보고 싶을 때
- 개선 후 전에 실패했던 항목이 해결됐는지 확인하고 싶을 때

### 사용법

**1단계 — 시나리오 생성:**
```
/test-scenario
```
처음 실행하면 generate 모드. PRD와 코드를 분석해 기능 목록을 보여주고 확인 후 시나리오 프롬프트 파일들을 생성한다.

**2단계 — Chrome 확장으로 실행 (유저 직접):**
```
docs/test-scenarios/scenarios/YYYY-MM-DD-{feature}.md 파일 열기
→ 프롬프트 내용 복사
→ Claude Chrome 확장에 붙여넣기
→ 결과 수령
```

**3단계 — 결과 저장:**
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

결과를 붙여넣으면 report 모드로 자동 전환. 기대 결과와 비교해 보고서를 저장하고 개선 방향을 도출한다.

**현황 보기:**
```
/test-scenario
→ 모드 선택에서 C 선택
```

**시나리오 업데이트 (기능 변경 후):**
```
/test-scenario update 로그인
```

### 동작 흐름

```
generate 모드
  PRD + 코드 분석
    → 기능 목록 유저 확인
    → 기능별 scenarios/*.md 생성
    → README.md 인덱스 생성

report 모드
  결과 블록 파싱
    → scenarios/*.md에서 기대 결과 읽기
    → 단계별 기대 vs 실제 비교
    → reports/*.md 저장
    → improvement.md 미결 항목 추가/업데이트
    → README.md 인덱스 갱신
```

### 생성 파일 구조

```
docs/test-scenarios/
├── README.md                               ← 전체 기능 PASS/FAIL 현황 인덱스
├── scenarios/
│   └── YYYY-MM-DD-{feature}.md            ← Chrome 확장에 넣을 테스트 프롬프트
├── reports/
│   └── YYYY-MM-DD-{feature}-report.md     ← 기대 vs 실제 비교 보고서
└── improvement/
    └── YYYY-MM-DD-improvement.md          ← 미결/해결 개선 항목 누적
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

`improvement.md`는 실패 항목을 누적한다:

```
## 미결 항목
| 기능 | 실패 단계 | 추정 원인 | 우선순위 | 첫 발견 |
|----|----|----|----|----|

## 해결된 항목
| 기능 | 해결일 | 내용 |
```

같은 기능을 여러 번 돌리면 `README.md` 인덱스에 추이가 쌓인다:

```
기능       | 총 실행 | PASS | FAIL | PARTIAL | 추이
----------|---------|------|------|---------|------
로그인     |    3    |  2   |  1   |    0    | ↑ 개선중
회원가입   |    2    |  2   |  0   |    0    | ✅ 안정
```

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
