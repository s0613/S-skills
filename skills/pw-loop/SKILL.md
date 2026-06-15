---
name: pw-loop
version: 2.0.1
description: |
  기능 단위 Playwright 테스트 반복 루프.
  한 번에 하나의 기능(feature)을 집중 테스트.
  시나리오를 심화하며 기능을 완전히 검증한 후 다음 기능으로 이동한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
triggers:
  - /pw-loop
---

# pw-loop — 기능 단위 반복 루프

## 절대 규칙

- **Chrome 확장 사용 금지.** `npx playwright test`는 Claude가 Bash로 직접 실행한다.
- **사용자에게 테스트 위임 금지.**
- **기능 목표 준수.** sj-tech-lead 수정은 `feature-goal.txt`에 정의된 범위 내에서만. 범위 밖 수정이 필요하면 → AskUserQuestion 에스컬레이션.
- **PASS 즉시 다음 시나리오 자동 진입.** 사용자 확인 없이.
- **기능 완료 즉시 다음 기능 자동 진입.** 사용자 확인 없이.
- **현재 기능의 spec 파일만 실행.** 다른 기능 spec은 건드리지 않는다.

```
[기능 대기열]
    ↓
[기능 시작] → goal 확정 (feature-goal.txt 저장)
    ↓
[Scenario 1: happy-path 생성] → [실행]
    ↓ PASS                         ↓ FAIL
[Scenario 2 생성] → [실행]     [fix (목표 범위)] → [재실행]
    ↓ PASS                         ↓ FAIL x3
    ...                        [에스컬레이션]
    ↓ 모든 시나리오 PASS
[기능 완료] → 다음 기능
```

---

## Preamble

스킬 시작 시 반드시 실행:

```bash
_PW_DIR="docs/pw-loop"
_STATE="$_PW_DIR/.state"
mkdir -p "$_STATE" "$_PW_DIR/reports"

# 기능 상태
_QUEUE_COUNT=$(grep -c . "$_STATE/feature-queue.txt" 2>/dev/null || echo 0)
case "$_QUEUE_COUNT" in ''|*[!0-9]*) _QUEUE_COUNT=0 ;; esac
_CUR_FEATURE=$(cat "$_STATE/current-feature.txt" 2>/dev/null | tr -d '\n')
_CUR_SLUG=$(cat "$_STATE/feature-slug.txt" 2>/dev/null | tr -d '\n')
_CUR_GOAL=$(cat "$_STATE/feature-goal.txt" 2>/dev/null | head -3)
_SCENARIO_IDX=$(cat "$_STATE/scenario-index.txt" 2>/dev/null || echo "0")
case "$_SCENARIO_IDX" in ''|*[!0-9]*) _SCENARIO_IDX=0 ;; esac
_SCENARIO_STATUS=$(cat "$_STATE/scenario-status.txt" 2>/dev/null | tr -d '[:space:]' || echo "none")
_FIX_ATTEMPTS=$(cat "$_STATE/fix-attempts.txt" 2>/dev/null || echo "0")
case "$_FIX_ATTEMPTS" in ''|*[!0-9]*) _FIX_ATTEMPTS=0 ;; esac

# 환경
_PW_CONFIG=$(ls playwright.config.ts playwright.config.js playwright.config.mts 2>/dev/null | head -1)
_TEST_DIR=$(cat "$_STATE/test-dir.txt" 2>/dev/null || echo "tests/e2e")
_BASE_URL=$(cat "$_STATE/base-url.txt" 2>/dev/null || echo "http://localhost:3000")

# Playwright 설치 확인
_PW_INSTALLED="no"
if npx playwright --version >/dev/null 2>&1 || [ -f "node_modules/.bin/playwright" ]; then
  _PW_INSTALLED="yes"
fi

echo "=== pw-loop 상태 ==="
echo "FEATURE: ${_CUR_FEATURE:-(없음)} [${_CUR_SLUG:-}]"
echo "GOAL: ${_CUR_GOAL:-(미설정)}"
echo "SCENARIO: ${_SCENARIO_IDX} | STATUS: ${_SCENARIO_STATUS}"
echo "FIX_ATTEMPTS: ${_FIX_ATTEMPTS}"
echo "QUEUE_COUNT: ${_QUEUE_COUNT}"
echo "TEST_DIR: ${_TEST_DIR} | PW_INSTALLED: ${_PW_INSTALLED}"
```

