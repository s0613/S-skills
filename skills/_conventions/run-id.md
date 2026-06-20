# RUN_ID 추적 계약

## 규칙

sj-company 파이프라인의 한 실행은 단일 RUN_ID로 추적된다.

| 역할 | 책임 |
|------|------|
| **생성** (sj-company Preamble) | `_RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"` 를 만들어 `docs/sj-company/.state/current-run.txt`에 기록 |
| **소비** (sj-tech-lead 등 하위 스킬) | `cat docs/sj-company/.state/current-run.txt` 로 읽는다. 파일이 없으면(독립 호출) `date +%Y%m%d-%H%M%S` 폴백으로 자체 생성 |

## 사용처

- 산출물·로그에 RUN_ID를 남겨 어느 파이프라인 실행의 결과인지 추적
- `*-context.md` 인사이트 append 시 출처 표기에 활용 가능 (어느 실행에서 배운 것인지)

## 불변

- RUN_ID는 실행당 1회만 생성한다 — 하위 스킬이 재생성하면 파이프라인 추적이 끊어진다 (폴백은 독립 호출일 때만).
- 마이그레이션 등으로 `.state`를 통째 archive할 때는 `current-run.txt`를 활성 위치에 **복원**해야 계약이 유지된다 (sj-company Preamble 마이그레이션 블록 참조).
- `current-run.txt`는 단일 활성 실행을 전제한다 — 같은 워크스페이스에서 동시·스케줄 실행이 겹치면 서로 덮어써 추적이 혼선될 수 있다 (알려진 한계).
