---
name: pw-loop
version: 1.2.0
description: |
  Playwright 테스트를 자동 생성·실행·수정하는 반복 루프 스킬.
  spec 파일 생성 → npx playwright test 실행 → 실패 분석 → sj-dev 수정 →
  재실행 사이클을 목표 통과율 달성까지 반복한다.
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

# pw-loop

Playwright E2E 테스트 자동화 반복 루프.

## 절대 규칙 — 반드시 지킬 것

- **Chrome 확장 사용 금지.** 이 스킬은 Chrome 확장과 무관하다. 사용자에게 시나리오를 붙여넣으라고 요청하지 않는다.
- **사용자에게 테스트 실행을 위임하지 않는다.** `npx playwright test`는 Claude가 Bash 도구로 직접 실행한다.
- **Generate 완료 즉시 Run 모드로 자동 진입한다.** 사용자 확인 없이 바로 Playwright를 실행한다.
- test-scenario 스킬의 `[결과]...[/결과]` 블록 형식은 이 스킬과 관계없다. 사용하지 않는다.

```
generate specs → (자동) → npx playwright test → parse → fix (sj-dev) → re-run → report
                                                              ↑________________________|
                                                              목표 통과율 미달 시 반복
```

---

## Preamble

스킬 시작 시 반드시 실행:

```bash
_PW_DIR="docs/pw-loop"
_STATE_DIR="$_PW_DIR/.state"
mkdir -p "$_STATE_DIR" "$_PW_DIR/reports"

# 상태 읽기
_CYCLE=$(cat "$_STATE_DIR/cycle.txt" 2>/dev/null || echo "0")
case "$_CYCLE" in ''|*[!0-9]*) _CYCLE=0 ;; esac
_THRESHOLD=$(cat "$_STATE_DIR/threshold.txt" 2>/dev/null || echo "80")
case "$_THRESHOLD" in ''|*[!0-9]*) _THRESHOLD=80 ;; esac
_DATE=$(date +%Y-%m-%d)

# Playwright 설치 여부
_PW_INSTALLED="no"
if npx playwright --version >/dev/null 2>&1 || [ -f "node_modules/.bin/playwright" ]; then
  _PW_INSTALLED="yes"
fi

# playwright.config 탐색 → testDir 확인
_PW_CONFIG=$(ls playwright.config.ts playwright.config.js playwright.config.mts 2>/dev/null | head -1)
_TEST_DIR=$(cat "$_STATE_DIR/test-dir.txt" 2>/dev/null || echo "tests/e2e")
if [ -n "$_PW_CONFIG" ]; then
  _TEST_DIR_RAW=$(grep -oE "testDir:\s*['\"]([^'\"]+)['\"]" "$_PW_CONFIG" 2>/dev/null | grep -oE "['\"][^'\"]+['\"]" | tr -d "'\"" | head -1)
  [ -n "$_TEST_DIR_RAW" ] && _TEST_DIR="$_TEST_DIR_RAW"
fi

# 현재 사이클 통계 (summary.json이 있으면 파싱)
_LAST_REPORT="$_PW_DIR/reports/cycle-${_CYCLE}-summary.json"
_C_PASS=0; _C_FAIL=0; _C_TOTAL=0; _C_RATE=0
if [ -f "$_LAST_REPORT" ] && [ "$_CYCLE" -gt 0 ]; then
  _C_PASS=$(python3 -c "import json; d=json.load(open('$_LAST_REPORT')); print(d.get('passed',0))" 2>/dev/null || echo 0)
  _C_FAIL=$(python3 -c "import json; d=json.load(open('$_LAST_REPORT')); print(d.get('failed',0))" 2>/dev/null || echo 0)
  _C_TOTAL=$(( _C_PASS + _C_FAIL ))
  [ "$_C_TOTAL" -gt 0 ] && _C_RATE=$(( (_C_PASS * 100) / _C_TOTAL )) || _C_RATE=0
fi
case "$_C_RATE" in ''|*[!0-9]*) _C_RATE=0 ;; esac

# pending-mode (harness 라우팅용)
_PENDING_MODE=$(cat "$_STATE_DIR/pending-mode.txt" 2>/dev/null | tr -d ' ')
[ -n "$_PENDING_MODE" ] && rm -f "$_STATE_DIR/pending-mode.txt"

echo "CYCLE: $_CYCLE"
echo "THRESHOLD: ${_THRESHOLD}%"
echo "PW_INSTALLED: $_PW_INSTALLED"
echo "PW_CONFIG: ${_PW_CONFIG:-없음}"
echo "TEST_DIR: $_TEST_DIR"
echo "LAST_RESULT: PASS=${_C_PASS} FAIL=${_C_FAIL} RATE=${_C_RATE}%"
echo "PENDING_MODE: ${_PENDING_MODE:-none}"

# 완료 체크
if [ "$_C_RATE" -ge "$_THRESHOLD" ] && [ "$_C_TOTAL" -gt 0 ]; then
  echo "STATUS: COMPLETE"
else
  echo "STATUS: IN_PROGRESS"
fi
```