---

## 모드 감지

| 조건 | 모드 |
|------|------|
| `PW_INSTALLED: no` | **setup** |
| `QUEUE_COUNT == 0` AND `CUR_FEATURE` 없음 | **init** |
| `CUR_FEATURE` 없음 | **feature-start** |
| `SCENARIO_IDX == 0` | **scenario-generate** (Scenario 1) |
| `SCENARIO_STATUS == pass` | **scenario-next** |
| `SCENARIO_STATUS == fail` AND `FIX_ATTEMPTS < 3` | **fix** |
| `SCENARIO_STATUS == fail` AND `FIX_ATTEMPTS >= 3` | **escalate** |
| `SCENARIO_STATUS == running` OR `none` | **run** |
| 유저 메시지에 수정 완료 내용 포함 | **rerun** |

"수정 완료" 판단 기준: "수정했어", "고쳤어", 코드 변경 내역, 버그 수정 내용 포함 시.  
→ sj-tech-lead 없이 Run 모드 Step 2로 직접 진입.

---

## Setup 모드

`PW_INSTALLED: no`이면:

```bash
cat package.json 2>/dev/null | grep -E '"playwright|@playwright'
```

AskUserQuestion:
```
Playwright가 설치되어 있지 않습니다.
```
- A) 지금 설치 (추천) → `npm install -D @playwright/test && npx playwright install --with-deps chromium`
- B) 이미 설치됨 (경로 문제) → 계속 진행

설치 완료 후 Init 또는 Feature-Start 모드로 진입.

---

## Init 모드

기능 대기열이 없을 때.

```bash
# PRD에서 기능 목록 추출 시도
[ -f "docs/prd.md" ] && grep -A 20 "## Features" docs/prd.md | head -20
[ -f "docs/STATUS.md" ] && grep -A 20 "## Features" docs/STATUS.md | head -20
```

AskUserQuestion으로 테스트할 기능 목록 입력:
```
테스트할 기능 목록을 입력해주세요. (줄 구분)
PRD에서 발견한 기능: {목록}
```

입력받은 기능 목록 저장:
```bash
# 입력받은 기능을 feature-queue.txt에 저장
# 예: 사용자 입력 "로그인\n회원가입\n비밀번호 찾기"
printf '%s\n' "{기능1}" "{기능2}" "{기능3}" > docs/pw-loop/.state/feature-queue.txt

# testDir 확정 및 저장
_PW_CONFIG=$(ls playwright.config.ts playwright.config.js playwright.config.mts 2>/dev/null | head -1)
_TEST_DIR="tests/e2e"
if [ -n "$_PW_CONFIG" ]; then
  _TEST_DIR_RAW=$(grep -oE "testDir:\s*['\"]([^'\"]+)['\"]" "$_PW_CONFIG" 2>/dev/null \
    | grep -oE "['\"][^'\"]+['\"]" | tr -d "'\"" | head -1)
  [ -n "$_TEST_DIR_RAW" ] && _TEST_DIR="$_TEST_DIR_RAW"
fi
echo "$_TEST_DIR" > docs/pw-loop/.state/test-dir.txt
mkdir -p "$_TEST_DIR"

# base-url 저장 (없으면 묻기)
if [ ! -f "docs/pw-loop/.state/base-url.txt" ]; then
  grep -oE "baseURL:\s*['\"][^'\"]+['\"]" "$_PW_CONFIG" 2>/dev/null \
    | grep -oE "['\"][^'\"]+['\"]" | tr -d "'\"" | head -1 \
    > docs/pw-loop/.state/base-url.txt
  [ ! -s "docs/pw-loop/.state/base-url.txt" ] && echo "http://localhost:3000" > docs/pw-loop/.state/base-url.txt
fi

echo "대기열 저장 완료: $(cat docs/pw-loop/.state/feature-queue.txt | wc -l)개 기능"
```

이후 **feature-start** 모드로 자동 진입.

---

## Feature Start 모드

대기열에서 다음 기능을 꺼내 시작한다.

### Step 1: 기능 꺼내기

