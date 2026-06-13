# Loop: SKILL.md 정합성 검사 (manifest)
> 생성: 2026-06-11 | 확장: 2026-06-13 (manifest 검사) | 프로젝트: S-skills | slug: validate-skill-frontmatter

## 목적
skills/ 의 모든 SKILL.md가 유효한 frontmatter를 갖고, manifest·RESOLVER·CLAUDE.md가 서로 정합하도록 검사하고 drift를 고친다. (gbrain manifest 패턴 — 산문이 아니라 가드가 drift를 막는다.)

## 이번 반복에서 할 일
1. `docs/sj-company/loops/validate-skill-frontmatter-state.md`를 읽어 지난 반복 상태를 파악한다 (없으면 첫 반복)
2. 정합성 검사를 실행해 drift 목록을 얻는다:
   ```bash
   python3 scripts/skill-manifest.py --check
   ```
   검출 항목: `frontmatter`(필드 누락), `name-mismatch`(name≠디렉토리), `resolver-dispatch`(RESOLVER가 실존하지 않는 스킬 호출), `version-drift`(CLAUDE.md 버전 표기≠frontmatter), `manifest-stale`(manifest.json 낡음).
3. drift를 **한 반복에 최대 3건까지** 고친다:
   - `manifest-stale` → `python3 scripts/skill-manifest.py --write` 로 재생성
   - `version-drift` → CLAUDE.md 버전 표기를 frontmatter version에 맞춘다 (frontmatter가 진실의 원천)
   - `frontmatter` 누락 → `name:`은 폴더명과 동일하게, `description:`은 본문 첫 단락 요약으로 채운다
   - `name-mismatch` → frontmatter `name`을 디렉토리명에 맞춘다
   - `resolver-dispatch` → RESOLVER의 `Skill("s-skills:X")`를 실존 스킬명으로 고친다 (트리거 별칭을 스킬명으로 호출하는 버그)
4. 결과를 상태 파일에 기록한다: `## 시도` / `## 통과` / `## 미해결` 섹션에 append
5. 스스로 판단할 수 없는 항목(예: 어느 스킬로 디스패치해야 할지 모호한 resolver-dispatch)은 `docs/sj-company/triage-inbox.md`에 `- [ ] {날짜} [validate-skill-frontmatter] {항목}` 형식으로 append한다
6. 아래 정지 조건을 **실제로 실행**해 전부 참이면 상태 파일 상단의 `status:` 줄을 `status: DONE`으로 바꾸고 종료 보고한다 (정지 신호는 출력 문장이 아니라 상태 파일의 이 줄이다)

## 정지 조건 (기계 검증 가능)
- `python3 scripts/skill-manifest.py --check` 종료 코드 0 (drift 0건)

## 가드레일
- git push·PR 머지·프로덕션 배포 금지 (사람 게이트 — 머지 준비가 되면 triage-inbox에 기록하고 멈춘다)
- 한 반복에서 수정 파일 3건 초과 금지
- 같은 실패가 2회 반복되면 시도를 멈추고 triage-inbox에 기록한다
- frontmatter·manifest·RESOLVER·CLAUDE.md 버전 표기 외의 본문은 수정하지 않는다
- PROJECT.md·*-context.md를 통째로 재작성하지 않는다 (archive-only 불변식)
- manifest.json은 손으로 편집하지 않는다 — 항상 `--write`로 생성 (derived artifact)
