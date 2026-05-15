# Design Output — 로그인 페이지에 '비밀번호 찾기' 링크 추가
> 생성일: 2026-05-15
> 참조 브랜드: linear.app

## 디자인 요약
로그인 폼의 비밀번호 입력 필드 우측 상단(또는 제출 버튼 하단)에
'비밀번호 찾기' 텍스트 링크를 추가한다.
Linear 디자인 시스템의 subtle 색상을 사용해 주요 액션(로그인 버튼)보다
시각적 위계를 낮게 유지한다.

## 비주얼 방향
- **텍스트**: `비밀번호를 잊으셨나요?` (PM 후보 중 선택 — 더 자연스러운 한국어)
- **색상**: `#8a8f98` (Linear `ink-subtle`) — 기본 상태
- **호버 색상**: `#d0d6e0` (Linear `ink-muted`)
- **폰트**: 14px / weight 400 / line-height 1.5 (Linear `body-sm`)
- **밑줄**: 없음 (기본), 호버 시 `underline`
- **위치**: 비밀번호 입력 필드 행의 우측 정렬 (`flex justify-between` 또는 `text-right`)

## 컴포넌트 명세

### ForgotPasswordLink
```
<a href="/forgot-password">
  텍스트: "비밀번호를 잊으셨나요?"
  스타일:
    - font-size: 14px
    - font-weight: 400
    - color: #8a8f98  (기본)
    - color: #d0d6e0  (hover)
    - text-decoration: none  (기본)
    - text-decoration: underline  (hover)
    - transition: color 150ms ease
```

### 위치 — 비밀번호 필드 행
```
[비밀번호 레이블]          [비밀번호를 잊으셨나요?]  ← 우측 정렬
[비밀번호 입력 필드                              ]
```
또는 (레이블이 없는 placeholder 방식이면):
```
[비밀번호 입력 필드                              ]
[로그인 버튼                                    ]
[비밀번호를 잊으셨나요?]  ← 버튼 하단, 중앙 정렬
```

## 구조
기존 로그인 폼 마크업에 `<a>` 태그 1개만 추가.
별도 컴포넌트 파일 생성 불필요 (단순 인라인 링크).
레이아웃 변경은 비밀번호 필드를 감싸는 행(wrapper)에
`display: flex; justify-content: space-between; align-items: center` 추가.

## 산출물
- 링크 텍스트: "비밀번호를 잊으셨나요?"
- href: `/forgot-password`
- 색상: `#8a8f98` → hover `#d0d6e0`
- 위치: 비밀번호 필드 우측 상단 (또는 제출 버튼 하단 중앙)
- 기존 로그인 기능 변경 없음