```bash
_NEXT_FEATURE=$(head -1 docs/pw-loop/.state/feature-queue.txt | tr -d '\r')
_REMAINING=$(tail -n +2 docs/pw-loop/.state/feature-queue.txt)
echo "$_REMAINING" > docs/pw-loop/.state/feature-queue.txt

# 기능 번호 (slug용)
_FEATURE_NUM=$(cat docs/pw-loop/.state/feature-num.txt 2>/dev/null || echo "0")
case "$_FEATURE_NUM" in ''|*[!0-9]*) _FEATURE_NUM=0 ;; esac
_FEATURE_NUM=$(( _FEATURE_NUM + 1 ))
_SLUG="f${_FEATURE_NUM}"

echo "$_NEXT_FEATURE" > docs/pw-loop/.state/current-feature.txt
echo "$_SLUG" > docs/pw-loop/.state/feature-slug.txt
echo "$_FEATURE_NUM" > docs/pw-loop/.state/feature-num.txt
echo "0" > docs/pw-loop/.state/scenario-index.txt
echo "none" > docs/pw-loop/.state/scenario-status.txt
echo "0" > docs/pw-loop/.state/fix-attempts.txt
echo "" > docs/pw-loop/.state/feature-goal.txt

echo "FEATURE_STARTED: $_NEXT_FEATURE [slug: $_SLUG]"
echo "REMAINING_QUEUE: $(cat docs/pw-loop/.state/feature-queue.txt | grep -c . 2>/dev/null || echo 0)개"
```

### Step 2: 기능 목표 확정

소스 코드에서 기능 컨텍스트 수집:

```bash
_FEATURE=$(cat docs/pw-loop/.state/current-feature.txt)

# PRD에서 기능 설명 추출
[ -f "docs/prd.md" ] && grep -A 5 -i "$_FEATURE" docs/prd.md 2>/dev/null | head -10

# 관련 소스 파일 탐색
grep -rl "$_FEATURE" src/ app/ pages/ components/ \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v node_modules | head -5 | xargs head -30 2>/dev/null
```

수집한 정보를 바탕으로 기능 목표를 **1-3문장**으로 정의하고 저장:

```bash
# 아래는 예시 — 실제 기능에 맞게 작성
cat > docs/pw-loop/.state/feature-goal.txt << 'GOAL_EOF'
{기능 목표: 이 기능이 무엇을 해야 하는지 1-3문장으로 명확히 기술}
{성공 조건 명시}
{핵심 제약 조건 명시}
GOAL_EOF
```

**목표 작성 원칙:**
- "로그인 기능: 이메일/비밀번호로 인증 → 성공 시 대시보드 이동, 실패 시 에러 표시. 세션 만료 시 로그인 페이지로 리다이렉트." 형식
- 모호한 표현 없이 검증 가능한 동작 기술
- 이 파일은 기능 완료까지 수정하지 않는다

이후 **scenario-generate** 모드로 자동 진입.

---

## Scenario Generate 모드

현재 기능의 다음 시나리오 spec 파일을 생성한다.

### Step 1: 시나리오 번호 증가

```bash
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt 2>/dev/null || echo "0")
case "$_SCENARIO_IDX" in ''|*[!0-9]*) _SCENARIO_IDX=0 ;; esac
_NEXT_IDX=$(( _SCENARIO_IDX + 1 ))
echo "$_NEXT_IDX" > docs/pw-loop/.state/scenario-index.txt
echo "running" > docs/pw-loop/.state/scenario-status.txt
echo "0" > docs/pw-loop/.state/fix-attempts.txt
echo "SCENARIO: $_NEXT_IDX"
```

**시나리오 유형 (순서 고정):**

| 번호 | 유형 | 검증 내용 |
|------|------|-----------|
| 1 | happy-path | 기능의 주요 성공 경로 |
| 2 | error-handling | 잘못된 입력, 에러 응답, 경계값 |
| 3 | state-persistence | 상태 유지, 새로고침 후 동작, 세션 처리 |
| 4+ | context-specific | 기능 목표에 미검증 동작이 있는 경우에만 |

시나리오 3 완료 후 기능 목표를 재검토해 4+가 필요한지 판단한다. 필요 없으면 기능 완료.

