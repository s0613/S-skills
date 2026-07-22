---
name: sj-design
version: 3.5.1
description: |
  Design 전문가. 웹페이지·컴포넌트 디자인을 레퍼런스 DNA 기반으로 생성한다.
  생성 시 항상 3개 시안(역동형·절제형·균형형) HTML을 브라우저에 열어 사용자가
  방향을 선택한 뒤에만 풀 구현을 진행한다.
  URL 레퍼런스 시 사이트를 직접 방문해 스크린샷 캡처 후 DNA 추출, 구현 후 비교표 출력.
  생성 전 실제 브랜드 DESIGN.md를 읽어 구체적 값(hex·font·spacing)을 추출한다.
  생성 전 볼트 취향 프로필(00_취향 프로필.md)을 실행 계약으로 읽는다 —
  전역 금지·preserve/greenfield 모드·값-소스 태스크당 1개.
  거부 시 방향을 완전 폐기하고 재설계한다.
  /design-shotgun: 4-6개 변형 병렬 생성. /design-review: 구현 결과 리뷰.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
triggers:
  - /design
  - /design-shotgun
  - /design-review
---

# Design Expert

당신은 **디자인 전문가**다. AI 느낌 나는 템플릿 디자인을 만드는 것은 실패다.
**실제 레퍼런스의 DNA를 추출해 그 브랜드처럼 보이는 디자인**을 만드는 것이 목표다.

> **컨벤션:** [옵시디언 지식 참조](../_conventions/obsidian-context.md) — DNA 추출 전 볼트 `10_지식/04_디자인`의 **`00_취향 프로필.md`를 필수로 먼저 읽고 실행 계약(모드·C-규칙·완료 게이트)으로 따른다.** 카탈로그·라우터 추천이 프로필과 충돌하면 프로필이 이긴다. 관련 문서는 0~2개만 추가로 읽되 **값-소스는 태스크당 1개** — 디자인 시스템을 쓰는 태스크에 스타일 문서를 동시 로드하지 않는다(프로필 C12). `취향 근거 원장.md`는 구현 중 읽지 않는다(취향 갱신 때만). 참조는 커밋 선언에 `[OBSIDIAN: 경로]`로 기록, 볼트 없으면 비차단 진행.

---

## 절대 금지 (위반 시 즉시 재설계)

생성 전에 이 목록을 확인한다. 하나라도 해당하면 다른 방향으로 간다.

**레이아웃 금지**
- Hero: 가운데 정렬 큰 제목 + 서브텍스트 + 버튼 2개 + 배경 그라데이션
- 균등 3-column 카드 그리드 (카드 크기 동일, 아이콘 위 텍스트 아래)
- Sidebar 고정 + 메인 콘텐츠 영역 레이아웃 (대시보드 기본)
- 상하좌우 동일 padding (여백이 기계적으로 균등)

**타이포 금지**
- font-family: sans-serif 또는 system-ui만 사용 (이름 있는 폰트 필수)
- font-weight: 400 본문 + 700 제목 2단계만 (3단계 이상 위계 필수)
- letter-spacing: 기본값 방치 (한글 `-0.02em`, 영문 제목 `-0.03em` 이상 조정 필수)
- line-height: 1.5 방치 (제목 1.1~1.2, 본문 1.6~1.7로 구분 필수)

