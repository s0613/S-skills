# 네이티브 앱 제작 템플릿

> `/automation` Step 3-C에서 로드한다. SwiftUI·WinForms·GTK·Tauri·customtkinter 앱 템플릿.

## macOS — SwiftUI 앱

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
# Package.swift 작성 후 빌드
swift build -c release
# 실행 파일: .build/release/MyApp
# .app 번들이 필요하면 Contents/MacOS 구조를 직접 만들고 Info.plist를 넣는다
```

> `swift package generate-xcodeproj`는 Swift 5.6에서 제거됐다. Xcode는 이제 Package.swift를 직접 연다(`xed .`).

## macOS — 메뉴바 앱 (rumps / Python)

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

## 크로스플랫폼 — Tauri (권장)

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

## 크로스플랫폼 — customtkinter (Python, 빠른 구현)

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

## Windows — WinForms (C#)

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

## 트레이 앱 (모든 OS — pystray)

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
