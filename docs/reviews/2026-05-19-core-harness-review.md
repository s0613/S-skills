# Core Harness Review — sj-company v3 워크플로우

> 작성: 2026-05-19
> 범위: `sj-company`, `sj-pm`, `sj-design`, `sj-tech-lead`, `sj-qa` (5개 SKILL.md)
> 보조 참조: `docs/sj-company/PROJECT.md`, `docs/sj-company/` 워크스페이스, `agents/sj-dev-*.md` 인터페이스
> 진단 축: (A) 구조/일관성 · (B) 양방향 프롬프트 품질
> 산출물 유형: 진단 보고서 — 수정/패치는 별도 승인 후 적용

---

## TL;DR

**한 줄 요약:** sj-company v3는 "PROJECT.md 단일 소스" 룰로 단순화했지만, 하위 4개 스킬과 7개 서브에이전트는 여전히 v2 모델(`pm-output.md` / `design-output.md` / `dev-output.md` / `qa-output.md` / `stage.txt`)로 동작한다. 룰과 구현이 정면 충돌하며, 실제 워크스페이스에 6개 금지 파일이 모두 존재한다 — 가장 큰 구조적 결함이며 다른 거의 모든 발견의 근본 원인이다.

**심각도 분포**
- **CRITICAL 1** — v3 룰 vs 하위 스킬·에이전트 정면 충돌
- **HIGH 5** — PM HINT 전달 / Design 명세 모드 dead / pw-loop 이중 호출 / Design 리뷰 호출 비실행 / 서브에이전트 입력 인터페이스 잔재
- **MEDIUM 4** — `_HAS_PM` 오판 / verdict 파싱 fragility / Step 번호 누락 / Case A→B 전이 명시 부재
- **LOW 3** — Design 명세 모드 잔여 가이드 / Tech Lead "발췌" 지시 모호 / design-review.md 통합 경로 부재

**권장 방향:** 룰을 따를지(v3 단일 소스로 재정합) 구현을 따를지(v2 5파일 모델을 공식화) 먼저 결정해야 한다 — 부분 패치로는 해결 안 됨. 본 보고서는 v3 룰 유지를 전제로 한 reconciliation 패치를 제안한다.

---

## 1. 스킬 한 장 정리

| 스킬 | 호출 시점 | 입력 | 산출 | PROJECT.md 갱신 |
|------|---------|------|------|----------------|
| `sj-company` | `/sj-company [task]` | PROJECT.md | PROJECT.md, `.state/task.txt` | ✅ (Tiny/Small/Medium) |
| `sj-pm` | Large 경로에서만 (`SKILL.md:382`) | `.state/task.txt`, `pm-context.md` | `.state/task.txt` 덮어쓰기, `pm-context.md`, PROJECT.md `next` | ✅ |
| `sj-design` | spec 모드: **호출처 없음**<br>review 모드: Tech Lead Step 7b | `design-output.md`(review), `dev-output/frontend.md`(review) | `design-output.md`(spec), `dev-output/design-review.md`(review), `.state/stage.txt` | ❌ |
| `sj-tech-lead` | Medium/Large 경로 | `.state/task.txt`, `design-output.md`, `dev-context.md` | `dev-output.md`, `dev-output/{role}.md`, `.state/model-policy.txt`, `.state/review-iterations.txt` | ❌ |
| `sj-qa` | Large 경로 (`SKILL.md:396`) | `pm-output.md`, `dev-output.md`, `.state/task.txt` | `qa-output.md`, `qa-context.md`, PROJECT.md `status`/`blockers` | ✅ |

**`docs/sj-company/` 실제 워크스페이스 상태:**
```
PROJECT.md           ← v3 단일 소스
pm-output.md         ← v3 금지인데 존재
design-output.md     ← v3 금지인데 존재
dev-output.md        ← v3 금지인데 존재
dev-output/          ← Tech Lead가 만드는 역할별 디렉토리
qa-output.md         ← v3 금지인데 존재
report.md            ← v3 금지인데 존재
pm-context.md        ← 정상
design-context.md    ← 정상
dev-context.md       ← 정상
qa-context.md        ← 정상
.state/stage.txt     ← v3 금지인데 존재
.state/task.txt      ← 정상
```

---

## 2. CRITICAL 발견

### C1. v3 룰과 하위 스킬·에이전트의 정면 충돌