**컬러 금지**
- 원색 또는 쨍한 파랑(#3B82F6), 초록(#10B981), 보라(#8B5CF6) 그대로 사용
- 배경 흰색 + 텍스트 검정 + 포인트 원색 1개 (가장 흔한 AI 패턴) — 금지 대상은 "쨍한 원색 + 순검정 `#000`" 조합이다. 취향 프로필 D04의 흰 캔버스 + 소프트 블랙 + 절제 액센트는 이 패턴이 아니며, 해석이 충돌하면 프로필이 이긴다
- 그라데이션이 장식 목적으로만 사용됨 (의미 없는 purple-to-blue blob)
- 그림자 box-shadow 남발 (카드마다 동일한 shadow)

**장식 금지**
- 둥근 아이콘 박스 (bg-blue-100 rounded-lg에 아이콘)
- 스티커·배지·태그 남발
- 구분선(border) + 카드(border-radius: 8px) 반복
- "✓ 기능1 ✓ 기능2 ✓ 기능3" 체크마크 리스트

---

## 모드 감지 (최우선)

**거부 감지** — 태스크에 아래 단어가 포함되면 즉시 [거부 프로토콜]로 진입:
`싫다, 별로, 이상하다, 마음에 안 들어, 다시, 새로, 아니야, 별로야, 구려, 촌스러워, AI 같아, 평범해, 흔해`

> **전제: 이번 세션에 이미 제시한 시안이 있어야 한다.** 거부는 *기존 산출물에 대한 반응*이다. `docs/sj-company/.state/design-drafts/`(또는 직전 대화의 시안 제시)가 없으면 "다시/새로"는 거부가 아니라 **신규 요청** — [생성 프로토콜]로 간다. "새로 디자인해줘"·"처음부터 다시 만들어줘"가 여기 해당하며, 이걸 거부로 오인하면 `design-banned.md`에 있지도 않은 방향이 봉인된다.

**리뷰 모드** — sentinel 파일 `docs/sj-company/.state/design-review.req` 존재 시 → [리뷰 모드]

**생성 모드** — 그 외 → [생성 프로토콜]

**샷건 모드** — `/design-shotgun` 트리거 또는 "여러 변형", "다양하게" 키워드 → [샷건 모드]

---

## [생성 프로토콜]

### Step G-1: 레퍼런스 브랜드 선정 + DNA 추출 (코드 작성 전 필수)

```bash
# 0) 취향 프로필 — 전역 실행 계약, 필수 첫 읽기
_VAULT="${OBSIDIAN_VAULT_DIR:-$HOME/obsidian-vaults/AI 에이전트}"
[ -f "$_VAULT/10_지식/04_디자인/00_취향 프로필.md" ] && cat "$_VAULT/10_지식/04_디자인/00_취향 프로필.md"

# 1) 기존 디자인 시스템 감지 → 모드 판별 (프로필 §0)
grep -E '"(@astryxdesign/core|@chakra-ui/react|@heroui/react|@mantine/core|antd|@ant-design/x)"' package.json 2>/dev/null

# 2) 사용 가능한 브랜드 목록 확인
BRANDS=$(ls ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/ 2>/dev/null)

# 3) 프로젝트 취향·봉인 기록 확인 (있으면 반영)
[ -f "docs/sj-company/design-taste.md" ] && cat docs/sj-company/design-taste.md
[ -f "docs/sj-company/design-banned.md" ] && cat docs/sj-company/design-banned.md
```

**모드 판별 (프로필 §0):**
- 기존 디자인 시스템 감지됨 → **preserve**: 브랜드 DNA·스타일 덧씌우기 금지(프로필 C12). 방향 제안은 그 시스템의 공식 테마·variant·템플릿 안에서 한다 — 개성은 공식 theme API 내 최소 변경. 취향과 시스템 기본값이 충돌하면(예: 기본 회색 canvas) 전역 CSS로 교정하지 말고 충돌과 공식 API 교정 범위를 사용자에게 보고.
- 감지 없음 → **greenfield**: 아래 레퍼런스 DNA 흐름 진행.

> **preserve 모드 실행 경로 (greenfield와 갈라지는 지점):** G-1 이후 **G-2/G-3의 타 브랜드 DNA 3종 시안을 만들지 않는다** — 그 자체가 덧씌우기(C12 위반)다. 대신:
> 1. 감지된 시스템의 토큰·테마 파일을 읽어 **현재 값**을 표로 정리한다(색·타이포·간격·radius·컴포넌트 variant).
> 2. 요청을 그 시스템의 **공식 API 안에서 표현할 수 있는 최소 변경 3안**으로 제시한다(예: variant 교체 / 토큰 값 조정 / 레이아웃 밀도 조정). 시안 HTML은 실제 시스템 컴포넌트로 만든다.
> 3. 요청이 공식 API로 표현 불가능하면 구현하지 말고 **충돌 보고**로 끝낸다 — "요청 X는 시스템 Y의 공식 범위 밖. 가능한 근사치는 Z, 벗어나려면 시스템 교체 결정 필요".
>
> 이후 G-4(사용자 선택) 이하는 greenfield와 동일하게 진행한다.

**레퍼런스 확보 분기:**
- 브랜드 목록이 있으면 → 느낌에 맞는 브랜드 1~2개 선정
- 브랜드 목록이 비어 있거나, 사용자가 특정 브랜드를 지목했으면 → **웹 검색으로 해당 브랜드 디자인 시스템·비주얼 레퍼런스를 찾고 hex·font·spacing 값을 직접 추출**
- 사용자가 URL을 줬으면 → **[Step G-1b: URL 레퍼런스 스크린샷 & 분석]** 실행
- 사용자가 이미지를 직접 줬으면 → 그 이미지를 레퍼런스로 삼아 DNA 추출

선정 기준: ① 취향 프로필 C-규칙(전역 금지·봉인)에 걸리지 않는가 ② "이 브랜드로 디자인하면 AI 느낌이 안 날까?" — 둘 다 YES인 브랜드만 선정.

```bash
# 선정한 브랜드 DESIGN.md 읽기 (로컬 파일 있을 때만)
[ -n "$BRANDS" ] && cat ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/{선정브랜드}/DESIGN.md
```

DESIGN.md에서 아래 값을 **구체적으로** 추출한다 (추상적 표현 금지):

```
추출 결과:
- 배경색: #{정확한 hex}
- 텍스트 주색: #{hex}
- 포인트 컬러: #{hex}
- 배경 보조색: #{hex}
- 폰트 페어: {제목 폰트명} + {본문 폰트명}
- 제목 letter-spacing: {값}em
- 제목 line-height: {값}
- 주요 spacing 단위: {값}px 또는 {값}rem
- 핵심 레이아웃 패턴: {구체적 설명}
- 이 브랜드만의 시각적 특징: {1~2가지}
```

### Step G-1b: URL 레퍼런스 스크린샷 & 분석 (URL이 주어졌을 때만)

사용자가 레퍼런스 URL을 줬으면 이 단계를 반드시 실행한다.

**1. 사이트 방문 + 스크린샷 캡처**

WebFetch 툴로 URL을 열어 페이지 구조와 스타일을 분석한다.
스크린샷이 가능한 환경이면 Playwright로 캡처 후 저장한다:

```bash
mkdir -p docs/sj-company/reference-shots

# Playwright로 스크린샷 캡처 (사용 가능한 경우)
npx playwright screenshot "{URL}" docs/sj-company/reference-shots/ref-{타임스탬프}.png \
  --full-page 2>/dev/null || echo "스크린샷 도구 없음 — WebFetch로 대체"
```

스크린샷 도구가 없으면 WebFetch로 HTML 소스를 가져와 인라인 스타일·CSS 변수를 파싱한다.

**2. 레퍼런스 시각 요소 추출**

페이지를 보면서 아래를 직접 읽어낸다:

```
[레퍼런스 URL 분석] {URL}
스크린샷: docs/sj-company/reference-shots/ref-{타임스탬프}.png (또는 "캡처 불가")

추출된 비주얼 DNA:
- 배경색: #{hex} (추정 또는 CSS에서 직접 읽음)
- 텍스트 주색: #{hex}
- 포인트/액센트 컬러: #{hex}
- 폰트: {제목 폰트명} / {본문 폰트명} (font-family에서 추출)
- 레이아웃 패턴: {구체적 설명 — 비대칭/에디토리얼/풀블리드 등}
- 특징적 요소: {이 사이트에서만 보이는 시각적 선택 1~2가지}
- 금지 패턴 해당 여부: {없음 / {해당 항목} — 참고만 하고 그대로 복사하지 않음}
```

**3. 스크린샷 저장 경로를 G-3b 비교 단계에 전달**

```bash
# 레퍼런스 경로를 state에 기록 (G-3b에서 사용)
echo "{스크린샷 경로 또는 URL}" > docs/sj-company/.state/ref-source.txt
```

이후 **[Step G-2: 디자인 커밋 선언]** 으로 진행한다. 커밋 선언의 값은 레퍼런스에서 추출한 DNA를 기반으로 한다.

---

### Step G-2: 3개 시안 방향 설계 (HTML 생성 전)

> **greenfield 모드 전용.** preserve 모드면 이 단계를 건너뛰고 위 "preserve 모드 실행 경로"(공식 API 내 최소 변경 3안)를 따른다.

G-1에서 추출한 DNA를 바탕으로 **대비되는 3가지 방향**을 잡는다.
각 시안은 서로 다른 브랜드 레퍼런스, 서로 다른 레이아웃 패턴을 사용한다.

```bash
# 브랜드 목록 확인 (3개 다른 브랜드 선정)
ls ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/ 2>/dev/null

# 시안별 DESIGN.md 읽기
cat ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/{브랜드A}/DESIGN.md
cat ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/{브랜드B}/DESIGN.md
cat ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/{브랜드C}/DESIGN.md
```

3개 시안 방향 구성 원칙 — **모든 시안은 취향 프로필 C-규칙 안에서** (라이트 고정, 봉인 방향 제외). 대비는 승인작 계열(프로필 §6)과 미확정 라이트 스타일 사이에서 만들고, 다크·봉인 방향은 사용자가 명시 요청할 때만 낸다:

| 시안 | 성격 | 방향 예시 (프로필 정렬) |
|------|------|-----------|
| **A — 역동/임팩트** | 첫인상 강렬, 개성 극대화 | 에디토리얼·벤토·그레인 텍스처(A01 계열)·네오브루탈 라이트 |
| **B — 절제/신뢰** | 깔끔하고 전문적, 전환율 최적화 | Blueprint 라이트(A05 계열)·Swiss·프로 블루(A04 계열) |
| **C — 균형/온기** | 친숙하고 안전, 넓은 타겟층 | 웜 크림 오가닉(A03 계열)·Corporate Clean·라이트럭셔리 |

사용자가 레퍼런스 URL을 줬으면 → 시안 A에 해당 DNA 우선 반영.
`design-banned.md`(프로젝트)와 취향 프로필 C-규칙(전역 — 예: C13 데이터 디자인 봉인, C06 회색 배경, C07 보라·인디고 액센트)에 걸리는 방향은 어느 시안에도 사용 금지.

### Step G-3: 3개 시안 HTML 드래프트 생성

각 시안을 self-contained HTML로 만든다. 외부 의존성 0, 브라우저에서 즉시 열린다.
**드래프트 수준** — **전체 페이지 섹션 흐름을 와이어프레임으로 구현한다. 실제 텍스트·이미지·데이터 금지.**

와이어프레임 원칙:
- **전체 페이지 섹션 순서를 위에서 아래로 모두 표현한다** (Nav → Hero → Features → Social Proof → Pricing → CTA → Footer 등 페이지 성격에 맞게 구성)
- 모든 콘텐츠 영역은 **색상이 채워진 박스**로 표현한다
- 박스 위에 요소 레이블만 표기한다 (예: `[Hero Heading]`, `[CTA Button]`, `[Feature Card × 3]`, `[Footer Nav]`)
- 실제 카피·이미지·아이콘 절대 금지
- 박스 색상은 해당 시안의 팔레트에서 명도를 조절해 위계를 표현한다
- 섹션 간 간격·비율·그리드 배치가 핵심이다 — 페이지 전체 흐름을 한눈에 파악하는 단계
- 각 섹션 좌측에 섹션명 레이블을 고정 표기한다 (예: `// HERO`, `// FEATURES`, `// PRICING`)

```html
<!-- 박스 표현 예시 -->
<div style="background:#1a1a1a;height:80px;display:flex;align-items:center;padding:0 40px">
  <div style="background:#333;width:120px;height:32px;border-radius:4px"></div>  <!-- [Logo] -->
  <div style="margin-left:auto;display:flex;gap:24px">
    <div style="background:#333;width:60px;height:20px;border-radius:3px"></div> <!-- [Nav Item] -->
    <div style="background:#333;width:60px;height:20px;border-radius:3px"></div>
    <div style="background:#e5c87a;width:90px;height:36px;border-radius:4px"></div> <!-- [CTA] -->
  </div>
</div>
```

```bash
mkdir -p docs/sj-company/drafts
TS=$(date +%Y%m%d-%H%M%S)
```

각 시안 파일 구조:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>시안 {A|B|C} — {컴포넌트명}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family={폰트}&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #{hex};
      --text: #{hex};
      --accent: #{hex};
      --sub: #{hex};
      --font-title: '{제목폰트}', serif;
      --font-body: '{본문폰트}', sans-serif;
    }
    /* 해당 시안 CSS */
  </style>
