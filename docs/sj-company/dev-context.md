# Dev Context — S-skills

## 기술 스택
- 언어: JavaScript (Node.js)
- 프레임워크: 없음 (마크다운 기반 스킬 플러그인)
- 주요 라이브러리: 없음

## 디렉토리 구조
```
skills/           ← 각 스킬의 SKILL.md 정의 파일
docs/             ← 생성된 문서 및 상태 파일
docs/sj-company/  ← sj-company 파이프라인 산출물
```

## 코드 컨벤션
- 네이밍: 파일명 kebab-case
- 파일 구조: 스킬별 디렉토리 + SKILL.md 단일 파일
- 에러 처리: bash 블록 내 `2>/dev/null || echo "fallback"` 패턴

## 주요 패턴
- SKILL.md에 지시사항 + bash preamble + AskUserQuestion 라우팅
- .state/*.txt 파일로 파이프라인 상태 관리

## 참고
이 프로젝트 자체에는 UI가 없음. 하네스 테스트용 가상 태스크 처리 시
Next.js/React 기반 프로젝트를 가정한다.

## 히스토리
- 2026-05-15: 초기 생성
