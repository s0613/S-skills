# docs-organize — Remediate 모드 (점수 기반 치유 루프)

> SKILL.md가 인자에서 `remediate`/`점수 올려`/`치유`/`target` 을 감지하면 이 파일을 읽고 실행한다.

목표 점수까지 docs 건강 점수를 끌어올린다. gbrain `doctor --remediate --target-score` 패턴 차용:
의존성 순서로 치유 플랜을 짜고, **단계마다 재측정**하고, **자동으로 도달 불가능한 점수(천장)에서 멈추고** 사람/sj-company에 넘긴다.

> **컨벤션:** [사람 게이트](../_conventions/human-gate.md) — 플랜은 사람이 승인한 뒤에만 실행. 파일 삭제·배포는 자동 금지.
> **컨벤션:** [archive-only](../_conventions/archive-only.md) — 기존 문서를 통째 재작성하기 전 백업.

## 정지 조건 (기계 검증 가능)

루프는 다음 중 하나가 참이면 멈춘다:
1. STATUS.md `Score` ≥ 목표 점수 → **DONE**
2. 남은 부족분이 전부 **자동 치유 불가 항목**(아래 표의 "수동")뿐 → **CEILING** (천장 도달, sj-company/triage로 위임하고 멈춤)

정지 신호는 출력 문장이 아니라 STATUS.md의 `Score` 값이다.

## Step 1: 현재 점수 + 목표 확정

```bash
[ -f docs/STATUS.md ] && grep -E "^\*\*Score:\*\*|^\| (Documentation|Feature|Code|Infra)" docs/STATUS.md
```

- STATUS.md가 없으면 → 먼저 일반 docs-organize(Phase 0–6)를 1회 돌려 점수를 측정한 뒤 이 루프로 돌아온다.
- 목표 점수: 인자에서 숫자를 받으면 그 값, 없으면 AskUserQuestion으로 묻는다 (기본 제안 90).

## Step 2: 부족분 진단 + 치유 가능성 분류

차원별 부족분(= max − 현재)을 계산하고, 각 항목을 **자동 / 수동**으로 분류한다:

| 차원 | 항목 | 배점 | 치유 | 방법 |
|------|------|------|------|------|
| Documentation | prd/architecture/ADR/STATUS/CLAUDE.md | 5씩 | **자동** | docs-organize Phase 3 (누락분 생성) |
| Infra | .env.example | 7 | **자동** | 코드의 env 키에서 값 마스킹한 템플릿 생성 |
| Infra | README setup 섹션 | 5 | **자동** | 설치·실행 절차 작성 |
| Infra | CI config | 8 | **자동(제안)** | 워크플로 스캐폴드 — 실제 배포 step은 사람 검토 |
| Infra | 모니터링/로깅 | 5 | 수동 | 코드에 logger 추가 — 개발 필요 |
| Code Quality | 테스트 파일 존재 | 5 | 수동 | 테스트 작성 — 개발 필요 |
| Code Quality | TODO/FIXME 정리 | 10 | 수동 | 코드 수정 — 개발 필요 |
| Code Quality | 통과율 | 10 | 수동 | 실패 테스트 수정 — 개발 필요 |
| Feature Completion | 테스트 통과율 | 25 | 수동 | 기능 구현·테스트 통과 — 개발 필요 |

**max_reachable = 현재 점수 + 자동 항목 부족분 합.** 목표가 max_reachable보다 크면, 그 차이는 수동 항목으로만 메울 수 있다.

## Step 3: 치유 플랜 + 사람 게이트

의존성 순서(문서 → infra → 그 외)로 자동 항목 플랜을 제시한다:

```
[치유 플랜] 현재 {N}/100 → 목표 {T}/100

자동 치유 (이번 루프가 수행):
  1. docs/architecture.md 누락 → 생성 (+5)
  2. .env.example 없음 → 생성 (+7)
  3. README setup 섹션 없음 → 추가 (+5)
  예상 도달: {N+17}/100 (max_reachable)

수동 필요 (자동 불가 — 도달 천장 위):
  - 테스트 통과율 0% → +25는 기능 구현 필요 → sj-company 위임
  - TODO/FIXME 14건 → 정리 시 +10 → 개발 필요

목표 {T} 달성하려면 수동 항목이 필요합니다. 진행할까요?
  A) 자동 항목만 수행 ({N}→{N+17}), 나머지는 triage-inbox 기록
  B) 자동 수행 후 sj-company로 수동 항목 위임
  C) 취소
```

AskUserQuestion으로 승인받는다. **승인 없이 실행하지 않는다.**

## Step 4: 단계 실행 (한 번에 하나, 재측정)

승인된 자동 항목을 **하나씩** 실행하고, 각 단계 후 점수를 재측정한다:

1. 항목 1개 치유 (문서 생성 등 — 기존 문서 통째 재작성 시 [archive-only](../_conventions/archive-only.md) 백업)
2. docs-organize **Phase 5(Score Calculation)만 재실행**해 STATUS.md 점수 갱신
3. 정지 조건 확인:
   - `Score` ≥ 목표 → DONE, 종료 보고
   - 남은 게 수동뿐 → CEILING으로
4. 아니면 다음 항목으로

**한 루프 반복에서 자동 항목 최대 3개**까지만 (오버런 방지). 더 남으면 다음 반복으로.

## Step 5: 천장(CEILING) 처리

자동 항목을 다 했는데 목표 미달이면:

1. 수동 항목을 `docs/sj-company/triage-inbox.md`에 기록:
   ```
   - [ ] {날짜} [docs-remediate] 테스트 통과율 0% → Feature Completion +25, 기능 구현 필요
   - [ ] {날짜} [docs-remediate] TODO/FIXME 14건 → Code Quality +10
   ```
2. 플랜에서 사용자가 **B(sj-company 위임)**를 골랐으면 `Skill("s-skills:sj-company")` 호출하며 수동 항목을 태스크로 전달.
3. **A**를 골랐으면 멈추고 보고:
   ```
   [천장 도달] 자동 치유 완료: {N}→{M}/100
   목표 {T} 달성에 필요한 {T-M}점은 개발이 필요합니다 (triage-inbox 기록).
   → /sj-company 로 수동 항목을 진행하세요.
   ```

## 가드레일

- 플랜 승인 없이 파일을 만들거나 고치지 않는다 (사람 게이트).
- 파일 삭제·git push·PR 머지·배포 금지.
- 기존 문서 통째 재작성 전 archive-only 백업.
- 자동 치유 불가 항목을 자동으로 "한 것처럼" 점수에 반영하지 않는다 — 점수는 docs-organize Phase 5 재측정 결과로만.
- 한 반복 자동 항목 3개 초과 금지.