**증거 (sj-company `SKILL.md:401-406`):**
```
- pm-output.md, design-output.md, dev-output.md, qa-output.md, report.md 생성 금지
- stage.txt 업데이트 금지
- 모든 상태는 PROJECT.md에만 기록
- Design 단계 없음 (PM이 충분히 커버)
```

**모순되는 구현 (전부 5개 위치에서 발견):**

| 위치 | 행동 | 룰 위반 |
|------|------|--------|
| `sj-design/SKILL.md:152` Step 6 | `docs/sj-company/design-output.md` 생성 | 생성 금지 위반 |
| `sj-design/SKILL.md:179` Step 6 | `echo "design" > docs/sj-company/.state/stage.txt` | stage.txt 업데이트 금지 위반 |
| `sj-tech-lead/SKILL.md:293` Step 9 | `docs/sj-company/dev-output.md` 생성 | 생성 금지 위반 |
| `sj-qa/SKILL.md:107` Step 5 | `docs/sj-company/qa-output.md` 생성 | 생성 금지 위반 |
| `sj-design/SKILL.md:125,133,142`<br>`sj-qa/SKILL.md:81,88,97`<br>`agents/sj-dev-frontend.md` 입력 컨텍스트 | `pm-output.md` 읽기 시도 | 절대 생성되지 않는 파일을 읽도록 명세 (dead reference) |

**영향:**
- 워크스페이스에 6개 금지 파일이 모두 존재 → v3 도입 이후 sj-company가 한 번도 마이그레이션을 수행 못 했거나, 하위 스킬이 재생산했거나, 둘 다.
- `pm-output.md`는 **누구도 만들지 않으므로** sj-design/sj-qa/sj-dev-frontend의 컨텍스트 로드는 항상 빈 결과 → PM 분석 컨텍스트가 모든 다운스트림에서 누락.
- sj-design 명세 모드는 호출되지 않으므로 `design-output.md`도 비어 있을 가능성 높음 → frontend 에이전트가 디자인 명세 없이 작업.

**근본 원인:** sj-company는 v3로 단순화됐는데 하위 스킬·에이전트는 v2 그대로. reconciliation이 안 됨.

---

## 3. HIGH 발견

### H1. PM HINT 전달이 Large 경로에서 깨짐

**Medium 경로 (`sj-company/SKILL.md:322-345`):** task.txt를 `[HINT:single={hint}] {태스크}\n\nPM 브리핑:...` 포맷으로 직접 작성. Tech Lead가 `HINT:single=` grep으로 추출.

**Large 경로 (`sj-company/SKILL.md:382`):** `Skill("s-skills:sj-pm")` 호출 → sj-pm은 task.txt를 **자체 포맷**(`PM Output — ...\n생성일: ...\n요구사항 분석: ...\n태스크 목록: - [ ] ...\n리스크: ...`)으로 **덮어씀** (`sj-pm/SKILL.md:111-129`). HINT는 어디에도 없음.

**증거 (`sj-tech-lead/SKILL.md:60-74`):**
```bash
_HINT_SINGLE=$(echo "$_TASK" | grep -oE 'HINT:single=[a-z]+' | cut -d= -f2 || echo "")
...
# _HINT_SINGLE=없음 → 기존 로직대로 (Step 3에서 specialist 식별)
```

**영향:** Large 경로에서는 HINT가 없으니 Tech Lead가 항상 Step 3 일반 식별 로직으로 폴백. Medium만 단일-디스패치 최적 경로를 탐. 작동 자체는 하지만 의도와 다름.

### H2. Design 명세 모드는 호출처 없는 dead path

**증거:**
- sj-company `SKILL.md:406`: "Design 단계 없음 (PM이 충분히 커버)"
- sj-company 어느 경로(Tiny/Small/Medium/Large)도 `Skill("s-skills:sj-design")` 호출 없음
- sj-design 명세 모드는 7-step 절차 + design-output.md 생성으로 280줄 중 약 절반

**영향:**
- `design-output.md`는 누구도 생성하지 않음 → sj-tech-lead Step 1 `_HAS_DESIGN` 판정 항상 `no`
- frontend 디스패치 시 Design 명세 누락 → frontend 품질 영향
- 280줄짜리 SKILL의 sketch 모드(라인 52-184)가 dead code

### H3. pw-loop 이중 호출 (Large 경로)

**증거:**
- `sj-company/SKILL.md:351-356` Large Step 5: `_HAS_PW=yes`이면 `Skill("s-skills:pw-loop")` 호출
- `sj-company/SKILL.md:396` Large Step 6: `Skill("s-skills:sj-qa")` 호출
- `sj-qa/SKILL.md:130-143` Step 6: 다시 `Skill("s-skills:pw-loop")` 호출

