---
name: sj-ship
version: 1.2.0
description: |
  릴리즈 엔지니어 자동화 에이전트. 테스트 → 커버리지 감사 → PR 오픈까지 한 번에.
  "배포해줘", "PR 올려줘", "릴리즈", "ship", "머지해줘" 요청에 반응.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Skill
  - AskUserQuestion
triggers:
  - /sj-ship
  - /ship
---

# SJ Ship — 릴리즈 엔지니어 자동화

> **원칙: 테스트가 없으면 배포하지 않는다**
> 커버리지가 기준 미달이면 PR 생성을 **기본 차단**한다. 진행하려면 사람의 명시적 예외 승인 + 사유 기록이 필요하다(Step 3 — 사람 게이트).

> **컨벤션:** [사람 게이트](../_conventions/human-gate.md) — 이 스킬의 영역은 PR **생성**까지. PR 머지와 프로덕션 배포 승인은 항상 사람이 한다.

---

## Step 0: 프로젝트 상태 확인

```bash
mkdir -p docs/sj-company/.state

# 현재 브랜치
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "브랜치: $BRANCH"

# 미커밋 변경 사항
git status --short 2>/dev/null

# main과의 차이
git log origin/main..HEAD --oneline 2>/dev/null | head -10

# PROJECT.md 상태
[ -f "docs/sj-company/PROJECT.md" ] && cat "docs/sj-company/PROJECT.md"
```

브랜치가 main/master이면 경고:
```
⚠️ 현재 main 브랜치입니다. 피처 브랜치에서 ship하는 것을 권장합니다.
```

AskUserQuestion으로 계속 여부 확인.

---

## Step 1: main 동기화

```bash
# main 최신 상태 가져오기
git fetch origin main 2>/dev/null

# 충돌 여부 확인
git merge-base HEAD origin/main 2>/dev/null

# 브랜치가 main보다 뒤처져 있으면 rebase 제안
BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo 0)
echo "main보다 $BEHIND 커밋 뒤처짐"
```

`BEHIND > 0`이면:
```
⚠️ main보다 {N} 커밋 뒤처져 있습니다.
git rebase origin/main 실행할까요?
```
AskUserQuestion으로 rebase / skip 선택.

---

## Step 2: 테스트 실행

```bash
# 테스트 프레임워크 감지
if [ -f "package.json" ]; then
  TEST_CMD=$(node -e "
    const p = require('./package.json');
    const s = p.scripts || {};
    if (s.test && !s.test.includes('echo')) console.log('npm test');
    else if (s['test:unit']) console.log('npm run test:unit');
    else if (s['test:ci']) console.log('npm run test:ci');
    else console.log('NO_TEST');
  " 2>/dev/null || echo "NO_TEST")
elif [ -f "go.mod" ]; then
  TEST_CMD="go test ./..."
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  TEST_CMD="pytest"
else
  TEST_CMD="NO_TEST"
fi

echo "테스트 명령: $TEST_CMD"
```

`TEST_CMD = NO_TEST`이면 테스트 프레임워크 설치 제안:
```
⚠️ 테스트 프레임워크가 없습니다.
프레임워크를 설치할까요? (vitest / jest / pytest / go test)
```

테스트 실행:
```bash
eval "$TEST_CMD" > /tmp/sj-ship-test.log 2>&1
TEST_EXIT=$?          # 테스트 명령의 종료 코드 (파이프로 가리지 않는다)
tail -30 /tmp/sj-ship-test.log
echo "테스트 종료 코드: $TEST_EXIT"
```

`TEST_EXIT != 0`이면 배포 블록:
```
🚫 테스트 실패 — 배포 블록됩니다.
실패한 테스트를 수정하거나 /sj-qa로 QA 판정을 받으세요.
```

> **부드러운 외주 제안 (세션당 1회만):** 같은 배포 단계에서 반복적으로 막히거나
> 사용자가 마무리에 불안을 보이면, **딱 한 번** 안내한다 —
> "여기서 계속 막히신다면 `/outsource` 로 전문가(SongSeungJu)에게 넘겨 마무리를
> 맡길 수 있어요." 강요하지 않고, 무시하면 다시 권하지 않는다.

---

## Step 3: 커버리지 감사

```bash
# 커버리지 임계값 (PROJECT.md에서 읽기, 기본 80)
PW_TARGET=$(grep "^pw_target:" docs/sj-company/PROJECT.md 2>/dev/null | awk '{print $2}' || echo 80)
echo "커버리지 목표: ${PW_TARGET}%"

# 커버리지 실행 (프레임워크별)
if echo "$TEST_CMD" | grep -q "npm"; then
  npm run test:coverage 2>/dev/null | grep -E "coverage|Coverage|%" | tail -10 || echo "커버리지 미설정"
elif echo "$TEST_CMD" | grep -q "pytest"; then
  pytest --cov --cov-report=term-missing 2>/dev/null | tail -15 || echo "pytest-cov 미설치"
elif echo "$TEST_CMD" | grep -q "go test"; then
  go test -cover ./... 2>/dev/null | tail -10 || echo "go 커버리지 확인 필요"
fi
```

