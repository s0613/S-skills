# sj-company Harness Fixtures

이 디렉토리는 sj-company v3 하네스의 단계 간 데이터 형식 예시를 담는다.
하네스를 수정할 때 dry-run / 회귀 검증의 기준으로 사용한다.

## 파일

| 파일 | 무엇 | 어디서 만들어지는지 |
|------|------|---------------------|
| `sample-task.txt` | sj-company가 Large 경로에서 PM 호출 전 작성하는 raw 태스크 (Medium에서는 PM 브리핑 인라인 포함) | sj-company SKILL.md Medium/Large Step 1 |
| `expected-pm-brief.md` | sj-pm Step 5가 생산하는 표준 출력 — Tech Lead가 소비 | sj-pm SKILL.md Step 5 |
| `expected-dev-summary.md` | sj-tech-lead Step 9a가 생산하는 통합 요약 — sj-qa가 소비 | sj-tech-lead SKILL.md Step 9 |
| `expected-qa-verdict.md` | sj-qa Step 5가 생산하는 판정 — sj-company가 PROJECT.md 갱신 시 소비 | sj-qa SKILL.md Step 5 |

## 검증 방법

하네스 변경 후 다음 항목을 수동 비교:

1. **PM Brief 첫 줄**: `[HINT:single=<role>]` 형식이 유지되는가? Tech Lead `_HINT_SINGLE` 추출이 fixture로 통과하는가?
   ```bash
   echo "$(cat docs/superpowers/fixtures/expected-pm-brief.md)" | grep -oE 'HINT:single=[a-z]+' | head -1 | cut -d= -f2
   ```

2. **QA Verdict 헤더 정규식**: sj-qa Step 7의 정규식 `^## 판정:\s*(PASS|FAIL|CONDITIONAL)\b`이 fixture에 매칭되는가?
   ```bash
   python3 -c "
   import re
   content = open('docs/superpowers/fixtures/expected-qa-verdict.md').read()
   m = re.search(r'^## 판정:\s*(PASS|FAIL|CONDITIONAL)\b', content, re.MULTILINE)
   print(f'verdict: {m.group(1) if m else \"NONE\"}')
   "
   ```

3. **`.state/` 휘발 경로 정합성**: fixture의 파일명이 SKILL.md들이 참조하는 경로와 일치하는가? (수동 grep)

## 사용 시나리오

- 새 스킬 추가 또는 기존 스킬 BREAKING 변경 전 — 기존 contract가 지켜지는지 dry-run
- 외부 기여자 onboarding — 단계 간 데이터 형식을 한눈에 파악
- 회귀 디버깅 — 실제 .state/* 파일이 fixture와 다르면 어느 단계에서 어긋났는지 추적

## 갱신 정책

스킬의 출력 contract(파일명/스키마)가 바뀌면 같은 PR에서 해당 fixture도 갱신한다.
fixture는 "이 시점의 ground truth"로 동작하므로 stale fixture는 잘못된 신호.
