# 컨텍스트 큐레이션 (Context Curation)

`*-context.md`(pm/dev/qa/design)는 사이클을 거듭하며 누적되는 프로젝트 brain이다.
시간이 지나도 **읽을 가치가 유지되려면** 두 규칙을 지킨다: notability 게이트로 잡음을 막고,
인용으로 출처를 남긴다.

> gbrain의 `_brain-filing-rules.md` 차용 — "빠진 인사이트는 나중에 추가할 수 있지만,
> 잡음 페이지 하나는 읽기·검색 품질을 영구히 떨어뜨린다(A missing page can be created later.
> A junk page wastes attention and degrades search quality)."

## Notability 게이트 (append 전 자문)

`## 히스토리`에 한 줄 쓰기 전에 스스로 묻는다:

1. **다음 사이클이 이걸 알면 실제로 더 나은 결정을 하나?** — 단순 작업 기록("X 파일 수정함")은 아니다.
2. **코드·git·CLAUDE.md에서 이미 얻을 수 있나?** — 그렇다면 쓰지 않는다 (중복은 brain을 흐린다).
3. **재사용 가능한 패턴·계약·취약점인가, 일회성인가?** — 일회성이면 쓰지 않는다.

**셋 다 통과할 때만 쓴다. 의심되면 쓰지 않는다.** 단순 작업이었으면 그냥 스킵한다.

## 인용 형식

```
- {YYYY-MM-DD} [run:{RUN_ID}]: {인사이트}
```

- `RUN_ID`는 `docs/sj-company/.state/current-run.txt`에서 읽는다 ([RUN_ID 추적](run-id.md)). 어느 파이프라인 실행에서 배운 것인지 추적 — 나중에 인사이트가 의심스러우면 그 실행을 되짚을 수 있다.
- 파일이 없으면(독립 호출) `[run:standalone]` 또는 RUN_ID 절을 생략하고 날짜만.
- append 전 [PII 마스킹](pii-masking.md)을 적용한다.

## 모순은 덮지 말고 표기한다

새 인사이트가 기존 히스토리 항목과 **모순**되면, 옛 줄을 조용히 지우거나 덮어쓰지 않는다.
새 줄을 추가하되 모순을 명시한다:

```
- 2026-06-13 [run:...]: 인증은 JWT 사용 (이전 2026-05-01 "세션 쿠키" 기록을 대체 — 마이그레이션됨)
```

옛 사실이 왜·언제 바뀌었는지가 brain의 가치다. 단순 덮어쓰기는 그 이력을 잃는다.

## 적용 지점

| 스킬 | 지점 | 파일 |
|------|------|------|
| sj-pm | Step 6 | pm-context.md |
| sj-tech-lead | 9c | dev-context.md |
| sj-qa | Step 8 | qa-context.md |
| sj-design | Step R-4 | design-context.md |

큐레이션(200줄 임계 초과 시 통합)은 [archive-only](archive-only.md) 백업 후 수행 — sj-company SKILL.md "context.md 큐레이션 트리거" 참조.
