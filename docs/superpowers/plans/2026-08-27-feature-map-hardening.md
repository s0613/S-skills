# 기능 지도 경화(hardening) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v4.1.0에서 출시한 기능 지도가 "쓸 만한 초판"에서 "믿고 쓰는 인프라"가 되도록, 미검증 데이터·좁은 발동 경로·부재한 자기 회귀망을 메운다.

**Architecture:** 새 층을 쌓지 않는다. 이미 있는 가드(`scripts/skill-manifest.py`)에 검사 2개를 덧붙이고, 이미 있는 실행 경로(sj-company Small)에 지도 읽기를 끼우고, 손으로 한 번 돌렸던 행동 테스트를 픽스처로 저장소에 남겨 sj-retro 게이트가 쓰게 한다. 마지막에 실제 프로젝트 1개로 검증한다.

**Tech Stack:** Python 3 (기존 `scripts/skill-manifest.py` 확장) + Markdown + bash. 새 의존성 없음.

**Spec:** `docs/spec/2026-08-27-feature-map-traceability.md` — 이 계획은 그 스펙이 *주장한* 불변식을 실제로 *참으로 만드는* 작업이다.

## 왜 (평가에서 나온 약점 5가지)

| # | 약점 | 증거 | 이 계획의 대응 |
|---|------|------|----------------|
| 1 | 지도에서 가장 가치 있는 `의존` 칸에 기계 검증이 0 | drift 검사는 경로 실존만 본다. 의존이 틀리거나 기능이 빠져도 감지 불가 | Task 1 — 참조 무결성 + 표↔mermaid 일치를 가드에 추가 |
| 2 | 지도를 읽는 경로가 sj-spec 하나뿐 | Tiny/Small은 sj-spec을 건너뛴다 — 실사용의 대부분이 여기 | Task 2 — sj-company Small 경로에 지도 읽기 |
| 3 | 실제 프로젝트에서 미검증 | S-skills는 스킬 1개=기능 1개라 거의 기계적. 기능 60개짜리 앱은 안 해봄 | Task 5 — 실제 프로젝트 1개에 적용·평가 |
| 4 | 하네스가 자기 회귀를 못 잡음 | 행동 테스트 3건은 손으로 돌리고 픽스처를 지웠다. self-harness 게이트의 "녹색불"은 구조 drift만 본다 | Task 3·4 — 계약 어서션(상시) + 행동 픽스처(주기) |
| 5 | 리뷰 비용 배분이 나빴음 | 태스크별 리뷰 6회가 3건, 최종 교차 리뷰 1회가 블로킹 3건 | 이 계획은 태스크 5개 — 태스크별 리뷰는 가볍게, 최종 리뷰에 무게 |

## Global Constraints

- **비차단 폴백**: 볼트가 없으면 어떤 검사도 실패로 만들지 않는다. 볼트 부재는 스킵이지 에러가 아니다 (하네스 전역 원칙).
- **지도 불일치는 경고(LOW), FAIL 아님** — sj-qa 판정 규칙은 **편집 금지 표면**이다(`self-harness.md`). 이 계획은 그 규칙을 건드리지 않는다.
- **대상 프로젝트에 스크립트를 설치하지 않는다.** 새 Python 코드는 S-skills 저장소 자신의 가드에만 들어간다. 대상 프로젝트용 검사는 컨벤션의 bash 한 줄로 남긴다.
- **Judge 독립성 불변**: sj-qa는 지도를 판정 근거로 삼지 않는다. 이 계획의 어떤 변경도 지도를 판정 입력으로 만들지 않는다.
- **사람 게이트 불변**: PR 머지·프로덕션 배포 승인은 사람이 한다.
- 검증된 drift 검사 명령 (변경 금지, 그대로 사용):

```bash
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

- 지도 표의 칼럼 순서(고정): `ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존`
- 화살표 방향 규칙(고정): `A --> B`는 **A가 B에 의존**한다는 뜻.

## 실행 순서

Task 1 → Task 2 → Task 3(Task 2 의존) → Task 4 → Task 5(전부 이후, 사람 게이트).
Task 3은 Task 2가 sj-company 플레이북에 남기는 마커를 검사하므로 반드시 뒤에 온다.

---

### Task 1: 지도 무결성 검사 — 참조 무결성 + 표↔mermaid 일치

지금 drift 검사는 "적힌 경로가 실존하는가"만 본다. 의존 ID가 존재하지 않는 행을 가리켜도, mermaid가 표와 다른 말을 해도 아무도 모른다. 이 저장소 자신의 지도부터 기계가 지키게 한다.

**Files:**
- Modify: `scripts/skill-manifest.py` (`check()` 함수 — 검사 7번 뒤, `return errors` 앞)
- Modify: `skills/_conventions/feature-map.md` (`## drift 검사 (기계 검증)` 절 끝)

**Interfaces:**
- Consumes: `docs/FEATURE-MAP.md`의 고정 칼럼 순서와 화살표 방향 규칙.
- Produces: `[feature-map-stale]` / `[feature-map-ref]` / `[feature-map-edge]` 3종 에러 태그 — Task 3이 같은 `errors` 리스트에 `[playbook-contract]`를 덧붙인다.

