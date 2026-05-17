# PM Output — README.md 비서/총괄 보고서 아키텍처 설명 추가
> 생성일: 2026-05-17

## 요구사항 분석

sj-secretary 스킬 설명 항목에, 총괄(sj-company)이 report.md를 작성하고 비서는 이를 요약·전달하는 역할 분리 구조를 한 줄로 추가한다.

## 태스크 목록
- [ ] CLAUDE.md 또는 README.md의 `sj-secretary` 항목에 역할 분리 설명 한 줄 추가

## 리스크
- README.md와 CLAUDE.md 두 곳에 스킬 설명이 중복되어 있어 어느 쪽을 수정할지 확인 필요

## Dev/QA에 전달할 핵심 지침
- 수정 대상: `CLAUDE.md`의 `sj-secretary` 항목 (README.md가 별도 존재하면 둘 다)
- 추가 내용: "총괄(sj-company)이 사이클 완료 시 report.md를 작성하고, 비서는 이를 읽어 요약 보고"
- 한 줄 이내로 간결하게. 기존 설명 포맷 유지.
- 다른 항목 건드리지 않음.
