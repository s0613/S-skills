# archive-only 불변식 (영속 파일 보호)

## 규칙

`PROJECT.md`·`*-context.md` 등 **영속 파일을 통째로 재생성(Write로 덮어쓰기)하기 직전에는,
반드시 직전 버전을 `docs/sj-company/archive/`로 보존한 뒤 덮어쓴다.**

**절대 삭제하지 않는다 — archive만 한다.** 컨텍스트는 복구 가능해야 한다.
(Hermes curator의 "never auto-delete, archive only" 불변식과 동일 철학.)

## 적용 범위

- 적용: 통째 재작성, 마이그레이션, 리셋, 큐레이션(consolidate)
- 비적용: 필드 단위 수정(Edit), `## 히스토리` append

## 백업 레시피 (canonical)

```bash
# 영속 파일을 Write로 통째 덮어쓰기 직전 1회 실행
mkdir -p docs/sj-company/archive
_F="docs/sj-company/PROJECT.md"   # 또는 *-context.md
[ -f "$_F" ] && cp "$_F" "docs/sj-company/archive/$(basename "$_F").$(date +%Y%m%d-%H%M%S).bak"
```

## 관련 규칙

- context.md 큐레이션(200줄 임계 초과 시 통합)도 이 불변식을 먼저 적용한 뒤 수행한다 — sj-company SKILL.md "context.md 큐레이션 트리거" 참조.
