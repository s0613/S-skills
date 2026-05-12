# S-skills

Personal Claude Code skill library. Each skill is a self-contained directory with a `SKILL.md` that Claude follows when invoked.

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/s0613/S-skills.git ~/S-skills

# 2. Link skills into Claude
ln -sf ~/S-skills/docs-organize ~/.claude/skills/docs-organize
```

새 맥이나 다른 환경에서도 위 두 줄이면 세팅 완료.

---

## Skills

| Skill | Trigger | 한 줄 설명 |
|-------|---------|-----------|
| [docs-organize](#docs-organize) | `/docs-organize` | 프로젝트 분석 → 문서 생성 → 건강 점수 산출 |

---

## docs-organize

### 목적

프로젝트 디렉토리에서 `/docs-organize`를 실행하면:

1. 코드베이스 자동 분석 (tech stack, 프로젝트 타입, 프론트엔드 여부)
2. 코드만으로 알 수 없는 것을 최소한의 질문으로 수집
3. `docs/` 하위에 표준 문서 생성
4. 테스트 스위트 실행 후 결과 반영
5. 프로젝트 건강 점수 0–100점 산출

### 사용법

```
# 아무 프로젝트 디렉토리에서
/docs-organize
```

또는 자연어로:

```
docs 정리
문서 정리
```

### 생성 파일 구조

```
{project}/
├── CLAUDE.md                    ← 이 프로젝트용 Claude 지시사항 (루트)
└── docs/
    ├── prd.md                   ← 제품 요구사항
    ├── architecture.md          ← 시스템 구조 & 기술 결정
    ├── UI_GUIDE.md              ← UI 디자인 가이드 (프론트엔드 감지 시만 생성)
    ├── STATUS.md                ← 구현 상태 + 프로젝트 점수
    └── adr/
        └── YYYY-MM-DD-{title}.md  ← Architecture Decision Records
```

> `docs/spec/`는 처음부터 만들지 않음. 첫 spec 요청 시 생성됨.

### 인터뷰 방식

코드 분석 후 아래 4가지를 모두 확신할 수 없으면 질문합니다 (최대 5개, 최소 1개):

- 제품 목적 (한 문장)
- 주요 타겟 유저
- 현재 단계 (POC / MVP / Production)
- 코드에서 보이지 않는 핵심 제약 또는 아키텍처 결정

### 문서 포맷

**prd.md**
```
Problem / Target Users / Features (in scope) / Out of Scope / Success Metrics
```

**architecture.md**
```
Overview / Tech Stack / Key Decisions / Data Flow / Constraints
```

**UI_GUIDE.md** _(프론트엔드만)_
```
Design Direction / Color Palette / Typography / Spacing & Layout /
Component Patterns / Motion / Do Not
```

**STATUS.md**
```
Score: XX/100 (prev: XX → delta)
Score Breakdown (4개 차원)
Test Results
Milestones / Features / Technical Debt / Infrastructure
```

**adr/YYYY-MM-DD-{title}.md** (ADR 표준)
```
Status / Context / Decision / Consequences
```

**CLAUDE.md** (프로젝트 루트)
```
Project Summary / Tech Stack / Conventions / Do Not / Docs Reference
```

### 점수 시스템 (0–100)

| 차원 | 배점 | 기준 |
|------|------|------|
| 문서 완성도 | 25 | prd, architecture, ADR, STATUS, CLAUDE.md 각 5pt |
| 기능 구현율 | 25 | 테스트 통과율 기반. 테스트 없으면 코드 구조 분석으로 폴백 |
| 코드 품질 | 25 | 테스트 파일 존재 + 통과율 + TODO/FIXME 수 |
| 인프라 준비도 | 25 | CI/CD + .env.example + README + 모니터링 |

매 실행마다 이전 점수와 비교해 delta를 기록:

```
Score: 72 / 100  (prev: 61 → +11)
```

#### 기능 구현율 상세

테스트가 있을 때:
- `round(passed / (passed + failed) * 25)`

테스트가 없을 때 (POC 등) — 코드 구조 폴백:
- PRD 기능 대비 구현된 코드 비율로 3–20점 부여
- STATUS.md에 `Runner: none — scored via code structure analysis` 기록

### 반복 실행 (업데이트)

이미 `docs/`가 있으면 덮어쓰지 않고 병합합니다. 의도적으로 작성된 내용은 유지됩니다.

```
# 한 달 후 다시 실행하면
/docs-organize
→ 새로 추가된 기능, 변경된 구조, 테스트 결과가 반영되고 점수가 갱신됨
```

---

## 새 스킬 추가하기

```bash
mkdir ~/S-skills/my-skill
# SKILL.md 작성
ln -sf ~/S-skills/my-skill ~/.claude/skills/my-skill
```

`SKILL.md` 최소 구조:

```markdown
---
name: my-skill
version: 1.0.0
description: |
  한 줄 설명
triggers:
  - /my-skill
---

# my-skill

스킬 지시사항...
```

---

## 업데이트

```bash
cd ~/S-skills && git pull
```

심링크를 그대로 두면 pull만으로 즉시 반영됩니다.
