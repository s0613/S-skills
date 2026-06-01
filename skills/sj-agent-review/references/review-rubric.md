# 에이전트 리뷰 루브릭 (7축 상세 기준)

각 축의 점수(0~10)와 PASS/WARN/FAIL 판정 기준을 상세히 정의한다.

---

## 축 1: Runtime Loop (런타임 루프)

**검사 목표**: 에이전트가 무한 실행되거나 예산 없이 반복하지 않는가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | max_turns + max_failures + timeout 모두 설정, 루프 종료 조건 명시, 각 조건별 처리 코드 존재 |
| 7~8 | max_turns + timeout 설정, 실패 처리 있으나 max_failures 미설정 |
| 5~6 | max_turns만 설정, timeout/failure 처리 없음 |
| 3~4 | 루프 예산 일부만 있고, 특정 조건에서 우회 가능 |
| 1~2 | `while True` 또는 재귀 호출에 중단 조건 없음 |
| 0 | 루프 예산 전혀 없음 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하 또는 `while True` with no break

**탐색 코드 패턴**:
```bash
# 좋은 패턴
grep -rn "max_turns\|max_iterations\|max_steps\|timeout" .

# 나쁜 패턴
grep -rn "while True\|while(true)\|for(;;)" .
```

---

## 축 2: Orchestration Layer (오케스트레이션)

**검사 목표**: Manager와 Specialist가 분리되어 있고 흐름이 조율되는가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | Manager 클래스/함수 분리, 각 Specialist 라우팅 로직, human handoff 조건, 결과 통합 로직 모두 명시 |
| 7~8 | Manager 분리되어 있고 라우팅 있으나 handoff 조건 미명시 |
| 5~6 | 오케스트레이션 로직이 있으나 Manager/Specialist 경계 불명확 |
| 3~4 | 단일 함수에서 모든 흐름 처리 |
| 1~2 | 선형 실행만 있고 조율 개념 없음 |
| 0 | 오케스트레이션 없음 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하

**탐색 패턴**:
```bash
# Manager 존재 확인
grep -rn "class.*Manager\|class.*Orchestrator\|def.*orchestrate\|def.*route" .

# Human handoff 확인
grep -rn "human_handoff\|require_human\|escalate\|handoff" .
```

---

## 축 3: Role Separation & Specialist Ownership (역할 분리)

**검사 목표**: 역할별로 독립된 Specialist가 존재하고 책임이 명확한가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | Specialist 2개 이상 + 각각 독립 클래스/모듈 + 입출력 스키마 타입 정의 + 권한 분리 |
| 7~8 | Specialist 2개 이상 분리, 스키마 일부만 정의 |
| 5~6 | Specialist 개념은 있으나 1개 클래스 내 메서드로만 분리 |
| 3~4 | 역할 분리 시도는 있으나 실제로 책임이 겹침 |
| 1~2 | 분리 없음, 모든 로직이 1개 클래스/함수에 |
| 0 | 만능 에이전트 1개 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하 또는 Specialist가 0개

**탐색 패턴**:
```bash
# Specialist 클래스 확인
grep -rn "class.*Specialist\|class.*Agent\|class.*Worker" .

# 입출력 스키마 확인 (Python)
grep -rn "class.*Input\|class.*Output\|TypedDict\|BaseModel\|dataclass" .

# 입출력 스키마 확인 (TypeScript)
grep -rn "interface.*Input\|interface.*Output\|type.*Schema" .
```

---

## 축 4: Tool Hierarchy (도구 계층화)

**검사 목표**: 도구가 위험도별로 분류되고 승인 정책이 적용되는가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | 모든 Tool에 레벨 명시 + Level 4 이상 승인 로직 + Level 5 human review + Tool별 timeout |
| 7~8 | Level 분류 있고 위험 Tool에 승인 있으나 일부 누락 |
| 5~6 | 위험 Tool에 확인 로직 있으나 체계적 분류 없음 |
| 3~4 | 일부 Tool에만 확인, 다수 무조건 실행 |
| 1~2 | 승인 로직 거의 없음 |
| 0 | 모든 Tool 무조건 실행, 권한 제어 없음 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하 또는 delete/drop/send 류 Tool에 승인 없음

**탐색 패턴**:
```bash
# 위험 Tool 식별
grep -rn "delete\|drop\|send_email\|send_sms\|execute\|run_command\|subprocess" .

# 승인 로직 확인
grep -rn "require_approval\|confirm\|human_review\|approval_gate" .

# DB 수정 쿼리 무방비 실행 확인
grep -rn "DELETE\|UPDATE\|DROP\|INSERT" . | grep -v "test\|#\|//"
```

---

## 축 5: State & Context Management (컨텍스트 관리)

