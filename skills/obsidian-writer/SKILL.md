---
name: obsidian-writer
version: 1.0.1
description: |
  Obsidian 문서 작성 전문가.
  기능, 작업, 프로젝트 전체에 대한 정보를 받아 Obsidian 볼트에
  아름답고 구조화된 .md 문서를 작성한다.
  최초 실행 시 볼트 경로를 탐지하고, 이후 매 실행마다 저장 위치를 확인한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - /obsidian
  - /obsidian-writer
---

# Obsidian Writer Skill

## Step 1 — 볼트 경로 탐지

아래 명령으로 사용 가능한 볼트를 탐지한다.

```bash
ICLOUD_BASE="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents"
LOCAL_BASE="$HOME/Documents/Obsidian Vault"

ICLOUD_OK=false
LOCAL_OK=false

[ -d "$ICLOUD_BASE" ] && ICLOUD_OK=true
[ -d "$LOCAL_BASE" ] && LOCAL_OK=true

echo "ICLOUD=$ICLOUD_OK"
echo "ICLOUD_PATH=$ICLOUD_BASE"
echo "LOCAL=$LOCAL_OK"
echo "LOCAL_PATH=$LOCAL_BASE"
```

- **iCloud 경로** (일반적): `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/`
  - 하위 볼트: `sj/` — 프로젝트·작업 기록 용도
  - 하위 볼트: `AI 에이전트/` — AI 에이전트 지식베이스
- **로컬 경로** (일반적): `~/Documents/Obsidian Vault/`
  - 하위 폴더: `Projects/` — 클로드맴 마이그레이션 기록

## Step 2 — 저장 위치 선택

탐지된 경로가 2개 이상이면 **매번** AskUserQuestion으로 확인한다.

```
질문: "어느 볼트에 저장할까요?"
옵션:
  A. iCloud (sj/) — 모든 기기에서 접근 가능
  B. 로컬 (Projects/) — 이 맥에서만 접근
  C. 둘 다 — iCloud + 로컬 모두 저장
```

선택 결과를 기억해 이 세션 내에서는 같은 문서 저장에 재사용한다.

## Step 3 — 문서 타입 판단

사용자의 요청을 분석해 아래 타입 중 하나를 선택한다. 모호하면 물어본다.

> **컨벤션:** [정직 산출 계약](../_conventions/honest-report.md) — 요청이 파일 경로를 언급하면 **존재 확인 후 실제로 읽고** 작성한다. 없거나 못 읽으면 그 사실을 보고하고 추측으로 채우지 않는다. 저장 후엔 실제 경로를 보고한다.

| 타입 | 키워드 예시 | 파일명 패턴 |
|------|------------|------------|
| `feature` | 기능, 구현, 추가, 만들었어 | `feature-{slug}.md` |
| `task` | 작업, 했어, 완료, 정리 | `task-{date}-{slug}.md` |
| `overview` | 전체, 프로젝트 개요, 아키텍처, 현황 | `overview.md` |
| `decision` | 결정, 왜, 선택, ADR | `decision-{slug}.md` |
| `devlog` | 오늘, 일지, 로그, 기록 | `devlog-{date}.md` |

## Step 4 — 폴더 구조 결정

### iCloud 볼트 (`sj/`)

```
sj/
└── {project-name}/
    ├── overview.md          ← 프로젝트 개요 (1개)
    ├── features/
    │   └── feature-{slug}.md
    ├── tasks/
    │   └── task-{date}-{slug}.md
    ├── decisions/
    │   └── decision-{slug}.md
    └── devlog/
        └── devlog-{date}.md
```

### 로컬 볼트 (`Projects/`)

```
Projects/
└── {project-name}/
    └── {YYYY-MM-DD}.md     ← 날짜별 일지 형태
```

현재 프로젝트명은 `git rev-parse --show-toplevel 2>/dev/null | xargs basename` 또는 `pwd | xargs basename`으로 추출한다.

## Step 5 — 문서 작성 규칙

### Frontmatter (필수)

