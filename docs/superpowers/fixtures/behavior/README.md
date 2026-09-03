# 하네스 행동 테스트 픽스처

구조 검사(`scripts/skill-manifest.py --check`)는 배선의 **존재**만 본다.
이 픽스처들은 배선이 **의도대로 동작하는지**를 본다. self-harness 게이트가
"회귀 통과"를 말하려면 이쪽까지 돌아야 한다.

## 언제 돌리나

기능 지도 배선(sj-spec Step 3.5 · sj-tech-lead `[IMPACT]`/9b-2 · sj-qa Step 3-map ·
sj-company Small 경로) 중 하나라도 바뀌는 하네스 변경을 제안할 때. sj-retro Step 5b가 호출한다.

## 어떻게 돌리나

이 스킬들은 `AskUserQuestion`을 쓰므로 비대화형 서브에이전트에서 멈춘다 — 계약 정본은 `skills/_conventions/noninteractive.md`이며, 디스패치 시 `SJ_NONINTERACTIVE=1`을 주거나 "사용자 없음"을 명시한다.
각 케이스는 **서브에이전트에게 해당 스킬 역할을 시켜** 돌린다 — 볼트 플레이북을 읽고
그대로 따르게 하되, 사용자 질문은 "가정으로 채우고 명시"하도록 지시한다.

**기대 결과를 에이전트에게 알려주지 않는다.** 알려주면 테스트가 아니라 받아쓰기가 된다.
출력 파일을 아래 단언으로 대조하는 것은 호출자의 몫이다.

작업 디렉토리는 픽스처를 복사해 쓴다(원본 오염 방지):

```bash
T=$(mktemp -d)
cp -R docs/superpowers/fixtures/behavior/mapped "$T/"
cp -R docs/superpowers/fixtures/behavior/qastale "$T/"
cp -R docs/superpowers/fixtures/behavior/pmtask "$T/"
cp -R docs/superpowers/fixtures/behavior/retrofriction "$T/"
cp -R docs/superpowers/fixtures/behavior/routing "$T/"
cp -R docs/superpowers/fixtures/behavior/triage "$T/"
cp -R docs/superpowers/fixtures/behavior/libscan "$T/"
```

## 케이스 A — 지도 있음 (sj-spec)

- 픽스처: `mapped/`
- 태스크: `로그인에 2단계 인증 추가`
- 단언:

```bash
F=$(ls "$T/mapped/docs/sj-company/spec-"*.md)
grep -q '^## 영향 범위' "$F"                            || echo "FAIL: 영향 범위 절 없음"
awk '/^### 역방향/{f=1;next} /^### /{f=0} f' "$F" | grep -q 'F02' || echo "FAIL: 역방향에 F02 미지목"
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
grep -q '^## 판정: PASS' "$V"      || echo "FAIL: 낡은 지도가 판정을 끌어내림 (PASS가 아님)"
grep -qi 'LOW' "$V"                || echo "FAIL: 낡음이 LOW로 기록되지 않음"
```

**낡은 지도만으로 판정이 PASS 아래로 내려가면 실패**다 — FAIL이든 CONDITIONAL이든 똑같이 심각도 보정 불변식 위반이고, 이 규칙이 무너지면 사람들이 지도를 우회하기 시작한다.

## 케이스 D — 완료 조건은 기계 검증 가능해야 한다 (sj-pm)

- 픽스처: `pmtask/`
- 태스크: `장바구니에서 항목을 여러 개 한 번에 빼는 기능 추가`
- 단언:

```bash
B="$T/pmtask/docs/sj-company/.state/pm-brief.md"
[ -f "$B" ]                                 || echo "FAIL: pm-brief 미생성"
grep -q '^## 완료 조건' "$B"                 || echo "FAIL: 완료 조건 절 없음"
COND=$(awk '/^## 완료 조건/{f=1;next} /^## /{f=0} f&&/^- /' "$B")
[ -n "$COND" ]                              || echo "FAIL: 완료 조건 항목이 0개"
echo "$COND" | grep -qv '`' && echo "FAIL: 명령·경로 없는 완료 조건이 있다 (기계 검증 불가)"
```

`- 잘 동작한다` 같은 항목이 하나라도 있으면 실패다. sj-qa가 1:1로 실행·대조할 수 없으면
"done"은 다시 주장으로 돌아간다.

## 케이스 E — 구스키마가 섞인 friction 로그를 읽어낸다 (sj-retro)

- 픽스처: `retrofriction/` (신스키마 2건 + 구스키마 2건, 구스키마엔 `severity` 없음)
- 모드: 기본. friction 소비 단계(Step 4b)까지만 확인하면 된다.
- 단언:

```bash
R="$T/retrofriction"
# 스킬이 크래시 없이 완주했고, 구스키마 항목을 집계에서 빠뜨리지 않았는가
grep -q 'friction 3건' "$R/out.txt"  || echo "FAIL: 구스키마 항목이 집계에서 누락됐다"
grep -q 'delight 1건'  "$R/out.txt"  || echo "FAIL: delight 집계 오류"
grep -qi 'KeyError\|Traceback' "$R/out.txt" && echo "FAIL: 조회가 예외로 죽었다"
```

(실행 시 스킬의 friction 요약 출력을 `$R/out.txt`로 받는다.)

**이 케이스는 실제로 났던 사고를 고정한다.** 2026-08-28에 로그 11건이 스키마 4가지로 갈려
있었고 2건에 `severity`가 없어, 컨벤션이 문서화한 조회 레시피가 `KeyError`로 죽었다.
로그가 비어 있는 것보다 나빴다 — 채워도 읽히지 않았으므로. 로그는 append-only라
**과거 항목을 고쳐 쓰는 방식으로는 이 케이스를 통과할 수 없다.** 읽는 쪽이 흡수해야 한다.

## 케이스 F — 키워드가 아니라 행위로 라우팅한다 (sj-company)

- 픽스처: `routing/`
- 태스크: `옵시디언 문서 리뷰해줘`
- 실행: `SJ_OUTPUT_FILE="$T/routing/out.txt"`를 주고 sj-company를 돌린다.
- 단언:

```bash
O="$T/routing/out.txt"
[ -f "$O" ]                        || echo "FAIL: 출력 캡처 안 됨 (SJ_OUTPUT_FILE 미준수)"
grep -qi 'review\|리뷰' "$O"        || echo "FAIL: 행위(리뷰)로 라우팅하지 않았다"
grep -qi 'obsidian-writer' "$O"    && echo "FAIL: 키워드(옵시디언)로 라우팅했다"
```

키워드 `옵시디언`은 obsidian-writer를, 행위 `리뷰`는 리뷰 경로를 가리킨다.
RESOLVER 규칙은 **행위 우선**이다 — 2026-06-22 friction에 기록된 실제 마찰이고,
키워드 단독 매칭으로 퇴화하면 여기서 잡힌다.

## 케이스 G — 수신함을 표시하고 아무것도 고치지 않는다 (sj-secretary)

- 픽스처: `triage/` (미처리 3건 + 처리됨 1건)
- 실행: `SJ_OUTPUT_FILE="$T/triage/out.txt"`를 주고 sj-secretary를 돌린다.
- 단언:

```bash
O="$T/triage/out.txt"
BEFORE=$(find "$T/triage/docs" -type f -exec md5 -q {} \; | sort | md5 -q)
grep -q '수신함 3건' "$O" || echo "FAIL: 수신함 건수 미표시 또는 처리됨 항목을 셌다"
AFTER=$(find "$T/triage/docs" -type f -exec md5 -q {} \; | sort | md5 -q)
[ "$BEFORE" = "$AFTER" ] || echo "FAIL: 읽기 전용 불변식 위반 — 파일이 바뀌었다"
```

(`BEFORE`는 실행 **전**에 찍어 둔다.) 처리된 `- [x]` 항목을 세면 3이 아니라 4가 나온다.
이 소비자는 2026-08-28에 배선했다 — 그 전에는 sj-loop과 docs-organize가 쓰기만 하고
읽는 곳이 없었다.

## 케이스 H — 공유 도메인 모듈은 올리고 범용 기반은 올리지 않는다 (docs-organize)

- 픽스처: `libscan/` (라우트 3개, 공유 모듈 2개)
- 단언:

```bash
M="$T/libscan/docs/FEATURE-MAP.md"
[ -f "$M" ]                              || echo "FAIL: 지도 미생성"
grep -q 'order-notify' "$M"              || echo "FAIL: 도메인 규칙 모듈(order-notify)을 놓쳤다"
grep -q 'utils/format' "$M"              && echo "FAIL: 범용 기반(format)을 기능으로 올렸다"
awk -F'|' '/^\| *F[0-9]/ {print $4 $5 $6}' "$M" | tr -d '`' | tr ' ,' '\n\n' \
  | grep -v '^$\|^없음$\|^—$\|^-$' \
  | while read p; do [ -e "$T/libscan/$p" ] || echo "FAIL: STALE $p"; done
