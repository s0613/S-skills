---
name: sj-retro
version: 1.0.0
description: |
  주간 엔지니어링 회고 에이전트. 프로젝트별 배송 지표·테스트 건강도·성장 기회를 분석한다.
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

# 프로젝트 목록 (docs/sj-company가 있는 디렉토리들)
find ~ -name "PROJECT.md" -path "*/sj-company/*" 2>/dev/null | head -10
```

`/retro global` 호출 시: 모든 프로젝트를 집계. 기본은 현재 프로젝트.

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

## Step 5: 성장 기회 분석

데이터를 바탕으로 패턴을 도출한다:

**잘 된 것 (Keep):**
- 커밋 수, 테스트 수, 커버리지가 이전 주 대비 향상됐으면 언급
- PASS 판정이 많으면 언급

**개선할 것 (Improve):**
- fix 커밋이 feat보다 많으면 → 사전 스펙 작성 권장 (`/sj-spec`)
- test 커밋이 0이면 → TDD 도입 권장
- 블로커가 2주 이상 이어지면 → 근본 원인 조사 권장 (`/sj-investigate`)
- 커버리지가 목표보다 낮으면 → 테스트 집중 세션 권장

**실험할 것 (Try):**
- 데이터 패턴에서 도출한 이번 주 시도 제안 1~2개

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

## 이번 주 요약
✅ Keep: {잘 된 것}
🔧 Improve: {개선할 것}
🧪 Try: {실험할 것}
```

---

## Step 7: 히스토리 누적

```bash
echo "
## {SINCE} ~ {UNTIL}
커밋: {N} | 커버리지: {N}% | QA PASS: {N}
블로커: {블로커}
배송 스트리크: {N}일
인사이트: {이번 주 가장 중요한 학습}
" >> docs/sj-company/retro-history.md
```

```
✅ 회고 완료! retro-history.md에 기록됨.

다음 주 권장 액션:
{실험할 것에서 도출한 구체적 액션 1개}
```
