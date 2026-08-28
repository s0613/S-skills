# Spec: sj-tech-lead 행동 테스트 케이스
> 작성일: 2026-08-28 | 버전: 1.0.0 | 작성자: SJ Spec

## 목적 (Why)

sj-tech-lead는 26개 스킬 중 **유일하게 행동 테스트가 없는 오케스트레이션 스킬**이다.
지금 이 스킬이 깨져도 신호가 없다 — 구조 검사(`skill-manifest.py --check`)는 플레이북에
마커가 있는지만 보고, 디스패치·집계·PROJECT.md 갱신이 망가져도 녹색불이 켜진다.

`self-harness.md`는 하네스 변경을 "회귀가 녹색일 때만" 채택하라고 규정한다. tech-lead 배선을
건드리는 제안에 대해 그 녹색불은 지금 아무것도 보증하지 못한다.

## 가정

사용자 확인을 받은 것:
- **성공 지표는 산출물 계약까지만** — 디스패치 행위(역할 선택·Dispatch Card 내용)는 단언하지 않는다.
- **진짜 서브에이전트 1개만 뜨도록** 픽스처 태스크를 설계한다. 스텁으로 대체하지 않는다.
- 이번 사이클은 **스펙까지**. 구현은 스펙을 보고 따로 결정한다.

사용자 미답변으로 가정한 것:
- 픽스처는 기존 8케이스와 같은 위치(`docs/superpowers/fixtures/behavior/`)에 둔다 (사용자 미답변).
- 실행 주체는 sj-retro Step 5b — 기존 케이스와 동일한 경로로 돌린다 (사용자 미답변).
- 비대화형 계약(`noninteractive.md`)을 따르며 `SJ_NONINTERACTIVE=1`로 실행한다 (사용자 미답변).

## 성공 기준

- 이 케이스가 **고장난 tech-lead를 잡는다**: 산출물 계약 4개 중 하나라도 빠지면 실패를 낸다.
- 케이스 1회 실행에 뜨는 서브에이전트 **1개 이하**.
- 다른 8케이스와 **동일한 단언 형태**(파일 존재 + 내용 grep)로 끝난다 — 새 실행 메커니즘을 만들지 않는다.

## 스코프

### 포함
- 픽스처 프로젝트 1개 (`docs/superpowers/fixtures/behavior/dispatch/`)
- 픽스처에 `pm-brief.md` 1개 — 역할 하나만 필요한 최소 태스크
- 픽스처 README (다른 케이스와 동일 형식)
- 픽스처 README에 케이스 I 절 + 단언 블록
- 커버리지 경계표에서 sj-tech-lead를 "미커버"에서 "케이스 I"로 이동

### 제외
- 디스패치 행위 단언 (어느 역할을 골랐는가, Dispatch Card에 `[IMPACT]`가 실렸는가)
- 리뷰 단계(Step 6·7) 검증
- 재디스패치 루프(Step 8) 검증
- 병렬 디스패치·worktree 격리 검증

### 보류 (v2)
- Dispatch Card 내용 단언 — Result Card를 들여다봐야 해 단언이 깨끗하지 않다
- sj-company Medium 경로 전체(pm→tech-lead→qa) 통합 케이스

## 사용자 스토리

- As a 하네스 유지자, I want to tech-lead 배선을 고칠 때 회귀가 실제로 돌기를, so that
  "회귀 녹색"이 구조 drift가 아니라 동작을 뜻하게 된다.
- As a sj-retro Step 5b, I want to tech-lead 관련 제안을 기존 케이스와 같은 방식으로 검증하기를,
  so that 게이트에 예외 경로를 만들지 않는다.

## 영향 범위

### 의존 (이 기능이 필요로 하는 것)
- F25 sj-tech-lead — 검증 대상 그 자체. 산출물 계약이 바뀌면 이 케이스의 단언도 바뀐다
- F18 sj-pm — 픽스처의 `pm-brief.md`가 pm 산출물 형식을 따른다
- F20 sj-retro — 이 케이스를 실행하는 주체(Step 5b)

### 역방향 (이 기능이 바뀌면 영향받는 것)
- F04 pw-loop — 지도상 F25에 의존. tech-lead 계약을 건드리면 회귀 확인 필요
- F08 sj-company — 지도상 F25에 의존. Medium 이상 경로가 tech-lead를 호출한다

### 회귀 확인 대상 테스트
- `docs/superpowers/fixtures/behavior/routing/` (F08) — sj-company 라우팅
- F04(pw-loop)는 테스트 `없음` — 이 케이스 작업 중 tech-lead 계약을 바꾸면 pw-loop 쪽은 수동 확인

## 기술 명세

### 데이터 모델 (픽스처 파일 구조)

