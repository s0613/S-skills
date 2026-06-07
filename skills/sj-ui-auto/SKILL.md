---
name: sj-ui-auto
version: 1.0.0
description: |
  화면 UI 자동화 프로그램 제작 전문가.
  "특정 버튼 클릭", "화면 인식 후 입력", "반복 클릭" 같은
  GUI 조작 자동화 프로그램을 즉시 구현·실행한다.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
triggers:
  - /sj-ui-auto
  - /ui-auto
  - /ui
---

# SJ UI Auto — 화면 조작 자동화 전문가

> **원칙:** 좌표 하드코딩은 금지. 항상 이미지 인식 또는 접근성 API로 요소를 찾는다.
> 반드시 실행 테스트 후 완료 선언한다.

---

## Step 1 — 요구사항 파악

| 항목 | 파악할 내용 |
|------|------------|
| **대상 앱** | 웹 브라우저? 네이티브 앱? 특정 앱 이름? |
| **액션** | 클릭·입력·스크롤·드래그·스크린샷·대기? |
| **인식 방법** | 버튼 텍스트? 이미지? 좌표? 접근성 라벨? |
| **반복** | 1회? 루프? 조건부? |
| **실행 방식** | 수동 실행? 단축키? 스케줄? |

불명확하면 AskUserQuestion으로 핵심 2개만 질문.

---

## Step 2 — 도구 선택

```
대상이 웹 브라우저?
  → Playwright (추천) 또는 Selenium

대상이 macOS 네이티브 앱?
  트리거가 텍스트/라벨 기반?
    → AppleScript + System Events (접근성 API)
  트리거가 이미지/화면 좌표 기반?
    → PyAutoGUI

대상이 데스크탑 전체 (복수 앱, 게임 등)?
  → PyAutoGUI (이미지 인식) + cliclick

단순 마우스/키보드 제어만?
  → cliclick (CLI, 설치 간단)
```

### 도구 특성 비교

| 도구 | 강점 | 약점 | 설치 |
|------|------|------|------|
| **Playwright** | 웹 최강, 요소 대기 자동 | 웹 전용 | `pip install playwright` |
| **PyAutoGUI** | 모든 앱, 이미지 인식 | 해상도 의존적 | `pip install pyautogui pillow` |
| **AppleScript** | macOS 앱 내부 접근, 안정적 | macOS 전용, 문법 특이 | 기본 내장 |
| **cliclick** | CLI 간단 사용 | 기능 제한 | `brew install cliclick` |
| **Selenium** | 웹, 레거시 호환 | 느림 | `pip install selenium` |

---

## Step 3 — 구현

### 3-A. Playwright (웹 자동화)

```python
#!/usr/bin/env python3
"""웹 UI 자동화 — Playwright"""

import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # 브라우저 실행 (headless=False 로 화면 보이게)
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()

        # 페이지 이동
        await page.goto("https://example.com")

        # 텍스트로 버튼 찾아 클릭
        await page.get_by_text("로그인").click()

        # placeholder로 입력창 찾아 입력
        await page.get_by_placeholder("이메일").fill("user@example.com")
        await page.get_by_placeholder("비밀번호").fill("password123")

        # 역할(role)로 버튼 찾기
        await page.get_by_role("button", name="확인").click()

        # 요소가 나타날 때까지 대기
        await page.wait_for_selector("#dashboard", timeout=10000)

        # 스크린샷
        await page.screenshot(path="/tmp/result.png")

        await browser.close()

asyncio.run(main())
```

**설치:**
```bash
pip3 install playwright
python3 -m playwright install chromium
```

**요소 선택자 우선순위 (안정적인 순):**
```python
page.get_by_role("button", name="확인")      # 1순위 — 역할+텍스트
page.get_by_text("로그인")                    # 2순위 — 텍스트
page.get_by_placeholder("이메일")            # 3순위 — placeholder
page.get_by_label("사용자명")                # 4순위 — label
page.locator("css=#submit-btn")              # 5순위 — CSS (마지막)
```