### Step 2: 소스 코드 분석

```bash
_FEATURE=$(cat docs/pw-loop/.state/current-feature.txt)
_GOAL=$(cat docs/pw-loop/.state/feature-goal.txt)

grep -r "placeholder\|aria-label\|htmlFor\|data-testid\|<button\|<Link\|getByRole" \
  src/ app/ pages/ components/ --include="*.tsx" --include="*.jsx" \
  2>/dev/null | grep -v node_modules | head -20
```

### Step 3: spec 파일 생성

spec 파일명: `{TEST_DIR}/{SLUG}-s{N}.spec.ts`

**생성 원칙:**
- 이번 시나리오 유형(happy-path / error-handling / state-persistence)에 집중
- 기능 목표 범위 내의 동작만 검증 — 목표에 없는 동작은 테스트하지 않는다
- `getByRole`, `getByLabel`, `getByText`, `getByTestId` 우선 사용
- CSS 선택자 하드코딩 금지
- 이전 시나리오(S1, S2...) 테스트는 이 파일에 포함하지 않는다 (별도 파일 존재)

```typescript
/**
 * Feature: {feature-name}
 * Scenario {N}: {scenario-type} — {scenario-description}
 * Goal: {feature-goal 1줄 요약}
 *
 * ⚠️  이 파일은 {scenario-type} 케이스만 검증한다.
 *     기능 목표 범위를 벗어나는 테스트는 추가하지 않는다.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || '{BASE_URL}';

test.describe('{feature-name} — {scenario-type}', () => {
  test('{주요 성공/오류 시나리오}', async ({ page }) => {
    await page.goto(`${BASE_URL}{경로}`);
    // ...
  });
});
```

### Step 4: 생성 완료 → 즉시 Run 모드 자동 진입

```
기능 [{FEATURE}] Scenario {N} ({scenario-type}) 생성 완료.
파일: {TEST_DIR}/{SLUG}-s{N}.spec.ts

Playwright 실행 중...
```

사용자 입력을 기다리지 않는다. 즉시 Run 모드 Step 1로 진입.

---

## Run 모드

### Step 1: 개발 서버 체크

```bash
_BASE_URL=$(cat docs/pw-loop/.state/base-url.txt 2>/dev/null || echo "http://localhost:3000")
_HTTP_CODE=$(curl -s --connect-timeout 3 "$_BASE_URL" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
echo "SERVER: $_HTTP_CODE (${_BASE_URL})"
```

`000`이면 AskUserQuestion:
```
개발 서버({BASE_URL})에 접근할 수 없습니다. 서버를 먼저 실행해주세요.
```
- A) 실행 완료, 계속 진행
- B) BASE_URL 변경

### Step 2: 현재 시나리오 spec만 실행

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_TEST_DIR=$(cat docs/pw-loop/.state/test-dir.txt 2>/dev/null || echo "tests/e2e")

_SPEC_FILE="${_TEST_DIR}/${_SLUG}-s${_SCENARIO_IDX}.spec.ts"
_RAW_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-raw.json"

echo "RUNNING: ${_SPEC_FILE}"

if [ ! -f "$_SPEC_FILE" ]; then
  echo "SPEC_NOT_FOUND: $_SPEC_FILE"
  exit 1
fi

npx playwright test "$_SPEC_FILE" \
  --reporter=json \
  2>/tmp/pw-loop-stderr.log > "$_RAW_FILE" || true

