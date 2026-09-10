# 보고서 다이어그램 (Report Diagram)

**규칙: 사용자가 읽는 보고서에 그림이 필요하면 [diagram-design](https://github.com/cathrynlavery/diagram-design) 스킬로 그린다. 즉석 mermaid·ASCII 아트로 때우지 않는다.**

> 출처: [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (Cathryn Lavery, MIT).
> 40종 에디토리얼 다이어그램 타입을 자립형 HTML + 인라인 SVG로 생성한다.
> 설치는 [external-tools.md](external-tools.md) 표 참조.

## 왜

보고서는 사람이 **이해**하려고 읽는다([literate-report.md](literate-report.md)).
구조·흐름·의존은 문장보다 그림이 빠른데, 지금까지 하네스가 그림을 낼 수단은
즉석 mermaid뿐이었다 — 렌더러마다 다르게 깨지고, 노드가 늘수록 읽을 수 없어지고,
어느 프로젝트에서 뽑아도 똑같이 생겼다. 그림이 보고서 품질을 **떨어뜨리는** 상태였다.

diagram-design은 타입별 레이아웃 문법과 편집 규칙(강조색은 1~2개 노드에만, 목표 밀도 4/10,
"지울 게 없을 때 끝난다")을 갖고 있다. 그림이 필요할 때 쓸 도구가 생겼으므로, 이제
**그림을 넣을지 말지**만 판단하면 된다.

## 언제 그리는가

그림이 **문장을 대체할 때만** 그린다. 장식용 그림은 읽는 부담만 늘린다.

| 그린다 | 그리지 않는다 |
|---|---|
| 3개 이상 컴포넌트가 서로 호출하는 구조 | 파일 2개 고친 변경 |
| 분기·상태 전이가 있는 흐름 | 순서대로 읽으면 끝나는 절차 |
| 시간축·단계가 있는 계획(로드맵·WBS) | 항목 5개짜리 목록 |
| 역할×권한, 원인×결과 같은 2차원 관계 | 이미 표로 충분한 것 |

보고서 하나에 **그림 1~2개**가 상한이다. 그 이상 필요하면 보고서가 두 개다.

## 산출 계약

1. **원본**: 대상 저장소 `docs/diagrams/{slug}.html` (자립형 HTML — 빌드·CDN 의존 없음).
2. **보고서 임베드**: 볼트 보고서에는 SVG로 내보내 `![[{slug}.svg]]`로 임베드하고,
   바로 아래 줄에 원본 HTML 경로를 링크한다. 옵시디언은 HTML을 미리보기하지 않는다.
3. **PR 본문·GitHub 마크다운**: SVG 대신 PNG. GitHub은 마크다운 안의 SVG를 렌더하지 않는다.
4. [정직 산출 계약](honest-report.md): 만들었다고 쓰기 전에 파일 존재를 확인한다.

## 비대화형·비차단

- diagram-design이 없으면 **그림 없이 보고서를 완성**하고 `미수행: diagram-design 미설치`
  한 줄과 설치 명령을 남긴다. 그림 때문에 보고가 막히지 않는다.
- diagram-design은 프로젝트 첫 실행에서 브랜드 토큰을 묻는 스타일 게이트가 있다.
  사용자 없는 실행에서는 기본 토큰으로 진행하고 `## 가정`에 기록한다([noninteractive.md](noninteractive.md)).

## 적용 지점

| 스킬 | 기본 타입 |
|------|----------|
| sj-tech-lead (완료 보고) | architecture · dependency graph · sequence |
| sj-investigate (조사 결과) | fishbone (원인→결과) · sequence (재현 경로) |
| sj-cso (보안 감사) | data flow · DP security matrix (역할×권한) |
| sj-retro (주간 회고) | bar · line (지표 추이) |
| sj-qa (판정) | 기본은 그림 없음 — 판정은 문장이다. 의심 지점이 여러 기능에 걸칠 때만 dependency graph |
| sj-ship (PR 본문) | 구조가 바뀐 변경에 한해 architecture (PNG) |
| sj-dev-si (SI 문서) | high-level · process · swimlane · Gantt (WBS) · ER |
| docs-organize (`docs/architecture.md`) | architecture · layer stack |

**제외:** `docs/FEATURE-MAP.md`의 mermaid — 표가 정본이고 mermaid는 기계 파생물이라
사람이 읽는 보고서가 아니다([feature-map.md](feature-map.md)). 그대로 둔다.
