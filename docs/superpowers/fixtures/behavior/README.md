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
