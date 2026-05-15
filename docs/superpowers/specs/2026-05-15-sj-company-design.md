# SJ Company — Design Spec

**Date:** 2026-05-15
**Status:** Approved

---

## 개요

`sj-company`는 PM/Dev/Design/QA 역할을 가진 AI 에이전트들을 하네스 스킬로 구현한 시스템이다.
기존 `ai-company` (Node.js TUI + claude CLI 서브프로세스)를 대체하며, Claude 자체가 각 역할을 수행하는 순수 마크다운 하네스로 동작한다.

---

## 아키텍처

### 스킬 구조

```
skills/sj-company/
├── SKILL.md                  # /ai 하네스 (메인 진입점)
└── skills/
    ├── pm/SKILL.md           # /pm 트리거
    ├── dev/SKILL.md          # /dev 트리거
    ├── design/SKILL.md       # /design 트리거
    └── qa/SKILL.md           # /qa 트리거
```

### 프로젝트별 상태 디렉토리

각 프로젝트 루트에 생성됨. 프로젝트마다 독립적으로 관리된다.

```
docs/ai-company/
├── .state/
│   ├── stage.txt             # 현재 단계: pm|design|dev|qa|done
│   └── task.txt              # 진행 중인 태스크 설명
├── pm-context.md             # PM 역할의 프로젝트별 뇌 (처음 실행 시 생성, 이후 누적)
├── dev-context.md            # Dev 역할의 프로젝트별 뇌
├── design-context.md         # Design 역할의 프로젝트별 뇌 (awesome-design-md 브랜드 포함)
├── qa-context.md             # QA 역할의 프로젝트별 뇌
├── pm-output.md              # PM 실행 결과물
├── design-output.md          # Design 실행 결과물
├── dev-output.md             # Dev 실행 결과물
└── qa-output.md              # QA 실행 결과물
```

### 뇌(Brain) 계층 구조

```
[Base Brain]     skills/sj-company/skills/{role}/SKILL.md  ← 역할 정의, 출력 형식, 행동 방식
                         ↓ 상속 + 프로젝트 분석으로 확장
[Project Brain]  {project}/docs/ai-company/{role}-context.md  ← 프로젝트별 최적화된 컨텍스트
```

- Base Brain: 모든 프로젝트에 공통 적용되는 역할 정의
- Project Brain: 처음 실행 시 프로젝트 코드베이스를 분석해 자동 생성. 이후 실행마다 누적·업데이트

---

## 하네스 라우팅 로직 (`/ai`)

### 인자 없음 — 상태 기반 라우팅

```
docs/ai-company/.state/stage.txt 읽기

없음 또는 비어있음 → 사용자에게 태스크 입력 받기 → PM 실행
"pm"              → 태스크 유형 분석 후 Design 또는 Dev 실행
"design"          → Dev 실행
"dev"             → QA 실행
"qa" / "done"     → 완료 요약 출력 + 새 태스크 여부 확인
```

### 인자 있음 — 의도 기반 라우팅

Claude가 메시지를 분석해 적절한 역할로 직접 라우팅:

| 의도 패턴 | 라우팅 |
|-----------|--------|
| 버그 수정 | Dev → QA |
| 디자인 요청 | Design |
| 새 기능 기획 | PM → Design + Dev → QA |
| 테스트/검증 | QA |
| 요구사항 분석 | PM |
| 구현 방법 | Dev |

---

## 각 역할 상세

### PM (`/pm`)

**책임:** 태스크 분석, 요구사항 정의, 리스크 식별, 우선순위 결정

**Project Brain 생성 시 분석 항목:**
- 프로젝트 도메인 및 목표
- 주요 사용자 및 제약조건
- 기존 PRD/스펙 문서

**출력:** `docs/ai-company/pm-output.md`
```
## 요구사항 분석
## 태스크 목록
## 리스크
## 다음 역할에 전달할 핵심 지침
```

---

### Design (`/design`)

**책임:** UI/UX 설계, 비주얼 방향 정의, 컴포넌트 명세

**awesome-design-md 참조:**
- 경로: `/Users/songseungju/awesome-design-md/design-md/`
- Project Brain 생성 시 프로젝트에 맞는 참고 브랜드를 선정해 `design-context.md`에 저장
- 실행 시 해당 브랜드의 `DESIGN.md`를 읽어 색상·타이포·컴포넌트 패턴을 컨텍스트로 주입
- 사용 가능한 브랜드: airbnb, apple, claude, cursor, figma, framer, linear.app, notion, raycast, shopify, spotify, stripe, supabase, vercel, webflow 등 71개

**출력:** `docs/ai-company/design-output.md`
```
## 디자인 요약
## 참고 브랜드/디자인 시스템
## 비주얼 방향 (색상·타이포·레이아웃)
## 컴포넌트 명세
## 산출물
```

---

### Dev (`/dev`)

**책임:** 구현 방법 제안, 코드 작성, 파일 변경 목록

**Project Brain 생성 시 분석 항목:**
- 기술 스택 (언어, 프레임워크, 주요 라이브러리)
- 디렉토리 구조 및 코드 패턴
- 기존 컨벤션

**출력:** `docs/ai-company/dev-output.md`
```
## 구현 접근법
## 변경할 파일 목록
## 구현 내용 (코드 포함)
## 우려사항
```

---

### QA (`/qa`)

**책임:** 테스트 계획 수립, 엣지케이스 식별, 최종 판정

**Project Brain 생성 시 분석 항목:**
- 기존 테스트 패턴 및 프레임워크
- 주요 검증 포인트

**출력:** `docs/ai-company/qa-output.md`
```
## 테스트 케이스
## 엣지 케이스
## 판정: PASS | FAIL | CONDITIONAL
## 발견된 이슈
```

---

## marketplace.json 등록

```json
{
  "name": "sj-company:harness",
  "trigger": "/ai",
  "description": "SJ Company 하네스. 프로젝트 상태를 감지하고 PM/Dev/Design/QA 역할로 라우팅"
},
{
  "name": "sj-company:pm",
  "trigger": "/pm",
  "description": "PM 역할. 요구사항 분석 및 태스크 정의"
},
{
  "name": "sj-company:dev",
  "trigger": "/dev",
  "description": "Dev 역할. 구현 방법 제안 및 코드 작성"
},
{
  "name": "sj-company:design",
  "trigger": "/design",
  "description": "Design 역할. UI/UX 설계 및 awesome-design-md 참조"
},
{
  "name": "sj-company:qa",
  "trigger": "/qa",
  "description": "QA 역할. 테스트 계획 및 최종 판정"
}
```

---

## 기존 ai-company와의 관계

- 기존 `skills/ai-company/` 디렉토리는 유지 (TUI 앱은 삭제하지 않음)
- 새 `skills/sj-company/`를 별도로 생성
- marketplace.json에 sj-company 스킬들 추가 등록

---

## 성공 기준

- `/ai` 호출 시 현재 프로젝트 상태를 감지해 적절한 역할을 제안한다
- `/ai <메시지>` 호출 시 의도를 분석해 올바른 역할로 라우팅된다
- 각 역할은 프로젝트별 context 파일이 없으면 자동 생성하고, 있으면 읽어서 활용한다
- Design 역할은 awesome-design-md에서 적절한 브랜드를 선택해 디자인에 반영한다
- cos_totaro, web_totaro, upflow, factsheet 등 각 프로젝트에서 독립적인 뇌를 유지한다