---

### 3-B. PyAutoGUI (화면 이미지 인식 자동화)

```python
#!/usr/bin/env python3
"""이미지 인식 기반 UI 자동화 — PyAutoGUI"""

import pyautogui
import time
import subprocess
from pathlib import Path

# 안전 설정
pyautogui.PAUSE = 0.5          # 액션 사이 0.5초 대기
pyautogui.FAILSAFE = True      # 마우스 좌상단 → 즉시 중단

SCREENSHOT_DIR = Path("/tmp/ui-auto")
SCREENSHOT_DIR.mkdir(exist_ok=True)

def find_and_click(image_path: str, confidence: float = 0.8, timeout: int = 10) -> bool:
    """이미지를 화면에서 찾아 클릭. 못 찾으면 False 반환."""
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

def wait_for_image(image_path: str, timeout: int = 15) -> bool:
    """이미지가 화면에 나타날 때까지 대기."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            if pyautogui.locateOnScreen(image_path, confidence=0.8):
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def notify(msg: str):
    subprocess.run(["osascript", "-e", f'display notification "{msg}" with title "UI Auto"'])

def capture_reference(name: str):
    """현재 화면 캡처 → 레퍼런스 이미지로 저장 (개발용)"""
    path = SCREENSHOT_DIR / f"{name}.png"
    pyautogui.screenshot(str(path))
    print(f"저장: {path}")
    return str(path)

# === 실제 자동화 로직 ===
def run():
    # 앱 활성화
    subprocess.run(["open", "-a", "앱이름"])
    time.sleep(2)  # 앱 로딩 대기

    # 이미지로 버튼 찾아 클릭
    if not find_and_click("images/start_button.png"):
        notify("버튼을 찾지 못했습니다")
        return

    # 텍스트 입력
    pyautogui.typewrite("입력할 텍스트", interval=0.05)
    pyautogui.press("return")

    # 결과 대기
    if wait_for_image("images/success_screen.png"):
        notify("완료!")
    else:
        notify("오류: 성공 화면 미감지")

if __name__ == "__main__":
    run()
```

**설치:**
```bash
pip3 install pyautogui pillow pyobjc-framework-Quartz
```

**레퍼런스 이미지 캡처 방법:**
```bash
# 1. 자동화할 버튼/화면을 화면에 띄운다
# 2. 아래 실행 → 현재 화면 저장
python3 -c "
import pyautogui
from pathlib import Path
Path('images').mkdir(exist_ok=True)
pyautogui.screenshot('images/target_button.png')
print('캡처 완료')
"
# 3. 저장된 이미지에서 버튼 부분만 크롭 (미리보기 앱 활용)
```

---

### 3-C. AppleScript + System Events (macOS 앱 접근성)

```applescript
-- 앱 내부 UI 요소를 접근성 API로 직접 제어
-- 좌표 없이 버튼 이름/역할로 찾음 → 해상도 무관

tell application "앱이름"
    activate
end tell

delay 1

tell application "System Events"
    tell process "앱이름"

        -- 버튼 텍스트로 클릭
        click button "확인" of window 1

        -- 체크박스 선택
        set value of checkbox "알림 받기" of window 1 to 1

        -- 텍스트 필드 입력
        set focused of text field 1 of window 1 to true
        keystroke "입력할 텍스트"

        -- 메뉴 클릭
        click menu item "저장" of menu "파일" of menu bar 1

        -- 요소 목록 확인 (디버깅용)
        -- get name of every button of window 1

    end tell
end tell
```

실행:
```bash
osascript script.applescript

# 또는 한 줄
osascript -e 'tell application "Safari" to activate'
```

**접근성 권한 부여:**
```
시스템 설정 → 개인정보 보호 및 보안 → 접근성 → Terminal (또는 앱) 추가
```

---

### 3-D. cliclick (CLI 마우스/키보드)