```
docs/superpowers/fixtures/behavior/dispatch/
  README.md                                  픽스처 설명
  docs/sj-company/PROJECT.md                 goal·status·progress·next 필드 보유
  docs/sj-company/.state/pm-brief.md         역할 1개만 필요한 태스크 + 기계 검증 가능한 완료 조건
  src/greeting.ts                            수정 대상 1파일
```

`pm-brief.md`의 태스크는 **backend 역할 하나만** 필요하도록 좁힌다 — frontend가 끼면
`design-review.req` sentinel 경로가 열려 서브에이전트가 늘어난다.

### 단언 (4개 계약)

```bash
D="$T/dispatch/docs/sj-company"
[ -f "$D/.state/dev-summary.md" ]        || echo "FAIL: dev-summary 미생성"
ls "$D/.state/dev/"*.md >/dev/null 2>&1  || echo "FAIL: Result Card 미생성"
grep -q '^progress:' "$D/PROJECT.md"     || echo "FAIL: PROJECT.md progress 필드 없음"
grep -q '2026-' "$D/PROJECT.md"          || echo "FAIL: last_session 미갱신"
```

지도가 픽스처에 없으므로 `미수행: FEATURE-MAP 없음`이 dev-summary에 있어야 한다(비차단 폴백 확인):

```bash
grep -q '미수행: FEATURE-MAP 없음' "$D/.state/dev-summary.md" || echo "FAIL: 비차단 폴백 미기록"
```

### 에러 케이스
- 서브에이전트가 2개 이상 뜬다 → 픽스처 태스크가 너무 넓다. 성공 기준 위반이므로 픽스처를 좁힌다
- Result Card는 있는데 dev-summary가 없다 → 집계 단계(Step 9) 결함. 이 케이스가 잡아야 할 바로 그것
- PROJECT.md가 갱신되지 않았다 → 계약 위반. tech-lead의 명시적 책임이다

### 성능 요건
- 케이스 1회 실행 시 서브에이전트 1개 이하, 벽시계 5분 이내(다른 케이스와 같은 자릿수)

### 보안 고려사항
- 픽스처에 자격증명·PII를 넣지 않는다. `pm-brief.md`는 공개 저장소에 커밋된다
- 픽스처 실행은 `mktemp -d` 사본에서 — 원본 픽스처를 오염시키지 않는다(기존 케이스와 동일)

## 수용 기준 (Acceptance Criteria)

- [ ] `dispatch/` 픽스처가 존재하고 4개 파일을 모두 갖는다
- [ ] 케이스 I를 돌리면 서브에이전트가 1개만 뜬다
- [ ] 정상 tech-lead에 대해 단언 5개가 모두 침묵한다(통과)
- [ ] `dev-summary.md`를 지우고 다시 단언하면 `FAIL: dev-summary 미생성`이 나온다 (진단성 확인)
- [ ] `PROJECT.md`의 `progress:` 줄을 지우고 단언하면 해당 FAIL이 나온다 (진단성 확인)
- [ ] 픽스처 README와 케이스 절이 기존 8케이스와 같은 형식이다
- [ ] 커버리지 경계표에서 sj-tech-lead가 커버로 이동하고 "26개 중 8개"로 갱신된다

## 엣지 케이스

- **재진입**: 픽스처에 이전 Result Card가 남아 있으면 tech-lead의 5-resume가 디스패치를 건너뛴다.
  실행마다 `mktemp -d` 사본을 쓰므로 발생하지 않아야 하지만, 사본을 안 쓰면 케이스가 조용히 통과한다
- **지도 부재**: 픽스처에 `FEATURE-MAP.md`가 없다. 9b-2가 `미수행:`을 남기고 진행해야 하며,
  멈추면 비차단 불변식 위반이다
- **서브에이전트 실패**: 디스패치된 에이전트가 BLOCKED를 반환하면 재디스패치(최대 2회)가 돈다.
  이 경우 서브에이전트가 2개 이상 뜨므로 성능 요건과 충돌한다 — 픽스처 태스크를 실패할 수 없을 만큼
  단순하게 유지해야 한다
- **frontend 오판**: tech-lead가 태스크를 보고 frontend를 함께 고르면 sentinel 경로가 열린다.
  `[HINT:single=backend]`를 task.txt에 넣어 강제할지 결정 필요

## 제외 이유 (Out of Scope)

- **디스패치 행위 단언**: Result Card의 자기 서술을 근거로 삼아야 하는데, 그건 구현자의 자기 평가라
  Judge 독립성 원칙과 결이 맞지 않는다. 산출물 존재·형식만으로도 집계 단계 결함은 잡힌다
- **리뷰·재디스패치 검증**: 실패를 유도해야 해서 서브에이전트가 여러 개 뜬다. 성공 기준(1개 이하)과 충돌
- **통합 케이스**: sj-company Medium 경로 전체는 케이스 F(라우팅)와 이 케이스로 나눠 덮는 편이
  실패 지점 특정에 유리하다
