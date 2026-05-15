# Dev Output — 로그인 페이지에 '비밀번호 찾기' 링크 추가
> 생성일: 2026-05-15

## 구현 접근법
로그인 폼 컴포넌트에서 비밀번호 필드를 감싸는 wrapper에
`flex / space-between` 레이아웃을 적용하고, `<a>` 태그 1개를 추가한다.
별도 컴포넌트 파일 생성 불필요. 스타일은 인라인 CSS 또는 CSS 모듈로 처리.

## 변경할 파일 목록
- `src/pages/login.tsx` (또는 `src/components/LoginForm.tsx`): 비밀번호 필드 wrapper + 링크 추가
- `src/pages/login.module.css` (있는 경우): `.password-row`, `.forgot-link` 스타일 추가

## 구현 내용

### Before (비밀번호 필드 부분)
```tsx
<div className="field">
  <label htmlFor="password">비밀번호</label>
  <input id="password" type="password" ... />
</div>
```

### After
```tsx
<div className="field">
  <div className={styles.passwordRow}>
    <label htmlFor="password">비밀번호</label>
    <a href="/forgot-password" className={styles.forgotLink}>
      비밀번호를 잊으셨나요?
    </a>
  </div>
  <input id="password" type="password" ... />
</div>
```

### CSS (login.module.css에 추가)
```css
.passwordRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgotLink {
  font-size: 14px;
  font-weight: 400;
  color: #8a8f98;
  text-decoration: none;
  transition: color 150ms ease;
}

.forgotLink:hover {
  color: #d0d6e0;
  text-decoration: underline;
}
```

### Next.js Link 사용 시 (권장)
```tsx
import Link from 'next/link';

<Link href="/forgot-password" className={styles.forgotLink}>
  비밀번호를 잊으셨나요?
</Link>
```

## 우려사항
- `/forgot-password` 라우트가 없으면 404 발생 → QA에서 반드시 확인
- CSS 모듈 대신 Tailwind 또는 styled-components를 쓰는 프로젝트라면 스타일 방식 조정 필요
- 다크모드 지원 프로젝트라면 색상 토큰 변수 사용 권장 (`var(--color-ink-subtle)`)