- [ ] **Step 1: 검사가 실패하는 것을 먼저 확인 (RED)**

일부러 지도를 깨뜨린다:

```bash
cd /Users/songseungju/S-skills
cp docs/FEATURE-MAP.md /tmp/feature-map-backup.md
python3 - <<'PY'
p='docs/FEATURE-MAP.md'
s=open(p,encoding='utf-8').read()
s=s.replace('| F02 |','| F02 |',1)
# 존재하지 않는 의존 ID를 F01 행에 주입
import re
s=re.sub(r'^(\| F01 \|[^|]*\|[^|]*\|[^|]*\|[^|]*\|)([^|]*)\|', r'\1 F99 |', s, count=1, flags=re.M)
open(p,'w',encoding='utf-8').write(s)
print("F01의 의존을 F99(존재하지 않음)로 바꿈")
PY
python3 scripts/skill-manifest.py --check
```

Expected: 아직 검사가 없으므로 `정합성 검사 통과`가 나온다 — **이것이 문제다.** 깨진 지도를 가드가 통과시킨다는 사실을 눈으로 확인한 뒤 다음 단계로 간다.

- [ ] **Step 2: 검사 8번 구현**

`scripts/skill-manifest.py`의 `check()` 함수에서 검사 7번(`# 7. skills/VERSION ↔ package.json`) 블록이 끝난 직후, `return errors` **앞**에 삽입:

```python
    # 8. docs/FEATURE-MAP.md 무결성 (이 저장소 자신의 기능 지도)
    #    drift 검사(경로 실존)는 컨벤션의 bash가 대상 프로젝트에서 돌지만,
    #    참조 무결성과 표↔mermaid 일치는 여기서만 상시 검사한다.
    feature_map = os.path.join(ROOT, "docs", "FEATURE-MAP.md")
    if os.path.isfile(feature_map):
        with open(feature_map, encoding="utf-8") as f:
            fmap = f.read()
        # 칼럼: ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존
        rows = re.findall(
            r"^\|\s*(F\d+)\s*\|[^|]*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|",
            fmap, re.M,
        )
        row_ids = {r[0] for r in rows}
        for rid, entry, core, test, _dep in rows:
            for cell in (entry, core, test):
                for path in re.split(r"[ ,]+", cell.replace("`", "").strip()):
                    if path and path not in ("—", "-", "없음"):
                        if not os.path.exists(os.path.join(ROOT, path)):
                            errors.append(f"[feature-map-stale] {rid}: '{path}' 경로 없음 — 지도가 낡음")
        for rid, _e, _c, _t, dep in rows:
            for ref in re.findall(r"F\d+", dep):
                if ref not in row_ids:
                    errors.append(f"[feature-map-ref] {rid}의 의존 '{ref}' — 그런 행이 표에 없음")
        table_edges = {
            (rid, ref)
            for rid, _e, _c, _t, dep in rows
            for ref in re.findall(r"F\d+", dep)
        }
        mermaid_edges = set(re.findall(r"(F\d+)(?:\[[^\]]*\])?\s*-->\s*(F\d+)", fmap))
        for a, b in sorted(mermaid_edges - table_edges):
            errors.append(f"[feature-map-edge] mermaid에 {a} --> {b} 있으나 표의 의존 칸에 없음 (표가 정본)")
        for a, b in sorted(table_edges - mermaid_edges):
            errors.append(f"[feature-map-edge] 표에 {a}의 의존 {b} 있으나 mermaid에 화살표 없음 (표가 정본)")
```

- [ ] **Step 3: 검사가 깨진 지도를 잡는지 확인 (RED → 잡힘)**

```bash
cd /Users/songseungju/S-skills
python3 scripts/skill-manifest.py --check
```

Expected: exit 1, 그리고 최소 두 종류의 에러 —
`[feature-map-ref] F01의 의존 'F99' — 그런 행이 표에 없음`
`[feature-map-edge] 표에 F01의 의존 F99 있으나 mermaid에 화살표 없음 (표가 정본)`

두 에러가 모두 나오지 않으면 정규식이 칼럼을 잘못 잡은 것이다. `rows` 길이를 출력해 26인지 확인한 뒤 고친다.

- [ ] **Step 4: 지도 복구 후 GREEN 확인**

```bash
cd /Users/songseungju/S-skills
cp /tmp/feature-map-backup.md docs/FEATURE-MAP.md
rm /tmp/feature-map-backup.md
git diff --stat docs/FEATURE-MAP.md
python3 scripts/skill-manifest.py --check
```

Expected: `git diff --stat`이 빈 출력(복구 완료), 그리고 `정합성 검사 통과 — 스킬 26개, drift 없음`.

- [ ] **Step 5: 컨벤션에 대상 프로젝트용 bash 검사 2종 추가**

`skills/_conventions/feature-map.md`의 `## drift 검사 (기계 검증)` 절에서, 역방향 설명 문단(`역방향(코드엔 있으나 지도에 없는 기능)은 기계로 잡히지 않는다 …`) **바로 앞**에 삽입:

````markdown
경로 실존 외에 두 가지를 더 기계로 확인할 수 있다. 대상 프로젝트에서는 아래 두 명령을 쓴다 (스크립트 설치 없음).

