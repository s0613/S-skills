# Feature Map (fixture — 케이스 A)
> 행동 테스트용. 실제 프로젝트가 아니다.
> F02가 F01에 의존하므로, F01을 바꾸는 스펙은 역방향으로 F02를 지목해야 한다.

## 흐름
```mermaid
flowchart LR
  F02[주문] --> F01[로그인]
```

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 로그인 | `src/lib/auth.ts` | `src/lib/auth.ts` | 없음 | — |
| F02 | 주문 | `src/lib/order.ts` | `src/lib/order.ts` | 없음 | F01 |

## 미매핑
- 없음
