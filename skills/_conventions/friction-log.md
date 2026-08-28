# 프릭션 로그 (Friction Log)

스킬을 실행하다 마찰(혼란·오류·막힘)을 만나거나, 반대로 기대 이상으로 잘 풀렸을 때
**한 줄로 기록**한다. 이 신호를 sj-retro가 주간으로 모아 Keep/Improve/Try에 반영한다.

> gbrain의 `friction log` 프로토콜 차용 — 버그 리포트를 쓰는 대신, 마찰을 만난 그 자리에서
> append-only 로그에 남긴다. **마찰을 기록하는 일 자체에 마찰이 없어야** 실제로 기록된다.

## 언제 기록하나

**friction (개선 신호)** — 다음 중 하나라도 일어나면:
- 명령·단계가 실패했는데 에러 메시지가 다음 행동을 알려주지 못했다
- 문서(SKILL.md·컨벤션)가 말한 것과 실제 동작이 달랐다
- 다음 단계를 못 찾았다 / 성공 여부를 판단할 수 없었다
- 수동 우회가 필요했다

**delight (긍정 신호)** — 다음 중 하나라도 일어나면:
- 처음 시도에 그대로 됐고 문서가 정확히 맞았다
- 에러 메시지가 곧바로 해법을 줬다

## 의무 기록 트리거 (판단하지 않는다)

위의 "언제 기록하나"는 **알아차림**을 요구한다 — 작업에 몰입해 있으면 그냥 지나간다.
실제로 이 로그는 두 달 넘게 4건에 머물렀고, 그 사이 기록되지 않은 마찰이 최소 6건 있었다.

그래서 **관측 가능한 사건**을 트리거로 고정한다. "마찰을 느꼈나"를 묻지 말고 아래가 일어났는지만 본다:

1. **산출물에 `미수행:`을 썼다** → 그 이유가 곧 마찰이다.
2. **같은 태스크에서 수정 라운드가 2회 이상 돌았다** → 한 번에 안 된 이유가 마찰이다.
3. **도구·훅·명령이 예상과 다르게 동작해 우회했다** — 재시도, 다른 방법으로 돌아가기, 플래그 변경.
4. **리뷰가 Critical 또는 Important를 냈다** → 그걸 만든 원인이 마찰이다.
5. **지시받은 대로 했는데 지시 자체가 틀렸다는 걸 발견했다** → 가장 값진 신호다. 반드시 기록한다.

## 의무 체크포인트

역할 스킬이 **완료 보고를 쓰기 직전**, 위 5개 트리거 중 발생한 것이 있으면 각각 한 줄씩 기록한 뒤 보고한다.

- 발생한 게 없으면 **아무것도 기록하지 않는다** — "마찰 없음" 항목은 로그를 잡음으로 채운다.
- 체크 자체는 건너뛰지 않는다. 완료 보고가 항상 있으므로 체크 지점도 항상 있다.
- 기록은 사후 회상이 아니라 그 자리에서 — 회상은 이번처럼 6건을 놓친다.

## severity 가이드

| severity | 의미 |
|----------|------|
| `blocker` | 더 진행할 수 없었다. 하드 스톱. |
| `error` | 명령·단계가 예기치 않게 실패했다. |
| `confused` | 문서/동작 불일치, 모호함, 포인터 누락. |
| `nit` | 다듬을 거리. 사소함. |

delight는 `kind=delight`로 기록하되 severity는 아무거나(보통 `nit`).

구체적으로: "doctor가 schema_version=0이라며 apply-migrations를 가리키는데, apply-migrations는 출력 없이 종료 코드 0" 이 "doctor가 헷갈렸다"보다 낫다.

## 기록 위치 & 스키마

`docs/sj-company/friction.jsonl` — **영속, append-only.** (`.state/`가 아님 — 사이클이 지나도 보존돼야 retro가 본다.)

한 줄당 한 레코드(JSON):

```json
{"ts":"2026-06-13T14:30:00","run_id":"20260613-143000-12345","skill":"sj-tech-lead","phase":"dispatch","kind":"friction","severity":"confused","message":"...","hint":"..."}
```