**의존 참조 무결성** — 의존 칸이 가리키는 ID가 실제 행으로 존재하는가:

```bash
IDS=$(awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); print $2}' docs/FEATURE-MAP.md | sort -u)
awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); n=split($7,a,/[ ,]+/); for(i=1;i<=n;i++) if(a[i] ~ /^F[0-9]+$/) print $2, a[i]}' docs/FEATURE-MAP.md \
  | while read src ref; do echo "$IDS" | grep -qx "$ref" || echo "DANGLING: $src → $ref"; done
```

**표↔mermaid 일치** — 화살표 집합과 의존 칸 집합이 같은가 (`A --> B` = A가 B에 의존):

```bash
diff <(awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); n=split($7,a,/[ ,]+/); for(i=1;i<=n;i++) if(a[i] ~ /^F[0-9]+$/) print $2"->"a[i]}' docs/FEATURE-MAP.md | sort) \
     <(grep -o 'F[0-9]*\(\[[^]]*\]\)\? *--> *F[0-9]*' docs/FEATURE-MAP.md | sed 's/\[[^]]*\]//g; s/ *--> */->/' | sort) \
  && echo "EDGES OK"
```

둘 다 출력이 없으면(후자는 `EDGES OK`) 지도가 자기모순 없이 일관된다. **의존 관계가 실제로 참인지는 기계가 확인할 수 없다** — 그것만은 사람과 리뷰의 몫이다.
````

- [ ] **Step 6: 컨벤션의 bash 검사 2종이 실제로 도는지 확인**

```bash
cd /Users/songseungju/S-skills
IDS=$(awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); print $2}' docs/FEATURE-MAP.md | sort -u)
awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); n=split($7,a,/[ ,]+/); for(i=1;i<=n;i++) if(a[i] ~ /^F[0-9]+$/) print $2, a[i]}' docs/FEATURE-MAP.md \
  | while read src ref; do echo "$IDS" | grep -qx "$ref" || echo "DANGLING: $src → $ref"; done
diff <(awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); n=split($7,a,/[ ,]+/); for(i=1;i<=n;i++) if(a[i] ~ /^F[0-9]+$/) print $2"->"a[i]}' docs/FEATURE-MAP.md | sort) \
     <(grep -o 'F[0-9]*\(\[[^]]*\]\)\? *--> *F[0-9]*' docs/FEATURE-MAP.md | sed 's/\[[^]]*\]//g; s/ *--> */->/' | sort) \
  && echo "EDGES OK"
grep -c '^```' skills/_conventions/feature-map.md
```

Expected: DANGLING 출력 없음, `EDGES OK`, 펜스 개수 짝수.
`EDGES OK`가 안 나오면 `diff`가 보여주는 양쪽 차이를 읽어 명령의 필드 인덱스를 고친다 — 지도가 아니라 명령을 의심한다(Python 검사 8번이 같은 지도를 통과시켰으므로).

- [ ] **Step 7: 커밋**

`git add` 대상: `scripts/skill-manifest.py`, `skills/_conventions/feature-map.md`

커밋 메시지:
```
feat(guard): 기능 지도 참조 무결성·표↔mermaid 일치 검사

drift 검사는 경로 실존만 봤다. 지도에서 가장 가치 있는 의존 칸은
아무도 검증하지 않았고, mermaid가 표와 다른 말을 해도 통과했다.
가드에 검사 8번을 추가해 이 저장소 자신의 지도를 상시 검사하고,
대상 프로젝트용으로는 컨벤션에 bash 2종을 남긴다.
의존이 실제로 참인지는 여전히 기계가 못 본다 — 그건 명시해둔다.
```

---

### Task 2: sj-company Small 경로에 지도 읽기

구현 전 영향 분석이 sj-spec에만 걸려 있어서, 실사용의 대부분인 Tiny/Small 태스크는 지도를 한 번도 읽지 않는다. Small에 붙여 발동 빈도를 올린다. Tiny는 붙이지 않는다 — 1파일·단순 값 변경에 영향 분석은 과하고, 플레이북이 Tiny에 대해 "과정 의식 금지"를 명시한다.

**Files:**
- Modify: `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-company.md` (`#### Small 실행 경로`)

**Interfaces:**
- Consumes: Task 1의 컨벤션(형식·화살표 방향 규칙). `docs/FEATURE-MAP.md`의 고정 칼럼 순서.
- Produces: 볼트 `sj-company.md`에 문자열 `FEATURE-MAP` — Task 3의 계약 어서션이 이 마커의 존재를 검사한다.

