---
name: sj-company
version: 1.2.0
description: |
  SJ Company 하네스. 프로젝트 상태를 감지하고 PM / Design / Tech Lead / QA 역할로 라우팅한다.
  Tech Lead가 Frontend/Backend/Database/DevOps/Security/Data 전문 서브에이전트를 병렬 디스패치한다.
  인자 없이 호출하면 상태 기반 라우팅, 메시지와 함께 호출하면 의도 기반 라우팅.
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Skill
  - AskUserQuestion
triggers:
  - /sj-company
---

# SJ Company Harness

## Base Guidelines (Karpathy)

모든 역할(PM/Design/Dev/QA)에 적용되는 행동 원칙이다.

**1. Think Before Coding** — 가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러낸다.
- 불확실하면 명시적으로 가정을 밝히고 물어본다.
- 해석이 여러 개면 골라서 제시한다. 조용히 하나만 선택하지 않는다.
- 더 단순한 방법이 있으면 말한다. 필요하면 반론한다.

**2. Simplicity First** — 문제를 푸는 최소한의 코드. 추측성 코드 없음.
- 요청된 것 이상의 기능 추가 금지.
- 단일 사용 코드에 추상화 금지.
- 200줄로 쓸 수 있는 걸 50줄로 쓸 수 있으면 다시 쓴다.

**3. Surgical Changes** — 꼭 필요한 것만 건드린다. 자기가 만든 쓰레기만 치운다.
- 인접 코드, 주석, 포맷을 "개선"하지 않는다.
- 고장나지 않은 것은 리팩토링하지 않는다.
- 변경된 모든 줄은 사용자 요청으로 직접 추적 가능해야 한다.

**4. Goal-Driven Execution** — 성공 기준을 정의하고 검증될 때까지 루프한다.
- 태스크를 검증 가능한 목표로 변환한다.
- 멀티스텝 태스크는 간략한 플랜을 먼저 제시한다.

---

## Preamble — 프로젝트 상태 감지

```bash
mkdir -p docs/sj-company/.state

_STAGE=$(cat docs/sj-company/.state/stage.txt 2>/dev/null | tr -d '[:space:]')
_TASK=$(cat docs/sj-company/.state/task.txt 2>/dev/null)
_HAS_PM=$([ -s "docs/sj-company/pm-output.md" ] && echo "yes" || echo "no")
_HAS_DESIGN=$([ -s "docs/sj-company/design-output.md" ] && echo "yes" || echo "no")
_HAS_DEV=$([ -s "docs/sj-company/dev-output.md" ] && echo "yes" || echo "no")
_HAS_QA=$([ -s "docs/sj-company/qa-output.md" ] && echo "yes" || echo "no")

echo "STAGE: ${_STAGE:-none}"
echo "TASK: ${_TASK:-없음}"
echo "PM: $_HAS_PM | DESIGN: $_HAS_DESIGN | DEV: $_HAS_DEV | QA: $_HAS_QA"
```

---

## 라우팅 결정

### Case A: 인자 없이 호출 (`/sj-company`) — 상태 기반

Preamble 결과를 바탕으로 판단:

| STAGE | 다음 액션 |
|-------|-----------|
| `none` 또는 비어있음 | 태스크 입력 받기 → PM 실행 |
| `pm` | AskUserQuestion: Design 또는 Dev 중 선택 |
| `design` | Dev 실행 |
| `dev` | QA 실행 |
| `done` | 완료 요약 출력 + 새 태스크 여부 확인 |

**STAGE=none 처리:**

task.txt에 잔류 태스크가 있는지 확인한다:

```bash
_LEFTOVER=$(cat docs/sj-company/.state/task.txt 2>/dev/null | tr -d '[:space:]')
echo "LEFTOVER: ${_LEFTOVER:-없음}"
```

**잔류 태스크 있음 (`LEFTOVER` 비어있지 않음):** AskUserQuestion:

```
이전 세션의 태스크가 남아 있습니다.
태스크: {LEFTOVER}
```

옵션:
- A) 이어서 진행 (추천) → 그대로 `Skill("s-skills:sj-pm")` 호출
- B) 새 태스크 입력 → 새 태스크를 AskUserQuestion으로 입력받아 task.txt 덮어쓰기 후 `Skill("s-skills:sj-pm")` 호출

