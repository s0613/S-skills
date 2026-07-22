# UI 조작 자동화 템플릿

> `/automation` Step 3-B에서 로드한다. Playwright·PyAutoGUI·AppleScript·xdotool·AutoHotkey 조작 템플릿.

## Playwright (웹, 모든 OS)

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

## PyAutoGUI — 이미지 인식 (모든 OS)

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

## macOS — AppleScript (접근성 API)

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

## Linux — xdotool (접근성)

```bash
pip install pyautogui  # GUI 인식
# 또는 xdotool 사용
xdotool search --name "앱이름" windowactivate
xdotool key Return
xdotool type "입력 텍스트"
```

## Windows — AutoHotkey / pywinauto

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