- [ ] **Step 1: 삽입 지점 확인**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-company.md"
grep -n '#### Small 실행 경로\|#### Medium 실행 경로' "$V"
sed -n '/#### Small 실행 경로/,/#### Medium 실행 경로/p' "$V"
```

Small 경로는 번호 목록 5개(1. 구현 계획 → 2. 구현 → 3. 빌드 확인 → 4. pw-loop → 5. PROJECT.md)로 되어 있다. 새 단계는 **1번과 2번 사이**에 들어간다 — 계획을 세운 뒤, 구현하기 전.

- [ ] **Step 2: 지도 읽기 단계 삽입**

`2. 구현 — 최소 코드 사다리 적용, 의도된 단순화는 `ponytail:` 주석으로 표시.` 줄 **바로 앞**에 삽입하고, 이후 번호를 2→3, 3→4, 4→5, 5→6으로 재부여한다:

````markdown
2. 영향 범위 확인 (지도 있을 때만):

```bash
[ -f docs/FEATURE-MAP.md ] && echo "MAP=present" || echo "MAP=absent"
```

`MAP=absent` → 건너뛰고 구현으로 간다. **중단하지 않는다.**

`MAP=present` → 지도를 Read로 읽고, 1번에서 정한 변경 대상 파일이 어느 기능 행에 속하는지 찾는다. 그 기능 ID를 `의존` 칸에 적어둔 다른 행이 있으면 — 그게 이 변경으로 깨질 수 있는 기능이다. 한 줄로 사용자에게 알리고 진행한다:

```
영향: F07 관리자 인박스가 F02에 의존합니다. 회귀 확인 대상: src/lib/sales/tools.test.ts
```

해당 기능이 없으면 출력하지 않는다. 지도 갱신은 하지 않는다 — Small은 기능 추가가 아니라 수정이 기본이고, 새 기능을 만들었다면 지도 행 추가는 Medium 이상 경로(sj-tech-lead 9b-2)의 몫이다.
````

- [ ] **Step 3: 삽입 검증**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-company.md"
sed -n '/#### Small 실행 경로/,/#### Medium 실행 경로/p' "$V"
grep -c 'FEATURE-MAP' "$V"
grep -c '^```' "$V"
```

Expected: Small 경로의 번호가 1~6으로 빠짐없이 이어지고, `FEATURE-MAP` 최소 1건, 펜스 개수 짝수.
번호가 중복되거나 건너뛰면 재부여가 잘못된 것이다 — 목록 전체를 다시 읽고 고친다.

- [ ] **Step 4: 커밋 (볼트는 스테이징하지 않음)**

볼트는 별도 저장소다. 이 태스크는 git 변경이 없다. 커밋하지 않고, 변경 사실을 리포트에 남긴다. 다음 태스크가 이 마커를 검사한다.

---

### Task 3: 볼트 플레이북 계약 어서션 (상시 가드)

지금은 누가 볼트 플레이북에서 기능 지도 배선을 지워도 아무도 모른다. 검사 9번이 배선의 **존재**를 상시 확인한다. 의미까지는 못 보지만 삭제·변형은 잡는다.

**Files:**
- Modify: `scripts/skill-manifest.py` (`check()` 함수 — Task 1이 넣은 검사 8번 뒤, `return errors` 앞)

**Interfaces:**
- Consumes: Task 1이 만든 `errors.append` 관례. Task 2가 `sj-company.md`에 남긴 `FEATURE-MAP` 마커.
- Produces: `[playbook-contract]` / `[playbook-missing]` 에러 태그.

- [ ] **Step 1: 마커가 실제로 존재하는지 먼저 확인 (검사를 쓰기 전에)**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북"
for f in sj-spec sj-tech-lead sj-qa sj-company; do echo "--- $f"; done
grep -c '## Step 3.5: IMPACT' "$V/sj-spec.md"
grep -c '미수행: FEATURE-MAP 없음' "$V/sj-spec.md"
grep -c '중단하지 않는다' "$V/sj-spec.md"
grep -c '\[IMPACT\]' "$V/sj-tech-lead.md"
grep -c '### 9b-2' "$V/sj-tech-lead.md"
grep -c '옮기는 규칙' "$V/sj-tech-lead.md"
grep -c '### Step 3-map' "$V/sj-qa.md"
grep -c 'LOW 이슈로만 기록한다' "$V/sj-qa.md"
grep -c '판정 근거가 아니다' "$V/sj-qa.md"
grep -c 'FEATURE-MAP' "$V/sj-company.md"
```

Expected: 전부 1 이상. 하나라도 0이면 그 마커 문자열이 틀린 것이므로, 해당 파일에서 실제 문구를 찾아 검사 코드의 문자열을 그것에 맞춘다 — 파일을 고치지 말고 검사를 고친다.

- [ ] **Step 2: 검사 9번 구현**

Task 1이 넣은 검사 8번 블록 **직후**, `return errors` 앞에 삽입:

```python
    # 9. 볼트 플레이북의 기능 지도 배선이 살아 있는가 (볼트 없으면 비차단)
    #    의미는 못 보고 존재만 본다 — 삭제·변형을 잡는 최소 회귀망.
    vault = os.environ.get("OBSIDIAN_VAULT_DIR") or os.path.expanduser(
        "~/obsidian-vaults/AI 에이전트"
    )
    playbooks = os.path.join(vault, "20_실행", "플레이북")
    wiring_contracts = {
        "sj-spec": ["## Step 3.5: IMPACT", "미수행: FEATURE-MAP 없음", "중단하지 않는다"],
        "sj-tech-lead": ["[IMPACT]", "### 9b-2", "옮기는 규칙"],
        "sj-qa": ["### Step 3-map", "LOW 이슈로만 기록한다", "판정 근거가 아니다"],
        "sj-company": ["FEATURE-MAP"],
    }
    if os.path.isdir(playbooks):
        for skill, markers in wiring_contracts.items():
            path = os.path.join(playbooks, f"{skill}.md")
            if not os.path.isfile(path):
                errors.append(f"[playbook-missing] {skill}.md — 볼트 플레이북 없음")
                continue
            with open(path, encoding="utf-8") as f:
                text = f.read()
            for marker in markers:
                if marker not in text:
                    errors.append(
                        f"[playbook-contract] {skill}.md: '{marker}' 없음 — 기능 지도 배선이 지워졌거나 변형됨"
                    )
```

