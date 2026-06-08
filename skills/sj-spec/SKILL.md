---
name: sj-spec
version: 1.0.0
description: |
  스펙 작성 전문가. 모호한 의도를 5단계(why·scope·technical·draft·file)를 거쳐
  실행 가능한 정밀 스펙으로 변환한다.
  "스펙 만들어줘", "요구사항 정리", "PRD 써줘", "기능 명세" 요청에 반응.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
triggers:
  - /sj-spec
  - /spec
---

# SJ Spec — 스펙 작성 전문가

> **원칙: 모호함을 코드보다 먼저 제거한다**
> 스펙이 명확하면 구현이 절반이다. Why → Scope → Technical → Draft → File 순으로 진행.

---

## Step 0: 프로젝트 컨텍스트 로드

```bash
mkdir -p docs/sj-company/.state
[ -f "docs/sj-company/PROJECT.md" ] && cat "docs/sj-company/PROJECT.md"
[ -f "docs/sj-company/pm-context.md" ] && cat "docs/sj-company/pm-context.md"
```

현재 요청이 있으면 바로 Step 1으로. 없으면 AskUserQuestion으로 "어떤 기능/시스템의 스펙을 만들까요?" 질문.

---

## Step 1: WHY — 목적 명확화 (Forcing Questions)

아래 6개 질문을 사용자에게 한 번에 보여주고, **답이 없는 항목은 Claude가 최선의 가정을 제시한다** (다시 물어보지 않는다):

```
[스펙 강제 질문]

1. 이 기능이 없으면 사용자가 지금 어떻게 해결하나?
   → (현재 방법 파악 — 해결하지 않는다면 이 기능이 필요한가?)

2. 이 기능으로 성공을 어떻게 측정하나? (지표)
   → (수치 없는 성공은 완료를 판단할 수 없다)

3. 이 기능을 가장 많이 쓸 사용자 유형은?
   → (엣지 케이스 우선 설계 방지)

4. 6개월 후 이 기능이 어떻게 확장될 수 있나?
   → (지금 당장 필요 없더라도 확장을 막는 설계는 피해야 함)

5. 이 기능을 제외하거나 축소하면 어떤 리스크가 있나?
   → (스코프를 좁힐 수 있는지 검토)

6. 어떤 기술적 제약이 이미 존재하나? (API 계약, 레거시, 성능 요건)
```

AskUserQuestion 한 번으로 모든 답을 받는다.

---

## Step 2: SCOPE — 범위 확정

답변을 분석해 **포함/제외/보류** 세 열로 정리:

```
## 스코프 확정

| 포함 | 제외 | 보류 (v2) |
|------|------|-----------|
| {명확히 필요한 것} | {명백히 이번이 아닌 것} | {판단 미루는 것} |
```

스코프가 너무 크면 MVP 버전을 제안한다:
```
⚠️ 스코프가 크습니다. MVP로 좁혀서 진행할까요?
MVP: {핵심 2~3개만}
Full: {전체}
```

AskUserQuestion으로 MVP / Full / 직접 수정 선택.

---

## Step 3: TECHNICAL — 기술 명세

코드베이스를 탐색해 기술적 컨텍스트를 파악한다:

```bash
# 주요 파일 구조
find . -maxdepth 3 \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/.next/*' | head -40

# 기존 API/인터페이스 확인
ls src/api 2>/dev/null || ls app/api 2>/dev/null || true
ls src/types 2>/dev/null || ls types 2>/dev/null || true
```

파악 후 아래를 작성:

```markdown
## 기술 명세

### 데이터 모델
[신규/변경 필드, 타입]

### API 인터페이스
[엔드포인트, 메서드, 입출력]

### 상태 변화
[Before → Event → After]

### 에러 케이스
[예상 에러 + 처리 방식]

### 성능 요건
[응답 시간, 동시 사용자, 데이터 크기]

### 보안 고려사항
[인증, 권한, 입력 검증]
```

---

## Step 4: DRAFT — 스펙 초안 작성 + 품질 검사

초안을 작성하고 아래 체크리스트를 자가 검토한다:

- [ ] 모든 요구사항이 **검증 가능한** 형태인가? ("빨라야 함" → "응답 300ms 이하")
- [ ] 엣지 케이스가 최소 3개 명시됐는가?
- [ ] 성공 기준이 지표로 정의됐는가?
- [ ] 기술 명세가 구현팀이 바로 시작할 수 있는 수준인가?
- [ ] 스코프 외 항목이 스며들지 않았는가?
- [ ] 비밀/시크릿이 스펙에 하드코딩되지 않았는가?
- [ ] 기존 스펙과 중복 기능이 없는가?

문제가 있으면 해당 항목 수정 후 다시 통과.

---

## Step 5: FILE — 파일 저장

스펙을 `docs/sj-company/spec-{feature-name}.md`로 저장:

```markdown
# Spec: {기능명}
> 작성일: {날짜} | 버전: 1.0.0 | 작성자: SJ Spec

## 목적 (Why)
{1~2문장 핵심 이유}

## 성공 기준
- {지표1}: {목표값}
- {지표2}: {목표값}

## 스코프

### 포함
- {항목}

### 제외
- {항목}

## 사용자 스토리
- As a {사용자}, I want to {행동}, so that {결과}.

## 기술 명세

### 데이터 모델
{모델}

### API
{엔드포인트}

### 에러 케이스
{케이스}

## 수용 기준 (Acceptance Criteria)
- [ ] {기준1}
- [ ] {기준2}

## 엣지 케이스
- {케이스1}
- {케이스2}
- {케이스3}

## 제외 이유 (Out of Scope)
{제외된 항목과 이유}
```

저장 완료 후, task.txt에 스펙 경로를 기록해 Dispatch Card에 자동 포함되도록 한다:

```bash
mkdir -p docs/sj-company/.state
SPEC_PATH="docs/sj-company/spec-{feature-name}.md"
# 기존 task.txt가 있으면 spec 참조를 맨 앞에 추가
if [ -f "docs/sj-company/.state/task.txt" ]; then
  TMP=$(cat docs/sj-company/.state/task.txt)
  echo "[SPEC: $SPEC_PATH]
$TMP" > docs/sj-company/.state/task.txt
else
  echo "[SPEC: $SPEC_PATH]" > docs/sj-company/.state/task.txt
fi
echo "스펙 경로가 task.txt에 등록됐습니다."
```

```
✅ 스펙 저장: docs/sj-company/spec-{feature-name}.md

다음 단계:
- 구현 시작: /sj-company {기능명} 구현해줘  (Tech Lead가 스펙 파일을 자동으로 참조)
- 보안 검토: /cso
- 에이전트 설계: /sj-agent-dev
```
