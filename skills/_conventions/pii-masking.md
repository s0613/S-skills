# PII 마스킹

## 규칙

영속 파일(`*-context.md`, 외주 리포트 등 git에 남는 모든 기록)에 텍스트를 append·작성하기 전,
민감 정보를 `[REDACTED]`로 치환한다.

## 정규 패턴 (canonical)

```
password|token|secret|api.?key|Bearer|private.?key
```

위 패턴에 해당하는 **값**(키 이름이 아니라 값)을 `[REDACTED]`로 치환한다.

## 적용 지점

| 스킬 | 지점 |
|------|------|
| 역할 스킬 전부 (sj-pm·sj-tech-lead·sj-qa·sj-design 등) | 볼트 학습 환류(`30_경험`·`40_프로젝트`) append 전 — [context-curation](context-curation.md) |
| sj-outsource | 외주 리포트(.md) 작성 전 — 외부로 나가는 문서이므로 가장 엄격하게 |
| sj-agent-dev / sj-agent-review | 에이전트 메모리 설계·심사 기준 (장기 메모리에 PII 무방비 저장 금지) |

## 패턴 변경 절차

1. 이 파일의 정규 패턴을 수정한다.
2. 인라인 사본을 찾아 전부 동기화한다: `grep -rn "REDACTED" skills/*/SKILL.md agents/*.md`
