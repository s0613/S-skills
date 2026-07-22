# Work Card Protocol

Tech Lead ↔ 서브에이전트 간 데이터 전달 규약.
모든 핸드오프는 이 스키마를 따른다.

---

## 1. Dispatch Card (Tech Lead → Sub-agent)

Tech Lead가 Agent() 프롬프트에 포함해야 하는 필드:

```
당신은 sj-dev-{role} 서브에이전트입니다.

[TASK]
{_TASK_CLEAN}           ← HINT 라인 제거, 최대 2KB

[CONTEXT_PATHS]
- PM Brief : docs/sj-company/.state/pm-brief.md   (있으면 직접 cat)
- Dev Ctx  : docs/sj-company/dev-context.md        (항상 cat)
- Prior    : docs/sj-company/.state/dev/{deps}.md  (의존 역할만 명시)

[SCOPE]
담당 영역: {role}
수정 가능 경로: {허용 경로 패턴 — 예: src/components/**, api/**}
금지 경로: docs/sj-company/{pm,design,dev,qa}-output.md, report.md, stage.txt

[OUTPUT]
결과를 docs/sj-company/.state/dev/{role}.md 에 저장 (Result Card 형식 준수)
```

**규칙:**
- 프롬프트 총 길이 4KB 미만 유지 (초과 시 TASK를 요약)
- Prior 경로는 실제 의존 관계가 있는 역할만 포함
- MODE 지시어가 있으면 맨 앞에 명시: `MODE=review` / `MODE=implement`

---

## 2. Result Card (Sub-agent → `.state/dev/{role}.md`)

서브에이전트가 작성하는 결과 파일 고정 스키마:

```markdown
# {role} Result — {태스크 한 줄 요약}
> {YYYY-MM-DD}

## 변경 파일
- `경로/파일.ext` — 변경 내용 한 줄
- ...

## API 계약 (Backend/Database만)
| Method | Path | Request | Response |
|--------|------|---------|---------|
| POST   | /api/... | {...} | {...} |

## 스키마 변경 (Database만)
```sql
-- 변경된 migration 요약
```

## 미해결 이슈
- [ ] 이슈 설명 (담당: {role 또는 escalate})

## Self-Review
- [ ] 본인 영역 외 파일 수정 없음
- [ ] 컨벤션 준수 (dev-context.md 기준)
- [ ] 요구사항 항목 모두 처리
```

**규칙:**
- "API 계약" 섹션은 Backend/Database 외 역할은 생략
- "스키마 변경" 섹션은 Database만 작성
- Self-Review 체크박스가 하나라도 미체크이면 Tech Lead가 재디스패치 트리거

---

## 3. 의존 관계 프로토콜

순차 호출 시 후속 에이전트는 선행 Result Card를 직접 cat한다:

```
# Dispatch Card Prior 예시 — Frontend가 Backend 계약에 의존할 때
[CONTEXT_PATHS]
- Prior: docs/sj-company/.state/dev/backend.md  ← API 계약 섹션 참고
```

**의존 순서 (고정):**

```
Database  →  Backend + Security(impl)  →  Frontend
                ↓
         Security(review) — 병렬 가능
```

후속 에이전트는 Prior 파일의 "미해결 이슈" 항목 중 자신이 처리할 수 있는 것을 인수한다.

---

## 4. 에스컬레이션 프로토콜

| 조건 | 처리 |
|------|------|
| Self-Review 미체크 항목 존재 | Tech Lead → 해당 역할 재디스패치 (카운터 +1) |
| Security review `CRITICAL`/`HIGH` | Tech Lead → 해당 역할 재디스패치 |
| Design review `FAIL` | Tech Lead → Frontend 재디스패치 |
| 재디스패치 카운터 ≥ 2 | 자동 재시도 중단 → 사용자 에스컬레이션 |

에스컬레이션 메시지 형식:

```
자동 재디스패치 한도(2회) 소진.
미해결 이슈:
- [{role}] {이슈 설명}
선택: (A) 사용자 직접 수정  (B) 강제 통과  (C) 1회 추가 허용
```

---

## 5. 팀 채널 (Team Channel)

Tech Lead를 거치지 않는 에이전트 직접 조율 채널.
`.state/dev/_channel.md`에 기록하고 후속 에이전트가 직접 읽는다.

### 채널 게시 형식

```markdown
---
## [{role}] ✅ DONE
핵심 변경: {한 줄 요약}
후속 에이전트 주의사항: {없으면 "없음"}
블로커: {없으면 "없음"}
---
```

### 사용 흐름

```
Tech Lead           Database            Backend             Frontend
    │                   │                   │                   │
    ├── 채널 초기화 ──▶│                   │                   │
    │                   │                   │                   │
    ├── Dispatch ──────▶│                   │                   │
    │                   │ 작업 완료         │                   │
    │                   ├── 채널 게시 ──────────────────────────▶ (읽기)
    │                   │                   │                   │
    ├── Dispatch ────────────────────────▶ │                   │
    │                   │  채널 읽기       │                   │
    │                   │◀─────────────────│                   │
    │                   │ Database 주의사항 인지 후 작업       │
    │                   │                   ├── 채널 게시 ──────▶ (읽기)
    │                   │                   │                   │
    ├── Dispatch ────────────────────────────────────────────▶ │
    │                   │         채널 읽기 후 작업             │
```

### 규칙

- **병렬 에이전트 간**: 채널을 쓰지만 실시간으로 읽지는 못함 (동시 실행). 주의사항은 다음 단계 에이전트가 소비
- **순차 에이전트**: 시작 전 반드시 채널 전체를 cat하여 선행 주의사항 확인
- **채널은 append-only**: 기존 내용 수정 금지, 끝에만 추가
- **수명**: Step 5 시작 시 생성 → Step 9에서 `.archive.md`로 보존 후 삭제

---

## 6. 파일 생명주기

| 파일 | 생성자 | 소비자 | 수명 |
|------|--------|--------|------|
| `.state/pm-brief.md` | sj-pm | Tech Lead, Sub-agents | 사이클 간 유지 |
| `.state/dev/{role}.md` | 각 Sub-agent | Tech Lead, 후속 Sub-agents | 사이클마다 덮어쓰기 |
| `.state/dev/_channel.md` | Tech Lead(초기화) + Sub-agents(append) | 후속 Sub-agents, Tech Lead | Step 9에서 archive 후 삭제 |
| `.state/dev/_channel.archive.md` | Tech Lead(Step 9) | 감사·디버깅 | 영속 보존 |
| `.state/dev/_review-security[-{lens}].md` | sj-dev-security (MODE=review) | Tech Lead(Step 7a·7a-1) | 사이클마다 덮어쓰기 |
| `.state/dev-summary.md` | Tech Lead | sj-company | 사이클마다 덮어쓰기 |
| `.state/design-review.req` | Tech Lead | sj-design | 소비 후 삭제 |
| `.state/design-review.md` | sj-design | Tech Lead | 사이클마다 덮어쓰기 |
| `.state/review-iterations.txt` | Tech Lead | Tech Lead | Step 9에서 삭제 |
| `dev-context.md` | Tech Lead | 모든 Sub-agents | 영속 누적 |

> **`_` 프리픽스 규약**: `.state/dev/` 안에서 `_`로 시작하는 파일은 Result Card가 **아니다**(팀 채널·리뷰 산출). Result Card 순회·참여 역할 집계는 모두 이 프리픽스를 제외한다.
>
> **sj-qa는 `dev-summary.md`의 소비자가 아니다** — [Judge 독립성](../../_conventions/README.md) 원칙상 구현자의 자기 요약을 읽지 않고 `pm-brief.md` + 실제 변경 파일을 직접 탐색한다. Result Card는 참조용으로만 열람하며 판정 근거로 쓰지 않는다.
