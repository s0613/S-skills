---
name: sj-automation
version: 2.1.0
description: |
  PC 자동화 + UI 조작 + 네이티브 앱 제작 통합 전문가.
  "~하고 싶다", "~할 때마다", "버튼 클릭 자동화", "앱 만들어줘" 요청을
  OS를 자동 감지해 최적 도구로 즉시 구현·배포한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - /sj-automation
  - /automation
  - /auto
  - /sj-ui-auto
  - /ui-auto
---

# SJ Automation — 자동화 + UI + 네이티브 앱 통합 전문가

> **원칙 1:** OS를 먼저 감지한다. OS에 맞지 않는 도구는 절대 제안하지 않는다.
> **원칙 2:** 좌표 하드코딩 금지. 항상 이미지 인식 또는 접근성 API로 요소를 찾는다.
> **원칙 3:** 동작 확인 없이 완료 선언하지 않는다.

---

## Step 0 — OS 자동 감지

스킬 시작 즉시 실행:

```bash
python3 -c "import platform; print(platform.system())" 2>/dev/null || uname -s
```

`platform.system()`은 `Darwin` / `Linux` / `Windows`를 반환한다. `uname -s`는 Windows 네이티브에서 쓸 수 없고 Git Bash·MSYS 환경에서 `MINGW64_NT-...` 형태를 반환하므로 폴백으로만 쓴다 — 그 경우 `MINGW*`/`CYGWIN*`/`MSYS*`를 Windows로 해석한다.

| 결과 | OS | 기본 도구 |
|------|-----|---------|
| `Darwin` | macOS | launchd, AppleScript, Hammerspoon, cliclick |
| `Linux` | Linux | systemd, xdotool, wmctrl, Python/GTK |
| `Windows` (또는 폴백 시 `MINGW*` / `CYGWIN*` / `MSYS*`) | Windows | Task Scheduler, PowerShell, AutoHotkey, Win32 API |

이후 모든 도구 선택과 코드 예시는 감지된 OS에 맞춰 제시한다.

---

## Step 1 — 요구사항 파악

유저 요청을 아래 3가지 카테고리로 분류한다:

### 카테고리 A — 스크립트/백그라운드 자동화
"파일이 추가되면 ~", "매일 오전 9시에 ~", "단축키를 누르면 ~"

| 항목 | 질문 |
|------|------|
| **트리거** | 언제? (시간·이벤트·단축키·파일변경·수동) |
| **액션** | 무엇을? (파일 이동·알림·실행·API 호출·UI 조작) |
| **지속성** | 1회성 vs 상시 동작 |

### 카테고리 B — UI 조작 자동화
"버튼 클릭", "화면 인식 후 입력", "반복 클릭", "웹 자동화"

| 항목 | 질문 |
|------|------|
| **대상 앱** | 웹 브라우저? 네이티브 앱? |
| **액션** | 클릭·입력·스크롤·드래그·스크린샷? |
| **반복** | 1회? 루프? 조건부? |

### 카테고리 C — 네이티브 앱 제작
"앱 만들어줘", "GUI 프로그램", "트레이 앱", "메뉴바 앱"

| 항목 | 질문 |
|------|------|
| **UI 복잡도** | 간단한 폼? 복잡한 대시보드? 트레이 아이콘만? |
| **배포 대상** | 내 컴퓨터만? 다른 사람에게도 배포? |
| **크로스플랫폼** | 하나의 OS만? 여러 OS 지원? |

불명확하면 AskUserQuestion으로 핵심 2개만 질문한다.

---

## Step 2 — 도구 선택

### A. 스크립트/백그라운드 자동화

```
[macOS]
  시간 기반?        → launchd plist
  단축키 기반?      → Hammerspoon (복잡) / Karabiner (키 리매핑)
  파일 감시?        → launchd WatchPaths / fswatch
  Claude Code 이벤트? → hooks (settings.json)
  범용?             → zsh 스크립트

[Linux]
  시간 기반?        → systemd timer / cron
  단축키 기반?      → xbindkeys / sxhkd
  파일 감시?        → inotifywait
  범용?             → bash 스크립트

[Windows]
  시간 기반?        → Task Scheduler / schtasks
  단축키 기반?      → AutoHotkey
  파일 감시?        → PowerShell FileSystemWatcher
  범용?             → PowerShell 스크립트
```

### B. UI 조작 자동화

```
웹 브라우저?
  → Playwright (모든 OS, 추천) 또는 Selenium

[macOS] 네이티브 앱?
  텍스트/라벨 기반?  → AppleScript + System Events
  이미지/화면 기반?  → PyAutoGUI
  단순 마우스/키?    → cliclick

[Linux] 네이티브 앱?
  텍스트/라벨 기반?  → xdotool (wmctrl)
  이미지/화면 기반?  → PyAutoGUI
  단순 마우스/키?    → xdotool mousemove / key

[Windows] 네이티브 앱?
  텍스트/라벨 기반?  → AutoHotkey / pywinauto
  이미지/화면 기반?  → PyAutoGUI
  단순 마우스/키?    → AutoHotkey
```

### C. 네이티브 앱 제작

```
내 OS만, 최고 품질?
  macOS   → SwiftUI (권장) / Tauri
  Windows → WinForms/WPF (C#) / Tauri
  Linux   → GTK4/Python / Tauri

크로스플랫폼 (한 번에 macOS+Windows+Linux)?
  → Tauri (Rust, 경량 ~5MB, 권장)
  → Electron (JS/TS, 무겁지만 에코시스템 풍부)

트레이 앱 / 메뉴바 앱만?
  macOS   → SwiftUI MenuBarExtra / rumps (Python)
  Windows → pystray (Python)
  Linux   → pystray (Python) / AppIndicator

간단한 GUI 폼 (빠른 구현)?
  → customtkinter (Python, 크로스플랫폼)
```