echo "STDERR_LINES: $(wc -l < /tmp/pw-loop-stderr.log 2>/dev/null || echo 0)"
```

### Step 3: 결과 파싱

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_RAW_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-raw.json"
_SUMMARY_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-summary.json"
_DATE=$(date +%Y-%m-%d)

python3 - <<EOF
import json, sys

try:
    content = open('${_RAW_FILE}').read()
    lines = content.split('\n')
    json_content = '\n'.join(l for l in lines if not l.startswith('[dotenv'))
    start = json_content.find('{')
    if start < 0:
        raise ValueError("JSON not found")
    data = json.loads(json_content[start:])
except Exception as e:
    print(f"PARSE_ERROR: {e}")
    print("STDERR:", open('/tmp/pw-loop-stderr.log').read()[:500])
    sys.exit(1)

passed = []
failed = []

def collect(suite, path=""):
    title = (path + "/" + suite.get('title', '')) if path else suite.get('title', '')
    for spec in suite.get('specs', []):
        name = title + " > " + spec.get('title', '')
        if spec.get('ok', False):
            passed.append(name)
            continue
        for test in spec.get('tests', []):
            result = (test.get('results') or [{}])[-1]
            status = result.get('status', 'unknown')
            if status == 'passed':
                passed.append(name)
            else:
                err = result.get('error') or {}
                failed.append({'name': name, 'error': err.get('message', ''), 'snippet': err.get('snippet', '')})
    for child in suite.get('suites', []):
        collect(child, title)

for s in data.get('suites', []):
    collect(s)

passed = list(dict.fromkeys(passed))
failed = [f for f in failed if f['name'] not in set(passed)]

total = len(passed) + len(failed)
rate = int(len(passed) * 100 / total) if total > 0 else 0

print(f"TOTAL: {total} | PASS: {len(passed)} | FAIL: {len(failed)} | RATE: {rate}%")
if failed:
    print("")
    for f in failed:
        print(f"  [FAIL] {f['name']}")
        if f['error']:
            print(f"         {f['error'][:200]}")

summary = {
    'feature': open('docs/pw-loop/.state/current-feature.txt').read().strip(),
    'slug': '${_SLUG}',
    'scenario': ${_SCENARIO_IDX},
    'date': '${_DATE}',
    'passed': len(passed),
    'failed': len(failed),
    'total': total,
    'rate': rate,
    'failed_tests': failed
}
json.dump(summary, open('${_SUMMARY_FILE}', 'w'), indent=2, ensure_ascii=False)
print("SUMMARY_SAVED")
EOF
```

### Step 4: 게이트 체크

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_SUMMARY_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-summary.json"

_FAILED=$(python3 -c "import json; print(json.load(open('${_SUMMARY_FILE}'))['failed'])" 2>/dev/null || echo 1)
_RATE=$(python3 -c "import json; print(json.load(open('${_SUMMARY_FILE}'))['rate'])" 2>/dev/null || echo 0)
case "$_FAILED" in ''|*[!0-9]*) _FAILED=1 ;; esac

if [ "$_FAILED" -eq 0 ]; then
    echo "GATE: PASS — 시나리오 ${_SCENARIO_IDX} 완전 통과 (${_RATE}%)"
    echo "pass" > docs/pw-loop/.state/scenario-status.txt
else
    echo "GATE: FAIL — ${_FAILED}건 실패 (통과율: ${_RATE}%)"
    echo "fail" > docs/pw-loop/.state/scenario-status.txt
fi
```

**GATE: PASS** → **scenario-next** 모드 자동 진입.
**GATE: FAIL** → **fix** 모드 자동 진입.

---

## Fix 모드

기능 목표 범위 내에서만 소스 코드를 수정한다.

### Step 1: 실패 컨텍스트 수집

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_TEST_DIR=$(cat docs/pw-loop/.state/test-dir.txt 2>/dev/null || echo "tests/e2e")
_SUMMARY_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-summary.json"

# 실패 내용 출력
python3 -c "
import json
d = json.load(open('${_SUMMARY_FILE}'))
for f in d.get('failed_tests', []):
    print('=== FAILED:', f['name'])
    print('Error:', f['error'][:400])
    if f.get('snippet'): print('Snippet:', f['snippet'][:400])
    print()
"

# 현재 시나리오 spec 파일 읽기
cat "${_TEST_DIR}/${_SLUG}-s${_SCENARIO_IDX}.spec.ts" 2>/dev/null
```

### Step 2: fix-attempts 증가 및 sj-tech-lead 호출

```bash
_FIX_ATTEMPTS=$(cat docs/pw-loop/.state/fix-attempts.txt 2>/dev/null || echo "0")
case "$_FIX_ATTEMPTS" in ''|*[!0-9]*) _FIX_ATTEMPTS=0 ;; esac
_FIX_ATTEMPTS=$(( _FIX_ATTEMPTS + 1 ))
echo "$_FIX_ATTEMPTS" > docs/pw-loop/.state/fix-attempts.txt
echo "FIX_ATTEMPT: $_FIX_ATTEMPTS / 3"
```

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_SUMMARY_FILE="docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-summary.json"
mkdir -p docs/sj-company/.state