```yaml
---
date: YYYY-MM-DD
project: {project-name}
type: feature|task|overview|decision|devlog
status: draft|active|complete
tags:
  - {project-name}
  - {type}
  - {topic-tags...}
related:
  - "[[overview]]"
---
```

### 문서 품질 기준 (최소 4개 이상 충족)

1. **계층적 구조** — H1 → H2 → H3 체계적 사용
2. **Callout 활용** — 중요 정보는 Obsidian callout 블록 사용
   ```
   > [!NOTE] 제목
   > 내용
   
   > [!WARNING] 주의
   > 내용
   
   > [!TIP] 팁
   > 내용
   
   > [!SUCCESS] 완료
   > 내용
   ```
3. **코드 블록** — 언어 태그 명시 (```typescript, ```bash 등)
4. **테이블** — 비교, 목록, 스펙에 활용
5. **내부 링크** — `[[overview]]`, `[[관련문서]]` 형태로 연결
6. **Mermaid 다이어그램** — 아키텍처, 플로우, 시퀀스 필요 시
   ````
   ```mermaid
   graph TD
     A --> B
   ```
   ````
7. **요약 섹션** — 문서 상단에 한 줄 요약 또는 TL;DR
8. **체크리스트** — 작업/기능에 `- [x]` 완료 항목 포함

### 타입별 템플릿

#### `feature` 템플릿

```markdown
---
(frontmatter)
---

# {기능명}

> [!NOTE] 요약
> 한 줄 설명

## 개요

무엇을, 왜 구현했는가.

## 구현 상세

### 핵심 로직

(코드 또는 설명)

### 파일 구조

(수정/추가된 파일 목록)

## 사용 방법

## 트레이드오프 & 결정 사항

## 관련 문서

- [[overview]]
```

#### `task` 템플릿

```markdown
---
(frontmatter)
---

# {작업명} — {날짜}

> [!SUCCESS] 완료
> 한 줄 요약

## 무엇을 했나

## 주요 변경사항

| 파일 | 변경 내용 |
|------|----------|
| ... | ... |

## 문제와 해결

## 다음 단계

- [ ] ...
```

#### `overview` 템플릿

```markdown
---
(frontmatter)
---

# {프로젝트명} 개요

> [!NOTE] 한줄 소개
> ...

## 목표

## 기술 스택

| 영역 | 기술 |
|------|------|
| ... | ... |

## 아키텍처

```mermaid
(다이어그램)
```

## 주요 기능

- [ ] 기능1
- [x] 기능2 (완료)

## 디렉토리 구조

## 관련 문서

- [[features/...]]
- [[decisions/...]]
```

#### `decision` 템플릿 (ADR 스타일)

```markdown
---
(frontmatter)
---

# ADR: {결정 제목}

> [!WARNING] 배경
> 어떤 상황에서 이 결정이 필요했나

## 문제

## 고려한 옵션

| 옵션 | 장점 | 단점 |
|------|------|------|
| A | ... | ... |
| B | ... | ... |

## 결정

**선택: {옵션}**

이유: ...

## 결과

## 재검토 시점
```

#### `devlog` 템플릿

```markdown
---
(frontmatter)
---

# 개발 일지 — {날짜}

## 오늘 한 일

## 배운 것

## 막힌 것 / 해결한 것

## 내일 할 일

- [ ] ...
```

## Step 6 — 파일 저장

1. 대상 디렉토리가 없으면 `mkdir -p`로 생성
2. 파일명 충돌 시: `overview.md` → `overview-2.md` 로 넘버링 (단, `devlog`, `task`는 날짜 포함이므로 충돌 없음)
3. 기존 `overview.md`가 있으면 덮어쓰기 전 확인
4. 저장 완료 후 경로를 출력해 사용자가 바로 확인할 수 있게

## Step 7 — 완료 보고

저장 후 아래 형식으로 보고:

```
✅ Obsidian 문서 저장 완료

📄 파일: {파일명}
📁 경로: {전체 경로}
🏷 태그: {tags}
```

둘 다 저장한 경우 두 경로 모두 출력.