- [ ] **Step 3: GREEN 확인**

```bash
cd /Users/songseungju/S-skills
python3 scripts/skill-manifest.py --check
```

Expected: `정합성 검사 통과 — 스킬 26개, drift 없음`.

- [ ] **Step 4: 검사가 실제로 잡는지 확인 (RED)**

볼트 파일을 임시로 깨뜨려 검사가 반응하는지 본다. **반드시 원상복구한다.**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-qa.md"
cp "$V" /tmp/sj-qa-backup.md
python3 - <<'PY'
import os
p = os.path.expanduser("~/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-qa.md")
s = open(p, encoding="utf-8").read()
s = s.replace("### Step 3-map", "### Step 3-MAP-BROKEN", 1)
open(p, "w", encoding="utf-8").write(s)
print("마커 훼손됨")
PY
cd /Users/songseungju/S-skills && python3 scripts/skill-manifest.py --check
```

Expected: exit 1, `[playbook-contract] sj-qa.md: '### Step 3-map' 없음 — 기능 지도 배선이 지워졌거나 변형됨`

- [ ] **Step 5: 볼트 복구 + 재확인**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-qa.md"
cp /tmp/sj-qa-backup.md "$V"
rm /tmp/sj-qa-backup.md
grep -c '### Step 3-map' "$V"
cd /Users/songseungju/S-skills && python3 scripts/skill-manifest.py --check
```

Expected: `1`, 그리고 `정합성 검사 통과`. 복구 확인 없이 다음으로 넘어가지 않는다 — 볼트는 살아 있는 절차 문서다.

- [ ] **Step 6: 볼트 부재 폴백 확인**

```bash
cd /Users/songseungju/S-skills
OBSIDIAN_VAULT_DIR=/tmp/does-not-exist-vault python3 scripts/skill-manifest.py --check
```

Expected: `정합성 검사 통과` — 볼트가 없으면 검사 9번은 조용히 스킵한다. 여기서 에러가 나면 비차단 폴백 불변식 위반이므로 `os.path.isdir` 가드를 고친다.

- [ ] **Step 7: 커밋**

`git add` 대상: `scripts/skill-manifest.py`

커밋 메시지:
```
feat(guard): 볼트 플레이북의 기능 지도 배선 존재 검사

누가 플레이북에서 배선을 지워도 아무도 몰랐다. 검사 9번이 네 플레이북의
필수 마커 존재를 상시 확인한다 — 의미는 못 보고 존재만 보지만,
삭제·변형은 잡는다. 볼트가 없으면 조용히 스킵(비차단).
```

---

### Task 4: 행동 테스트 픽스처 + sj-retro 게이트 배선

v4.1.0 검증 때 손으로 돌린 행동 테스트 3건은 픽스처를 지워서 재현이 불가능하다. self-harness 게이트가 요구하는 "회귀 통과"는 지금 구조 drift만 보고 있다. 픽스처를 저장소에 남기고, 하네스 변경 제안 시 이걸 돌리도록 게이트에 배선한다.

**Files:**
- Create: `docs/superpowers/fixtures/behavior/README.md`
- Create: `docs/superpowers/fixtures/behavior/mapped/docs/FEATURE-MAP.md`
- Create: `docs/superpowers/fixtures/behavior/mapped/src/lib/auth.ts` (빈 파일)
- Create: `docs/superpowers/fixtures/behavior/mapped/src/lib/order.ts` (빈 파일)
- Create: `docs/superpowers/fixtures/behavior/qastale/docs/real.ts` (빈 파일)
- Create: `docs/superpowers/fixtures/behavior/qastale/docs/FEATURE-MAP.md`
- Create: `docs/superpowers/fixtures/behavior/qastale/docs/sj-company/.state/pm-brief.md`
- Create: `docs/superpowers/fixtures/behavior/qastale/README.md`
- Modify: `$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-retro.md` (`## Step 5b: 하네스 변경 검증 게이트 (Self-Harness)`)

**Interfaces:**
- Consumes: Task 1·3의 가드(구조 검사는 이미 상시).
- Produces: `docs/superpowers/fixtures/behavior/` 경로와 그 README의 3케이스 절차 — sj-retro Step 5b가 경로로 참조한다.

- [ ] **Step 1: mapped 픽스처 작성**

`docs/superpowers/fixtures/behavior/mapped/docs/FEATURE-MAP.md`:

````markdown
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
````

빈 소스 파일도 만든다 (지도의 경로가 실존해야 drift가 0이다):