**검사 목표**: 컨텍스트가 압축·관리되고 Work Card 패턴이 사용되는가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | Work Card 스키마 정의 + Specialist 간 압축 전달 + 전체 히스토리 미전달 + context 크기 모니터링 |
| 7~8 | 압축 전달 구현, Work Card 비공식적으로 사용 |
| 5~6 | 일부 요약하지만 대부분 원본 전달 |
| 3~4 | 컨텍스트 압축 시도는 있으나 실질적 효과 없음 |
| 1~2 | 전체 대화 히스토리를 모든 Specialist에 전달 |
| 0 | 컨텍스트 관리 전혀 없음, 무제한 누적 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하 또는 전체 히스토리 무제한 전달

**탐색 패턴**:
```bash
# Work Card 패턴 확인
grep -rn "work_card\|WorkCard\|task_card\|context_summary\|handoff" .

# 컨텍스트 누적 위험 패턴
grep -rn "messages\.append\|history\+=" . | head -20

# 토큰/컨텍스트 크기 제한
grep -rn "max_tokens\|context_limit\|trim_context\|summarize" .
```

---

## 축 6: Guardrails & Approval System (가드레일)

**검사 목표**: 위험 상황에서 자동 중단·인간 개입 메커니즘이 있는가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | circuit breaker + 감정 신호 감지 + human handoff 자동 트리거 + 위험 작업 preview + dry-run 지원 |
| 7~8 | circuit breaker 구현, handoff 조건 명시, 감정 감지 미구현 |
| 5~6 | 오류 시 재시도는 있으나 circuit breaker 없음 |
| 3~4 | 기본 try/except만 있고 가드레일 개념 없음 |
| 1~2 | 오류 무시 또는 무한 재시도 |
| 0 | 가드레일 전혀 없음 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하

**탐색 패턴**:
```bash
# Circuit breaker 확인
grep -rn "circuit_breaker\|CircuitBreaker\|consecutive_failures\|failure_count" .

# Human handoff 트리거 확인
grep -rn "human_handoff\|escalate_to_human\|pause_agent\|require_human" .

# 감정 신호 감지 (정규식 패턴)
grep -rn "frustration\|anger\|sentiment\|emotion\|signal" .

# 단순 무한 재시도 위험 패턴
grep -rn "retry\|while.*error\|except.*continue" . | head -10
```

---

## 축 7: Observability & Logging (관측 가능성)

**검사 목표**: 실행이 추적 가능하고 사후 재현이 가능한가

### 점수 기준

| 점수 | 조건 |
|------|------|
| 9~10 | run_id 전 실행 부여 + 구조화 JSON 로그 + specialist/tool/approval/failure 모두 기록 + 메트릭 연동 |
| 7~8 | run_id 있고 구조화 로그 있으나 일부 항목 누락 |
| 5~6 | 로그 있으나 비구조적 (print, f-string) |
| 3~4 | 주요 이벤트만 로깅, 대부분 누락 |
| 1~2 | 로그가 거의 없음 |
| 0 | 로깅 전혀 없음 또는 PII 노출 |

**판정**:
- PASS: 7점 이상
- WARN: 4~6점
- FAIL: 3점 이하 또는 PII 마스킹 없음

**탐색 패턴**:
```bash
# run_id 존재 확인
grep -rn "run_id\|trace_id\|correlation_id\|request_id" .

# 구조화 로그 확인
grep -rn "logger\.\|logging\.\|structlog\|winston\|pino" .

# print 남발 확인 (비구조적 로그)
grep -rn "^[[:space:]]*print(" . | wc -l

# PII 위험 패턴 (로그에 민감 정보)
grep -rn "log.*password\|log.*email\|log.*phone\|log.*ssn" .
```

---

## 폴더 구조 품질 기준

좋은 에이전트 프로젝트의 폴더 구조:

```
project/
├── agents/
│   ├── manager.py          # Manager Agent
│   ├── retrieval.py        # Retrieval Specialist
│   └── answering.py        # Answering Specialist
├── tools/
│   ├── read_tools.py       # Level 1-2: 읽기 전용
│   ├── write_tools.py      # Level 3: 쓰기
│   └── exec_tools.py       # Level 4-5: 실행/파괴적
├── schemas/
│   ├── work_card.py        # Specialist 간 전달 스키마
│   └── tool_schemas.py     # Tool 입출력 스키마
├── guardrails/
│   ├── circuit_breaker.py
│   └── approval.py
├── observability/
│   ├── logger.py           # 구조화 로그
│   └── metrics.py
├── tests/
│   ├── unit/
│   └── integration/
└── config.py               # max_turns, timeout 등
```

나쁜 구조 신호:
- `agent.py` 1개 파일에 모든 로직
- `tools/` 없이 에이전트 내부에서 직접 API 호출
- `tests/` 디렉토리 없음
- 설정값이 코드에 하드코딩