**영향:** Large 경로에서 pw-loop가 연속 2회 실행될 수 있음. 비용·시간 낭비 + 첫 실행 결과 덮어쓰기 가능성.

### H4. Tech Lead의 Design 리뷰 호출 방식이 비실행적

**증거 (`sj-tech-lead/SKILL.md:248-258`):**
```
Skill("s-skills:sj-design")  # MODE=review 환경 변수와 함께

또는 직접 프롬프트로:

docs/sj-company/dev-output/frontend.md의 변경 파일을 design-output.md 명세 대비 검토.
색·간격·타이포·인터랙션 의도 일치 여부 보고. 불일치 시 FAIL.
```

**문제:**
- `Skill` 도구는 환경 변수를 전달하는 메커니즘 없음
- `Skill` 도구는 프롬프트 인자를 받지 않음 (오직 skill 이름 + 선택적 args 문자열)
- 따라서 sj-design을 `MODE=review`로 호출하는 명시적 방법이 존재하지 않음

**영향:** Design 리뷰 단계가 실제로 호출되지 않거나, 호출되더라도 명세 모드로 잘못 동작 (sj-design `SKILL.md:33` 기본값 spec).

### H5. 서브에이전트 입력 컨텍스트 인터페이스가 v2 잔재

**증거 (`agents/sj-dev-frontend.md` 입력 컨텍스트 절):**
```
Tech Lead가 다음 정보를 프롬프트로 전달한다:
- 태스크 설명 (docs/sj-company/.state/task.txt)
- PM 분석 (docs/sj-company/pm-output.md)
- Design 명세 (docs/sj-company/design-output.md)
- Dev 컨텍스트 (docs/sj-company/dev-context.md)
- Backend 계약 (docs/sj-company/dev-output/backend.md)
```

Step 1도 `cat docs/sj-company/pm-output.md` 등으로 직접 읽음.

**영향:** v3 룰상 pm-output.md는 생성되지 않으므로 항상 빈 cat. 디자인 명세 모드가 dead라 design-output.md도 비어 있음. 결과적으로 frontend 에이전트는 `task.txt` + `dev-context.md`만으로 작업. 명시된 인터페이스의 60%가 사실상 비어 있음.

(다른 6개 에이전트도 동일 패턴일 가능성 — 이번 리뷰 범위 밖이지만 후속 점검 필요.)

---

## 4. MEDIUM 발견

### M1. `_HAS_PM` 판정 로직이 의도와 어긋남

**증거 (`sj-tech-lead/SKILL.md:54`):**
```bash
_HAS_PM=$([ -s "docs/sj-company/.state/task.txt" ] && echo "yes" || echo "no")
```

`task.txt`가 비어 있지 않으면 PM이 돌았다고 간주. 하지만 sj-company Medium 경로는 PM 없이도 task.txt를 채움(`sj-company/SKILL.md:337-345`).

**영향:** `sj-tech-lead/SKILL.md:77-86`의 "PM 없으면 PROJECT.md goal 폴백" 분기는 사실상 영원히 안 탐. 큰 장애는 아니지만 dead branch.

### M2. sj-qa verdict 파싱이 fragile

**증거 (`sj-qa/SKILL.md:163-168`):**
```python
for f in ["docs/sj-company/qa-output.md"]:
    if os.path.exists(f):
        content = open(f, encoding="utf-8").read()
        if "CONDITIONAL" in content: verdict = "CONDITIONAL"; break
        if "PASS" in content: verdict = "PASS"; break
        if "FAIL" in content: verdict = "FAIL"; break
```

본문 어디에든 "CONDITIONAL"/"PASS"/"FAIL" 문자열이 있으면 매칭. 예: "이전엔 CONDITIONAL이었지만 이번엔 PASS"라는 서술이 있으면 CONDITIONAL로 잘못 판정.

이전 코드리뷰에서 한 번 보강(`ce9f8c3 fix(sj-company): 코드리뷰 지적사항 수정 — CONDITIONAL`)됐지만 substring 매칭은 그대로.

**권장:** `^## 판정:\s*(PASS|FAIL|CONDITIONAL)` 같은 명시적 헤더 정규식.

### M3. sj-pm Step 번호 누락

