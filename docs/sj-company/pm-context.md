# PM Context — S-skills

## 프로젝트 개요
Claude Code 사용자를 위한 커스텀 하네스 + 스킬 플러그인 모음.
오픈소스 배포 목적이며, `/s-skills` 하나로 문서 생성·테스트 사이클·개발 파이프라인을 오케스트레이션한다.
마크다운 기반 SKILL.md 파일로 동작하며 외부 의존성 없이 파일시스템만으로 상태를 관리한다.

## 주요 사용자
Claude Code를 사용하는 개발자 (개인 또는 팀)

## 개발 단계
MVP/Production (v2.2.0, 플러그인 배포 중)

## 핵심 제약조건
- Claude Code 환경에서만 동작 (다른 AI 도구 미지원)
- 코드 없이 SKILL.md(마크다운)만으로 스킬 정의
- 외부 DB/서비스 없이 파일시스템 상태 관리
- 컨텍스트 창 크기 제한 내에서 스킬 파일 처리

## 기술 스택 요약
- Runtime: Claude Code Skill System
- Skill 정의: Markdown (SKILL.md)
- 상태 저장: 파일시스템 (.state/*.txt, history.jsonl)
- 배포: Claude Code Plugin

## 히스토리
- 2026-05-15: 초기 생성
