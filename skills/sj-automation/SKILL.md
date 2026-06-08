---
name: sj-automation
version: 2.0.0
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
  - /ui
---

# SJ Automation — 자동화 + UI + 네이티브 앱 통합 전문가

> **원칙 1:** OS를 먼저 감지한다. OS에 맞지 않는 도구는 절대 제안하지 않는다.
> **원칙 2:** 좌표 하드코딩 금지. 항상 이미지 인식 또는 접근성 API로 요소를 찾는다.
> **원칙 3:** 동작 확인 없이 완료 선언하지 않는다.

---

## Step 0 — OS 자동 감지

스킬 시작 즉시 실행:

```bash
uname -s   # Darwin=macOS, Linux=Linux, MINGW/CYGWIN=Windows
```

| 결과 | OS | 기본 도구 |
|------|-----|---------|
| `Darwin` | macOS | launchd, AppleScript, Hammerspoon, cliclick |
| `Linux` | Linux | systemd, xdotool, wmctrl, Python/GTK |
| `MINGW*` / `CYGWIN*` / `Windows_NT` | Windows | Task Scheduler, PowerShell, AutoHotkey, Win32 API |

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

### 3-A. 스크립트/백그라운드 자동화

#### macOS — launchd plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.sj.AUTOMATION_NAME</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>/Users/songseungju/.automation/AUTOMATION_NAME.sh</string>
  </array>
  <!-- 매일 오전 9시 -->
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/tmp/com.sj.AUTOMATION_NAME.out</string>
  <key>StandardErrorPath</key>
  <string>/tmp/com.sj.AUTOMATION_NAME.err</string>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
```

```bash
# 등록
cp com.sj.AUTOMATION_NAME.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.sj.AUTOMATION_NAME.plist
launchctl start com.sj.AUTOMATION_NAME
```

#### Linux — systemd timer

```ini
# ~/.config/systemd/user/automation-name.service
[Unit]
Description=Automation Name

[Service]
ExecStart=/home/%u/.automation/automation-name.sh
StandardOutput=journal
StandardError=journal
```

```ini
# ~/.config/systemd/user/automation-name.timer
[Unit]
Description=Run Automation Name

[Timer]
OnCalendar=*-*-* 09:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
systemctl --user enable --now automation-name.timer
systemctl --user status automation-name.timer
```

#### Windows — Task Scheduler (PowerShell)

```powershell
# 매일 오전 9시 실행 등록
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NonInteractive -File C:\automation\task.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
Register-ScheduledTask -Action $action -Trigger $trigger `
  -TaskName "MyAutomation" -Description "자동화"
```

#### Windows — AutoHotkey (단축키)

```ahk
; Win+Shift+A 누르면 실행
#^+A::
    Run, notepad.exe
    WinWaitActive, 메모장
    Send, 자동 입력 텍스트
    return
```

---

### 3-B. UI 조작 자동화

#### Playwright (웹, 모든 OS)

```python
#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()
        await page.goto("https://example.com")

        # 안정적인 선택자 우선순위
        await page.get_by_role("button", name="로그인").click()     # 1순위
        await page.get_by_placeholder("이메일").fill("user@ex.com")  # 2순위
        await page.get_by_text("확인").click()                       # 3순위

        await page.wait_for_selector("#dashboard", timeout=10000)
        await page.screenshot(path="/tmp/result.png")
        await browser.close()

asyncio.run(main())
```

```bash
pip3 install playwright && python3 -m playwright install chromium
```

#### PyAutoGUI — 이미지 인식 (모든 OS)

```python
#!/usr/bin/env python3
import pyautogui, time, sys
from pathlib import Path

pyautogui.PAUSE = 0.5
pyautogui.FAILSAFE = True

def notify(msg: str):
    import subprocess, platform
    os_name = platform.system()
    if os_name == "Darwin":
        subprocess.run(["osascript", "-e", f'display notification "{msg}" with title "Auto"'])
    elif os_name == "Linux":
        subprocess.run(["notify-send", "Auto", msg])
    elif os_name == "Windows":
        from win10toast import ToastNotifier
        ToastNotifier().show_toast("Auto", msg, duration=3)

def find_and_click(image_path: str, confidence: float = 0.8, timeout: int = 10) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        try:
            loc = pyautogui.locateCenterOnScreen(image_path, confidence=confidence)
            if loc:
                pyautogui.click(loc)
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def run():
    if not find_and_click("images/btn_start.png"):
        notify("버튼 미발견")
        return
    pyautogui.typewrite("입력 텍스트", interval=0.05)
    pyautogui.press("return")
    notify("완료")

if __name__ == "__main__":
    run()
```

```bash
# macOS
pip3 install pyautogui pillow pyobjc-framework-Quartz

# Linux
pip3 install pyautogui pillow python3-xlib

# Windows
pip3 install pyautogui pillow
```

#### macOS — AppleScript (접근성 API)

```applescript
tell application "앱이름"
    activate
end tell
delay 1
tell application "System Events"
    tell process "앱이름"
        click button "확인" of window 1
        set focused of text field 1 of window 1 to true
        keystroke "입력 텍스트"
        click menu item "저장" of menu "파일" of menu bar 1
    end tell
end tell
```

#### Linux — xdotool (접근성)

```bash
pip install pyautogui  # GUI 인식
# 또는 xdotool 사용
xdotool search --name "앱이름" windowactivate
xdotool key Return
xdotool type "입력 텍스트"
```

#### Windows — AutoHotkey / pywinauto

