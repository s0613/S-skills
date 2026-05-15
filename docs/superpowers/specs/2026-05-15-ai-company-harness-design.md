# AI Company Harness — Design Spec

**Date:** 2026-05-15  
**Status:** Approved  
**Author:** SongSeungJu  

---

## 개요

Claude CLI 안에서 동작하는 AI SI 회사 하네스. 사용자는 총괄자로서 AI 총괄 에이전트에게 작업을 위임하고, 총괄 에이전트는 PM·Dev·Design·QA 부서 AI에게 태스크를 분배·조율한다. Ink 기반 TUI 대시보드로 실시간 상황을 확인하고, 프로젝트 상태는 세션 간 파일로 유지된다.

---

## 아키텍처

```
사용자
  ↓ /ai-company 입력
Claude CLI Skill (진입점)
  ↓ Node child process
Ink TUI App
  ├── GM Chat Panel (왼쪽)
  ├── Department Status Panel (오른쪽 상단)
  ├── Token Budget Panel (오른쪽 하단)
  └── Command Bar (하단)
  ↓ Claude Agent 툴
Orchestrator (총괄 AI)
  ├── PM Agent
  ├── Dev Agent
  ├── Design Agent
  └── QA Agent
  ↓
State Layer (~/.ai-company/<project>/)
```

---

## TUI 레이아웃

```
┌──────────────────────────────────────────────────────────────────────┐
│  AI Company HQ            PROJECT: my-app             세션: 2h 34m  │
├──────────────────────────┬───────────────────────────────────────────┤
│  총괄 대화               │  부서 현황                                 │
│                          │                                            │
│  [총괄] 요청 분석 중.    │  ┌─────────┬──────────┬───────┬────────┐  │
│  PM 팀에 요구사항 분석   │  │ 부서    │ 상태     │ 태스크 │ 진행률 │  │
│  을 요청합니다.          │  ├─────────┼──────────┼───────┼────────┤  │
│                          │  │ PM      │ ● 진행중 │  1/3  │ ▓▓░░░  │  │
│  [나] 로그인 기능이      │  │ Dev     │ ○ 대기중 │  0/5  │ ░░░░░  │  │
│  작동 안 해, 고쳐줘      │  │ Design  │ ✓ 완료   │  2/2  │ ▓▓▓▓▓  │  │
│                          │  │ QA      │ ○ 대기중 │  0/0  │ ░░░░░  │  │
│  [총괄] Dev팀에 auth     │  └─────────┴──────────┴───────┴────────┘  │
│  모듈 점검 요청합니다.   │                                            │
│                          │  토큰 예산                                 │
│  [PM] 분석 결과: 세션    │  전체  ▓▓▓▓▓▓░░░░░  52,000 / 100,000     │
│  토큰 만료가 원인.       │  PM    ▓▓▓▓░░░░░░░   8,000 /  20,000     │
│  Dev에 수정 요청 전달.   │  Dev   ░░░░░░░░░░░      0  /  40,000     │
│                          │  Design ▓▓▓▓▓▓▓▓▓▓  20,000 /  20,000     │
│                          │  QA    ░░░░░░░░░░░      0  /  20,000     │
├──────────────────────────┴───────────────────────────────────────────┤
│  > _                           [Tab] 패널 전환  [Ctrl+L] 로그  [Q] 종료│
└──────────────────────────────────────────────────────────────────────┘
```

**상태 아이콘:** `●` 진행중 / `○` 대기중 / `✓` 완료 / `✗` 실패

---

## 에이전트 계층 구조

### 총괄 AI 처리 흐름

**1. 분석 단계**
- 사용자 입력 수신 → 작업 유형 판단
- 신규 프로젝트 → PM에게 요구사항 분석 위임
- 기존 코드 개선 → PM + Dev에게 현황 파악 지시

**2. 분배 단계**
- 순차 (버그 수정): PM → Dev → QA
- 병렬 (신규 기능): PM → Design + Dev 동시 → QA

**3. 보고 단계**
- 각 부서 완료 → 총괄 AI가 취합 → 사용자에게 요약 보고

### 부서별 전문 영역

| 부서 | 주요 역할 | 사용 툴 |
|------|-----------|---------|
| PM | 요구사항 분석, 태스크 분해, 우선순위 | Read, Glob, Write |
| Dev | 코드 구현, 버그 수정, 리팩토링 | Read, Edit, Write, Bash |
| Design | 구조 설계, UI 명세, API 설계 | Read, Write |
| QA | 테스트 작성, 검증, 버그 재현 | Read, Bash, Write |

### 부서 컨텍스트 포맷

```json
{
  "task": "로그인 세션 만료 버그 수정",
  "project_context": "~/.ai-company/my-app/state.json",
  "token_budget": 40000,
  "dependencies": ["PM 분석 결과"],
  "deliverable": "수정된 코드 + 테스트"
}
```

### 사용자 개입 시점

- 총괄이 분배 계획 제시 → 사용자 승인/수정 후 진행
- 부서 결과물 보고 → 사용자 피드백 가능
- 토큰 예산 초과 경고 → 사용자가 추가 할당 결정

---

## 상태 관리

### 파일 구조

```
~/.ai-company/
  └── <project-name>/
      ├── state.json       # 현재 진행 상태
      ├── budget.json      # 토큰 예산 현황
      ├── decisions.md     # 결정 사항 로그
      └── history/
          ├── 2026-05-15-login-bug.md
          └── 2026-05-14-auth-design.md
```

### state.json 스키마

```json
{
  "project": "my-app",
  "active_task": "로그인 세션 만료 버그",
  "phase": "dev",
  "departments": {
    "PM":  { "status": "completed", "output": "history/2026-05-15-login-bug.md" },
    "Dev": { "status": "in_progress", "subtasks": [] },
    "QA":  { "status": "waiting" }
  },
  "last_updated": "2026-05-15T11:30:00"
}
```

### budget.json 스키마

```json
{
  "total": { "allocated": 100000, "used": 52000 },
  "departments": {
    "PM":     { "allocated": 20000, "used": 8000 },
    "Dev":    { "allocated": 40000, "used": 0 },
    "Design": { "allocated": 20000, "used": 20000 },
    "QA":     { "allocated": 20000, "used": 0 }
  }
}
```

---

## 토큰 예산 시스템

1. 작업 수신 → 총괄 AI가 복잡도 기반 예산 초안 제시
2. 사용자 승인 → budget.json 저장 → 각 부서 Agent에 전달
3. 실행 중 → 소진량 실시간 업데이트 → TUI 반영
4. 80% 도달 → 총괄이 경고 보고
5. 초과 시 → 해당 부서 일시 중지, 사용자에게 추가 할당 요청

---

## 세션 복원

```
/ai-company 재진입
  → state.json 감지
  → "my-app 진행 중인 작업 발견: Dev 35% 완료. 이어서 진행할까요?"
  → Y: 총괄 AI가 컨텍스트 복원 후 재개
  → N: 새 프로젝트 or 다른 프로젝트 선택
```

---

## 기술 스택

- **진입점:** Claude CLI Skill (`/ai-company`)
- **TUI:** [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **런타임:** Node.js (기존 s-skills와 동일)
- **에이전트:** Claude `Agent` 툴 (claude-sonnet-4-6 기본, opus는 총괄에만)
- **상태 저장:** JSON 파일 (`~/.ai-company/`)
- **위치:** `skills/ai-company/` (s-skills 플러그인 내)
