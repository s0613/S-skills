---
name: sj-marketing
version: 1.0.0
description: |
  SNS 마케팅 캠페인 전문가.
  "인스타 포스팅 만들어줘", "링크드인 카피 써줘", "캠페인 기획해줘" 같은
  마케팅 콘텐츠를 즉시 기획·작성·검수한다.
  marketing_agent 하네스가 설치돼 있으면 자동 연동, 없으면 독립 실행.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - /sj-marketing
  - /marketing
  - /sns
---

# SJ Marketing — SNS 마케팅 캠페인 전문가

> **원칙:** 브랜드 톤을 먼저 파악하고 카피를 쓴다. 금기어·광고법을 항상 지킨다.

---

## Step 1 — 요구사항 파악

| 항목 | 파악할 내용 |
|------|------------|
| **채널** | Instagram? LinkedIn? Threads? X(Twitter)? 복수 채널? |
| **목적** | 신규 홍보? 제품 소개? 리드 획득? 브랜드 인지도? |
| **형태** | 텍스트 단독? 카드뉴스(슬라이드)? 시리즈(3~5장)? |
| **톤** | 전문적? 친근? B2B? B2C? |
| **주제** | 오늘 다룰 핵심 메시지 |

불명확하면 AskUserQuestion으로 핵심 2개만 질문.

---

## Step 2 — 환경 감지

marketing_agent 하네스 설치 여부를 확인한다.

```bash
# marketing_agent 하네스 경로 탐색 (일반적인 설치 위치들)
HARNESS_PATH=""
for dir in \
  "$HOME/totaro/marketing_agent" \
  "$HOME/marketing_agent" \
  "$(pwd)" \
  "$(pwd)/../marketing_agent"; do
  if [ -f "$dir/harness/bin/generate.mjs" ]; then
    HARNESS_PATH="$dir"
    break
  fi
done

if [ -n "$HARNESS_PATH" ]; then
  echo "HARNESS=found:$HARNESS_PATH"
  # company-profile 존재 여부
  [ -f "$HARNESS_PATH/company-profile.yaml" ] && echo "PROFILE=yes" || echo "PROFILE=no"
else
  echo "HARNESS=not_found"
fi
```

### HARNESS=found → marketing_agent 연동 모드

`company-profile.yaml`을 읽어 브랜드 정보를 파악한다.

```bash
cat "$HARNESS_PATH/company-profile.yaml"
```

#### 의도 분기

| 사용자 의도 | 명령어 |
|------------|--------|
| 새 캠페인 시작 | `→ /sns-start` 안내 (Step 3A) |
| 이전 캠페인 반복 | `→ /sns-repeat` 안내 (Step 3A) |
| 생성 내용 수정 | `→ /sns-edit` 안내 |
| 환경 점검 / 계정 설정 | `→ /sns-doctor` 안내 |
| 카피만 빠르게 작성 | → Step 3B (독립 카피 모드, 하네스 생략) |

```
[marketing_agent 연동]
하네스 경로: {HARNESS_PATH}
회사: {brand.name}
채널: {channels.enabled}

다음 명령어를 Claude Code에서 실행하세요:
  /sns-start "{주제}"          ← 새 캠페인
  /sns-repeat                  ← 이전 캠페인 반복
  /sns-doctor                  ← 환경 점검 / 계정 설정
```

---

### HARNESS=not_found → 독립 실행 모드

marketing_agent 없이 직접 카피·브랜드 검수를 수행한다.

#### Step 2B-1: 브랜드 프로필 파악

```bash
# 현재 프로젝트에 company-profile 혹은 브랜드 파일 탐색
find . -maxdepth 3 \( \
  -name "company-profile.yaml" \
  -o -name "brand*.yaml" \
  -o -name "brand*.json" \
  -o -name "brand*.md" \
\) 2>/dev/null | head -5
```

브랜드 파일이 있으면 읽어 톤·금기어·채널 파악.
없으면 AskUserQuestion으로 아래 5가지를 인터뷰:

```
1. 브랜드명 / 업종
2. 타겟 고객 (B2B 제조업 대표 / B2C 2030 / 등)
3. 톤 (전문적·따뜻함·유머 / B2B 공식 / 등)
4. 금기어 (최저가, 100% 보장 등)
5. 주요 채널 (instagram, linkedin, threads, x)
```

인터뷰 결과를 임시 브랜드 프로필로 저장:

```yaml
# /tmp/sj-brand-profile.yaml (임시)
brand:
  name: {브랜드명}
  industry: {업종}
target: {타겟}
tone:
  preset: {전문적|친근|유머|B2B}
  notes: {톤 노트}
banned:
  words: [{금기어 목록}]
channels:
  enabled: [{채널 목록}]
```

---

## Step 3A — marketing_agent 캠페인 실행 (하네스 연동)

사용자가 하네스를 사용할 경우 8단계 캠페인 플로우를 안내한다.

### 빠른 시작 가이드

```bash
# 1. 환경 점검
node {HARNESS_PATH}/harness/bin/doctor.mjs --quick

# 2. 새 캠페인 시작
# Claude Code 안에서:
# /sns-start "{오늘의 주제}"

# 3. 반복 캠페인
# /sns-repeat
```

### 8단계 플로우 요약

| 단계 | 동작 | 사용자 개입 |
|------|------|------------|
| 0. 환경점검 | `doctor.mjs --quick` | 빨간 항목 수정 |
| 1. 프로필 | `company-profile.yaml` 확인 | 없으면 인터뷰 |
| 2. 슬롯 | 기존 슬롯 재사용 여부 | 선택 |
| 3. 캠페인 설정 | 주제·채널·목표·cadence | 주제 1줄 입력 |
| 4. 카피+이미지 생성 | copywriter·image-director 자동 | 대기 |
| 5. 미리보기 | draft + 브랜드 검수 결과 | 확인 |
| 6. 휴먼 게이트 | Y/S/N 선택 | **승인 필수** |
| 7. 발행 | 채널 API 또는 브라우저 자동화 | — |
| 8. 완료 | 슬롯 저장 | — |

### 유용한 옵션

```bash
# 카드뉴스 시리즈
/sns-start "{주제}" --cadence=series-3   # 3장 시리즈
/sns-start "{주제}" --cadence=series-5   # 5장 시리즈
/sns-start "{주제}" --cadence=thread     # 텍스트 스레드

# 특정 채널만
/sns-start "{주제}" --channels=linkedin,threads

# dry-run (실제 발행 없이 확인)
/sns-start "{주제}" --dry-run
```

---

## Step 3B — 독립 카피 작성 모드

marketing_agent 없이 카피를 직접 작성한다.

### 채널별 카피 작성 원칙

#### Instagram
- **길이:** 150~300자 본문 + 해시태그 5~15개
- **구조:** 후킹 첫 줄 → 핵심 메시지 → CTA → 줄바꿈 후 해시태그
- **이모지:** 강조 포인트 2~4개, 남발 금지
- **해시태그:** 브랜드 태그 + 카테고리 태그 + 틈새 태그

#### LinkedIn
- **길이:** 500~1300자 (긴 글도 OK)
- **구조:** 후킹 첫 문장 → 스토리/데이터 → 인사이트 → 질문/CTA
- **이모지:** 0~2개, 전문적 분위기 유지
- **해시태그:** 3~5개, 본문 끝에

#### Threads
- **길이:** 200~500자
- **구조:** 핵심 메시지 선행 → 설명 → 참여 유도
- **이모지:** 1~3개

#### X (Twitter)
- **길이:** 280자 이내 (스레드 가능)
- **구조:** 첫 트윗에 핵심 → 이후 보충
- **해시태그:** 1~2개

---

### 카피 품질 체크리스트

작성 후 반드시 확인:

**브랜드 일치**
- [ ] 브랜드 톤과 일치하는가?
- [ ] 금기어 없는가? (최저가, 100% 보장, 공짜, 무료, 업계 1위 등)
- [ ] 과장 표현 없는가? (유일한, 최고의, 세계 최초)
- [ ] 광고 표시 필요 시 `#광고` 포함됐는가?

**채널 최적화**
- [ ] 해당 채널 글자수 범위 내인가?
- [ ] 해시태그 수가 적절한가?
- [ ] 첫 문장이 후킹(스크롤 멈춤)을 유도하는가?

**AI 티 제거** (sj-design 기준 적용)
- [ ] 자간/행간이 기계적이지 않은가? (타이포 고려한 줄바꿈)
- [ ] 원색 과용 없는가? (컬러 카드뉴스의 경우)
- [ ] 강조가 1~2곳으로 집중됐는가?
- [ ] 가운데 정렬 텍스트 블록이 과도하게 쓰이지 않았는가?

**광고법 (한국)**
- [ ] "최저", "1등", "유일", "완벽", "절대" 류 절대적 표현 없는가?
- [ ] 효능·효과 과장 없는가?
- [ ] 비교 광고 시 객관적 근거 있는가?

---

## Step 4 — 카드뉴스 슬라이드 명세 (이미지 있을 경우)

카드뉴스가 필요하면 슬라이드 구조를 먼저 설계한다.

```
슬라이드 1 (표지)
  - 제목: {후킹 메시지}
  - 서브타이틀: {보조 설명}
  - 배경: {브랜드 컬러 or 이미지}
  - 로고 위치: 우하단

슬라이드 2~N (본문)
  - 섹션 제목
  - 핵심 내용 (3줄 이내)
  - 아이콘 or 수치 강조

슬라이드 N (마무리)
  - CTA 메시지
  - 계정명 / 웹사이트
  - 해시태그 블록
```

인하우스 슬라이드(marketing_agent)를 사용하면:

```bash
# .env.local 설정
CONTENT_ENGINE_PROVIDER=inhouse-slides

# 제품 이미지 경로를 /sns-start에서 입력하면 슬라이드에 자동 삽입
```

---

## Step 5 — 완료 보고

```
✅ 마케팅 콘텐츠 작성 완료

채널: {Instagram / LinkedIn / Threads / X}
주제: {주제}
형태: {단일 포스트 / 카드뉴스 / 시리즈}
브랜드 검수: ✅ PASS (금기어·광고법 이상 없음)

--- 완성 카피 ---
{카피 전문}
-----------------

해시태그: {태그 목록}
발행 방법: {수동 업로드 / /sns-start 발행}
```

marketing_agent 하네스 사용 시 발행은 `/sns-start` 6단계 휴먼 게이트에서 Y 입력.

---

## 흔한 실수와 해결

| 실수 | 해결 |
|------|------|
| 금기어 포함 | 브랜드 프로필의 banned.words와 대조 후 재작성 |
| 채널 톤 미스매치 | LinkedIn ↔ Instagram 톤 분리 작성 |
| 해시태그 과다 | Instagram 15개 이하, LinkedIn 5개 이하 |
| 광고 미표시 | 협찬/유료 콘텐츠에 `#광고` 추가 |
| 너무 긴 문장 | 핵심만 → 2~3줄 이내로 단락 분리 |
| AI 느낌 나는 카피 | 구체적 수치·상황·고객 언어로 바꾸기 |

---

## 빠른 참조 — 후킹 첫 줄 패턴

```
숫자 시작: "제조업 대표 3명 중 2명이 모르는 것"
질문 시작: "바이어가 당신을 검색하지 않는 이유"
역설 시작: "잘 만든 제품이 팔리지 않는 이유"
공감 시작: "영어 카탈로그 만드는 데 3개월 쓴 적 있으신가요?"
수치 시작: "37초. 바이어가 브랜드 사이트에 머무는 평균 시간"
```
