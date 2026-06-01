# 비즈니스 에이전트 패턴 카탈로그

## 패턴 1: Manager-Specialist 구조 (기본)

가장 범용적인 구조. Manager가 조율하고 Specialist가 실행한다.

```
User Request
    ↓
[Manager Agent]
  - 요청 분석
  - 적절한 Specialist 선택
  - 결과 통합
  - 최종 응답
    ↓
[Retrieval Specialist]    [Answering Specialist]    [Mutation Agent]
  - DB/API 조회              - 근거 기반 답변 생성         - DB 쓰기/수정
  - 근거 ID 반환             - 근거 없으면 거절             - 승인 후에만 실행
  - 읽기 전용                - 읽기 전용                   - 가역적 연산 우선
```

**적합한 도메인**: CRM 자동화, 고객 문의 처리, 지식 베이스 Q&A

**Work Card 예시 (Specialist 간 전달)**:
```json
{
  "task_id": "task_001",
  "objective": "고객 주문 상태 조회 및 답변",
  "context_summary": "고객 ID: C-123, 주문 ID: O-456",
  "retrieved_evidence_ids": ["doc_78", "doc_92"],
  "allowed_tools": ["read_order_db"],
  "constraints": "개인정보 마스킹 필수"
}
```

---

## 패턴 2: Pipeline Agent (순차 처리)

각 단계 출력이 다음 단계 입력이 되는 순차 파이프라인.

```
Input → [Stage 1: 전처리] → [Stage 2: 분석] → [Stage 3: 실행] → [Stage 4: 검증] → Output
```

**적합한 도메인**: 문서 처리 자동화, 데이터 ETL, 보고서 생성

**예시 (문서 처리)**:
```
원문 수신 → 언어 감지 → 핵심 추출 → 포맷 변환 → 품질 검증 → 저장
```

---

## 패턴 3: Approval-Gate Agent (승인 게이트)

위험한 작업 전에 human 또는 senior agent의 승인을 요구한다.

```
Agent → [위험 작업 감지] → [Approval Request] → Human/Senior Review
                                                        ↓
                                              승인: 실행 / 거절: 중단
```

**적합한 도메인**: 금융 거래 처리, 계약서 발송, 고객 데이터 수정

**승인 요청 스키마**:
```json
{
  "approval_id": "appr_001",
  "action": "고객 데이터 삭제",
  "affected_records": 127,
  "risk_level": "destructive",
  "requester": "cleanup_agent",
  "justification": "GDPR 삭제 요청 처리",
  "reversible": false,
  "timeout_seconds": 3600
}
```

---

## 패턴 4: Parallel Specialist (병렬 처리)

독립적인 Specialist들을 병렬 실행 후 결과를 통합한다.

```
Manager
  ├── [Specialist A] ─── 결과 A ─┐
  ├── [Specialist B] ─── 결과 B ─┤→ [Aggregator] → 최종 결과
  └── [Specialist C] ─── 결과 C ─┘
```

**적합한 도메인**: 멀티채널 데이터 수집, 경쟁사 분석, 다중 시스템 상태 확인

---

## 패턴 5: Self-Healing Loop (자가 복구)

실패 시 스스로 진단하고 재시도하는 구조. 반드시 max_failures 제한.

```
Task → 실행 → 실패 감지 → 원인 분석 → 수정 시도 → 재실행
                                              ↓ max_failures 초과
                                         Human Handoff
```

**구현 시 필수 요소**:
- `max_failures`: 최대 재시도 횟수 (권장: 3)
- `failure_log`: 각 실패의 reason, timestamp, context 기록
- `circuit_breaker`: 동일 오류 반복 시 즉시 중단

---

## Work Card 설계 원칙

Specialist 간 컨텍스트 전달 시 반드시 **압축된 Work Card**를 사용한다.

### 필수 필드
```json
{
  "task_id": "고유 작업 ID",
  "objective": "이 Specialist가 달성해야 할 목표 (1~2문장)",
  "context_summary": "필요한 배경 정보 요약 (전체 대화 X)",
  "constraints": "절대 하면 안 되는 것",
  "output_schema": "반환해야 할 데이터 형식"
}
```

### 금지 패턴
- 전체 대화 히스토리 전달 → 목표 관련 정보만
- 자유 형식 텍스트 → 구조화된 스키마
- 모호한 objective → 검증 가능한 성공 조건 명시