python3 - <<EOF
import json

d = json.load(open('${_SUMMARY_FILE}'))
failed = d.get('failed_tests', [])
goal = open('docs/pw-loop/.state/feature-goal.txt').read().strip()
feature = open('docs/pw-loop/.state/current-feature.txt').read().strip()

task = f"# Playwright 실패 수정 — {feature} Scenario {d['scenario']}\n\n"
task += "## ⚠️ 기능 목표 (이 범위에서만 수정)\n\n"
task += f"{goal}\n\n"
task += "## 수정 범위 제한\n\n"
task += "- 위 기능 목표와 직접 관련된 소스 코드만 수정하세요.\n"
task += "- spec 파일은 수정하지 않습니다.\n"
task += "- 기능 목표 범위 밖의 코드 리팩토링·기능 추가는 하지 않습니다.\n"
task += "- 범위 밖 수정이 불가피하면 이유를 dev-output.md에 명시하세요.\n\n"
task += "## 실패한 테스트\n\n"
for i, f in enumerate(failed, 1):
    task += f"### {i}. {f['name']}\n"
    task += f"**오류:** {f['error'][:300]}\n"
    if f.get('snippet'):
        task += f"**코드 위치:**\n\`\`\`\n{f['snippet'][:300]}\n\`\`\`\n"
    task += "\n"

open('docs/sj-company/.state/task.txt', 'w').write(task)
print("TASK_SAVED")
EOF

echo "dev" > docs/sj-company/.state/stage.txt
```

`Skill("s-skills:sj-tech-lead")` 호출 — `.state/task.txt`(위에서 기록)를 받아 수정 디스패치.

### Step 3: sj-tech-lead 완료 후 즉시 재실행

사용자 확인 없이 즉시 Run 모드 Step 2(Playwright 실행)로 돌아간다.

---

## Escalate 모드

fix-attempts >= 3이고 동일 실패 지속 시.

```bash
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_FEATURE=$(cat docs/pw-loop/.state/current-feature.txt)