---

## 모드 감지

| 조건 | 모드 |
|------|------|
| `PENDING_MODE` 값 있음 | PENDING_MODE 값으로 직접 진입 |
| `PW_INSTALLED: no` | **setup** — Playwright 설치 먼저 |
| `CYCLE: 0` | **generate** — 첫 실행, spec 생성 |
| `STATUS: COMPLETE` | **complete** — 목표 달성 |
| 그 외 | AskUserQuestion으로 선택 |

```
A) 새 Cycle 시작 (spec 재생성 + 실행)
B) 현재 spec 그대로 실행
C) 실패 테스트만 재실행
D) 현황 대시보드
E) 목표 통과율 변경 (현재: {THRESHOLD}%)
```

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
- B) 이미 설치돼 있음 (경로 문제) → 계속 진행

설치 완료 후 Generate 모드로 진입.

---

## Generate 모드

### Step 1: 사이클 번호 증가

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt 2>/dev/null || echo "0")
case "$_CYCLE" in ''|*[!0-9]*) _CYCLE=0 ;; esac
_NEXT_CYCLE=$(( _CYCLE + 1 ))
echo "$_NEXT_CYCLE" > docs/pw-loop/.state/cycle.txt

# testDir 확정 후 파일에 저장 (Fix 모드에서 재사용)
_TEST_DIR=$(cat docs/pw-loop/.state/test-dir.txt 2>/dev/null || echo "tests/e2e")
_PW_CONFIG=$(ls playwright.config.ts playwright.config.js playwright.config.mts 2>/dev/null | head -1)
if [ -n "$_PW_CONFIG" ]; then
  _TEST_DIR_RAW=$(grep -oE "testDir:\s*['\"]([^'\"]+)['\"]" "$_PW_CONFIG" 2>/dev/null | grep -oE "['\"][^'\"]+['\"]" | tr -d "'\"" | head -1)
  [ -n "$_TEST_DIR_RAW" ] && _TEST_DIR="$_TEST_DIR_RAW"
fi
echo "$_TEST_DIR" > docs/pw-loop/.state/test-dir.txt
mkdir -p "$_TEST_DIR"
echo "NEXT_CYCLE: $_NEXT_CYCLE | TEST_DIR: $_TEST_DIR"
```

### Step 2: 기능 목록 수집

우선순위 순서:
1. `docs/pw-loop/.state/features.txt` (이전 확정 목록)
2. `docs/prd.md` Features 섹션
3. `docs/STATUS.md` Features 테이블
4. 라우트/컴포넌트 직접 탐색

```bash
find . -maxdepth 5 \
  \( -path "*/pages/*.tsx" -o -path "*/pages/*.jsx" \
     -o -path "*/app/*/page.tsx" -o -path "*/routes/*.ts" \) \
  -not -path "*/node_modules/*" -not -path "*/_*" | head -20

