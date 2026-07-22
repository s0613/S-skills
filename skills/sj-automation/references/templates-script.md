# 스크립트/백그라운드 자동화 템플릿

> `/automation` Step 3-A에서 로드한다. OS별 스케줄러(launchd·systemd·Task Scheduler) 등록 템플릿.

## macOS — launchd plist

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

## Linux — systemd timer

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

## Windows — Task Scheduler (PowerShell)

```powershell
# 매일 오전 9시 실행 등록
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NonInteractive -File C:\automation\task.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
Register-ScheduledTask -Action $action -Trigger $trigger `
  -TaskName "MyAutomation" -Description "자동화"
```

## Windows — AutoHotkey (단축키)

```ahk
; Win+Shift+A 누르면 실행
#^+A::
    Run, notepad.exe
    WinWaitActive, 메모장
    Send, 자동 입력 텍스트
    return
```