```bash
brew install cliclick

# 현재 마우스 위치 출력
cliclick p

# 클릭
cliclick c:500,300         # x=500, y=300 클릭
cliclick dc:500,300        # 더블클릭
cliclick rc:500,300        # 우클릭

# 키 입력
cliclick kd:return         # Return 키 누르기
cliclick t:"입력할 텍스트"  # 텍스트 타이핑

# 드래그
cliclick dd:100,100 du:500,100  # 드래그

# 대기
cliclick w:1000            # 1초 대기
```

shell 스크립트로 조합:
```bash
#!/bin/zsh
# 예: 3초 후 특정 좌표 클릭 + 텍스트 입력
sleep 3
cliclick c:800,400
sleep 0.5
cliclick t:"자동 입력 텍스트"
cliclick kd:return
```

---

## Step 4 — 프로젝트 구조

```
~/.automation/ui/
├── PROJECT_NAME/
│   ├── main.py          # 메인 자동화 스크립트
│   ├── images/          # 레퍼런스 이미지 (PyAutoGUI용)
│   │   ├── btn_start.png
│   │   └── screen_success.png
│   ├── run.sh           # 실행 스크립트
│   └── README.md        # 트리거·액션·실행 방법
```

`run.sh` 템플릿:
```bash
#!/bin/zsh
cd "$(dirname "$0")"
echo "[$(date)] 자동화 시작"
python3 main.py
echo "[$(date)] 완료"
```

---

## Step 5 — 검증 체크리스트

구현 후 반드시 확인:

```bash
# 1. 직접 실행 테스트
python3 main.py   # 또는 osascript script.applescript

# 2. 화면 보면서 동작 확인
#    - 올바른 요소를 클릭하는가?
#    - 타이밍이 맞는가?
#    - 오류 발생 시 알림이 뜨는가?

# 3. 엣지케이스 확인
#    - 앱이 느리게 뜰 때?
#    - 버튼이 안 보일 때?
#    - 이미 완료된 상태일 때?
```

---

## Step 6 — 완료 보고

```
✅ UI 자동화 구축 완료

이름: [자동화 이름]
도구: [Playwright / PyAutoGUI / AppleScript / cliclick]
대상: [앱/URL]
동작: [트리거 → 액션 요약]
파일: [경로]
실행: [실행 방법]
테스트: ✅ 직접 동작 확인 완료

실행 명령:
  python3 ~/.automation/ui/PROJECT/main.py
  # 또는
  ~/.automation/ui/PROJECT/run.sh
```

---

## 흔한 실수와 해결

| 실수 | 원인 | 해결 |
|------|------|------|
| 이미지 못 찾음 | 해상도/DPI 차이 | `confidence=0.7`로 낮추거나 이미지 재캡처 |
| 클릭 타이밍 어긋남 | 앱 로딩 미대기 | `wait_for_image()` 또는 `delay` 추가 |
| 접근성 권한 오류 | 권한 미부여 | 시스템 설정 → 접근성에 Terminal 추가 |
| Retina 좌표 2배 | HiDPI 환경 | `pyautogui.size()`로 실제 해상도 확인 |
| 요소 찾기 실패 | 앱 업데이트 | 접근성 API 방식으로 전환 (좌표 대신 이름) |
| Playwright 요소 없음 | SPA 렌더링 지연 | `wait_for_selector()` 또는 `expect()` 사용 |

---

## 빠른 참조 — 자주 쓰는 패턴

```python
# 화면 스크린샷 찍기
import pyautogui
pyautogui.screenshot("/tmp/screen.png")

# 현재 마우스 위치 확인 (좌표 파악용)
import pyautogui, time
for _ in range(5):
    print(pyautogui.position())
    time.sleep(1)

# Playwright — 스크롤
await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

# Playwright — 새 탭 열기
new_page = await context.new_page()

# Playwright — 다운로드 처리
async with page.expect_download() as dl:
    await page.click("#download-btn")
download = await dl.value
await download.save_as("/tmp/file.pdf")

# AppleScript — 키보드 단축키
tell application "System Events" to keystroke "s" using command down

# cliclick — 현재 마우스 위치
cliclick p
```
