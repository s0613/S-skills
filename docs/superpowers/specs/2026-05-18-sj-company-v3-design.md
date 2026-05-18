# sj-company v3 설계 스펙

**작성일:** 2026-05-18  
**배경:** 하루 2~6개 프로젝트를 전환하며 웹 개발(외주 + 내부)을 진행하는 상황에서, 기존 PM→Design→TechLead→QA 4단계 고정 사이클이 과정 중심이고 실질 가치가 없다는 문제 인식.  
**목표:** 프로젝트 전환 시 컨텍스트 복귀를 0초로 줄이고, 태스크 크기에 맞는 워크플로우 깊이를 자동 결정하며, pw-loop로 실제 검증.

---

## 1. 핵심 개념

### PROJECT.md — 프로젝트 두뇌

각 프로젝트의 `docs/sj-company/PROJECT.md` 하나가 전체 상태를 담는다.  
기존의 stage.txt, task.txt, pm-output.md, design-output.md, dev-output.md, qa-output.md, report.md 파일들을 대체한다.

**형식:**
```markdown
# {프로젝트명}
goal: {현재 스프린트/목표 한 줄}
stack: {주요 기술스택}
last_session: {YYYY-MM-DD} — {마지막 세션에서 완료한 것}
next: {다음에 할 것}
blockers: {없음 | 구체적 블로커}
pw_target: {pw-loop 목표 통과율, 기본 80%}
status: {active | done | blocked}
```

매 사이클 완료 시 자동 업데이트. 사람이 직접 편집해도 된다.

---

## 2. 태스크 크기 분류

`/sj-company <태스크>` 호출 시 태스크 텍스트와 파일 변경 범위를 분석해 크기를 자동 판정한다.

| 크기 | 판정 기준 | 워크플로우 |
|------|-----------|-----------|
| **Tiny** | 텍스트/스타일/설정값 변경, 파일 1개, 30줄 이하 예상 | 즉시 구현 → 빌드 확인 |
| **Small** | 단일 컴포넌트 또는 API 엔드포인트 1개, 파일 1~3개 | 계획 2줄 → 구현 → 선택적 pw-loop |
| **Medium** | 기능 단위 (화면 1개, 플로우 1개), 파일 3~10개 | PM 브리핑 → 구현 → pw-loop |
| **Large** | 새 섹션/모듈, 큰 리팩토링, 파일 10개 이상 | PM + 구현 계획 → 구현 → pw-loop |

판정 결과를 사용자에게 한 줄로 보여주고 진행. 이의 있으면 크기 조정 가능.

---

## 3. 워크플로우 상세

### `/sj-company` (인자 없음) — 세션 시작 브리핑

PROJECT.md를 읽어 현재 상태를 즉시 출력한다.

```
[{프로젝트명} 브리핑]
목표: {goal}
지난 세션: {last_session}
다음: {next}
블로커: {blockers}

바로 시작할까요? 아니면 다른 태스크?
```

PROJECT.md가 없으면 신규 프로젝트로 간주, goal/stack/pw_target 입력 받아 생성.

---

### `/sj-company <태스크>` — 태스크 실행

**Tiny / Small:**
```
[Tiny] 텍스트 수정으로 판정. 바로 구현합니다.
→ 구현
→ 빌드 확인 (npm run build 또는 프로젝트 빌드 명령)
→ PROJECT.md 업데이트
```

**Medium:**
```
[Medium] 기능 단위로 판정.
PM: {요건 2~3줄, 엣지케이스}
→ 구현
→ /pw-loop 실행 (목표: {pw_target})
→ PROJECT.md 업데이트
```

**Large:**
```
[Large] 큰 작업으로 판정.
PM: {요건, 범위, 리스크}
구현 계획: {단계별 체크리스트}
→ 구현
→ /pw-loop 실행 (목표: {pw_target})
→ PROJECT.md 업데이트
```

---

### `/sj-secretary` — 아침 브리핑 (포트폴리오 뷰)

모든 프로젝트의 PROJECT.md를 읽어 우선순위로 정렬 출력.

```
[아침 브리핑] 2026-05-18 · 프로젝트 5개

[긴급] upflow-ax — pw-loop CONDITIONAL 미해결, next: ReqGrid undo 수정
[진행] totaro-web — streaming input 검증 남음
[진행] totaro-cos — AI 상담 플로우 시작 필요
[대기] s-skills — 완료, 다음 태스크 없음
[완료] songse-s-skills — 중복, 정리 필요

오늘 어디서 시작할까요?
```

우선순위 기준: blocked > conditional(미해결) > active(next 있음) > active(next 없음) > done

---

## 4. 제거하는 것

| 제거 항목 | 이유 |
|-----------|------|
| Design 단계 | PM이 충분히 커버. 웹개발에서 별도 단계 불필요 |
| report.md | PROJECT.md가 대체 |
| stage.txt, task.txt | PROJECT.md로 통합 |
| pm-output.md, design-output.md, dev-output.md, qa-output.md | 분산 파일 제거, PROJECT.md에 통합 |
| Tech Lead 6개 서브에이전트 기본 병렬 실행 | Large 태스크에서만, 필요한 역할만 선택 실행 |
| Secretary의 WBS 에코 | 아침 브리핑으로 완전 대체 |

---

## 5. 유지하는 것

| 유지 항목 | 이유 |
|-----------|------|
| PM 역할 | 요건 명확화는 여전히 필요 (Medium/Large) |
| Tech Lead 역할 | 구현 조율 |
| pw-loop 연동 | 실제 검증 수단 |
| 중앙 인덱스 (`~/.sj-company/projects.json`) | 멀티 프로젝트 관리 |

---

## 6. PROJECT.md 업데이트 타이밍

| 이벤트 | 업데이트 내용 |
|--------|--------------|
| 세션 시작 | last_session 확인 |
| 태스크 완료 | last_session, next, status 갱신 |
| 블로커 발생 | blockers, status=blocked 갱신 |
| pw-loop 완료 | pw_target 대비 결과 기록 |

---

## 7. 마이그레이션

기존 `docs/sj-company/` 파일들(pm-output.md 등)이 있는 프로젝트는:
1. 첫 `/sj-company` 호출 시 기존 파일들을 읽어 PROJECT.md 자동 생성
2. 기존 파일들은 `docs/sj-company/archive/`로 이동
3. 사용자에게 마이그레이션 완료 알림

---

## 8. 성공 기준

- 프로젝트 전환 후 현재 상태 파악: 5초 이내
- Tiny/Small 태스크에 PM 단계 없음
- pw-loop 미지원 프로젝트에서도 빌드 확인으로 최소 검증
- 아침 브리핑 한 화면에 전 프로젝트 현황 표시