- `run_id` — [RUN_ID 추적](run-id.md)에서 읽는다. 어느 파이프라인 실행의 마찰인지 추적.
- `message` — **PII 금지.** [PII 마스킹](pii-masking.md) 적용 후 기록한다.
- `hint` — 선택. "이렇게 됐으면 좋겠다" 한 줄.

## 기록 레시피 (canonical)

argv + heredoc 방식 — message에 따옴표·특수문자가 있어도 안전하다:

```bash
python3 - "sj-tech-lead" "dispatch" "friction" "confused" "막힌 상황 한 줄" "개선 힌트(선택)" <<'PY'
import json, sys, os, re, datetime
state = "docs/sj-company/.state/current-run.txt"
rid = open(state).read().strip() if os.path.exists(state) else "standalone"

def redact(s):  # PII 마스킹을 선언이 아니라 코드로 강제 (영속 write 직전 필수)
    s = re.sub(r'(?i)\bbearer\s+[A-Za-z0-9._\-]+', 'Bearer [REDACTED]', s)
    s = re.sub(r'(?i)\b(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|auth)\b(["\s:=]+)\S+', r'\1\2[REDACTED]', s)
    s = re.sub(r'(?i)\bBearer\s+\S+', 'Bearer [REDACTED]', s)
    s = re.sub(r'\beyJ[A-Za-z0-9._\-]{10,}', '[JWT]', s)
    s = re.sub(r'[\w.+\-]+@[\w\-]+\.[\w.\-]+', '[EMAIL]', s)
    return s

rec = {
    "ts": datetime.datetime.now().isoformat(timespec="seconds"),
    "run_id": rid, "skill": sys.argv[1], "phase": sys.argv[2],
    "kind": sys.argv[3], "severity": sys.argv[4], "message": redact(sys.argv[5]),
}
if len(sys.argv) > 6 and sys.argv[6]:
    rec["hint"] = redact(sys.argv[6])
os.makedirs("docs/sj-company", exist_ok=True)
with open("docs/sj-company/friction.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
print(f"friction logged: {rec['severity']} — {rec['message'][:50]}")
PY
```

delight는 4번째 인자를 `delight`로: `... "sj-qa" "verify" "delight" "nit" "완료 조건이 명확해 1:1 대조가 바로 됐다"`.

## 조회 레시피 (retro용)

```bash
python3 - "$SINCE" <<'PY'
import json, os, sys
from collections import Counter
f = "docs/sj-company/friction.jsonl"
if not os.path.exists(f):
    print("friction 없음"); raise SystemExit
since = sys.argv[1]   # YYYY-MM-DD
rows = [json.loads(l) for l in open(f, encoding="utf-8") if l.strip()]
recent = [r for r in rows if r.get("ts", "")[:10] >= since]

# 구스키마 관용 — 초기 항목은 severity 없이 where/note를 썼다. 로그는 append-only라
# 과거를 고쳐 쓰지 않고 읽는 쪽이 흡수한다. 누락 필드로 죽으면 retro가 통째로 멈춘다.
def sev_of(r):   return r.get("severity", "confused")
def who_of(r):   return r.get("skill") or r.get("where", "?")
def msg_of(r):   return r.get("message") or r.get("note", "")

sev = Counter(sev_of(r) for r in recent if r.get("kind") == "friction")
delight = sum(1 for r in recent if r.get("kind") == "delight")
print(f"friction {sum(sev.values())}건 "
      f"(blocker:{sev['blocker']} error:{sev['error']} confused:{sev['confused']} nit:{sev['nit']}) "
      f"/ delight {delight}건")
for r in recent:
    if r.get("kind") == "friction" and sev_of(r) in ("blocker", "error", "confused"):
        phase = r.get("phase", "-")
        print(f"  [{sev_of(r)}] {who_of(r)}/{phase}: {msg_of(r)}"
              + (f"  → {r['hint']}" if r.get("hint") else ""))
PY
```

## 상태 관리

friction.jsonl은 **append-only — 처리/미처리 플래그를 두지 않는다.** retro가 날짜 범위로 필터해 소비하므로, 같은 마찰이 반복되면 여러 줄로 쌓이고 그 빈도 자체가 우선순위 신호가 된다 (자주 쌓이는 마찰일수록 먼저 고친다).

파일이 비대해지면(수백 줄+) retro 시점에 [archive-only](archive-only.md)로 백업한 뒤 오래된 항목을 잘라낸다.
