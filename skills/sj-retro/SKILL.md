---
name: sj-retro
version: 1.2.1
description: |
  주간 엔지니어링 회고 에이전트. 프로젝트별 배송 지표·테스트 건강도·프로세스 마찰·성장 기회를 분석한다.
  "회고", "retro", "이번 주 정리", "retrospective", "지난주 리뷰" 요청에 반응.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
triggers:
  - /sj-retro
  - /retro
---

# SJ Retro — 주간 엔지니어링 회고

> **원칙: 숫자로 말하고, 패턴에서 배운다**
> 감정적 회고 대신 커밋·테스트·이슈 데이터로 한 주를 돌아본다.

---

## Step 0: 회고 범위 설정

```bash
# 기본값: 지난 7일
SINCE=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d 2>/dev/null || echo "1 week ago")
UNTIL=$(date +%Y-%m-%d)
echo "회고 범위: $SINCE ~ $UNTIL"

# 기본: 현재 프로젝트(cwd)만 — 프라이버시·성능을 위해 홈 전체를 뒤지지 않는다
ls docs/sj-company/PROJECT.md 2>/dev/null && echo "(현재 프로젝트)" || echo "현재 디렉토리에 sj-company 프로젝트 없음"
```

**`/retro global` 호출 시에만** 사용자에게 알린 뒤 홈 전체를 탐색한다 (그 외에는 위 cwd 한정):
```bash
find ~ -name "PROJECT.md" -path "*/sj-company/*" 2>/dev/null | head -10
```

---

## Step 1: 배송 지표

```bash
# 이번 주 커밋 수
git log --oneline --since="$SINCE" --until="$UNTIL" 2>/dev/null | wc -l

# 커밋 타입 분류 (feat / fix / refactor / docs / test / chore)
git log --format="%s" --since="$SINCE" --until="$UNTIL" 2>/dev/null | \
  awk '{
    if ($0 ~ /^feat/) feat++;
    else if ($0 ~ /^fix/) fix++;
    else if ($0 ~ /^refactor/) refactor++;
    else if ($0 ~ /^test/) test_++;
    else if ($0 ~ /^docs/) docs++;
    else other++;
  }
  END {
    print "feat:", feat+0
    print "fix:", fix+0
    print "refactor:", refactor+0
    print "test:", test_+0
    print "docs:", docs+0
    print "other:", other+0
  }'

# 변경된 파일 수
git diff --name-only HEAD~7 HEAD 2>/dev/null | wc -l

# 라인 변경
git diff --stat HEAD~7 HEAD 2>/dev/null | tail -1
```

---

## Step 2: 테스트 건강도

```bash
# 테스트 파일 수
find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" 2>/dev/null | \
  grep -v node_modules | grep -v .git | wc -l

# 테스트 실행 및 결과
if [ -f "package.json" ]; then
  npm test 2>&1 | grep -E "Tests:|passed|failed|Test Suites:" | tail -5
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
  pytest --tb=no -q 2>&1 | tail -5
elif [ -f "go.mod" ]; then
  go test ./... 2>&1 | grep -E "ok|FAIL" | head -10
fi

# 커버리지 트렌드 (이전 보고서 대비)
[ -f "docs/sj-company/retro-history.md" ] && \
  grep "커버리지:" docs/sj-company/retro-history.md | tail -3
```

---

## Step 3: QA 판정 히스토리

```bash
# 이번 주 QA 결과
[ -f "docs/sj-company/.state/qa-verdict.md" ] && \
  grep "## 판정:" docs/sj-company/.state/qa-verdict.md | head -5

# archive에서 최근 판정들
ls docs/sj-company/archive/*.qa-verdict.md 2>/dev/null | \
  xargs -I{} grep "## 판정:" {} 2>/dev/null | tail -10
```

---

## Step 4: 배송 스트리크 + 블로커