```python
# pywinauto — 윈도우 앱 접근성 API
from pywinauto.application import Application

app = Application(backend="uia").start("notepad.exe")
app.UntitledNotepad.Edit.type_keys("입력 텍스트", with_spaces=True)
app.UntitledNotepad.menu_select("파일->저장")
```

```bash
pip install pywinauto
```

---

### 3-C. 네이티브 앱 제작

#### macOS — SwiftUI 앱

```swift
// ContentView.swift
import SwiftUI

@main
struct AutoApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var inputText = ""
    @State private var result = ""

    var body: some View {
        VStack(spacing: 16) {
            TextField("입력", text: $inputText)
                .textFieldStyle(.roundedBorder)
            Button("실행") {
                result = "처리 완료: \(inputText)"
            }
            .buttonStyle(.borderedProminent)
            Text(result)
        }
        .padding(24)
        .frame(width: 400, height: 200)
    }
}
```

```bash
# 프로젝트 생성 (Xcode 없이)
mkdir -p MyApp/Sources/MyApp
# Package.swift 생성 후 swift build
swift build -c release
# .app 번들 생성
swift package generate-xcodeproj
```

#### macOS — 메뉴바 앱 (rumps / Python)

```python
#!/usr/bin/env python3
import rumps

class MenuBarApp(rumps.App):
    def __init__(self):
        super().__init__("앱이름", icon="icon.png")
        self.menu = ["실행", "설정", None, "종료"]

    @rumps.clicked("실행")
    def run_task(self, _):
        # 자동화 로직
        rumps.notification("완료", "", "작업이 완료되었습니다")

    @rumps.clicked("종료")
    def quit(self, _):
        rumps.quit_application()

if __name__ == "__main__":
    MenuBarApp().run()
```

```bash
pip3 install rumps
# 앱 번들로 패키징
pip3 install pyinstaller
pyinstaller --windowed --onefile app.py
```

#### 크로스플랫폼 — Tauri (권장)

```bash
# 의존성
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm create tauri-app@latest my-app
cd my-app && npm install
npm run tauri dev      # 개발
npm run tauri build    # 배포 빌드 (~5MB)
```

```rust
// src-tauri/src/main.rs — 백엔드 커맨드
#[tauri::command]
fn run_automation(input: String) -> String {
    format!("처리 완료: {}", input)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_automation])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```html
<!-- src/index.html — 프론트엔드 -->
<script>
const { invoke } = window.__TAURI__.core;
async function runTask() {
    const result = await invoke("run_automation", { input: "테스트" });
    document.getElementById("result").textContent = result;
}
</script>
```

#### 크로스플랫폼 — customtkinter (Python, 빠른 구현)

```python
#!/usr/bin/env python3
import customtkinter as ctk
import threading

ctk.set_appearance_mode("system")  # OS 테마 자동 적용
ctk.set_default_color_theme("blue")

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("자동화 앱")
        self.geometry("500x350")

        self.input = ctk.CTkEntry(self, placeholder_text="입력", width=300)
        self.input.pack(pady=20)

        self.btn = ctk.CTkButton(self, text="실행", command=self.run_task)
        self.btn.pack(pady=10)

        self.progress = ctk.CTkProgressBar(self)
        self.progress.pack(pady=10, fill="x", padx=20)
        self.progress.set(0)

        self.log = ctk.CTkTextbox(self, height=150)
        self.log.pack(pady=10, fill="both", expand=True, padx=20)

    def run_task(self):
        def task():
            self.btn.configure(state="disabled")
            self.log.insert("end", f"실행: {self.input.get()}\n")
            self.progress.set(0.5)
            # 여기에 자동화 로직
            self.progress.set(1.0)
            self.log.insert("end", "완료\n")
            self.btn.configure(state="normal")
        threading.Thread(target=task, daemon=True).start()

if __name__ == "__main__":
    App().mainloop()
```

```bash
pip3 install customtkinter
# 실행 파일로 패키징
pip3 install pyinstaller
pyinstaller --windowed --onefile app.py
```

#### Windows — WinForms (C#)

```csharp
// Program.cs
using System.Windows.Forms;

var form = new Form { Text = "자동화 앱", Width = 500, Height = 350 };
var input = new TextBox { Left = 20, Top = 20, Width = 300 };
var btn = new Button { Text = "실행", Left = 340, Top = 18 };
var log = new TextBox {
    Left = 20, Top = 60, Width = 440, Height = 200,
    Multiline = true, ScrollBars = ScrollBars.Vertical
};

btn.Click += (s, e) => {
    log.AppendText($"실행: {input.Text}\r\n");
    // 자동화 로직
    log.AppendText("완료\r\n");
};

form.Controls.AddRange(new Control[] { input, btn, log });
Application.Run(form);
```

```bash
dotnet new winforms -n MyApp
cd MyApp && dotnet run
dotnet publish -c Release -r win-x64 --self-contained
```

#### 트레이 앱 (모든 OS — pystray)

```python
#!/usr/bin/env python3
import pystray
from PIL import Image, ImageDraw
import threading

def create_icon():
    img = Image.new("RGBA", (64, 64), (0, 120, 212, 255))
    d = ImageDraw.Draw(img)
    d.ellipse([16, 16, 48, 48], fill="white")
    return img

def run_task(icon, item):
    print("작업 실행")

def quit_app(icon, item):
    icon.stop()

menu = pystray.Menu(
    pystray.MenuItem("실행", run_task),
    pystray.Menu.SEPARATOR,
    pystray.MenuItem("종료", quit_app)
)

icon = pystray.Icon("myapp", create_icon(), "My App", menu)
icon.run()
```

```bash
pip3 install pystray pillow
```

---

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