**잔류 태스크 없음:** AskUserQuestion으로 태스크를 입력받고 task.txt에 저장:

```bash
echo "{사용자 입력}" > docs/sj-company/.state/task.txt
# 새 사이클 시작: 이전 사이클 산출물·타임스탬프 초기화 (크로스-사이클 mtime 오염 방지)
> docs/sj-company/pm-output.md
> docs/sj-company/design-output.md
> docs/sj-company/dev-output.md
> docs/sj-company/qa-output.md
echo "{}" > docs/sj-company/.state/timestamps.json
```

이후 `Skill("s-skills:sj-pm")` 호출.

**STAGE=pm 처리:**

AskUserQuestion:
```
PM 분석이 완료됐습니다.
다음 단계를 선택하세요:
```
- A) Design 먼저 (UI/UX 작업 포함) → `Skill("s-skills:sj-design")`
- B) Tech Lead 바로 진행 (UI 작업 없음) → `Skill("s-skills:sj-tech-lead")`

**STAGE=design 처리:** `Skill("s-skills:sj-tech-lead")` 호출.

**STAGE=dev 처리:** `Skill("s-skills:sj-qa")` 호출.

**STAGE=done 처리:**

```bash
# 1. 총괄 보고서(report.md) 작성 — 총괄(sj-company)이 직접 기록
TASK_TEXT=$(cat docs/sj-company/.state/task.txt 2>/dev/null)
QA_VERDICT=$(grep -oE 'PASS|FAIL|CONDITIONAL' docs/sj-company/qa-output.md 2>/dev/null | head -1)
NOW=$(date "+%Y-%m-%d %H:%M")

# 타임스탬프: timestamps.json 우선, 없으면 mtime 폴백
eval "$(python3 - <<'PY'
import json, os, subprocess

ts_path = "docs/sj-company/.state/timestamps.json"
ts = {}
try:
    ts = json.load(open(ts_path))
except Exception:
    pass

def mtime(f):
    try:
        r = subprocess.run(["stat", "-f", "%Sm", "-t", "%Y-%m-%d %H:%M", f],
                           capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else "-"
    except Exception:
        return "-"

pm  = ts.get("pm",  mtime("docs/sj-company/pm-output.md"))
dev = ts.get("dev", mtime("docs/sj-company/dev-output.md"))
qa  = ts.get("qa",  mtime("docs/sj-company/qa-output.md"))

has_design = (os.path.isfile("docs/sj-company/design-output.md")
              and os.path.getsize("docs/sj-company/design-output.md") > 0)
design_status = "✅ 완료" if has_design else "⏭️ 생략"
design_mtime  = ts.get("design", mtime("docs/sj-company/design-output.md")) if has_design else "-"

print(f'PM_MTIME="{pm}"')
print(f'DESIGN_STATUS="{design_status}"')
print(f'DESIGN_MTIME="{design_mtime}"')
print(f'DEV_MTIME="{dev}"')
print(f'QA_MTIME="{qa}"')
PY
)"

# QA 요약: 판정 섹션 전체 추출 (다음 ## 이전까지, 최대 800자)
QA_SUMMARY=$(python3 - <<'PY'
import re
try:
    text = open("docs/sj-company/qa-output.md", encoding="utf-8").read()
    m = re.search(r'(#{1,3}\s*판정.+?)(?=\n#{1,3}\s|\Z)', text, re.DOTALL)
    if m:
        print(m.group(1).strip()[:800])
    else:
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if "판정" in line:
                print("\n".join(lines[i:i+25]))
                break
        else:
            print("(판정 섹션 없음)")
except Exception as e:
    print(f"(QA 요약 추출 실패: {e})")
PY
)
```

위 변수를 사용해 `docs/sj-company/report.md`를 **Write 툴로** 작성한다:

```markdown
---
task: "{TASK_TEXT}"
completed: "{NOW}"
qa_verdict: {QA_VERDICT}
---

# 태스크 보고서

**태스크:** {TASK_TEXT}
**완료:** {NOW}

## WBS 결과

| 단계 | 상태 | 완료 시각 |
|------|------|-----------|
| PM | ✅ 완료 | {PM_MTIME} |
| Design | {DESIGN_STATUS} | {DESIGN_MTIME} |
| Tech Lead | ✅ 완료 | {DEV_MTIME} |
| QA | {QA_VERDICT} | {QA_MTIME} |

## QA 핵심 요약

{QA_SUMMARY}
```