[ -f "docs/prd.md" ] && grep -A 30 "## Features" docs/prd.md | head -30
[ -f "docs/pw-loop/.state/features.txt" ] && cat docs/pw-loop/.state/features.txt
```

수집한 기능 목록을 유저에게 보여주고 확인:

```
Cycle N — 테스트 대상 기능 목록

신규 (spec 없음):
  1. 로그인
  2. 회원가입

재테스트 (이전 FAIL):
  3. 비밀번호 찾기  [FAIL — Cycle N-1]

안정 (연속 PASS, 스킵 가능):
  4. 메인 페이지  [PASS x 2]

제외할 항목이 있으면 말씀해주세요.
```

확정 후 `docs/pw-loop/.state/features.txt` 저장.

### Step 3: Base URL 확인

```bash
grep -r "port\|PORT\|localhost" next.config* vite.config* package.json 2>/dev/null | grep -oE '[0-9]{4}' | head -5
cat playwright.config.ts 2>/dev/null | grep "baseURL"
cat docs/pw-loop/.state/base-url.txt 2>/dev/null
```

`docs/pw-loop/.state/base-url.txt`가 없으면 AskUserQuestion으로 URL을 입력받아 저장:

```bash
# AskUserQuestion에서 받은 URL을 _INPUT_URL 변수에 담아 저장
# 기본값: http://localhost:3000
echo "${_INPUT_URL:-http://localhost:3000}" > docs/pw-loop/.state/base-url.txt
```

### Step 4: spec 파일 생성

신규 + 재테스트 기능마다 `{TEST_DIR}/{feature-slug}.spec.ts` 생성 또는 교체.

**생성 원칙:**
- `getByRole`, `getByLabel`, `getByText`, `getByTestId` 순서로 선호
- 하드코딩된 CSS 선택자 금지
- 각 기능당 happy path + 최소 1개 edge case
- `test.describe` 블록으로 묶기

코드 참조가 필요하면 실제 소스 파일을 읽어 정확한 텍스트/역할 확인:

```bash
grep -r "placeholder\|aria-label\|htmlFor\|<label\|<button\|<Link" \
  src/ app/ pages/ components/ 2>/dev/null \
  --include="*.tsx" --include="*.jsx" | head -30
```

**파일 포맷:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('{기능명}', () => {
  test('{기능}: {성공 시나리오}', async ({ page }) => {
    await page.goto('{URL}');
    await page.getByLabel('{레이블}').fill('{값}');
    await page.getByRole('button', { name: '{버튼명}' }).click();
    await expect(page).toHaveURL('{예상 URL}');
    await expect(page.getByText('{기대 텍스트}')).toBeVisible();
  });

  test('{기능}: {실패 시나리오}', async ({ page }) => {
    await page.goto('{URL}');
    // ...
    await expect(page.getByRole('alert')).toContainText('{에러 메시지}');
  });
});
```

### Step 5: playwright.config 확인 및 보정

```bash
cat "$_PW_CONFIG" 2>/dev/null || echo "config 없음"
```

`baseURL`이 설정되지 않았으면 config에 추가 제안:

```typescript
// playwright.config.ts에 추가 권장
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
},
```

### Step 6: 생성 완료 — 즉시 Run 모드 자동 진입

```
Cycle N spec 생성 완료.

생성/업데이트:
   신규: {기능 목록}
   재테스트: {기능 목록}
   스킵: {기능 목록}

{TEST_DIR}/
   {feature1}.spec.ts
   {feature2}.spec.ts

Playwright 실행 중...
```

**사용자 입력을 기다리지 않는다. 즉시 Run 모드 Step 1로 진입한다.**

---

## Run 모드

### Step 1: 개발 서버 체크

```bash
_BASE_URL=$(cat docs/pw-loop/.state/base-url.txt 2>/dev/null || echo "http://localhost:3000")
_HTTP_CODE=$(curl -s --connect-timeout 3 "$_BASE_URL" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
echo "SERVER_STATUS: $_HTTP_CODE (${_BASE_URL})"
```

