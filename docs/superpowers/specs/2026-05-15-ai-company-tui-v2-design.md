# AI Company TUI v2 — 설계 스펙

**날짜:** 2026-05-15  
**범위:** TUI 레이아웃 3-컬럼 전환 + 단축키 고도화

---

## 1. 레이아웃

### 현재 (v1)
- 좌 60%: 채팅 패널 (고정 20줄, 스크롤 없음)
- 우 40%: Ctrl+L로 전체 전환 (DeptTable+BudgetBar ↔ LogPanel)

### 목표 (v2)
```
┌─ AI Company HQ ──────── PROJECT: xxx ──── 세션: 12m ─┐
│                                                        │
│  채팅 패널 (50%)  │  부서현황+예산 (25%)  │  로그 (25%) │
│                  │                       │             │
│  스크롤 가능     │  DeptTable            │  LogPanel   │
│                  │  BudgetBar            │  스크롤 가능│
│                  │                       │             │
├──────────────────────────────────────────────────────  │
│ > 입력_          ↑↓스크롤 Tab포커스 Ctrl+K초기화 ?도움│
└───────────────────────────────────────────────────────┘
```

**패널 비율:** `flexDirection="row"` — 50% / 25% / 25%  
**BudgetBar:** 부서현황 컬럼 하단에 항상 표시 (Ctrl+L 토글 제거)  
**LogPanel:** 3번째 컬럼으로 항상 표시

---

## 2. 채팅 스크롤

- `messages` 전체를 메모리에 보관, `scrollOffset` state로 표시 위치 제어
- 화면에 표시 가능한 줄 수를 `visibleHeight`로 계산해 슬라이싱
- 새 메시지 수신 시 자동으로 최하단으로 스크롤 (auto-scroll)
- 사용자가 ↑ 스크롤하면 auto-scroll 일시 정지, 최하단 도달 시 재활성화
- `scrollOffset` 표시: `─── N줄 위 ↑ ───` 상태 표시

---

## 3. 로그 패널 스크롤

- `logScrollOffset` state 추가
- Tab으로 포커스 전환 후 ↑/↓로 로그 스크롤
- 새 로그 수신 시 포커스가 로그 패널에 없으면 auto-scroll

---

## 4. 단축키 체계

| 키 | 동작 | 조건 |
|----|------|------|
| `↑` / `↓` | 포커스 패널 스크롤 | 입력창 비어있을 때 |
| `↑` / `↓` | 명령 히스토리 탐색 | 입력창에 텍스트 있을 때 (기존 입력 지우고 히스토리로 교체) |
| `PgUp` / `PgDn` | 채팅 5줄 단위 스크롤 | 항상 |
| `Tab` | 포커스 전환 (채팅 → 로그 → 채팅) | 항상 |
| `Ctrl+K` | 입력 초기화 | 항상 |
| `Ctrl+C` | 실행 중 태스크 취소 | busy=true일 때 |
| `?` | 도움말 오버레이 토글 | 항상 |
| `q` / `:q` | 앱 종료 | 입력창 비어있을 때 |

**명령 히스토리:**
- 최대 50개 보관 (`commandHistory` state)
- `historyIndex` state로 현재 위치 추적
- Enter 제출 시 히스토리 앞에 추가, `historyIndex` 리셋

**도움말 오버레이:**
- `showHelp` state (boolean)
- 오버레이 표시 중 다른 입력 차단
- 아무 키나 누르면 닫힘

---

## 5. 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/App.jsx` | 레이아웃 3-컬럼 재구성, scrollOffset/focus/history state 추가, 단축키 핸들러 통합 |
| `src/components/ChatPanel.jsx` | scrollOffset prop 받아 슬라이싱, 스크롤 상태 표시 추가 |
| `src/components/LogPanel.jsx` | scrollOffset prop 받아 슬라이싱, 포커스 표시 추가 |
| `src/components/CmdBar.jsx` | Tab 제거, Ctrl+K 힌트 추가, 포커스 표시 |
| `src/components/HelpOverlay.jsx` | 신규 — 단축키 목록 오버레이 컴포넌트 |

**삭제:**
- `App.jsx`의 `showLog` state 및 `Ctrl+L` 핸들러 (LogPanel 항상 표시로 대체)

---

## 6. 제약 사항

- `PgUp`/`PgDn`은 ink의 `useInput`에서 `key.pageUp` / `key.pageDown`으로 감지
- `Tab`은 `key.tab`으로 감지 (ink 지원 확인 필요, 안 되면 Ctrl+T로 대체)
- 터미널 너비 80 미만이면 로그 패널 자동 숨김 (2-컬럼 fallback)은 v3에서 처리
