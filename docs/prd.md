# Product Requirements

## Problem
Claude Code 사용자는 프로젝트마다 반복적으로 문서를 만들고, 테스트 사이클을 수동으로 관리하느라 시간을 낭비한다.
표준화된 문서 구조와 사이클 기반 테스트 추적이 없으면 프로젝트 건강 상태를 객관적으로 파악하기 어렵다.

## Target Users
Claude Code를 사용하는 개발자라면 누구나 — 개인 프로젝트부터 팀 워크플로우까지.
오픈소스로 배포되어 플러그인 형태로 누구나 설치해 쓸 수 있다.

## Features (in scope)
- **harness**: `/s-skills` 하나로 프로젝트 상태 감지 → 적절한 스킬 자동 라우팅
- **docs-organize**: 코드 분석 + 인터뷰 → 표준 문서(PRD, 아키텍처, STATUS) 자동 생성 + 건강 점수 0–100
- **test-scenario**: 사이클 기반 E2E 테스트 하네스 — 시나리오 생성 → 실행 → 결과 보고 → 목표 통과율까지 반복
- **sj-company**: PM/Design/Dev/QA 역할별 서브 에이전트 파이프라인
- 플러그인 업그레이드 감지 및 원클릭 업데이트

## Out of Scope
- 자동 코드 실행 (테스트 실행은 사용자 또는 Claude가 직접)
- CI/CD 파이프라인 직접 구성
- 다른 AI 도구 (Copilot, Cursor 등) 지원

## Success Metrics
- 새 프로젝트에서 `/s-skills` 한 번 실행으로 표준 문서 생성 완료
- 테스트 사이클 목표 통과율(기본 80%) 달성
- 플러그인 설치 → 즉시 사용 가능 (설정 불필요)