`_HTTP_CODE`가 `000`이면 AskUserQuestion:
```
개발 서버({BASE_URL})에 접근할 수 없습니다.
서버를 먼저 실행해주세요. (예: npm run dev)
```
- A) 서버 실행 완료, 계속 진행
- B) BASE_URL 변경

### Step 2: Playwright 실행

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_RAW_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-raw.json"
_ARTIFACT_DIR="docs/pw-loop/reports/cycle-${_CYCLE}-artifacts"

# stderr 분리하여 JSON stdout만 캡처
npx playwright test \
  --reporter=json \
  --output="$_ARTIFACT_DIR" \
  2>/tmp/pw-loop-stderr.log > "$_RAW_FILE" || true

echo "EXIT_CODE: $?"
echo "STDERR_LINES: $(wc -l < /tmp/pw-loop-stderr.log 2>/dev/null || echo 0)"
```

### Step 3: 결과 파싱

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_RAW_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-raw.json"
_SUMMARY_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-summary.json"
_DATE=$(date +%Y-%m-%d)

python3 - <<EOF
import json, sys

try:
    data = json.load(open('${_RAW_FILE}'))
except Exception as e:
    print(f"PARSE_ERROR: {e}")
    print("STDERR:", open('/tmp/pw-loop-stderr.log').read()[:500])
    sys.exit(1)

passed = []
failed = []

def collect(suite, path=""):
    title = (path + "/" + suite.get('title', '')) if path else suite.get('title', '')
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            result = (test.get('results') or [{}])[-1]
            status = result.get('status', 'unknown')
            name = title + " > " + spec.get('title', '')
            if status == 'passed':
                passed.append(name)
            else:
                err = result.get('error') or {}
                failed.append({
                    'name': name,
                    'error': err.get('message', ''),
                    'snippet': err.get('snippet', '')
                })
    for child in suite.get('suites', []):
        collect(child, title)

for s in data.get('suites', []):
    collect(s)

total = len(passed) + len(failed)
rate = int(len(passed) * 100 / total) if total > 0 else 0

print(f"TOTAL: {total}")
print(f"PASS: {len(passed)}")
print(f"FAIL: {len(failed)}")
print(f"RATE: {rate}%")

if failed:
    print("")
    for f in failed:
        print(f"[FAIL] {f['name']}")
        if f['error']:
            print(f"  Error: {f['error'][:200]}")

summary = {
    'cycle': int(open('docs/pw-loop/.state/cycle.txt').read().strip()),
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
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_THRESHOLD=$(cat docs/pw-loop/.state/threshold.txt 2>/dev/null || echo "80")
_SUMMARY_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-summary.json"
_RATE=$(python3 -c "import json; d=json.load(open('${_SUMMARY_FILE}')); print(d['rate'])" 2>/dev/null || echo 0)
case "$_RATE" in ''|*[!0-9]*) _RATE=0 ;; esac

if [ "$_RATE" -ge "$_THRESHOLD" ]; then
  echo "GATE: PASS — ${_RATE}% >= ${_THRESHOLD}%"
else
  echo "GATE: FAIL — ${_RATE}% < ${_THRESHOLD}%"
fi
```

**GATE: PASS** → Complete 모드로 진입.

**GATE: FAIL** → Fix 모드로 진입.

---

## Fix 모드

실패한 테스트가 있을 때 자동 진입.

### Step 1: 실패 컨텍스트 수집

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_SUMMARY_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-summary.json"

python3 -c "
import json
d = json.load(open('${_SUMMARY_FILE}'))
for f in d.get('failed_tests', []):
    print('=== FAILED:', f['name'])
    print('Error:', f['error'][:400])
    if f.get('snippet'):
        print('Snippet:', f['snippet'][:400])
    print()
