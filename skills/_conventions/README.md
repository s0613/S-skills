# _conventions — 횡단 규칙 단일 정의

S-skills의 모든 스킬에 적용되는 공통 규칙. **규칙 본문은 여기에만 존재한다.**
각 스킬은 한 줄 참조와 실행에 필요한 최소 커널(정규식·한 문장)만 인라인으로 갖는다.

> gbrain의 `skills/_brain-filing-rules.md` 패턴 차용 — 규칙이 N개 스킬에 흩어지면
> 수정할 때 하나는 반드시 빠뜨린다. 단일 정의 + 참조가 구조적 해법이다.

## 규칙 목록

| 규칙 | 한 줄 요약 | 주 적용 스킬 |
|------|-----------|--------------|
| [human-gate.md](human-gate.md) | PR 머지·프로덕션 배포는 항상 사람이 승인한다 | sj-ship, sj-loop, 모든 자동화 |
| [pii-masking.md](pii-masking.md) | 영속 파일 append 전 민감 정보를 `[REDACTED]` 치환 | sj-pm, sj-tech-lead, sj-qa, sj-design, sj-outsource |
| [archive-only.md](archive-only.md) | 영속 파일은 삭제 금지 — 백업 후에만 통째 덮어쓰기 | sj-company, 영속 파일을 쓰는 모든 스킬 |
| [judge-independence.md](judge-independence.md) | 검증자는 구현자의 자기 평가를 읽지 않는다 | sj-qa |
| [run-id.md](run-id.md) | 파이프라인 실행 식별자 생성·전파 계약 | sj-company, sj-tech-lead |
| [friction-log.md](friction-log.md) | 스킬 실행 중 마찰·기쁨을 한 줄 기록 → sj-retro가 주간 소비 | 모든 스킬 (기록), sj-retro (소비) |

## 스킬에서 참조하는 방법

규칙이 적용되는 지점에 한 줄 참조를 둔다:

```markdown
> **컨벤션:** [PII 마스킹](../_conventions/pii-masking.md) — append 전 민감 패턴을 `[REDACTED]`로 치환.
```

- 경로는 각 스킬의 베이스 디렉토리 기준 `../_conventions/{파일}.md`.
- 실행에 필요한 커널(정규식, 한 문장 규칙)은 참조 줄에 인라인 복사를 허용한다 —
  런타임에 파일을 못 읽어도 규칙이 작동해야 하기 때문.
- **커널을 변경할 때는 이 디렉토리의 규칙 파일을 먼저 고치고**, 아래 명령으로
  인라인 사본을 전부 찾아 동기화한다:

```bash
# 예: PII 정규식 변경 시 인라인 사본 위치 확인
grep -rn "REDACTED" skills/*/SKILL.md agents/*.md
```

## 새 규칙 추가 기준

- 2개 이상 스킬이 같은 규칙을 지켜야 할 때만 추가한다 (단일 스킬 규칙은 그 SKILL.md에).
- 규칙 파일은 현재 상태만 기술한다 — 변경 이력은 CHANGELOG.md와 git에.