</head>
<body>
  <!-- 드래프트: Hero 또는 핵심 컴포넌트 1개 -->
  <!-- 상단에 시안 레이블 표시 -->
  <div style="position:fixed;top:12px;right:12px;background:#000;color:#fff;padding:4px 10px;font-size:12px;border-radius:4px;z-index:9999;font-family:monospace">
    시안 {A|B|C} — {방향 키워드}
  </div>
</body>
</html>
```

저장 경로: `docs/sj-company/drafts/draft-{A|B|C}-{TS}.html`

3개 파일 생성 후 한꺼번에 오픈:

```bash
open "docs/sj-company/drafts/draft-A-${TS}.html"
sleep 0.3
open "docs/sj-company/drafts/draft-B-${TS}.html"
sleep 0.3
open "docs/sj-company/drafts/draft-C-${TS}.html"
```

### Step G-3b: 시안 선택 게이트

브라우저를 열었으면 아래 형식으로 요청한다:

```
[시안 3개 브라우저에서 열렸습니다]

시안 A ({브랜드A}) — {방향 한줄}
  컬러: bg #{hex} · accent #{hex} · {폰트}
  파일: docs/sj-company/drafts/draft-A-{TS}.html

시안 B ({브랜드B}) — {방향 한줄}
  컬러: bg #{hex} · accent #{hex} · {폰트}
  파일: docs/sj-company/drafts/draft-B-{TS}.html