```bash
cd /Users/songseungju/S-skills/docs/superpowers/fixtures/behavior/mapped
mkdir -p src/lib && touch src/lib/auth.ts src/lib/order.ts
```

- [ ] **Step 2: qastale 픽스처 작성**

`docs/superpowers/fixtures/behavior/qastale/docs/FEATURE-MAP.md`:

```markdown
# Feature Map (fixture — 케이스 C)
> 행동 테스트용. F02는 일부러 존재하지 않는 경로를 가리킨다(낡은 지도).

## 기능
| ID | 기능 | 진입점 | 핵심 파일 | 테스트 | 의존 |
|----|------|--------|-----------|--------|------|
| F01 | 있는 기능 | `docs/real.ts` | `docs/real.ts` | 없음 | — |
| F02 | 낡은 행 | `docs/deleted.ts` | `docs/deleted.ts` | 없음 | F01 |
```

`docs/superpowers/fixtures/behavior/qastale/docs/sj-company/.state/pm-brief.md`:

```markdown
# PM Brief — README 한 줄 추가

## 요구사항 분석
README.md에 프로젝트 한 줄 설명을 추가한다.

## 완료 조건 (기계 검증 가능)
- [ ] `test -f README.md` 가 성공한다
- [ ] `grep -c "설명" README.md` 가 1 이상이다
```

`docs/superpowers/fixtures/behavior/qastale/README.md`:

```markdown
# 프로젝트

한 줄 설명: 행동 테스트용 픽스처.
```

그리고 지도가 가리키는 실존 파일:

```bash
cd /Users/songseungju/S-skills/docs/superpowers/fixtures/behavior/qastale
touch docs/real.ts
```

`unmapped` 케이스는 파일이 필요 없다 — 지도가 없는 상태 그 자체가 픽스처이므로, 실행 시 빈 임시 디렉토리를 만든다(README에 명시).

- [ ] **Step 3: 실행 절차 README 작성**

`docs/superpowers/fixtures/behavior/README.md`:

````markdown
# 하네스 행동 테스트 픽스처

구조 검사(`scripts/skill-manifest.py --check`)는 배선의 **존재**만 본다.
이 픽스처들은 배선이 **의도대로 동작하는지**를 본다. self-harness 게이트가
"회귀 통과"를 말하려면 이쪽까지 돌아야 한다.

## 언제 돌리나

기능 지도 배선(sj-spec Step 3.5 · sj-tech-lead `[IMPACT]`/9b-2 · sj-qa Step 3-map ·
sj-company Small 경로) 중 하나라도 바뀌는 하네스 변경을 제안할 때. sj-retro Step 5b가 호출한다.

## 어떻게 돌리나

이 스킬들은 `AskUserQuestion`을 쓰므로 비대화형 서브에이전트에서 멈춘다.
각 케이스는 **서브에이전트에게 해당 스킬 역할을 시켜** 돌린다 — 볼트 플레이북을 읽고
그대로 따르게 하되, 사용자 질문은 "가정으로 채우고 명시"하도록 지시한다.

**기대 결과를 에이전트에게 알려주지 않는다.** 알려주면 테스트가 아니라 받아쓰기가 된다.
출력 파일을 아래 단언으로 대조하는 것은 호출자의 몫이다.

작업 디렉토리는 픽스처를 복사해 쓴다(원본 오염 방지):

```bash
T=$(mktemp -d)
cp -R docs/superpowers/fixtures/behavior/mapped "$T/"
```

## 케이스 A — 지도 있음 (sj-spec)

- 픽스처: `mapped/`
- 태스크: `로그인에 2단계 인증 추가`
- 단언:

```bash
F=$(ls "$T/mapped/docs/sj-company/spec-"*.md)
grep -q '^## 영향 범위' "$F"                            || echo "FAIL: 영향 범위 절 없음"
awk '/^### 역방향/,/^### 회귀/' "$F" | grep -q 'F02'     || echo "FAIL: 역방향에 F02 미지목"
grep -q '미수행: FEATURE-MAP 없음' "$F"                  && echo "FAIL: 지도가 있는데 미수행 기록"
```

세 줄 모두 출력이 없어야 통과. **역방향 F02 지목이 이 테스트의 핵심** — 지도의 `의존` 칸을
양방향으로 읽지 못하면 여기서 걸린다.

## 케이스 B — 지도 없음 (sj-spec)

- 픽스처: 없음. `mkdir -p "$T/unmapped/src" && touch "$T/unmapped/src/a.ts"`
- 태스크: `파일 업로드 기능 추가`
- 단언:

```bash
F=$(ls "$T/unmapped/docs/sj-company/spec-"*.md 2>/dev/null)
[ -n "$F" ]                                             || echo "FAIL: 중단됨 — 스펙이 생성되지 않음"
grep -q '미수행: FEATURE-MAP 없음' "$F"                  || echo "FAIL: 미수행 기록 없음"
```

스킬이 "지도를 먼저 만드세요"라며 멈췄다면 **실패**다 — 비차단 폴백 불변식 위반.

## 케이스 C — 낡은 지도 (sj-qa)