**증거 (`sj-pm/SKILL.md`):**
- Step 1: 프로젝트 뇌 로드
- Step 2: 태스크 수행
- Step 3: 자체 검토
- **Step 4 없음**
- Step 5: 결과 저장
- Step 6: 완료 보고

오타지만 문서 일관성 점수 떨어뜨림. 다른 스킬들은 모두 연속 번호.

### M4. sj-company Case A→Case B 전이 명시 없음

**증거 (`sj-company/SKILL.md:136-195`):**

Case A는 브리핑 후 AskUserQuestion:
- A) 바로 시작 (NEXT 태스크로) → "NEXT 값을 태스크로 Case B 실행"
- B) 새 태스크 입력 → "입력값으로 Case B 실행"

명시는 있으나 "Case B로 점프"가 행간. 라우터의 가장 핵심 분기인데 더 단호한 표현이 필요. (예: "이 시점부터 Case B Step 1부터 그대로 실행한다.")

또 PROJECT.md가 없는 신규 프로젝트 분기(162-195)에서 PROJECT.md 생성 후 다음 행동이 명시되지 않음 — 브리핑으로 돌아갈지, 바로 Case B로 갈지, 종료할지 모호.

---

## 5. LOW 발견

### L1. Design 명세 모드 Step 7의 "Tech Lead 제안"이 dead

`sj-design/SKILL.md:182-184` "다음 단계(Tech Lead)를 제안한다" — 명세 모드 자체가 호출되지 않으므로 무의미.

### L2. Tech Lead의 "PM 분석 발췌" 지시가 모호

`sj-tech-lead/SKILL.md:178`: `PM 분석 요약: {docs/sj-company/.state/task.txt에서 본인 영역 관련 부분 발췌}` — 발췌 알고리즘 미명시. 모델이 자유롭게 판단하라는 의도라면 그 자체를 명시하는 게 안전.

### L3. design-review.md → dev-output.md 통합 경로 부재

`sj-design/SKILL.md:230-263`은 `docs/sj-company/dev-output/design-review.md`를 생성. 그러나 `sj-tech-lead/SKILL.md:289-340` Step 9의 dev-output.md 집계 템플릿에 design-review 통합 섹션이 없음. 리뷰 결과가 미아.

---

## 6. 교차 발견 (스킬 경계)

**관통 패턴:** v3는 sj-company만 단순화했고 나머지 4스킬 + 7에이전트는 v2 그대로 — 5스킬 모두 같은 워크스페이스를 공유하면서 서로 다른 모델로 동작한다.

**구체적 경계 이슈:**
1. `task.txt` 포맷이 호출자에 따라 다름 (sj-company Medium vs sj-pm) → 다운스트림(sj-tech-lead) 파싱 불안정
2. `pm-output.md` / `design-output.md`를 생성하는 곳과 읽는 곳이 어긋남 → 100% dead reference
3. PROJECT.md 갱신을 하는 스킬과 안 하는 스킬이 섞임 (`sj-design`/`sj-tech-lead`는 안 함, 나머지는 함) — Large 경로에서 sj-qa가 최종 갱신을 책임지지만 Medium 경로에서 sj-tech-lead만 돌고 끝나면 PROJECT.md `next`가 stale로 남음
4. `pw-loop` 호출 책임이 sj-company와 sj-qa 양쪽에 분산 → 중복 호출

---

## 7. 패치 제안 백로그

> 각 패치는 **별도 승인 후** 적용. 아래는 v3 룰 유지를 전제로 한 reconciliation 방향.

### P1 [CRITICAL → 우선] v3 룰 vs 구현 reconciliation 결단
- **옵션 A (룰 유지):** sj-pm/sj-design/sj-tech-lead/sj-qa의 `*-output.md` 생성을 제거하고 모든 결과를 PROJECT.md에 인라인 + `.state/`만 사용. sj-design 명세 모드는 삭제 또는 비활성. 7개 dev 에이전트의 입력 인터페이스도 v3에 맞춰 재작성. **추천** — v3 도입 의도를 살림.
- **옵션 B (구현 유지):** sj-company `SKILL.md:401-406`의 금지 룰을 제거하고 v2 5파일 모델을 공식화. v3 단순화 효과 포기.
- **옵션 C (혼합):** 산출 파일은 허용하되 PROJECT.md를 single source of truth로 유지 (현 실태에 가장 가까움). 룰을 "PROJECT.md를 항상 최신으로 유지" 식으로 재서술.