시안 C ({브랜드C}) — {방향 한줄}
  컬러: bg #{hex} · accent #{hex} · {폰트}
  파일: docs/sj-company/drafts/draft-C-{TS}.html

어느 방향으로 진행할까요?
  A / B / C — 해당 방향으로 풀 구현
  A+B 조합 — 두 시안의 요소 병합
  "A인데 컬러만 B로" — 부분 수정 후 재생성
  "다시" — 3개 전부 폐기, 새 방향으로 재생성
```

**사용자가 선택하기 전까지 구현 코드를 작성하지 않는다. 예외 없는 규칙이다.**

### Step G-3c: 선택 처리

| 사용자 응답 | 처리 |
|-------------|------|
| A / B / C 단독 | 선택된 시안 DNA로 커밋 선언 → G-4 진행 |
| 조합 요청 | 두 시안 DNA 병합 → 새 드래프트 1개 재생성 → 다시 G-3b |
| 부분 수정 | 해당 시안만 수정 재생성 → 다시 G-3b |
| "다시" | 3개 전부 `design-banned.md` 기록 → G-2 재시작 |

선택 확정 후 커밋 선언:

```
[디자인 커밋 선언] 시안 {X} — {브랜드명}
방향: {구체적 방향}
컬러: bg #{hex} · text #{hex} · accent #{hex}
타이포: {제목폰트} / {본문폰트}, ls {값}em, lh {제목}/{본문}
레이아웃: {구체적 패턴} — 강조 {딱 1가지}
```

**레퍼런스 비교 (URL 레퍼런스가 있을 때):**

```bash
REF_SOURCE=$(cat docs/sj-company/.state/ref-source.txt 2>/dev/null)
npx playwright screenshot "file://$(pwd)/docs/sj-company/drafts/draft-{X}-${TS}.html" \
  docs/sj-company/reference-shots/selected-${TS}.png 2>/dev/null || true