- 픽스처: `qastale/`
- 모드: 기본(`/canary`·`/benchmark` 아님)
- 단언:

```bash
V="$T/qastale/docs/sj-company/.state/qa-verdict.md"
grep -q '^## 판정: FAIL' "$V"      && echo "FAIL: 낡은 지도가 FAIL을 유발함"
grep -qi 'LOW' "$V"                || echo "FAIL: 낡음이 LOW로 기록되지 않음"
```

**낡은 지도만으로 FAIL이 나면 실패**다 — 심각도 보정 불변식 위반이고, 이 규칙이 무너지면
사람들이 지도를 우회하기 시작한다.

## 결과 기록

세 케이스의 통과/실패와 실제 출력을 sj-retro 보고서의 Self-Harness 절에 적는다.
돌리지 못한 케이스는 `미수행: {이유}`로 남긴다 — 안 돌린 것을 통과로 세지 않는다.
````

- [ ] **Step 4: 픽스처의 지도가 자기 규칙을 지키는지 확인**

픽스처가 규칙 위반이면 테스트가 거짓 신호를 낸다.

```bash
cd /Users/songseungju/S-skills/docs/superpowers/fixtures/behavior/mapped
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
cd ../qastale
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
```

Expected: `mapped`은 출력 0줄(깨끗한 지도여야 케이스 A가 유효). `qastale`은 `STALE: docs/deleted.ts`가 나와야 한다(낡은 지도여야 케이스 C가 유효) — 중복 출력은 정상이다.

- [ ] **Step 5: sj-retro Step 5b에 배선**

`$OBSIDIAN_VAULT_DIR/20_실행/플레이북/sj-retro.md`의 `## Step 5b: 하네스 변경 검증 게이트 (Self-Harness)` 절을 읽고, 회귀 검증을 다루는 지점에 삽입:

````markdown
**행동 회귀 (기능 지도 배선을 건드리는 제안일 때 필수)**

제안이 sj-spec Step 3.5 · sj-tech-lead `[IMPACT]`/9b-2 · sj-qa Step 3-map · sj-company Small 경로
중 하나라도 수정 대상으로 삼으면, 구조 검사(`skill-manifest.py --check`)만으로는 "회귀 통과"라고
말할 수 없다. S-skills `docs/superpowers/fixtures/behavior/README.md`의 3케이스를 돌리고 결과를 적는다.

- 3케이스 전부 통과 → "채택 후보" 자격 있음 (채택은 여전히 사람 게이트)
- 하나라도 실패 → **채택 후보 아님.** 실패한 단언과 실제 출력을 보고서에 그대로 적는다
- 돌리지 못함 → `미수행: {이유}`로 기록하고 **통과로 세지 않는다** (fail-closed)
````

- [ ] **Step 6: 배선 확인**

```bash
V="$HOME/obsidian-vaults/AI 에이전트/20_실행/플레이북/sj-retro.md"
grep -n 'fixtures/behavior' "$V"
grep -c '^```' "$V"
cd /Users/songseungju/S-skills && python3 scripts/skill-manifest.py --check
```

Expected: `fixtures/behavior` 1건 이상, 펜스 짝수, 가드 통과.

- [ ] **Step 7: 커밋**

`git add` 대상: `docs/superpowers/fixtures/behavior/`

커밋 메시지:
```
test(harness): 행동 테스트 픽스처 3케이스 + 실행 절차

v4.1.0 검증 때 손으로 돌린 뒤 지워버린 픽스처를 저장소에 남긴다.
구조 검사는 배선의 존재만 보고, 이 셋은 동작을 본다 — 역방향 의존
지목, 지도 부재 시 비차단, 낡은 지도가 FAIL을 유발하지 않을 것.
self-harness 게이트의 "회귀 통과"가 처음으로 실제 의미를 갖는다.
```

---

### Task 5: 실제 프로젝트 검증 (사람 게이트)

지금까지의 검증은 전부 S-skills 자신 또는 2행짜리 픽스처였다. 스킬 1개=기능 1개인 이 저장소는 지도 만들기가 거의 기계적이라, "무엇을 기능으로 셀 것인가"가 진짜로 애매한 실제 앱에서는 검증된 바가 없다. 이 태스크는 코드를 만들지 않는다 — 판단을 만든다.

**Files:**
- Create: `docs/superpowers/plans/2026-08-27-feature-map-field-report.md` (검증 결과 기록)
- 대상 프로젝트의 `docs/FEATURE-MAP.md` (생성 — 대상 저장소, 이 저장소 아님)

**Interfaces:**
- Consumes: Task 1~4의 전체 배선과 가드.
- Produces: 실제 사용 데이터 — 다음 개선의 근거.

- [ ] **Step 1: 대상 프로젝트를 사람에게 확인받는다**

**이 단계는 사람 게이트다.** 후보를 제시하고 답을 기다린다. 임의로 고르지 않는다 — 남의 저장소에 문서를 만드는 일이고, 프로젝트마다 기능 경계의 성격이 다르다.

제시할 후보와 각각의 성격:
- `totaro_sales_web` — Next.js, 라우트가 많고 관리자/바이어 두 면이 있어 기능 경계가 뚜렷할 가능성
- `upflow` — 문서 생성 도메인, 기능이 워크플로 단계로 나뉠 가능성

물을 것: 어느 프로젝트에 깔지, 그리고 생성된 지도를 커밋할지 아니면 평가만 하고 버릴지.

- [ ] **Step 2: 지도 생성**

승인받은 프로젝트 디렉토리에서:

```bash
cd <승인받은-프로젝트>
```

`/docs-organize`를 실행한다. Phase 3이 `docs/FEATURE-MAP.md`를 만든다.
확신이 없는 기능은 `## 미매핑`에 두고 사용자에게 묻도록 되어 있으므로, 그 질문에 답하며 진행한다.