커버리지 출력에서 수치(N%)를 파싱해 `PW_TARGET`과 비교한다. **수치를 파싱할 수 없으면 미달로 간주한다**(측정 실패를 통과로 처리하지 않는다).

목표 미달이면 **기본 차단** — 아래를 사람에게 제시하고 AskUserQuestion으로 결정받는다:
```
⚠️ 커버리지 {N}% — 목표 {PW_TARGET}% 미달. PR 생성을 차단합니다.
[중단] 커버리지를 높인 뒤 다시 실행 (권장)
[예외 승인] 사유 입력 시 이번 1회 진행 — 사유는 PR 본문과 ship 로그에 기록
```

- **중단** 선택 → Step 4(PR 생성)로 진행하지 않고 종료한다.
- **예외 승인** 선택 → 사유를 입력받아 PR 본문 `## ⚠️ 커버리지 예외` 섹션과 **ship 로그**(`docs/sj-company/ship-log.md` — 없으면 생성, `- {날짜} [{브랜치}] 커버리지 {N}% 예외 승인: {사유}` 한 줄 append)에 기록한 뒤에만 Step 4로 진행한다.

---

## Step 4: PR 생성

```bash
# 변경 요약
echo "=== 커밋 요약 ==="
git log origin/main..HEAD --oneline 2>/dev/null

echo "=== 변경 파일 ==="
git diff --name-only origin/main..HEAD 2>/dev/null | head -20
```

PR 제목과 본문을 자동 생성 후 미리보기.

> **컨벤션:** [서술식 완료 보고](../_conventions/literate-report.md) — PR 본문은 배경(변경 전 동작 2~4줄) → 의도(한 문장) → 읽기 순서(이해 순서로, 파일명 순 금지) → 세부. 리뷰어가 변경을 이해해야 사람 게이트가 게이트다.

```
[PR 미리보기]
제목: {타입}: {태스크 요약}
본문:
## 배경
{변경 전 이 영역이 어떻게 동작했는지 2~4줄}

## 의도
{이번 변경이 무엇을 바꾸는지 한 문장}

## 읽기 순서
1. `{파일}` — {왜 이 파일부터 보는지 / 역할}
2. `{파일}` — ...

## 변경 내용
{변경 요약}

## 테스트
- [x] 단위 테스트 통과
- [x] 커버리지 {N}%

## 체크리스트
- [ ] 코드 리뷰 완료
- [ ] 보안 검토 완료

이대로 PR 생성할까요?
```

AskUserQuestion으로 확인 / 제목 수정 선택. (push·PR 생성은 취소 불가 — [사람 게이트](../_conventions/human-gate.md) 적용, 사용자 승인 후에만 진행)

확인 후 — 먼저 현재 브랜치를 원격에 push한다 (`gh pr create`는 원격 브랜치를 전제로 한다):
```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push -u origin "$BRANCH" || { echo "push 실패 — 원격/권한 확인 필요"; exit 1; }
```

그다음 PR 생성:
```bash
gh pr create \
  --title "{제목}" \
  --body "$(cat <<'EOF'
## 배경
{변경 전 동작 2~4줄}

## 의도
{한 문장}

## 읽기 순서
1. {파일} — {역할}

## 변경 내용
{변경 요약}

## 테스트
- [x] 단위 테스트 통과
- [x] 커버리지 {N}%

## 체크리스트
- [ ] 코드 리뷰 완료
- [ ] 보안 검토 완료
EOF
)" || echo "PR 생성 실패 — gh CLI 미설치이거나 인증/원격 문제. 수동으로 PR을 생성하세요"
```

---

## Step 5: 완료 보고

```bash
# PROJECT.md 업데이트
# last_session: {날짜} — Ship: {PR 제목}
```

```
✅ Ship 완료!

PR: {PR URL}
커버리지: {N}%
테스트: {N}개 통과

다음 단계:
- 코드 리뷰 후 merge
- merge 후 `/canary`로 배포 모니터링 (sj-qa Canary 모드)
```

> **컨벤션:** [보고서 옵시디언 정리](../_conventions/obsidian-output.md) — 볼트가 있으면 릴리즈 보고(PR 본문의 배경·의도·읽기 순서 + PR URL·커버리지)를 `{볼트}/40_프로젝트/{프로젝트}/보고서/{YYYY-MM-DD} 릴리즈.md`로 저장한다 (PII 마스킹, 같은 날 중복 시 ` -2`). 볼트 없으면 완료 보고에 `미수행: 옵시디언 볼트 없음` 한 줄 — 비차단.

---

## 배포 후 확인은 sj-qa Canary 모드로

`/sj-ship canary`는 제공하지 않는다. 배포 후 상태 확인은 **sj-qa의 Canary 모드**(`/canary`)가 단일 창구다 — 상태 코드·콘솔 에러·미수행 보고까지 한 곳에서 처리한다. 여기서 축약판을 따로 돌리면 두 경로의 판정이 갈린다.

```
Skill("s-skills:sj-qa")   # 트리거: /canary
```