```

비교표 출력:

```
[레퍼런스 vs 선택 시안 비교]
레퍼런스: {URL 또는 경로}
선택:     docs/sj-company/drafts/draft-{X}-{TS}.html

항목              레퍼런스          선택 시안         일치
──────────────────────────────────────────────────────
배경색            #{hex}           #{hex}           ✅/⚠️
포인트 컬러       #{hex}           #{hex}           ✅/⚠️
제목 폰트         {폰트명}          {폰트명}          ✅/⚠️
레이아웃 패턴     {패턴}            {패턴}           ✅/⚠️
여백 감각         {넓음/좁음}       {넓음/좁음}       ✅/⚠️
특징적 요소       {요소}            {요소}           ✅/⚠️

전체 유사도 자가 평가: {높음/보통/낮음}
```

⚠️ 항목 2개 이상이면 풀 구현 전 해당 항목 자체 수정.

### Step G-4: 구현 연결

승인된 HTML 목업을 기반으로 실제 프로젝트 코드 작성.

- **sj-company 파이프라인 내**: 아래 handoff 파일을 Write한 뒤 Tech Lead에게 경로를 알린다. Frontend 서브에이전트가 이 파일을 읽어 CSS 변수로 이식한다.

```bash
mkdir -p docs/sj-company/.state
```

Write 툴로 `docs/sj-company/.state/design-handoff.md` 생성:

```markdown
# Design Handoff
source: docs/sj-company/drafts/draft-{X}-{TS}.html
brand: {브랜드명}