- [ ] **Step 3: 생성된 지도를 기계 검사에 건다**

```bash
cd <승인받은-프로젝트>
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' docs/FEATURE-MAP.md \
  | tr -d '`' | tr ' ,' '\n\n' | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$p" ] || echo "STALE: $p"; done
IDS=$(awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); print $2}' docs/FEATURE-MAP.md | sort -u)
awk -F'|' '/^\| *F[0-9]/ {gsub(/ /,"",$2); n=split($7,a,/[ ,]+/); for(i=1;i<=n;i++) if(a[i] ~ /^F[0-9]+$/) print $2, a[i]}' docs/FEATURE-MAP.md \
  | while read src ref; do echo "$IDS" | grep -qx "$ref" || echo "DANGLING: $src → $ref"; done
grep -c '^| F' docs/FEATURE-MAP.md
```

Expected: STALE 0줄, DANGLING 0줄. 행 수는 기록해둔다.
여기서 STALE이나 DANGLING이 나오면 **그것 자체가 Task 5의 발견**이다 — docs-organize의 생성 규칙이 실제 코드베이스에서 부족하다는 증거이므로, 고치지 말고 기록한다.

- [ ] **Step 4: 쓸모를 사람 눈으로 평가한다**

기계 검사 통과는 "일관되다"까지만 말한다. 실제 질문은 **"고장났을 때 이걸 보고 어디를 고칠지 알 수 있나"**이다. 최근 그 프로젝트에서 실제로 났던 버그 2~3개를 떠올려, 각각에 대해:

- 그 버그의 기능이 표에 행으로 있는가?
- `진입점`이 실제로 그 버그를 추적하기 시작할 파일인가?
- `의존` 칸이 그 버그의 파급을 맞게 예측했는가?

- [ ] **Step 5: 필드 리포트 작성**

`docs/superpowers/plans/2026-08-27-feature-map-field-report.md`에 기록:

```markdown
# 기능 지도 필드 리포트 — {프로젝트명}

> 실행: 2026-08-27 · 대상: {경로} · 지도 행 수: {N}

## 기계 검사
- STALE: {N}줄
- DANGLING: {N}줄
- 표↔mermaid: {일치/불일치}

## 생성 품질
- 기능으로 잘못 잡은 것: {목록 또는 없음}
- 빠뜨린 기능: {목록 또는 없음}
- `## 미매핑`에 들어간 것: {개수}, 타당했나: {판단}

## 실제 버그 대조
| 버그 | 표에 행 있음 | 진입점이 맞음 | 의존이 파급 예측 |
|------|-------------|--------------|-----------------|
| {버그1} | {Y/N} | {Y/N} | {Y/N} |

## 판정
{이 지도가 실제로 쓸모 있는가 — 한 문단}

## 다음 개선 후보
{이번에 드러난 부족함, 우선순위대로}
```

- [ ] **Step 6: 커밋 (사람 게이트)**

필드 리포트는 S-skills에 커밋한다. **대상 프로젝트의 지도를 커밋할지는 Step 1에서 받은 답을 따른다** — 승인 없이 남의 저장소에 커밋하지 않는다.

`git add` 대상: `docs/superpowers/plans/2026-08-27-feature-map-field-report.md`

커밋 메시지:
```
docs: 기능 지도 필드 리포트 — {프로젝트명}

S-skills는 스킬 1개=기능 1개라 지도 만들기가 거의 기계적이었다.
실제 앱에서 "무엇을 기능으로 셀 것인가"가 애매할 때 이 기능이
쓸모 있는지 처음으로 확인한 기록.
```

---

## 실행 순서 주의

- **Task 1 → Task 2 → Task 3** 순서는 강제다. Task 3의 계약 어서션이 Task 2가 남기는 `FEATURE-MAP` 마커를 검사하므로, 순서를 바꾸면 Task 3이 자기가 만든 검사에 걸린다.
- Task 4는 Task 1~3과 독립이므로 언제든 끼워 넣을 수 있다.
- Task 5는 전부 끝난 뒤, 그리고 **사람 승인 후에만** 시작한다.
- **볼트 플레이북 변경(Task 2·4)은 이 저장소의 커밋 대상이 아니다** — 볼트는 별도 저장소다. 변경 사실만 리포트에 남긴다.
- Task 3 Step 4는 볼트 파일을 일부러 훼손한다. **Step 5의 복구를 건너뛰지 않는다** — 볼트는 살아 있는 절차 문서이고, 훼손된 채로 두면 다음 하네스 실행이 깨진다.