```bash
# 연속 배송일 계산
git log --format="%ad" --date=short --since="$SINCE" 2>/dev/null | sort -u | wc -l

# 현재 블로커
[ -f "docs/sj-company/PROJECT.md" ] && grep "^blockers:" docs/sj-company/PROJECT.md

# 지난 주 블로커였던 것들 (히스토리)
[ -f "docs/sj-company/retro-history.md" ] && \
  grep "블로커:" docs/sj-company/retro-history.md | tail -3
```

---

## Step 4b: 프로세스 마찰 신호 (friction)

> **컨벤션:** [프릭션 로그](../_conventions/friction-log.md) — 스킬 실행 중 쌓인 마찰·기쁨 신호를 회고에 반영한다.

```bash
python3 - "$SINCE" <<'PY'
import json, os, sys
from collections import Counter
f = "docs/sj-company/friction.jsonl"
if not os.path.exists(f):
    print("friction 없음"); raise SystemExit
since = sys.argv[1]
rows = [json.loads(l) for l in open(f, encoding="utf-8") if l.strip()]
recent = [r for r in rows if r.get("ts", "")[:10] >= since]
sev = Counter(r["severity"] for r in recent if r.get("kind") == "friction")
delight = sum(1 for r in recent if r.get("kind") == "delight")
print(f"friction {sum(sev.values())}건 "
      f"(blocker:{sev['blocker']} error:{sev['error']} confused:{sev['confused']} nit:{sev['nit']}) "
      f"/ delight {delight}건")
# 반복 마찰 = 같은 skill/phase가 여러 번 → 우선 개선 후보
freq = Counter((r["skill"], r["phase"]) for r in recent if r.get("kind") == "friction")
for (skill, phase), n in freq.most_common(5):
    print(f"  x{n}  {skill}/{phase}")
for r in recent:
    if r.get("kind") == "friction" and r["severity"] in ("blocker", "error", "confused"):
        print(f"  [{r['severity']}] {r['skill']}/{r['phase']}: {r['message']}"
              + (f"  → {r['hint']}" if r.get("hint") else ""))
PY
```

이 출력을 Step 5의 Improve/Try 도출에 직접 입력으로 쓴다. 반복 횟수가 많은 `skill/phase`가 최우선 개선 후보다.

---

## Step 5: 성장 기회 분석

데이터를 바탕으로 패턴을 도출한다:

**잘 된 것 (Keep):**
- 커밋 수, 테스트 수, 커버리지가 이전 주 대비 향상됐으면 언급
- PASS 판정이 많으면 언급
- delight 신호가 가리키는 "잘 작동한 스킬·문서"를 언급 (Step 4b)

**개선할 것 (Improve):**
- fix 커밋이 feat보다 많으면 → 사전 스펙 작성 권장 (`/sj-spec`)
- test 커밋이 0이면 → TDD 도입 권장
- 블로커가 2주 이상 이어지면 → 근본 원인 조사 권장 (`/sj-investigate`)
- 커버리지가 목표보다 낮으면 → 테스트 집중 세션 권장
- **반복 friction(Step 4b)** → 해당 스킬·문서를 고친다. blocker/error는 즉시, 반복 confused는 문서 명확화

**실험할 것 (Try):**
- 데이터 패턴에서 도출한 이번 주 시도 제안 1~2개

---

## Step 5b: 하네스 변경 검증 게이트 (Self-Harness)

> **컨벤션:** [셀프-하네스 게이트](../_conventions/self-harness.md) — 하네스 변경은 마이닝된 약점에서 출발해 최소 편집으로 제안하고, **회귀가 녹색일 때만 채택**한다. 검증 없이 SKILL.md를 고치지 않는다.

Improve/Try 항목 중 **하네스 자체를 바꾸는 것**(스킬·프롬프트·컨벤션 수정)은 산문 권고로 끝내지 않고 3단계 게이트에 태운다. 단순 작업 권고(예: "이번 주 테스트 더 써라")는 게이트 대상이 아니다.

