# 도구 계층화 기준표

에이전트에 부여할 도구(Tool)는 위험도에 따라 5단계로 분류하고, 각 등급마다 승인 정책을 다르게 적용한다.

## 5단계 분류

### Level 1: read-only (읽기 전용)
**정의**: 시스템 상태를 변경하지 않는 조회 작업

**예시**:
- 데이터베이스 SELECT 쿼리
- 파일 읽기
- API GET 요청
- 내부 지식베이스 검색

**승인 정책**: 즉시 실행, 로그만 기록

**구현 예시**:
```python
@tool(level="read-only")
async def search_customer_db(query: str) -> list[Customer]:
    return await db.select("customers", where=query)
```

---

### Level 2: external-read (외부 읽기)
**정의**: 외부 시스템에서 데이터를 가져오는 작업 (요금/할당량 발생 가능)

**예시**:
- 외부 API 호출 (OpenAI, Google, Slack 등)
- 외부 DB 조회
- 웹 스크래핑
- 이메일 수신함 읽기

**승인 정책**: 로그 기록 + 사용량 추적 후 실행

**구현 예시**:
```python
@tool(level="external-read", track_usage=True)
async def fetch_external_crm(customer_id: str) -> dict:
    log_tool_call("external_crm_read", customer_id)
    return await external_crm_api.get(customer_id)
```

---

### Level 3: write (쓰기)
**정의**: 내부 시스템 상태를 변경하는 작업 (가역적)

**예시**:
- 데이터베이스 INSERT/UPDATE
- 파일 생성/수정
- 캐시 업데이트
- 내부 상태 변경

**승인 정책**: 변경 내용 확인 후 실행, 변경 전 스냅샷 저장

**구현 예시**:
```python
@tool(level="write", require_confirmation=True, snapshot_before=True)
async def update_customer_status(customer_id: str, status: str) -> bool:
    snapshot = await db.get("customers", customer_id)
    await snapshots.save(snapshot)
    return await db.update("customers", customer_id, {"status": status})
```

---

### Level 4: exec (실행)
**정의**: 외부 시스템에 영향을 주는 작업 또는 중요한 비즈니스 이벤트 트리거

**예시**:
- 이메일/SMS 발송
- 결제 요청
- 외부 API POST/PUT/DELETE
- Slack/Teams 메시지 전송
- 웹훅 트리거

**승인 정책**: 명시적 승인 필수 (자동 승인 불가), 실행 전 preview 제공

**구현 예시**:
```python
@tool(level="exec", require_explicit_approval=True)
async def send_customer_email(to: str, subject: str, body: str) -> bool:
    approval = await request_approval({
        "action": "send_email",
        "to": to,
        "subject": subject,
        "preview": body[:200]
    })
    if not approval.granted:
        raise ApprovalDeniedError(approval.reason)
    return await email_service.send(to, subject, body)
```

---

### Level 5: destructive (파괴적)
**정의**: 되돌리기 어렵거나 불가능한 작업

**예시**:
- 데이터베이스 DELETE/DROP
- 파일 영구 삭제
- 계정 비활성화
- 대량 데이터 처리
- 프로덕션 배포

**승인 정책**: Human review 필수 + 이중 확인 + 실행 후 감사 로그

**구현 예시**:
```python
@tool(level="destructive", require_human_review=True, audit_log=True)
async def delete_customer_data(customer_id: str) -> bool:
    await audit_log.record({
        "action": "customer_data_deletion",
        "customer_id": customer_id,
        "requested_by": current_agent,
        "timestamp": datetime.utcnow()
    })
    human_approval = await require_human_approval(
        f"고객 {customer_id}의 모든 데이터를 영구 삭제합니다. 계속하시겠습니까?"
    )
    if not human_approval:
        return False
    return await db.delete_all(customer_id)
```

---

## 도메인별 권장 Tool 구성

### CRM 자동화 에이전트
| 도구 | Level | 비고 |
|------|-------|------|
| 고객 정보 조회 | read-only | - |
| 외부 CRM API 조회 | external-read | 사용량 추적 |
| 고객 상태 업데이트 | write | 스냅샷 필수 |
| 이메일 발송 | exec | 명시적 승인 |
| 고객 데이터 삭제 | destructive | Human review |

### 주문 처리 에이전트
| 도구 | Level | 비고 |
|------|-------|------|
| 재고 조회 | read-only | - |
| 결제 상태 확인 | external-read | - |
| 주문 상태 변경 | write | - |
| 결제 처리 | exec | 명시적 승인 |
| 주문 취소·환불 | exec | 명시적 승인 |
| 대량 주문 취소 | destructive | Human review |

---

## 공통 가드레일

모든 레벨에 공통 적용:

```python
GLOBAL_GUARDRAILS = {
    "max_calls_per_minute": 60,
    "max_calls_per_run": 500,
    "timeout_seconds": 30,
    "retry_on_failure": {
        "max_retries": 3,
        "backoff": "exponential",
        "circuit_breaker_threshold": 5  # 5회 연속 실패 시 차단
    }
}
```
