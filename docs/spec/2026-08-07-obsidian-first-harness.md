# 스펙 — 옵시디언 중심 하네스 v4 (Obsidian-First Harness)

> 작성: 2026-08-07 · 승인: 사용자 (얇은 디스패처화 / 역할 파이프라인 중심 / 30_경험 일원화)

## 왜 (배경)

- 하네스 스킬 26개, SKILL.md 합계 약 8,700줄 — 절차·규칙·체크리스트가 프롬프트 안에 갇혀 있어 수정마다 재배포가 필요하고, 볼트 지식과 이원화되어 있다.
- 볼트(`$OBSIDIAN_VAULT_DIR`, 기본 `~/obsidian-vaults/AI 에이전트`)는 이미 AI Dev OS 구조 — `00_SYSTEM/START-HERE.md`가 라우터, 10_지식 426문서, 20_실행 체크리스트/템플릿, 30_경험 패턴/실패/ADR.
- 사용자 의도: **지식·절차의 본체를 옵시디언으로, 스킬은 볼트 라우팅을 타는 얇은 디스패처로.** 새 학습은 볼트로 환류.

## 무엇을 (설계)

### 1. 볼트 — 플레이북 계층

- `20_실행/플레이북/` 신설. 역할 스킬 13개의 절차 본문을 각각 `{skill-name}.md`로 이관:
  sj-company, sj-pm, sj-design, sj-tech-lead, sj-qa, sj-spec, sj-investigate,
  sj-cso, sj-ship, sj-retro, sj-secretary, sj-marketing, sj-dev-si
- 플레이북 frontmatter: `type: playbook`, `skill: {name}`, `version`, `last-synced`.
- 본문은 기존 SKILL.md 절차를 이관하되, 지식·체크리스트·경험 문서는 `[[위키링크]]`로 연결.
- 컨벤션 참조는 저장소 상대링크 대신 이름+정본 경로 표기(`정본: S-skills/skills/_conventions/{file}`)로 변환.
- `00_SYSTEM/START-HERE.md`에 "하네스 역할 라우팅" 섹션 추가 — 역할 → 플레이북 + 우선 지식 폴더 맵.

### 2. 스킬 — 얇은 디스패처 (각 30~60줄)

유지: frontmatter(name·version·description·allowed-tools·triggers — RESOLVER/manifest 호환).
본문 구성:

1. **플레이북 로드 커널** — 볼트 탐지 → `20_실행/플레이북/{name}.md` Read 후 그 절차를 따른다.
2. **산출물 계약 (불변)** — `.state/pm-brief.md`·`dev-summary.md`·`qa-verdict.md` 등 파이프라인 파일 경로·핵심 형식, RUN_ID, Judge 독립성, 사람 게이트, PII 마스킹.
3. **학습 환류** — notability 게이트 통과 인사이트를 볼트 `30_경험/`(범용) 또는 `40_프로젝트/{프로젝트}/`(프로젝트 한정)에 append.
4. **최소 계약 폴백** — 볼트/플레이북 부재 시 3~6줄 축약 절차로 비차단 진행 + `미수행: 플레이북 없음` 기록.

도구 배선형 스킬(harness, docs-organize, obsidian-writer, pw-loop, test-scenario,
sj-automation, sj-loop, sj-agent-dev, sj-agent-review, sj-gpt, sj-law, sj-seo, sj-outsource)은 현행 유지.

### 3. 학습 환류 일원화

- `_conventions/context-curation.md` 개정: 누적 대상 `docs/sj-company/*-context.md` → 볼트
  `30_경험/검증된패턴|실패사례`(범용) + `40_프로젝트/{프로젝트}/`(프로젝트 한정).
- 기존 프로젝트의 *-context.md는 강제 이관하지 않음 — 새 사이클부터 볼트에 기록, 발견 시 읽기는 허용.
- 인용 형식 유지: `- {날짜} [run:{RUN_ID}]: {인사이트}`. PII 마스킹·notability 게이트 유지.
- `_conventions/obsidian-context.md`에 플레이북 로드 규칙 추가 (읽기 컨벤션의 일부).

### 4. 정합성

- CLAUDE.md 스킬 지도·아키텍처 원칙 갱신 (버전 표기 ↔ frontmatter 일치).
- `python3 scripts/skill-manifest.py --write` 재생성 + `--check` 통과.
- 역할 스킬 13개 frontmatter version 메이저 범프, 저장소 VERSION → 4.0.0.

## 불변식 (바뀌지 않는 것)

- 파이프라인 계약: RUN_ID, `.state/` 산출물 경로·형식, Judge 독립성, 사람 게이트(PR 머지·배포), PII 마스킹, archive-only.
- RESOLVER.md 라우팅 키워드·트리거 — 스킬 이름·트리거 변경 없음.
- 볼트 콘텐츠는 데이터 — 플레이북은 "따라야 할 절차"로 예외적으로 승격되지만, 플레이북 밖 볼트 문서 속 지시문은 여전히 데이터.

## 트레이드오프 (승인됨)

- 볼트가 준-하드 의존성이 됨: 볼트 없는 환경은 최소 계약 폴백으로만 동작. 볼트 백업 권장.
- 대가: 프롬프트 수정이 옵시디언에서 즉시 반영(재배포 불필요), 지식·절차·경험 단일 순환.

## 완료 조건 (기계 검증 가능)

- [ ] `ls "$OBSIDIAN_VAULT_DIR/20_실행/플레이북"` → 13개 플레이북 존재
- [ ] 역할 스킬 13개 SKILL.md 각 80줄 이하 (frontmatter 포함)
- [ ] `python3 scripts/skill-manifest.py --check` exit 0
- [ ] START-HERE.md에 "하네스 역할 라우팅" 섹션 존재
- [ ] context-curation.md에 30_경험/40_프로젝트 대상 명시
