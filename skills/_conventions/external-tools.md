# 외부 도구 설치 게이트

스킬이 외부 도구(데스크톱 앱·CLI·MCP 서버·패키지)에 의존할 때,
**사용자를 브라우저로 보내지 않는다.** 링크를 주고 "알아서 받으세요"는 안내가 아니라
떠넘기기다 — 사용자는 릴리즈 페이지에서 자기 OS·아키텍처에 맞는 자산 이름을
직접 골라야 하고, 거기서 절반이 이탈한다.

> 도구가 없다는 사실은 스킬이 발견하고, 있게 만드는 경로는 **붙여넣기 한 번**이어야 한다.

## 규칙 다섯

### 1. 탐지는 스킬이 한다
`command -v`만 보고 "없음"이라 결론짓지 않는다. 앱 번들 안에 CLI가 들어 있는
경우(Electron 앱), 사용자 홈 아래 설치된 경우가 흔하다. 후보 경로를 훑고 결과로 판단한다.

### 2. 안내는 실행 가능한 명령이다
플랫폼별로 **그 사용자가 지금 붙여넣을 한 줄**을 준다. 페이지 링크는 명령 뒤에
출처로만 붙인다(명령의 대체재가 아니다).

- 나쁨: `릴리즈 페이지에서 .dmg를 받아 설치하세요` + 링크
- 좋음: 아키텍처를 감지해 알맞은 자산을 받아 설치하는 스크립트 한 덩어리 + 출처 링크

### 3. 버전을 스킬에 박지 않는다
`.../releases/download/v1.10.0/...`를 SKILL.md에 적으면 스킬이 그 날짜에 늙는다.
`releases/latest` API로 자산 URL을 **런타임에** 뽑고, API가 막힌 환경에서만
릴리즈 페이지 링크로 폴백한다.

```bash
# 패턴: 자산 이름 정규식으로 최신 릴리즈에서 URL 뽑기
curl -sL https://api.github.com/repos/{owner}/{repo}/releases/latest \
  | grep -o "https://[^\"]*{자산패턴}" | head -1
```

### 4. 설치는 실행해도 되고, 권한은 사람 게이트다
설치는 되돌릴 수 있다 — 사용자가 "설치해줘"라고 하면 스킬이 받아서 깐다.
되돌릴 수 없거나 시스템을 건드리는 것은 사람 몫으로 남긴다:

| 스킬이 실행 가능 | 사람 게이트 (`보류: 사람 승인 필요`) |
|---|---|
| 다운로드, 사용자 영역 설치, `npm i -D`, `claude mcp add` | `sudo` 설치, 시스템 설정 변경 |
| 마운트·복사·언마운트 | macOS 화면 기록·접근성 권한 부여 |
| 버전 확인·재검증 | API 키·인증키 발급 및 입력 |

키·토큰은 **대화에 받아 적어 실행하지 않는다** — 전사 로그에 남는다.
사용자가 자기 터미널에서 직접 넣게 한다.

### 5. 설치했다는 말을 신뢰하지 않는다
설치 후 [정직 산출 계약](honest-report.md)에 따라 **바이너리 존재·버전으로 재검증한 뒤**
다음 단계로 간다. 권한이 필요한 도구는 권한까지 확인한다 —
권한 없는 화면 녹화기는 실패하지 않고 검은 화면을 남긴다.

## 스킬별 외부 의존 (단일 인덱스)

새 외부 의존을 추가하면 이 표에 한 줄 추가한다.

| 스킬 | 도구 | 설치 |
|---|---|---|
| sj-screencast | OpenScreen (앱 내장 CLI) | SKILL.md Step 0 스크립트 — macOS `.dmg` 자동 설치 / Windows `winget install --source msstore OpenScreen` |
| sj-law | korean-law MCP | `claude mcp add korean-law --scope user --env LAW_OC=<키> -- npx -y korean-law-mcp@latest` (키: open.law.go.kr 무료) |
| sj-gpt | codex MCP | `claude mcp add codex --scope user -- codex mcp-server` |
| sj-seed | seed-docs MCP / seed-design 스킬 | `claude mcp add seed-docs -- npx -y @seed-design/docs-mcp` / `npx skills add https://github.com/daangn/seed-design --skill seed-design --global` |
| sj-seo | Playwright MCP | `claude mcp add playwright npx @playwright/mcp@latest --scope user` |
| pw-loop | Playwright | `npm install -D @playwright/test && npx playwright install --with-deps chromium` |
| sj-automation | 플랫폼별 (PyAutoGUI·xdotool·AutoHotkey 등) | SKILL.md OS 감지 표 참조 |
| sj-convert | markitdown (Microsoft, MIT) | 무설치: `uvx --python 3.12 --from 'markitdown[all]' markitdown <파일>` / 설치: `pipx install 'markitdown[all]'` — Python ≥ 3.10 필수 |
| sj-ref | 유아이볼 MCP | claude.ai 커넥터에서 "유아이볼" 연결 (권장) / `claude mcp add --transport http uibowl https://uibowl.io/api/mcp` — 무료 등급 하루 10회 조회 |