"
```

실패한 spec 파일 읽기:

```bash
_TEST_DIR=$(cat docs/pw-loop/.state/test-dir.txt 2>/dev/null || echo "tests/e2e")
for _SPEC in "$_TEST_DIR"/*.spec.ts; do
  [ -f "$_SPEC" ] && echo "=== SPEC: $_SPEC ===" && cat "$_SPEC"
done
```

### Step 2: sj-dev 호출

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_THRESHOLD=$(cat docs/pw-loop/.state/threshold.txt 2>/dev/null || echo "80")
_SUMMARY_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-summary.json"
mkdir -p docs/sj-company/.state

python3 - <<EOF
import json

d = json.load(open('${_SUMMARY_FILE}'))
failed = d.get('failed_tests', [])
threshold = '${_THRESHOLD}'

task = f"Playwright 테스트 실패 수정 (Cycle {d['cycle']})\n\n"
task += f"통과율: {d['rate']}% -> 목표: {threshold}%\n\n"
task += "## 실패한 테스트\n"
for i, f in enumerate(failed, 1):
    task += f"\n### {i}. {f['name']}\n"
    task += f"**오류:** {f['error'][:300]}\n"
    if f.get('snippet'):
        task += f"**코드 위치:**\n\`\`\`\n{f['snippet'][:300]}\n\`\`\`\n"

task += "\n## 요청\n"
task += "위 테스트가 통과하도록 소스 코드를 수정해주세요.\n"
task += "spec 파일 자체는 수정하지 말고, 앱 소스 코드만 수정하세요."

open('docs/sj-company/.state/task.txt', 'w').write(task)
print("TASK_SAVED")
EOF

echo "dev" > docs/sj-company/.state/stage.txt
```

`Skill("s-skills:sj-dev")` 호출.

### Step 3: sj-dev 완료 후 재실행

sj-dev 완료 후 실패 테스트만 재실행:

```bash
_CYCLE=$(cat docs/pw-loop/.state/cycle.txt)
_SUMMARY_FILE="docs/pw-loop/reports/cycle-${_CYCLE}-summary.json"
_ARTIFACT_DIR="docs/pw-loop/reports/cycle-${_CYCLE}-artifacts-rerun"

# 실패 테스트의 describe 이름 추출 → grep 패턴으로 재실행
_GREP_PATTERN=$(python3 -c "
import json
d = json.load(open('${_SUMMARY_FILE}'))
names = []
for f in d.get('failed_tests', []):
    part = f['name'].split(' > ')[0].strip('/')
    if part:
        names.append(part)
print('|'.join(set(names)))
" 2>/dev/null || echo "")

if [ -n "$_GREP_PATTERN" ]; then
  npx playwright test \
    --reporter=json \
    --grep="$_GREP_PATTERN" \
    --output="$_ARTIFACT_DIR" \
    2>/tmp/pw-loop-rerun-stderr.log > "${_SUMMARY_FILE}.rerun.json" || true

  # rerun 결과로 summary.json 갱신
  _DATE=$(date +%Y-%m-%d)
  python3 - <<EOF
import json

try:
    new_data = json.load(open('${_SUMMARY_FILE}.rerun.json'))
except:
    print("RERUN_PARSE_FAILED — summary 유지")
    exit(0)

old = json.load(open('${_SUMMARY_FILE}'))
new_passed = []
new_failed = []

def collect(suite, path=""):
    title = (path + "/" + suite.get('title', '')) if path else suite.get('title', '')
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            result = (test.get('results') or [{}])[-1]
            status = result.get('status', 'unknown')
            name = title + " > " + spec.get('title', '')
            if status == 'passed':
                new_passed.append(name)
            else:
                err = result.get('error') or {}
                new_failed.append({'name': name, 'error': err.get('message', ''), 'snippet': err.get('snippet', '')})
    for child in suite.get('suites', []):
        collect(child, title)

for s in new_data.get('suites', []):
    collect(s)

# 재실행 대상이 아닌 기존 PASS는 유지
rerun_names = {f['name'] for f in new_failed} | set(new_passed)
kept_passed = [n for n in old.get('passed_names', []) if n not in rerun_names]

total_pass = len(new_passed) + len(kept_passed)
total_fail = len(new_failed)
total = total_pass + total_fail
rate = int(total_pass * 100 / total) if total > 0 else 0

summary = {
    'cycle': old['cycle'],
    'date': '${_DATE}',
    'passed': total_pass,
    'failed': total_fail,
    'total': total,
    'rate': rate,
    'failed_tests': new_failed,
    'passed_names': new_passed + kept_passed
}
json.dump(summary, open('${_SUMMARY_FILE}', 'w'), indent=2, ensure_ascii=False)
print(f"RERUN_UPDATED: {total_pass}/{total} = {rate}%")
EOF
fi
```

재실행 후 게이트 재체크 (Run 모드 Step 4 반복).

**3회 이상 반복 실패 시** AskUserQuestion:
```
N번 수정 시도 후에도 {FAIL_COUNT}개 테스트가 실패합니다.
```
- A) sj-dev 재시도 (다른 접근법으로)
- B) 해당 테스트를 임시 skip 처리하고 다음 사이클로
- C) 수동으로 확인 후 계속

---

## Report 저장

Run 또는 Fix 완료 후 사이클 보고서 작성.

`docs/pw-loop/reports/cycle-{N}-report.md`:

```markdown
# Playwright 테스트 보고서 — Cycle N

**날짜:** YYYY-MM-DD
**통과율:** N% (목표: THRESHOLD%)
**결과:** PASS / FAIL

---

## 결과 요약

| 구분 | 수 |
|------|---|
| 통과 | N |
| 실패 | N |
| 전체 | N |

## 실패 테스트

| 테스트명 | 오류 요약 | 수정 여부 |
|----------|----------|---------|
| {이름} | {오류} | sj-dev 수정 완료 |

## sj-dev 수정 내역

docs/sj-company/dev-output.md 참조

## 다음 단계

{GATE PASS}: 목표 달성. 완료.
{GATE FAIL}: Cycle N+1 재테스트 대상 — {목록}
```

`docs/pw-loop/.state/history.jsonl`에 이력 추가:
```json
{"cycle": N, "date": "YYYY-MM-DD", "passed": N, "failed": N, "rate": N, "fixed_by_dev": N}
```

---

## Complete 모드

`STATUS: COMPLETE`이면:

```bash
cat docs/pw-loop/.state/history.jsonl 2>/dev/null
```

출력:
```
pw-loop 완료

목표 통과율 {THRESHOLD}% 달성.

최종 결과 (Cycle N):
  PASS: N개 / 전체 N개 = N%

사이클 이력:
  Cycle 1: N%
  Cycle 2: N%
  Cycle N: N% <- 달성

보고서: docs/pw-loop/reports/
```

새 목표로 계속하려면:
```
/pw-loop -> E) 목표 통과율 변경
```

---

## 대시보드 모드

```bash
cat docs/pw-loop/.state/history.jsonl 2>/dev/null
ls docs/pw-loop/reports/*.md 2>/dev/null | xargs -I{} tail -5 {}
```

출력:
```
pw-loop 현황 (YYYY-MM-DD)
목표: THRESHOLD%  |  현재: N%  |  Cycle: N

Cycle | PASS | FAIL | 통과율
------|------|------|------
  1   |  3   |  4   | 43%
  2   |  6   |  1   | 86%  <- 달성
```

---

## 상태 파일 구조

```
docs/pw-loop/
├── .state/
│   ├── cycle.txt          <- 현재 사이클 번호
│   ├── threshold.txt      <- 목표 통과율 (기본 80)
│   ├── features.txt       <- 확정된 테스트 기능 목록
│   ├── base-url.txt       <- 앱 base URL
│   ├── test-dir.txt       <- spec 파일 디렉토리 (Generate Step 1에서 확정)
│   └── history.jsonl      <- 사이클별 이력
├── reports/
│   ├── cycle-N-raw.json          <- playwright --reporter=json 원본
│   ├── cycle-N-summary.json      <- 파싱된 요약
│   └── cycle-N-report.md         <- 사람이 읽는 보고서
└── improvement.md

{TEST_DIR}/                <- playwright.config의 testDir
├── {feature1}.spec.ts
├── {feature2}.spec.ts
└── ...
```