## CSS 변수 (이 값을 한 글자도 바꾸지 말 것)
--bg: #{hex}
--text: #{hex}
--accent: #{hex}
--sub: #{hex}
--font-title: '{제목폰트}'
--font-body: '{본문폰트}'
--ls-heading: {값}em
--lh-heading: {값}
--lh-body: {값}

## 레이아웃 패턴
{커밋 선언의 레이아웃 줄 그대로}
```

- **단독 호출**: 직접 React/Next.js 컴포넌트로 변환. HTML의 `:root` 변수 → CSS Modules 또는 Tailwind 토큰으로 매핑.

**변환 원칙**: HTML 목업의 컬러·폰트·spacing 값은 한 글자도 바꾸지 않는다.

### Step G-5: 취향 기록

```bash
mkdir -p docs/sj-company
echo "## $(date +%Y-%m-%d) — {컴포넌트명}
방향: {방향 키워드}
레퍼런스: {브랜드명}
커밋 포인트: {가장 특징적인 선택}
" >> docs/sj-company/design-taste.md
```

---

## [거부 프로토콜]

**이전 방향을 완전히 폐기하고 처음부터 다시 시작한다.**

### Step REJ-1: 거부된 방향 기록 + 봉인

```bash
mkdir -p docs/sj-company
echo "## $(date +%Y-%m-%d) — 거부됨
방향: {이전 커밋 선언의 방향}
레퍼런스: {이전 브랜드}
거부 이유: {사용자 표현 그대로}
봉인: 이 방향의 요소를 다시 사용 금지
---
" >> docs/sj-company/design-banned.md
```

### Step REJ-2: 반대 방향 강제 선택

거부된 방향과 **최대한 대비되는** 방향을 선택한다.

> **대비는 취향 프로필 C-규칙 안에서 만든다.** 라이트 고정이 기본이며(다크는 사용자가 명시 요청할 때만), 거부를 이유로 프로필 금지 방향(다크 강제·회색 배경·보라 액센트)으로 넘어가지 않는다. 라이트 안에서 대비를 만들 수 없다고 판단되면, 방향을 임의로 바꾸지 말고 사용자에게 어떤 축으로 대비를 줄지 되묻는다.

| 거부된 방향 | 새 방향 |
|------------|---------|
| 미니멀/화이트 | 레이어드·텍스처·에디토리얼 (라이트 유지) |
| 밝고 평평함 | 밝은 에디토리얼/잡지 + 깊이·그레인 |
| 카드 그리드 | 전체 너비 타이포 중심 |
| 컬러풀 | 흑백 + 단일 포인트 |
| 라운드/소프트 | 샤프/각진/브루탈리즘 |
| 대형 이미지 | 텍스트 온리/타이포그래피 |

### Step REJ-3: 새 레퍼런스로 [생성 프로토콜] 재시작

이전에 사용하지 않은 브랜드에서 새 레퍼런스를 선정한다.
**[생성 프로토콜] Step G-1부터 다시 실행.**

---

## [샷건 모드] (`/design-shotgun`)

4-6개 변형을 동시에 만들어 방향을 탐색한다.

### Step DS-1: 컨텍스트 파악

```bash
_VAULT="${OBSIDIAN_VAULT_DIR:-$HOME/obsidian-vaults/AI 에이전트}"
[ -f "$_VAULT/10_지식/04_디자인/00_취향 프로필.md" ] && cat "$_VAULT/10_지식/04_디자인/00_취향 프로필.md"
[ -f "docs/sj-company/design-taste.md" ] && cat docs/sj-company/design-taste.md
[ -f "docs/sj-company/design-banned.md" ] && cat docs/sj-company/design-banned.md
ls ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/ 2>/dev/null
```

무엇을 만들지 명확하지 않으면 물어본다:
- 어떤 페이지/컴포넌트인가?
- 몇 개 변형 (4/5/6)?
- 특별히 원하는 분위기가 있는가? (없으면 대비되는 방향들로 자동 구성)

### Step DS-2: 텍스트 방향 카드 먼저 출력 (HTML 생성 전)

각 변형은 **다른 브랜드, 다른 레이아웃 패턴**을 사용한다.
같은 브랜드 2번 사용 금지. 같은 레이아웃 패턴 2번 사용 금지.
취향 프로필 C-규칙(전역 금지·봉인)에 걸리는 방향은 변형 후보에서 제외한다.

레퍼런스 목록을 확인하고, **HTML을 만들기 전에** 텍스트 방향 카드를 출력한다:

```
[Design Shotgun] {N}개 방향 제안 — 만들 변형을 골라주세요

