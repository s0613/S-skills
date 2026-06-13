# Judge 독립성

## 규칙

**검증자(Judge)는 구현자의 자기 평가를 판정 근거로 읽지 않는다.**

sj-qa는 다음만으로 독립 검증한다:
- `.state/pm-brief.md` — 요구사항 원본 (특히 `## 완료 조건` — 기계 검증 가능한 조건을 1:1 실행·대조)
- **실제 변경 파일 직접 탐색** (`git diff --name-only` 등)

다음은 판정 근거로 금지:
- `.state/dev-summary.md` — 구현자(Tech Lead)의 자기 평가
- Result Card(`.state/dev/*.md`)의 자기 서술 — 변경 파일 목록 확인 등 참조용으로만 허용, 판정 근거 금지

## 이유

구현자의 자기 평가는 자신이 시도한 것을 기준으로 서술된다. Judge가 이를 읽으면
"무엇을 검증할지"의 프레임이 구현자 관점으로 오염된다(anchoring).
"done"은 주장이 아니라 완료 조건 충족의 결과여야 한다.

## 시행 지점

- sj-qa SKILL.md Step 2 (컨텍스트 로드) — dev-summary.md를 로드 목록에서 제외
- sj-qa SKILL.md Step 3 (태스크 수행) — pm-brief + 직접 탐색만 사용