#### 도구 비교

| 도구 | OS | 크기 | 언어 | 권장 |
|------|-----|------|------|------|
| **SwiftUI** | macOS | ~수백KB | Swift | macOS 네이티브 최고 품질 |
| **WinForms/WPF** | Windows | ~수MB | C# | Windows 네이티브 표준 |
| **GTK4** | Linux | ~수MB | Python/C | Linux 네이티브 |
| **Tauri** | 크로스 | ~5MB | Rust+HTML | 크로스플랫폼 경량 추천 |
| **Electron** | 크로스 | ~120MB | JS/TS | 에코시스템 풍부, 무거움 |
| **customtkinter** | 크로스 | ~수MB | Python | 빠른 프로토타입 |
| **rumps/pystray** | 크로스 | ~수MB | Python | 트레이/메뉴바 전용 |

---

## Step 3 — 구현

카테고리별 템플릿은 참조 파일에 있다. **해당 카테고리 하나만** 읽는다 — 세 개를 다 로드하면 컨텍스트만 먹고 선택을 흐린다.

| 카테고리 | 참조 파일 |
|----------|-----------|
| A. 스크립트/백그라운드 자동화 | [references/templates-script.md](references/templates-script.md) |
| B. UI 조작 자동화 | [references/templates-ui.md](references/templates-ui.md) |
| C. 네이티브 앱 제작 | [references/templates-native-app.md](references/templates-native-app.md) |

Step 0에서 감지한 OS에 해당하는 섹션만 골라 쓴다. 템플릿은 출발점이지 완성품이 아니다 — 요청에 없는 기능을 템플릿에 있다는 이유로 넣지 않는다([최소 코드](../_conventions/minimal-code.md)).

## Step 4 — 프로젝트 구조

```
~/.automation/
├── README.md               # 자동화 목록
├── install.sh              # 모든 트리거 등록
├── scripts/                # 백그라운드 자동화
│   ├── task-a.sh
│   └── task-b.py
├── plist/                  # macOS launchd
│   └── com.sj.task-a.plist
├── systemd/                # Linux
│   └── task-a.service
├── ui/                     # UI 조작 자동화
│   └── PROJECT_NAME/
│       ├── main.py
│       ├── images/
│       │   └── btn_start.png
│       └── run.sh
└── apps/                   # 네이티브 앱
    └── APP_NAME/
        ├── main.py (또는 swift/cs 파일)
        └── dist/
```

---

## Step 5 — OS별 검증

```bash
# [공통] Python 스크립트 직접 실행
python3 main.py

# [macOS] launchd 즉시 트리거
launchctl start com.sj.AUTOMATION_NAME
tail -f /tmp/com.sj.AUTOMATION_NAME.out

# [Linux] systemd 상태 확인
systemctl --user status automation-name.timer
journalctl --user -u automation-name.service -f

# [Windows] Task Scheduler 즉시 실행
schtasks /run /tn "MyAutomation"
Get-EventLog -LogName Application -Source "Task Scheduler" -Newest 10

# [UI 자동화] 화면 보면서 확인
# - 올바른 요소를 클릭하는가?
# - 타이밍이 맞는가?
# - 오류 시 알림이 뜨는가?
```

---

## Step 6 — 완료 보고

```
✅ 자동화 구축 완료

OS: [macOS / Linux / Windows]
이름: [자동화 이름]
카테고리: [스크립트 / UI 조작 / 네이티브 앱]
도구: [사용 도구]
트리거: [언제 실행]
액션: [무엇을 함]
파일: [경로]
테스트: ✅ 직접 동작 확인 완료

실행 방법:
  python3 ~/.automation/ui/PROJECT/main.py
  # 또는
  ~/.automation/scripts/task.sh
```

---

## 흔한 실수와 해결

| 실수 | OS | 해결 |
|------|-----|------|
| 이미지 못 찾음 | 공통 | `confidence=0.7`로 낮추거나 이미지 재캡처 |
| launchd 환경변수 없음 | macOS | plist에 `EnvironmentVariables` 키 추가 |
| 절대 경로 미사용 | macOS | launchd는 PATH 없음 — `/usr/bin/python3` 전체 경로 |
| 접근성 권한 오류 | macOS | 시스템 설정 → 접근성에 Terminal 추가 |
| Retina 좌표 2배 | macOS | `pyautogui.size()`로 실제 해상도 확인 |
| xdotool 미설치 | Linux | `sudo apt install xdotool` |
| UAC 권한 오류 | Windows | 관리자 권한으로 실행 또는 Task Scheduler 권한 조정 |
| AutoHotkey 경로 | Windows | 항상 절대 경로 사용 |
| Tauri 빌드 느림 | 공통 | 첫 빌드는 Rust 컴파일로 5~10분 소요 — 정상 |

---

## 빠른 참조

```bash
# OS 감지
python3 -c "import platform; print(platform.system())"

# 현재 마우스 위치 (좌표 파악)
python3 -c "import pyautogui,time; [print(pyautogui.position()) or time.sleep(1) for _ in range(5)]"

# 화면 스크린샷
python3 -c "import pyautogui; pyautogui.screenshot('/tmp/screen.png')"

# [macOS] 알림
osascript -e 'display notification "완료" with title "자동화"'

# [Linux] 알림
notify-send "자동화" "완료"

# [Windows] 알림 (PowerShell)
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime]

# Playwright 설치 (공통)
pip3 install playwright && python3 -m playwright install chromium

# customtkinter 설치 (공통)
pip3 install customtkinter pyinstaller
```