```

**빈도만 보면 반드시 틀린다** — `format`이 3회, `order-notify`가 2회로 범용 쪽이 더 많이 쓰인다.
판별은 "이 모듈만 고치는 버그 수정이 있었을 법한가"이지 빈도가 아니다.
2026-08-27 필드 검증에서 실증된 사각지대를 고정한다.

## 케이스 I — 만드는 요청은 자동화가 아니다 (sj-company)

- 픽스처: `routing/` (케이스 F와 공용)
- 태스크: `SEED로 버튼 컴포넌트 만들어줘`
- 실행: `SJ_OUTPUT_FILE="$T/routing/out-i.txt"`를 주고 sj-company를 돌린다.
- 단언:

```bash
O="$T/routing/out-i.txt"
[ -f "$O" ]                        || echo "FAIL: 출력 캡처 안 됨 (SJ_OUTPUT_FILE 미준수)"
grep -qi 'sj-seed\|SEED 디자인' "$O" || echo "FAIL: SEED 행(#26)으로 라우팅하지 않았다"
grep -qi 'sj-automation' "$O"      && echo "FAIL: #2 UI 자동화가 가로챘다"
```

RESOLVER #2의 맨 단어 `버튼`은 #26의 구 `seed 컴포넌트`보다 **위에** 있다 —
순서만 따르면 자동화 스킬이 이긴다. #2에 생성 동사 제외 조건이 없거나
모호성 규칙 1(행위 우선)이 퇴화하면 여기서 잡힌다.
2026-09-03 라우팅 감사에서 발견해 고정했다.

## 커버리지와 경계

지금 덮는 것과 못 덮는 것을 밝혀 둔다 — 덮이지 않은 영역이 검증된 것처럼 보이지 않도록.

| 스킬 | 상태 |
|---|---|
| sj-spec | 케이스 A·B |
| sj-qa | 케이스 C |
| sj-pm | 케이스 D |
| sj-retro | 케이스 E (friction 소비 경로만) |
| sj-company | 케이스 F·I (라우팅만) |
| sj-secretary | 케이스 G (수신함·읽기 전용) |
| docs-organize | 케이스 H (2차 훑기만 — 전체 문서 생성은 미커버) |
| sj-tech-lead | 미커버 — 서브에이전트 디스패치가 필요해 픽스처가 비싸다 |
| sj-investigate · cso · ship · design · marketing · dev-si | 외부 상태·사람 판단 의존 |
| seo · automation · law · gpt · agent-* · loop · outsource · pw-loop · test-scenario · harness · obsidian-writer | 브라우저·MCP·OS·네트워크가 필요해 값싼 픽스처에 부적합 |

**27개 스킬 중 행동 테스트가 있는 것은 7개다.** 나머지는 여전히 구조 검사
(`skill-manifest.py --check`)만 받는다 — 배선의 존재는 보지만 동작은 보지 않는다.

새 케이스를 추가할 때는 하나만 지킨다: **고장난 구현이 이 단언을 통과할 수 있는가?**
통과할 수 있으면 그 케이스는 하네스를 검증된 것처럼 보이게 만들 뿐이다.

## 결과 기록

각 케이스의 통과/실패와 실제 출력을 sj-retro 보고서의 Self-Harness 절에 적는다.
돌리지 못한 케이스는 `미수행: {이유}`로 남긴다 — 안 돌린 것을 통과로 세지 않는다.
