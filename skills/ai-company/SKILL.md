---
name: s-skills
version: 1.0.0
description: |
  AI Company 하네스. Claude CLI에서 /ai-company로 진입하면
  Ink TUI 대시보드를 실행한다. GM AI가 PM/Dev/Design/QA를 조율한다.
allowed-tools:
  - Bash
  - Read
triggers:
  - /ai-company
---

# AI Company Harness

AI SI 회사 TUI를 실행한다.

## 실행

1. ANTHROPIC_API_KEY 환경변수 확인:

```bash
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다."
  echo "export ANTHROPIC_API_KEY=your-key-here"
  exit 1
fi
```

2. 의존성 설치 확인 및 TUI 실행:

```bash
SKILL_DIR="$(dirname "$(realpath "$0")")"
cd "$SKILL_DIR"

if [ ! -d "node_modules" ]; then
  echo "의존성 설치 중..."
  npm install --silent
fi

PROJECT="${1:-}"
node src/index.jsx "$PROJECT"
```

## 사용법

- `/ai-company` — 새 세션 시작 (프로젝트명 TUI에서 입력)
- `/ai-company my-app` — 특정 프로젝트로 바로 진입

## 단축키

- `q` 또는 `:q` — 종료
- `Ctrl+C` — 강제 종료