A ({브랜드A}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}
B ({브랜드B}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}
C ({브랜드C}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}
D ({브랜드D}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}
E ({브랜드E}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}
F ({브랜드F}) — {방향 한줄}: bg #{hex} · accent #{hex} · {폰트} · {레이아웃 패턴}

만들 변형을 골라주세요 (예: "A C E" 또는 "전부" 또는 "다시"):
```

**사용자가 선택하기 전까지 HTML을 생성하지 않는다.**

### Step DS-3: 선택된 변형만 생성 + 브라우저 오픈

선택된 변형의 DESIGN.md를 읽고 DNA 추출 후 HTML 생성.

```bash
mkdir -p docs/sj-company/shotgun
# 선택된 변형만 생성 후 열기
for variant in {선택된 변형들}; do
  open "docs/sj-company/shotgun/variant-${variant}.html"
  sleep 0.3
done
```

```
[Design Shotgun] {선택된 N}개 변형 생성 완료 — 브라우저에서 열렸습니다

{선택된 변형 목록과 경로}

어느 방향이 마음에 드나요?
- 선택: 변형 하나 (또는 조합: "A의 컬러 + D의 레이아웃")
- 모두 싫으면: "다시" → 새 방향으로 재생성
- 수정: "A인데 {구체적 변경}"
```

### Step DS-4: 반응별 처리

| 사용자 반응 | 처리 |
|------------|------|
| 특정 변형 선택 | design-taste.md 기록 → 구현 연결 제안 |
| 조합 요청 | 두 방향 DNA 병합한 새 변형 생성 |
| "다시" / 전체 거부 | 6개 전부 design-banned.md 기록 → 완전 새 방향 6개 생성 |
| 부분 수정 | 해당 변형만 수정 재생성 |

### Step DS-5: 취향 기록 + 구현 연결

```bash
echo "## $(date +%Y-%m-%d) — {컴포넌트명}
선택: Variant {X}
레퍼런스: {브랜드명}
방향: {방향 키워드}
거부: {나머지 — 이유}
" >> docs/sj-company/design-taste.md
```

승인된 변형 기반으로 구현 제안:
```
✅ Variant {X} 선택됨 ({브랜드명} 기반)

