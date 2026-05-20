# QA Verdict — 로그인 비밀번호 표시 토글

> 생성일: 2026-05-20

## 테스트 케이스
- [x] 데스크탑 Chrome — 클릭 시 type 토글
- [x] 데스크탑 Safari — 자동완성과 충돌 없음
- [x] 모바일 iOS Safari — 터치 타깃 44px 이상
- [x] 모바일 Android Chrome — 토글 정상 동작
- [x] 스크린리더 (VoiceOver) — aria-label "비밀번호 표시"·"비밀번호 숨기기" 발화
- [x] 키보드 — Tab으로 토글 접근 가능, Enter/Space로 활성화

## 엣지 케이스
- 토글된 상태에서 form submit 시 비밀번호 평문이 GET 쿼리스트링에 노출되지 않음 (form method=POST 확인)

## 판정: PASS
모든 케이스 통과. 자동완성 충돌 없음. a11y 요구사항 충족.

## 발견된 이슈
- (LOW) 토글 아이콘 hover 시 색상 transition이 100ms로 너무 빠름 — 디자인 시스템 표준은 150ms.
  → Frontend follow-up commit으로 처리 가능 (블로커 아님).
