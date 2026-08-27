# Feature Map (fixture)
> drift 검사 회귀 테스트용. 실제 지도가 아니다.
> F01의 경로는 저장소에 실존하고, F02의 두 경로는 존재하지 않는다.

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 컨벤션 로딩 | `skills/_conventions/README.md` | `skills/_conventions/` | 없음 | — |
| F02 | 존재하지 않는 기능 | `skills/gone.md` | `skills/missing/` | 없음 | F01 |
