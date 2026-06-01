# 비즈니스 에이전트 구현 체크리스트

에이전트를 프로덕션에 배포하기 전 반드시 확인해야 할 항목들이다.

---

## Phase 1: 설계 검토

### 역할 분리 (Role Separation)
- [ ] Manager 에이전트와 Specialist 에이전트가 명확히 분리되었는가?
- [ ] 각 Specialist의 입력 스키마가 정의되었는가?
- [ ] 각 Specialist의 출력 스키마가 정의되었는가?
- [ ] 각 Specialist가 접근할 수 있는 Tool 목록이 명시되었는가?
- [ ] "만능 에이전트" 패턴이 없는가? (모든 기능이 1개 에이전트에 몰려있으면 NG)

### Loop 구조
- [ ] `max_turns` 값이 설정되었는가? (권장: 도메인에 따라 10~50)
- [ ] `max_failures` 값이 설정되었는가? (권장: 3)
- [ ] `timeout` 값이 설정되었는가?
- [ ] Loop 종료 조건이 명시되었는가? (성공, 실패, 예산 초과)
- [ ] Human handoff 진입 조건이 정의되었는가?

### Tool 계층화
- [ ] 모든 Tool이 5단계(read-only/external-read/write/exec/destructive) 중 하나로 분류되었는가?
- [ ] Level 4(exec) 이상 Tool에 명시적 승인 정책이 있는가?
- [ ] Level 5(destructive) Tool에 Human review 정책이 있는가?
- [ ] Tool별 timeout이 설정되었는가?

---

## Phase 2: 컨텍스트 관리

### Work Card 설계
- [ ] Specialist 간 전달 스키마(Work Card)가 정의되었는가?
- [ ] Work Card에 전체 대화 히스토리가 포함되지 않는가?
- [ ] Work Card의 `objective`가 검증 가능한 성공 조건을 포함하는가?
- [ ] Work Card의 `constraints`가 명시되었는가?

### 상태 관리
- [ ] 지속 규칙(system prompt)이 1,000 토큰 이내로 유지되는가?
- [ ] 중간 산출물이 session state에만 유지되는가? (프롬프트에 누적되지 않도록)
- [ ] 각 Specialist의 context window 크기가 검토되었는가?

---

## Phase 3: 가드레일

### 안전장치
- [ ] 사용자 감정 신호 감지 로직이 있는가? (분노/좌절 → human handoff)
- [ ] 위험 작업 감지 시 일시 중지 메커니즘이 있는가?
- [ ] Circuit breaker 패턴이 구현되었는가? (연속 실패 시 즉시 중단)
- [ ] 비가역적 작업 실행 전 dry-run 또는 preview 기능이 있는가?

### 에러 핸들링
- [ ] 각 Tool의 실패 케이스가 처리되었는가?
- [ ] Tool 실패 시 graceful degradation 전략이 있는가?
- [ ] 예외 상황에서 partial state가 정리되는가?

---

## Phase 4: 옵저버빌리티

### 로깅
- [ ] 모든 실행에 고유 `run_id`가 부여되는가?
- [ ] 다음 항목이 구조화 로그로 기록되는가?
  - [ ] selected specialist
  - [ ] tool name + arguments (마스킹 적용)
  - [ ] approval 여부
  - [ ] failure reason
  - [ ] 실행 시간 (latency)
- [ ] 로그로 실행을 사후 재현할 수 있는가?

### 메트릭
- [ ] 성공률(success rate)이 측정되는가?
- [ ] 평균 실행 시간이 측정되는가?
- [ ] Tool별 호출 횟수가 추적되는가?
- [ ] Human handoff 발생 빈도가 추적되는가?
- [ ] 비용(token/API call)이 추적되는가?

### 알람
- [ ] 실패율 임계값 알람이 설정되었는가?
- [ ] Loop 예산 소진 알람이 설정되었는가?
- [ ] Latency 이상 감지 알람이 설정되었는가?

---

## Phase 5: 보안

### 데이터 보호
- [ ] 개인정보(PII)가 로그에 마스킹 처리되는가?
- [ ] Tool arguments에서 민감 정보가 필터링되는가?
- [ ] Specialist 간 불필요한 정보 노출이 없는가?

### 권한 관리
- [ ] 각 Specialist가 최소 권한 원칙(Principle of Least Privilege)을 따르는가?
- [ ] API 키/시크릿이 하드코딩되지 않고 환경변수로 관리되는가?
- [ ] 외부 API 호출에 인증이 적용되었는가?

---

## Phase 6: 운영 준비

### 배포 전 테스트
- [ ] 각 Specialist 단위 테스트가 통과하는가?
- [ ] Happy path E2E 테스트가 통과하는가?
- [ ] 실패 시나리오 테스트가 통과하는가? (Tool 실패, Loop 초과, 승인 거절)
- [ ] 부하 테스트 결과가 허용 범위 내인가?

### 롤백 계획
- [ ] 에이전트 롤백 절차가 문서화되었는가?
- [ ] write/exec/destructive Tool 실행 취소 절차가 있는가?
- [ ] 장애 시 수동 처리 대체 방안이 있는가?

---

## 빠른 판정 기준

**배포 불가 (즉시 수정 필요)**:
- max_turns/max_failures 미설정
- Level 4+ Tool에 승인 정책 없음
- 로깅 미구현
- PII 마스킹 없음

**배포 주의 (모니터링 강화)**:
- Specialist가 1개뿐인 구조 (단일 에이전트)
- Work Card 미사용 (원시 컨텍스트 전달)
- Human handoff 진입 조건 미명시

**배포 권장**:
- 위 7단계 체크리스트 90% 이상 통과
- 실패 시나리오 테스트 완료
- 운영 메트릭 대시보드 준비