→ 옵션 결정이 P2~P12의 방향을 정한다. **다른 패치 작업 전 이 결단 먼저 필요.**

### P2 [HIGH] Design 명세 모드 처리
- 옵션 A 선택 시: sj-design 명세 모드 절차(L52-184) 삭제, 리뷰 모드만 남기고 파일 헤더·description도 review-only로 수정.
- 옵션 B/C 선택 시: sj-company 라우터에 Design 호출 경로 추가 (Medium/Large가 frontend HINT면 design 명세 → tech-lead 순서).

### P3 [HIGH] PM HINT 일관화
- sj-pm Step 5 결과 저장에 HINT 라인을 항상 첫 줄로 포함하도록 수정 (Medium의 task.txt 포맷과 통일).
- 또는 sj-company가 sj-pm 호출 전후로 HINT를 별도 파일(`.state/hint.txt`)에 분리 저장하고 Tech Lead가 두 곳을 읽도록.

### P4 [HIGH] pw-loop 이중 호출 제거
- sj-company Large Step 5의 pw-loop 호출을 제거하고 sj-qa에만 위임.
- 또는 sj-qa가 sj-company에서 호출된 경우 pw-loop를 건너뛰는 sentinel (`.state/pw-ran.txt`).

### P5 [HIGH] Tech Lead의 Design 리뷰 호출 메커니즘 수정
- 현 `Skill("...")` 호출을 `Agent(subagent_type="sj-design-reviewer", prompt="...")`로 변경 — 단 sj-design은 스킬이므로 별도 reviewer 에이전트 도입 또는 sj-design을 에이전트로 전환 필요.
- 또는 design-review 절차를 sj-tech-lead 본인이 인라인으로 수행 (체크리스트는 sj-design SKILL의 R-Step 2에서 import).

### P6 [HIGH] 서브에이전트 입력 컨텍스트 v3화
- 7개 dev 에이전트의 "입력 컨텍스트" 섹션 + Step 1 컨텍스트 로드 명령을 PROJECT.md + task.txt 중심으로 재작성.
- pm-output.md, design-output.md 참조 제거 또는 "있으면 읽고 없으면 task.txt만으로 진행" 명시.

### P7 [MEDIUM] `_HAS_PM` 판정 로직 보정
- task.txt 본문에 `PM Output —` 헤더 패턴이 있을 때만 `_HAS_PM=yes`로 판정.
- 또는 PROJECT.md goal 폴백 분기를 제거 (어차피 dead라면).

### P8 [MEDIUM] sj-qa verdict 파싱 강건화
- substring 매칭을 `re.search(r'^## 판정:\s*(PASS|FAIL|CONDITIONAL)', text, re.MULTILINE)`로 교체.
- 헤더 없으면 명시적 오류 출력.

### P9 [MEDIUM] sj-pm Step 번호 정합
- Step 4 추가 (자체 검토를 Step 4로 옮기고 결과 저장을 Step 5 그대로) 또는 Step 5→4로 번호 재조정.

### P10 [MEDIUM] Case A→Case B 전이 명시화
- sj-company `SKILL.md:158-161`을 "이후 Case B Step 1부터 실행한다" 같은 단호한 표현으로 보강.
- PROJECT.md 신규 생성 분기(162-195) 마지막에 "Step 1 브리핑부터 다시 실행한다" 같은 명시적 후속 행동.

### P11 [LOW] 잔여 가이드 정리
- sj-design 명세 모드 Step 7 "Tech Lead 제안" 라인 삭제 (P2와 함께 처리).
- sj-tech-lead Step 5 디스패치 템플릿의 "발췌" 지시를 "task.txt 본문을 그대로 전달한다" 또는 "본인 영역과 직접 관련된 단락만 요약 (200자 이내)"로 명시화.

### P12 [LOW] design-review 통합 경로 추가
- sj-tech-lead Step 9의 dev-output.md 템플릿에 "Design 리뷰 결과" 섹션 추가, design-review.md 요약 인용.

---

## 8. 우선순위 권장

1. **P1 결단** (CRITICAL, 다른 모든 패치의 전제)
2. P2, P5 (Design 경로 dead·비실행 — 의도된 워크플로우의 일부가 안 돎)
3. P3, P4, P6 (HIGH 잔여)
4. P7~P12 (MEDIUM/LOW 정합성)

P1을 어떤 옵션으로 갈지 결정해 주시면 P2~P12를 그 방향으로 다시 다듬어 적용 PR(또는 패치 묶음)을 제안하겠습니다.
