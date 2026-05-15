# AI Company Harness

Claude CLI에서 동작하는 AI SI회사 TUI 대시보드. 당신이 GM(총괄)로 명령을 내리면 PM, Dev, Design, QA 에이전트들이 실제 작업을 수행한다.

## 요구사항

- [Claude Code CLI](https://claude.ai/code) 설치 및 로그인 완료
- Node.js v18+

## 실행

```bash
# 스킬로 실행 (권장)
/ai-company

# 특정 프로젝트로 바로 진입
/ai-company my-app

# 직접 실행
cd skills/ai-company
npm install
node src/index.jsx
```

## 화면 구성

```
┌─ AI Company ─────────────────────────────────────────┐
│                                                       │
│  [채팅 패널 60%]        [부서 상태 / 로그 40%]        │
│                                                       │
│  GM: 요청 분석 중...    PM  ● 대기                   │
│  PM: 요구사항 정리 완료 Dev ● 작업 중                 │
│  Dev: 구현 시작...      Des ● 대기                   │
│                         QA  ● 대기                   │
│                                                       │
│                         [토큰 예산 바]                │
│                                                       │
├───────────────────────────────────────────────────────┤
│ > 명령 입력                          [Ctrl+L 로그]   │
└───────────────────────────────────────────────────────┘
```

## 사용법

### 프로젝트 선택
- 첫 실행 시 프로젝트 선택 화면 표시
- `↑↓` 기존 프로젝트 탐색, `Enter` 선택
- 새 프로젝트명 입력 후 `Enter`로 생성

### 명령 입력
```
> 로그인 기능을 추가해줘
> 현재 코드베이스에서 버그를 찾아 수정해줘
> 랜딩 페이지 디자인 개선해줘
```

GM이 요청을 분석해 PM → Dev/Design(병렬) → QA 순으로 자동 위임한다.

### 단축키

| 키 | 동작 |
|----|------|
| `Ctrl+L` | 부서 로그 패널 토글 |
| `Ctrl+C` | 강제 종료 |
| `q` / `:q` | 종료 |
| `y` / `n` | 예산 초과 승인/거부 |

### 토큰 예산

각 부서별 기본 예산 (토큰):

| 부서 | 기본 예산 |
|------|-----------|
| PM | 20,000 |
| Dev | 40,000 |
| Design | 20,000 |
| QA | 20,000 |

예산 초과 시 승인 요청이 표시되며, 60초 내 응답하지 않으면 자동 거부된다.

## 상태 저장 위치

```
~/.ai-company/
  <project-name>/
    state.json   # 프로젝트 상태
    budget.json  # 토큰 예산 현황
```

## 개발

```bash
# 테스트 실행
npm test

# 파일 구조
src/
├── index.jsx          # 진입점
├── App.jsx            # 메인 앱 (화면 라우팅, 예산 승인)
├── agents/
│   ├── gm.js          # GM 오케스트레이터 (Claude CLI 서브프로세스)
│   └── prompts.js     # 부서별 시스템 프롬프트
├── components/
│   ├── Header.jsx
│   ├── ChatPanel.jsx
│   ├── DeptTable.jsx
│   ├── BudgetBar.jsx
│   ├── CmdBar.jsx
│   ├── LogPanel.jsx
│   └── ProjectSelect.jsx
└── state/
    ├── manager.js     # 파일 기반 상태 관리
    └── defaults.js    # 기본값
```