```bash
# 2. task.txt 초기화 (완료된 태스크 잔류 방지)
echo "" > docs/sj-company/.state/task.txt
```

완료 요약을 사용자에게 출력한 뒤 AskUserQuestion으로 새 태스크 여부 확인:
- A) 새 태스크 시작 → stage.txt 초기화 후 재시작
- B) 종료

---

### Case B: 인자와 함께 호출 (`/sj-company <메시지>`) — 의도 기반

메시지 내용을 분석해 적절한 역할로 라우팅:

**라우팅 규칙:**

| 의도 패턴 | 라우팅 |
|-----------|--------|
| 버그 수정, 에러 수정, fix | `Skill("s-skills:sj-tech-lead")` → `Skill("s-skills:sj-qa")` |
| 디자인, UI 명세, 화면 설계 | `Skill("s-skills:sj-design")` |
| 기획, 요구사항, 스펙, 분석 | `Skill("s-skills:sj-pm")` |
| 테스트, 검증, 확인 | `Skill("s-skills:sj-qa")` |
| 기능 추가, 새 기능, 구현 | `Skill("s-skills:sj-pm")` 완료 후 Design/Tech Lead 선택 → `Skill("s-skills:sj-qa")` |
| 프론트만, UI 구현, 컴포넌트만 | `Skill("s-skills:sj-tech-lead")` (single dispatch: frontend) |
| 백엔드만, API만 | `Skill("s-skills:sj-tech-lead")` (single dispatch: backend) |
| 마이그레이션, 스키마 변경, DB | `Skill("s-skills:sj-tech-lead")` (single dispatch: database) |
| CI/CD, 배포, Docker, 워크플로우 | `Skill("s-skills:sj-tech-lead")` (single dispatch: devops) |
| 인증, 권한, 보안, 취약점 | `Skill("s-skills:sj-tech-lead")` (single dispatch: security) |
| 파이프라인, ML, 모델, 데이터 처리 | `Skill("s-skills:sj-tech-lead")` (single dispatch: data) |

> single dispatch 패턴: Tech Lead에게 "이 태스크는 {role} 1명만 필요"라고 힌트를 전달해 불필요한 병렬·리뷰 단계를 생략하게 한다.

메시지를 task.txt에 저장 후 라우팅:

```bash
echo "{메시지}" > docs/sj-company/.state/task.txt
# 새 사이클 시작: 이전 사이클 산출물·타임스탬프 초기화 (크로스-사이클 mtime 오염 방지)
> docs/sj-company/pm-output.md
> docs/sj-company/design-output.md
> docs/sj-company/dev-output.md
> docs/sj-company/qa-output.md
echo "{}" > docs/sj-company/.state/timestamps.json
```

> **참고:** "기능 추가" 라우팅에서 PM 완료 후 STAGE=pm과 동일한 AskUserQuestion을 제시한다 (Design 먼저 vs Tech Lead 바로 진행).

---

## 스킬 호출 완료 후 귀환

각 서브스킬 완료 후:

0. 완료된 단계의 타임스탬프를 timestamps.json에 기록 (아직 기록 안 된 경우에만):

```bash
_CURRENT_STAGE=$(cat docs/sj-company/.state/stage.txt 2>/dev/null | tr -d '[:space:]')
# stage.txt 값 → timestamps.json 키 매핑
case "$_CURRENT_STAGE" in
  pm)     _TS_KEY="pm" ;;
  design) _TS_KEY="design" ;;
  dev)    _TS_KEY="dev" ;;
  done)   _TS_KEY="qa" ;;
  *)      _TS_KEY="" ;;
esac
if [ -n "$_TS_KEY" ]; then
  python3 -c "
import json, datetime, os, sys
p = 'docs/sj-company/.state/timestamps.json'
key = sys.argv[1]
ts = json.load(open(p)) if os.path.exists(p) else {}
if key not in ts:
    ts[key] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    json.dump(ts, open(p, 'w'), ensure_ascii=False)
" "$_TS_KEY"
fi
```

1. 상태 재감지 (Preamble 재실행)
2. 완료된 결과물 요약 출력
3. 다음 단계 제안
