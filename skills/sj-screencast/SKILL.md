---
name: sj-screencast
version: 1.0.0
description: |
  화면 설명 영상(제품 데모·기능 소개·버그 재현) 제작 전문가.
  OpenScreen CLI(헤드리스)로 녹화 → 프로젝트 JSON을 줌·주석으로 편집 →
  내레이션·자막 → MP4/GIF 렌더까지 한 번에 끝낸다.
  "화면 녹화해줘", "데모 영상 만들어줘", "기능 설명 영상", "스크린캐스트",
  "GIF로 만들어줘", "이거 어떻게 쓰는지 영상으로" 같은 요청에 반응.
  화면은 사후 마스킹이 불가능하다 — 녹화 시작은 항상 사람 승인.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - AskUserQuestion
triggers:
  - /screencast
  - /sj-screencast
  - /데모영상
  - /화면녹화
---

# sj-screencast — 화면 설명 영상

[OpenScreen](https://github.com/getopenscreen/openscreen)(MIT) CLI를 도구로 쓴다.
GUI 편집기를 사람이 만지는 대신, **원고 → 녹화 → 프로젝트 JSON 편집 → 렌더**를
명령줄로 끝낸다. 영상 편집 앱을 열지 않고도 줌·주석·자막·내레이션이 들어간
설명 영상이 나온다.

이 스킬이 지키는 것 네 가지:

1. **화면은 되돌릴 수 없다** — 녹화 시작 전 사람 승인 + 화면 위생 점검. 찍힌 뒤
   발견한 비밀번호·토큰·고객 데이터는 편집으로 못 지운다(재촬영이 정답).
2. **소스를 추측하지 않는다** — `sources`로 실제 목록을 받은 뒤 `--window`/`--display` 확정.
3. **원고가 먼저다** — 설명 영상의 품질은 화질이 아니라 순서가 결정한다.
4. **만들었다는 말은 실제 파일 확인 후** — exit code·파일·프레임을 보고 보고한다.

> 이 스킬은 화면을 **조작하지 않는다.** 녹화 중 클릭·타이핑이 필요하면 사용자가
> 직접 하거나 `/sj-automation`으로 만든 스크립트를 병행 실행한다.

---

## Step 0. 바이너리·권한 확인 (매 실행 첫 단계)

CLI는 별도 패키지가 아니라 **앱 바이너리 안에 들어 있다.**

```bash
OS_BIN="$(command -v openscreen 2>/dev/null)"
[ -z "$OS_BIN" ] && for p in \
  "/Applications/Openscreen.app/Contents/MacOS/Openscreen" \
  "$HOME/Applications/Openscreen.app/Contents/MacOS/Openscreen" \
  "/opt/Openscreen/openscreen" ; do
  [ -x "$p" ] && OS_BIN="$p" && break
done
echo "${OS_BIN:-NOT_FOUND}"
```

Windows는 `"C:\Program Files\Openscreen\Openscreen.exe"`.

**없으면 설치를 안내하고 여기서 멈춘다.** 데스크톱 앱 설치와 화면 기록 권한 부여는
사람 게이트 — 대신 설치하지 않는다.

> OpenScreen을 먼저 설치해 주세요 (무료, MIT).
> - macOS: https://github.com/getopenscreen/openscreen/releases 에서 `.dmg`
> - Windows: `winget install --source msstore OpenScreen`
> - Linux: `.deb`/`.rpm`/`.AppImage` (Wayland는 PipeWire 포털 필요)
> 설치 후 **시스템 설정 → 개인정보 보호 → 화면 기록**에서 권한을 켜 주세요.

macOS 권한은 앱이 아니라 **Electron을 호스팅한 바이너리**(이 세션을 띄운 터미널)에
걸린다. 권한이 없으면 record가 성공한 척하고 **검은 화면**을 남긴다 — Step 9에서
프레임을 반드시 확인하는 이유다.

---

## Step 1. 무엇을 설명하는 영상인가

`AskUserQuestion` **최대 1회.** 비대화형 실행이면 아래 기본값으로 가정하고
산출물 `## 가정`에 적는다.

| 항목 | 기본값(가정) |
|---|---|
| 대상 | 실행 중인 앱 창 — 없으면 전체 화면(display 0) |
| 길이 | 30초 이하 (설명 영상은 짧을수록 끝까지 본다) |
| 내레이션 | 없음(주석·자막만). 요청 시 TTS |
| 형식 | `mp4`. 문서·README 삽입용이면 `gif`(무음) |

> **컨벤션:** [비대화형 실행](../_conventions/noninteractive.md) — 되돌릴 수 있는 선택은
> 좁은 쪽 기본값, **사람 게이트(Step 4 녹화 승인)는 가정하지 않는다.**

작업 폴더를 정한다: `docs/screencast/{slug}/` (원고·최종 명령어),
`.state/screencast/` (중간 산출물).

---

## Step 2. 소스 열거 — 추측 금지

```bash
mkdir -p .state/screencast
"$OS_BIN" sources -o .state/screencast/sources.json
```

`--json`(stdout) 대신 **`-o` 파일을 쓴다.** 래퍼(`xvfb-run`, 로그 수집기)가 Chromium
진단 출력을 stdout에 섞으면 JSON 파싱이 깨진다고 문서가 경고한다. 파일은 성공한
실행에서만 쓰이므로 **파일 존재가 아니라 exit code로 판단한다.**

파일 형태는 봉투 없이 payload 그대로다:

```bash
jq '.displays, .windows[] | select(.name|test("MyApp"))' .state/screencast/sources.json
```

이름이 여러 개 걸리거나 하나도 안 걸리면 목록을 사용자에게 보여주고 고르게 한다.
`--window`는 **제목 부분 일치 중 첫 번째**를 잡으므로 애매한 문자열은 위험하다.

---

## Step 3. 장면표(원고) — `docs/screencast/{slug}/script.md`

녹화 전에 쓴다. 이 표가 이후 줌·주석 타임코드의 원본이다.

```markdown
# {제목} 설명 영상 원고
- 대상: {window/display}   길이 목표: {n}초   형식: {mp4|gif}

| # | 시작(초) | 화면에서 하는 일 | 내레이션 / 자막 | 강조 |
|---|---------|-----------------|----------------|------|
| 1 | 0 | 앱 첫 화면 | "OO는 N초면 됩니다" | 주석: 제목 |
| 2 | 4 | 버튼 클릭 | "여기를 누르면" | 줌 depth 3 |
| 3 | 10 | 결과 화면 | "끝났습니다" | 주석: 화살표 |
```

규칙 넷:
- 한 장면 **8초 이하**, 전체 30초 이하.
- 첫 3초에 **무엇인지** 말한다 (기능 이름·해결하는 문제).
- 한 문장 40자 이하 — 자막으로 들어가면 화면을 가린다.
- 강조는 장면당 1개. 줌과 주석을 동시에 겹치면 둘 다 안 읽힌다.

---

## Step 4. 녹화 전 게이트 (사람 승인 필수)

> **컨벤션:** [사람 게이트](../_conventions/human-gate.md) — 되돌릴 수 없고 바깥으로
> 나가는 산출물은 사람이 승인한다. 비대화형이면 `보류: 사람 승인 필요`로 남기고
> Step 3까지의 산출물(원고·소스 목록·실행할 명령어)만 넘긴다.

승인 요청 시 이 체크리스트를 그대로 출력한다:

```
녹화를 시작하면 지금 보이는 화면이 그대로 영상에 담깁니다. 확인해 주세요:
  [ ] 비밀번호 매니저·1Password·키체인 창을 닫았다
  [ ] 터미널에 토큰·API 키·.env 내용이 떠 있지 않다
  [ ] 고객 실데이터·개인 메시지·메일 창이 없다 (데모 계정/시드 데이터 사용)
  [ ] 알림을 껐다 (집중 모드), 브라우저 탭 제목·북마크 바를 정리했다
  [ ] 녹화 대상: {window 이름} / {n}초
```

영상은 사후 마스킹이 사실상 불가능하다. 찍힌 뒤 발견하면 편집이 아니라 **재촬영**이
정답이며, 이미 공유했다면 회수할 수 없다.

---

## Step 5. 녹화

```bash
"$OS_BIN" record --window "MyApp" --duration 30 \
  --project .state/screencast/demo.openscreen --json
```

| 상황 | 옵션 |
|---|---|
| 전체 화면 | `--display 0` (인덱스는 Step 2 결과) |
| 목소리를 직접 녹음 | `--mic` 또는 `--mic-device "{라벨 일부}"` |
| 앱 소리 포함 | `--system-audio` |
| 길이를 미리 못 정함 | `--duration` 생략 → stdin에 `stop`+Enter, 또는 SIGINT |

`--cursor`는 **기본값(editable-overlay)을 유지한다.** 커서 텔레메트리(`.cursor.json`)가
있어야 자동 줌과 커서 편집이 동작한다. `--cursor system`은 커서를 영상에 구워버려
되돌릴 수 없다.

플랫폼 함정:
- **macOS**: CLI 녹화는 웹캠을 지원하지 않는다.
- **Windows**: SIGTERM이 없다 — `taskkill`로 죽이면 녹화가 날아간다. `--duration`이나
  stdin `stop`을 쓴다.
- **Linux/Wayland**: 포털 선택 다이얼로그가 뜨고, 데스크톱 세션이 없는 SSH에서는 녹화 불가.

길이를 정하지 않고 사용자가 직접 조작해야 하면 **백그라운드로 실행**하고, 조작이
끝났다는 신호를 받은 뒤 정지시킨다.

---

## Step 6. 프로젝트 편집 — 장면표를 줌·주석으로

`.openscreen`은 그냥 JSON이다. 원고의 초 단위를 밀리초로 옮긴다.

```bash
node -e '
  const fs = require("fs"), f = ".state/screencast/demo.openscreen";
  const p = JSON.parse(fs.readFileSync(f, "utf8"));
  p.editor.zoomRegions.push({ id: "z1", startMs: 4000, endMs: 9000, depth: 3,
    focus: { cx: 0.5, cy: 0.4 }, focusMode: "manual", source: "manual" });
  p.editor.annotationRegions.push({ id: "a1", startMs: 0, endMs: 3000,
    type: "text", content: "One-click setup", textContent: "One-click setup",
    position: { x: 8, y: 6 }, size: { width: 40, height: 12 },
    style: { fontSize: 24, color: "#fff" }, zIndex: 1 });
  fs.writeFileSync(f, JSON.stringify(p, null, 2));
'
```

- `focus.cx/cy`는 0~1 비율 좌표(좌상단 원점), `depth`는 배율.
- 수동 줌은 **"꼭 봐야 할 곳"에만.** 나머지는 Step 8의 `--auto-zoom`이 커서 체류를
  보고 채운다(기존 줌과 겹치지 않는다).
- 편집 후 JSON이 깨지지 않았는지 `node -e 'JSON.parse(...)'`로 확인한다 — 깨진 채
  export하면 실패 메시지가 원인을 정확히 알려주지 않는다.

---

## Step 7. 내레이션·자막

**내레이션(TTS)** — mp3/wav/m4a면 무엇이든 된다. AIFF는 지원하지 않는다.

```bash
say -o .state/screencast/voice.m4a --file-format=m4af -f script.txt   # macOS 내장
```

**자막(`captions`)의 순서 함정** — `captions`는 *프로젝트 안 영상의 오디오*를 전사한다.
TTS 내레이션은 export 단계에서 섞이므로, **TTS만 쓰면 자막을 뽑을 오디오가 없다.**

| 원하는 것 | 하는 법 |
|---|---|
| 목소리 + 자동 자막 | `record --mic`로 말하며 녹화 → `captions` → `export` |
| TTS 내레이션 + 자막 | 자막은 Step 6에서 **주석 텍스트로 직접** 넣는다 (원고가 이미 있다) |
| 자막만 | 주석 텍스트로 넣는다 |

```bash
"$OS_BIN" captions .state/screencast/demo.openscreen --min-words 2 --max-words 7
```

온디바이스 whisper.cpp — 업로드는 없다. 첫 실행에 모델을 내려받는다.
재실행하면 자동 자막만 교체되고 수동 주석은 보존된다.

---

## Step 8. 렌더

```bash
"$OS_BIN" export .state/screencast/demo.openscreen \
  -o docs/screencast/{slug}/demo.mp4 \
  --auto-zoom --quality good \
  --audio .state/screencast/voice.m4a --audio-mode replace --json
```

| 원하는 것 | 옵션 |
|---|---|
| README·문서 삽입용 GIF | `-o demo.gif --gif-fps 20 --gif-size large` (**무음** — 내레이션이 있으면 mp4) |
| 원본 화질 | `--quality source` (용량 급증) |
| 앱 소리 위에 내레이션 | `--audio-mode mix` (원본을 40%로 낮춰 섞는다) |

**미디어 경로 규칙**: 프로젝트가 참조하는 영상은 앱 recordings 디렉토리 또는
**프로젝트 파일 바로 옆**에 있을 때만 자동 승인된다. 옮겨야 하면 `pack`을 쓴다:

```bash
"$OS_BIN" pack .state/screencast/demo.openscreen --out .state/screencast/bundle/
```

**취소가 없다** — 렌더 중 프로세스를 죽여도 컴포지터 워커는 끝까지 돈다.
길이·화질을 먼저 확인하고 시작한다.

---

## Step 9. 검증 — 만들었다고 말하기 전에

> **컨벤션:** [정직 산출 계약](../_conventions/honest-report.md) — 실행 못 한 검증은
> `미수행: {이유}`로 남긴다. 은폐하지 않는다.

```bash
echo "exit=$?"                                   # 0이 아니면 여기서 멈춘다
ls -lh docs/screencast/{slug}/demo.mp4
"$OS_BIN" info .state/screencast/demo.openscreen --json
```

파일이 생겼다고 화면이 담긴 것은 아니다. **프레임을 뽑아서 직접 본다:**

```bash
ffmpeg -v error -i docs/screencast/{slug}/demo.mp4 \
  -vf "fps=1/8,scale=640:-1" -frames:v 3 .state/screencast/frame-%02d.png
```

세 장을 Read로 열어 확인한다:
- **검은 화면/빈 창** → macOS 화면 기록 권한 (Step 0). 재촬영해야 한다.
- 엉뚱한 창 → `--window` 부분 일치가 다른 창을 잡았다 (Step 2로).
- 화면에 토큰·개인정보가 보인다 → **파일을 지우고 재촬영.** 공유했다면 즉시 알린다.

`ffmpeg`이 없으면 `미수행: ffmpeg 없음 — 영상 내용 미확인`으로 기록하고, 사용자에게
직접 재생해 달라고 요청한다. 확인하지 않은 것을 확인했다고 쓰지 않는다.

---

## Step 10. 보고 + 재사용 자산

보고에 담을 것: 산출 경로, 길이, 해상도, 용량, 확인한 프레임에서 본 것, 미수행 항목.

다음에 또 찍는다 — 원고와 최종 명령어를 남긴다:

```
docs/screencast/{slug}/
├── script.md      ← 장면표 (다음 버전 영상의 출발점)
├── build.sh       ← record → 편집 → export 실제 실행한 명령 그대로
└── demo.mp4
```

`build.sh`는 이번에 **실제로 통과한** 명령만 담는다(추정 명령 금지). 다음 릴리즈에서
같은 화면을 다시 찍을 때 이 파일이 재촬영 비용을 0에 가깝게 만든다.

> **컨벤션:** [프릭션 로그](../_conventions/friction-log.md) — 권한 거부·검은 화면·
> 소스 오매치 등으로 재촬영했다면 완료 보고 직전에
> `docs/sj-company/friction.jsonl`에 한 줄 남긴다. 반복되면 회고가 잡는다.

---

## 하지 않는 것

| 요청 | 라우팅 |
|---|---|
| 화면을 클릭·타이핑하는 자동화 | `/sj-automation` (녹화와 병행 실행) |
| 이미 있는 영상 자르기·합치기만 | ffmpeg 직접 — OpenScreen 프로젝트가 없으면 이 스킬은 쓸모없다 |
| 마케팅용 카피·썸네일·게시글 | `/sj-marketing` (영상은 여기서, 배포 문구는 거기서) |
| 테스트 증거 영상 | `/pw-loop` (Playwright가 trace·video를 이미 남긴다) |