python3 -c "
import json
d = json.load(open('docs/pw-loop/reports/${_SLUG}-s${_SCENARIO_IDX}-summary.json'))
for f in d.get('failed_tests', []):
    print(f\"  - {f['name']}: {f['error'][:150]}\")
"
```

AskUserQuestion:
```
기능 [{FEATURE}] Scenario {N}에서 3회 수정 후에도 실패 지속.

실패 테스트:
- {test1}: {error}
```
- A) sj-tech-lead 재시도 (다른 접근법으로) → fix-attempts 초기화 후 Fix 모드 재진입
- B) 해당 테스트를 `test.skip`으로 표시 후 다음 시나리오 진행
- C) 직접 수정 후 `/pw-loop`로 계속

A 선택 시:
```bash
echo "0" > docs/pw-loop/.state/fix-attempts.txt
echo "fail" > docs/pw-loop/.state/scenario-status.txt
```

---

## Scenario Next 모드

현재 시나리오가 PASS됐을 때 자동 진입.

### Step 1: 다음 시나리오 결정

```bash
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_FEATURE=$(cat docs/pw-loop/.state/current-feature.txt)
_GOAL=$(cat docs/pw-loop/.state/feature-goal.txt)
echo "COMPLETED_SCENARIO: ${_SCENARIO_IDX} | FEATURE: ${_FEATURE}"
```

**판단 기준:**

| 완료 시나리오 | 다음 액션 |
|--------------|-----------|
| Scenario 1 | Scenario 2 (error-handling) 자동 생성 |
| Scenario 2 | Scenario 3 (state-persistence) 자동 생성 |
| Scenario 3 | 기능 목표 재검토 → 4+ 필요 시 생성, 불필요 시 기능 완료 |
| Scenario 4+ | 기능 목표 완전 검증 여부 판단 후 추가 또는 완료 |

**Scenario 3+ 이후 추가 생성 조건:** 기능 목표에 아직 검증하지 않은 중요 동작이 명시된 경우에만.

### Step 2: 다음 시나리오 생성 또는 기능 완료

**다음 시나리오 생성:** → scenario-generate 모드 자동 진입.

**기능 완료:**

```bash
_FEATURE=$(cat docs/pw-loop/.state/current-feature.txt)
_SLUG=$(cat docs/pw-loop/.state/feature-slug.txt | tr -d '\n')
_SCENARIO_IDX=$(cat docs/pw-loop/.state/scenario-index.txt)
_DATE=$(date +%Y-%m-%d)

# 완료 이력 저장
echo "${_FEATURE}|${_SLUG}|DONE|scenarios=${_SCENARIO_IDX}|${_DATE}" \
  >> docs/pw-loop/.state/completed-features.txt

# 현재 기능 상태 초기화
echo "" > docs/pw-loop/.state/current-feature.txt
echo "" > docs/pw-loop/.state/feature-slug.txt
echo "" > docs/pw-loop/.state/feature-goal.txt
echo "0" > docs/pw-loop/.state/scenario-index.txt
echo "none" > docs/pw-loop/.state/scenario-status.txt
echo "0" > docs/pw-loop/.state/fix-attempts.txt

_REMAINING=$(grep -c . docs/pw-loop/.state/feature-queue.txt 2>/dev/null || echo 0)
echo "FEATURE_COMPLETE: ${_FEATURE} | REMAINING: ${_REMAINING}개"
```

출력:
```
✓ 기능 [{FEATURE}] 완료

  Scenario 1 (happy-path): PASS
  Scenario 2 (error-handling): PASS
  Scenario 3 (state-persistence): PASS

완료: {N}개 / 대기열: {N}개
```

대기열에 남은 기능 있으면 → **feature-start** 자동 진입.
대기열 비었으면 → **all-complete** 모드.

---

## All Complete 모드

```bash
cat docs/pw-loop/.state/completed-features.txt 2>/dev/null
_TEST_DIR=$(cat docs/pw-loop/.state/test-dir.txt 2>/dev/null || echo "tests/e2e")
ls "$_TEST_DIR"/*.spec.ts 2>/dev/null | wc -l
```

출력:
```
pw-loop 전체 완료

완료된 기능:
  ✓ {기능1} ({N} 시나리오)
  ✓ {기능2} ({N} 시나리오)

생성된 spec: {TEST_DIR}/ — 총 {N}개
보고서: docs/pw-loop/reports/
```

AskUserQuestion:
- A) 새 기능 추가 → Init 모드
- B) 전체 회귀 테스트 실행 → `npx playwright test` 전체 실행 후 결과 출력
- C) 종료

---

## 상태 파일 구조

```
docs/pw-loop/
├── .state/
│   ├── feature-queue.txt        # 대기 중인 기능 목록 (줄 구분)
│   ├── current-feature.txt      # 현재 작업 기능명
│   ├── feature-slug.txt         # 현재 기능 slug (f1, f2, ...)
│   ├── feature-num.txt          # 기능 순번 (slug 생성용)
│   ├── feature-goal.txt         # 현재 기능 목표 (불변 — 기능 완료까지 수정 금지)
│   ├── scenario-index.txt       # 현재 시나리오 번호 (1, 2, 3, ...)
│   ├── scenario-status.txt      # pass / fail / running / none
│   ├── fix-attempts.txt         # 현재 시나리오 수정 시도 횟수
│   ├── completed-features.txt   # 완료된 기능 이력
│   ├── base-url.txt             # 앱 base URL
│   ├── test-dir.txt             # spec 파일 디렉토리
│   └── threshold.txt            # (미사용 — 기능 단위는 항상 100% 목표)
└── reports/
    ├── {slug}-s1-raw.json       # Playwright JSON 원본
    ├── {slug}-s1-summary.json   # 파싱된 요약
    ├── {slug}-s2-raw.json
    └── ...

{TEST_DIR}/
├── f1-s1.spec.ts   # 기능1 Scenario 1: happy-path
├── f1-s2.spec.ts   # 기능1 Scenario 2: error-handling
├── f1-s3.spec.ts   # 기능1 Scenario 3: state-persistence
├── f2-s1.spec.ts   # 기능2 Scenario 1: happy-path
└── ...
```