1. **약점 마이닝** — Step 4b의 반복 friction + Step 3의 반복 QA FAIL에서, **2회 이상** 반복된 것만 후보.
2. **하네스 제안** — 약점 1건 ↔ 변경 1건. 어느 파일 어느 섹션을 무엇으로 바꾸는지 diff 수준으로.
3. **제안 검증** — 채택 전 회귀를 실제로 돌려 녹색을 확인한다:

```bash
# 회귀 세트 — 이 프로젝트에 실제로 있는 것만 돌린다 (sj-retro는 임의 프로젝트에서 실행됨)
[ -f scripts/skill-manifest.py ] \
  && { python3 scripts/skill-manifest.py --check && echo "manifest OK" || echo "manifest 회귀 — 채택 보류"; } \
  || echo "manifest 검사: 해당 없음 (이 프로젝트는 s-skills 레포가 아님)"
[ -f package.json ] && npm test 2>&1 | tail -3
ls docs/sj-company/loops/*-state.md 2>/dev/null | head -1   # 과거 통과 시나리오 존재 확인
```

**한계 (over-claim 금지):** 이 회귀는 **구조·빌드 회귀**(매니페스트 정합·테스트 통과)만 잡는다. 프롬프트·문서를 바꾸는 하네스 변경이 *행동*을 어떻게 바꾸는지는 `npm test`로 안 잡힌다 — 그런 제안은 `test-scenario`로 동작을 재확인하거나, 잡히지 않는 회귀임을 명시하고 사람 검토로 넘긴다.

- 회귀 통과 → 보고서에 **"채택 후보"**로 표시(실제 편집·머지는 사람 게이트).
- 회귀 실패 / 회귀 세트 없음 → 채택하지 말고 `docs/sj-company/triage-inbox.md`에 `- [ ] {날짜} [retro] {제안 + 미검증 사유}` append.

채택(SKILL.md 실제 편집)은 자동화하지 않는다 — 게이트는 "검증된 제안"까지만 만든다.

---

## Step 6: 보고서 출력

```
📊 주간 회고 — {SINCE} ~ {UNTIL}

## 배송 지표
커밋: {N}개 (feat:{N} fix:{N} refactor:{N} test:{N})
변경 파일: {N}개 | 라인: +{N}/-{N}
배송 스트리크: {N}일 연속

## 테스트 건강도
테스트 파일: {N}개
결과: {N} 통과 / {N} 실패
커버리지: {N}% (목표: {PW_TARGET}%)

## QA 판정
PASS: {N} | CONDITIONAL: {N} | FAIL: {N}

## 프로세스 마찰
friction {N}건 (blocker:{N} error:{N} confused:{N}) / delight {N}건
최다 마찰: {skill/phase} x{N}

## 이번 주 요약
✅ Keep: {잘 된 것}
🔧 Improve: {개선할 것}
🧪 Try: {실험할 것}

## 하네스 변경 (Self-Harness 게이트)
🟢 채택 후보(회귀 통과): {제안 + 대상 파일} | 사람 승인 대기
🔴 보류(회귀 실패·미검증): {제안} → triage-inbox
```

---

## Step 7: 히스토리 누적

```bash
echo "
## {SINCE} ~ {UNTIL}
커밋: {N} | 커버리지: {N}% | QA PASS: {N}
friction: {N}건 (blocker:{N}) | delight: {N}건
블로커: {블로커}
배송 스트리크: {N}일
인사이트: {이번 주 가장 중요한 학습}
" >> docs/sj-company/retro-history.md
```

friction.jsonl이 수백 줄을 넘어 무거워졌으면, 회고 반영을 마친 뒤
[archive-only](../_conventions/archive-only.md)로 백업하고 이번 회고 범위 이전 항목을 잘라낸다.

```
✅ 회고 완료! retro-history.md에 기록됨.

다음 주 권장 액션:
{실험할 것에서 도출한 구체적 액션 1개}
```
