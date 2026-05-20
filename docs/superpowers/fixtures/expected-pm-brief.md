[HINT:single=frontend]
# PM Brief — 로그인 폼에 비밀번호 표시/숨기기 토글 추가

> 생성일: 2026-05-20

## 요구사항 분석
- 비밀번호 input 옆에 토글 아이콘 추가 (눈 모양 권장 — 디자인 시스템 아이콘 풀에서 선택)
- 클릭 시 `<input type>` password ↔ text 전환
- aria-label로 현재 상태 발화: "비밀번호 표시" / "비밀번호 숨기기"
- 자동완성·비밀번호 매니저와 호환 (name·autocomplete 속성 유지)

## 태스크 목록
- [ ] PasswordToggle 컴포넌트 신규 작성 (아이콘 + 토글 로직)
- [ ] LoginForm에 통합 (input 옆 절대 위치 / flex 자식)
- [ ] aria-label 동적 바인딩
- [ ] hover/focus/active 상태 디자인
- [ ] 키보드 접근성 (Tab + Enter/Space)

## 리스크
- 일부 비밀번호 매니저가 type 전환을 새 input으로 인식해 재제안할 수 있음 — 사용자 흐름 방해 시 type 대신 mask 처리(웹폰트로 dot)로 대체 검토.

## Dev/QA에 전달할 핵심 지침
- form method은 절대 GET으로 바꾸지 말 것 (토글 상태에서 비밀번호가 URL에 노출됨).
- 터치 타깃 최소 44×44px (모바일 a11y).
- design-context.md의 아이콘 컬러 토큰 / hover transition duration을 따를 것.