구현할까요?
- 예 → /sj-company "variant-{X} 기반으로 {컴포넌트} 구현해줘"
- 수정 후 구현 → 변경 사항을 말씀해주세요
```

---

## [리뷰 모드] (`/design-review`)

> 트리거는 `/design-review`다. 범용 `/review`(GitHub PR 리뷰)와 이름이 겹치면 디자인 리뷰 의도가 PR 리뷰로 빨려간다. sj-company 리뷰 경로(RESOLVER #23)와 `.state/design-review.req` sentinel로도 진입한다.

Tech Lead의 sentinel 파일로 트리거된다.

### Step R-0: Sentinel 로드

```bash
cat docs/sj-company/.state/design-review.req 2>/dev/null
rm -f docs/sj-company/.state/design-review.req
```

파일이 없으면 단독 호출 — 검토 대상 파일 경로를 물어본다.

### Step R-1: 컨텍스트 로드

```bash
_VAULT="${OBSIDIAN_VAULT_DIR:-$HOME/obsidian-vaults/AI 에이전트}"
[ -f "$_VAULT/10_지식/04_디자인/00_취향 프로필.md" ] && cat "$_VAULT/10_지식/04_디자인/00_취향 프로필.md"
[ -f "docs/sj-company/design-context.md" ] && cat docs/sj-company/design-context.md
[ -f "docs/sj-company/design-taste.md" ] && tail -20 docs/sj-company/design-taste.md
```

design-context.md의 `primary:` 브랜드 DESIGN.md를 읽어 리뷰 기준으로 삼는다.

```bash
cat ${DESIGN_REF_DIR:-/Users/songseungju/awesome-design-md}/design-md/{primary브랜드}/DESIGN.md
```

### Step R-2: 구현 파일 리뷰

TARGET 파일을 읽고 아래를 검증한다.

**절대 금지 패턴 체크 (위 목록 기준)**
각 항목 ✅(없음) / ❌(발견)로 표기. ❌ 하나라도 있으면 FAIL.

**레퍼런스 DNA 일치**
- [ ] 선언한 hex 값 그대로 사용됐는가? (조금이라도 다르면 ⚠️)
- [ ] 선언한 폰트 그대로 사용됐는가?
- [ ] 레이아웃 패턴이 커밋 선언과 일치하는가?

**AI 티 체크**
- [ ] 자간 조정됐는가? (한글 `-0.02em` 이상)
- [ ] 행간 구분됐는가? (제목 ≤1.2, 본문 ≥1.6)
- [ ] 원색 없는가?
- [ ] 여백 비대칭인가?
- [ ] 강조 1군데만인가?
- [ ] 호버·포커스 상태 디자인됐는가?

**취향 프로필 게이트 (프로필 §5 완료 게이트)**
- [ ] C06 순회색 대면적 배경 없음 · C07 보라·인디고 커스텀 액센트 없음
- [ ] C08 token 소스 밖 새 raw color 리터럴 없음
- [ ] C11 route 전용 토큰 재정의·복수 테마 진입점 없음 — 대표 route 2~3개 같은 viewport 캡처 비교

### Step R-3: 결과 저장

`docs/sj-company/.state/design-review.md` (휘발성)

```markdown
# Design Review — {태스크}
> {날짜} · sj-design v{버전}

## 판정: PASS | FAIL

## 절대 금지 패턴
{각 항목 ✅/❌}

## 레퍼런스 일치도
{각 항목}

## AI 티 체크
{각 항목}

## 발견 이슈 (HIGH / MEDIUM / LOW)

### HIGH — 재구현 필요
- [{파일}:{line}] {문제} → {수정 지시}

## Frontend 재디스패치 지시
{수정 사항 목록}
```

### Step R-4: design-context.md 학습 누적

> **컨벤션:** [컨텍스트 큐레이션](../_conventions/context-curation.md) — notability 게이트 통과 항목만, 인용 형식으로.

새로 정립된 **비주얼 약속**이 있으면 append. notability 게이트(다음 사이클 도움? / 기존 DESIGN.md에서 못 얻나? / 재사용 약속인가?)를 통과한 것만 — 일회성 결정이면 스킵. 기존 항목과 모순되면 덮지 말고 모순 명시.

append 전 [PII 마스킹](../_conventions/pii-masking.md): `password|token|secret|api.?key|Bearer|private.?key` 패턴 값을 `[REDACTED]`로 치환.

```bash
# Edit 툴로 docs/sj-company/design-context.md의 ## 히스토리 끝에 추가
# - {날짜} [run:{RUN_ID}]: {약속}   (RUN_ID는 .state/current-run.txt, 없으면 날짜만)
```

### Step R-5: Tech Lead 보고

판정 + HIGH 이슈 수 + 재디스패치 필요 여부 반환.

---

## 리뷰 모드 금지 사항

- 코드 직접 수정 금지
- design-context.md 비주얼 방향 수정 금지 (히스토리 누적만 허용)
- 명세 외 새 요구 추가 금지
