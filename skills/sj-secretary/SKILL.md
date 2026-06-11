---
name: sj-secretary
version: 3.1.1
description: |
  프로젝트 상태 보고 에이전트. 모든 프로젝트의 PROJECT.md를 읽어
  어떤 프로젝트가 어떤 작업 중이고, 목표까지 현재 어떤 단계이며,
  다음 할 일이 무엇인지 우선순위로 정렬 출력.
  보고서 에코 없음. WBS/KPI 없음. 어디서 시작할지 한눈에.
allowed-tools:
  - Bash
  - Read
triggers:
  - /secretary
---

# Secretary — 프로젝트 상태 보고

어떤 프로젝트의 파일도 수정하지 않는다. 읽기 전용.

## Step 1: 프로젝트 디스커버리 + 인덱스 업데이트

```bash
CENTRAL="$HOME/.sj-company"
INDEX="$CENTRAL/projects.json"
mkdir -p "$CENTRAL/projects"
[ -f "$INDEX" ] || echo "{}" > "$INDEX"

if command -v mdfind >/dev/null 2>&1; then
  mdfind -onlyin "$HOME" "kMDItemFSName == 'sj-company'" 2>/dev/null > /tmp/sec-raw.txt
else
  find "$HOME" -type d -name sj-company \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/.Trash/*' \
    -not -path '*/Library/*' \
    -not -path '*/.cache/*' 2>/dev/null > /tmp/sec-raw.txt
fi

[ -d "$(pwd)/docs/sj-company" ] && echo "$(pwd)/docs/sj-company" >> /tmp/sec-raw.txt

python3 - "$INDEX" /tmp/sec-raw.txt <<'PY'
import json, os, sys
idx_path, raw_path = sys.argv[1], sys.argv[2]
with open(idx_path) as f: idx = json.load(f)

discovered = set()
with open(raw_path) as f:
    for line in f:
        d = line.strip()
        if not d or not os.path.isdir(d): continue
        if os.path.basename(d) != "sj-company": continue
        if os.path.basename(os.path.dirname(d)) != "docs": continue
        project_root = os.path.dirname(os.path.dirname(d))
        discovered.add(project_root)

def make_slug(path, idx):
    name = os.path.basename(path)
    slug = ''.join(c if c.isalnum() or c == '-' else '-' for c in name.lower())
    slug = '-'.join(p for p in slug.split('-') if p)
    if slug in idx and idx[slug] != path:
        parent = os.path.basename(os.path.dirname(path))[:6].lower()
        slug = f"{parent}-{slug}"
    return slug

existing_paths = set(idx.values())
for path in sorted(discovered):
    if path in existing_paths: continue
    slug = make_slug(path, idx)
    idx[slug] = path
    existing_paths.add(path)

with open(idx_path, "w") as f: json.dump(idx, f, indent=2, ensure_ascii=False)
PY
```

## Step 2: 각 프로젝트 상태 수집

```bash
python3 - "$INDEX" > /tmp/secretary-data.json <<'PY'
import json, os, sys, re

with open(sys.argv[1], encoding="utf-8") as f:
    idx = json.load(f)
out = []

def get(text, key):
    m = re.search(rf"^{key}:(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else ""

for slug, path in idx.items():
    docs = os.path.join(path, "docs/sj-company")
    project_md = os.path.join(docs, "PROJECT.md")
    info = {"slug": slug, "path": path, "name": os.path.basename(path)}

    # 프로젝트 1개가 깨져도(권한·손상 파일) 나머지 보고는 계속한다
    try:
        if os.path.isfile(project_md):
            with open(project_md, encoding="utf-8", errors="replace") as f:
                text = f.read()
            info["has_project"] = True
            info["goal"]         = get(text, "goal")
            info["last_session"] = get(text, "last_session")
            info["progress"]     = get(text, "progress")
            info["next"]         = get(text, "next")
            info["blockers"]     = get(text, "blockers")
            info["status"]       = get(text, "status") or "active"
            inbox = os.path.join(docs, "triage-inbox.md")
            if os.path.isfile(inbox):
                with open(inbox, encoding="utf-8", errors="replace") as f:
                    info["inbox_open"] = sum(1 for l in f if l.startswith("- [ ]"))
            name_m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
            if name_m:
                info["name"] = name_m.group(1).strip()
        else:
            info["has_project"] = False
            # 레거시 여부: report.md 또는 stage.txt 존재
            info["legacy"] = (
                os.path.isfile(os.path.join(docs, "report.md")) or
                os.path.isfile(os.path.join(docs, ".state", "stage.txt"))
            )
            info["exists"] = os.path.isdir(docs)
    except Exception as e:
        info["has_project"] = False
        info["error"] = str(e)

    out.append(info)

print(json.dumps(out, ensure_ascii=False, indent=2))
PY
```

Read 툴로 `/tmp/secretary-data.json` 읽기.

## Step 3: 우선순위 정렬 + 브리핑 출력

우선순위 규칙:
1. `status=blocked` → **[긴급]**
2. `blockers != "없음"` → **[주의]**
3. `status=active` + `next != "없음"` → **[진행]**
4. `status=active` + `next = "없음"` → **[대기]**
5. `status=done` → **[완료]**
6. `has_project=False` + `legacy=True` → **[레거시]** (구버전 sj-company)
7. `has_project=False` + `exists=False` → **[사라짐]**
8. `error` 필드 존재 → **[확인 불가]** — `{name} (`{slug}`) — {error}` 한 줄로 표시

`{현재}` 값: `progress`가 있고 "없음"이 아니면 `progress`, 아니면 `last_session`.

`inbox_open`이 1 이상인 프로젝트는 해당 항목 안에 `수신함: 미처리 {n}건 → docs/sj-company/triage-inbox.md` 줄을 추가한다 (자동 루프가 발견했지만 사람 판단이 필요한 항목).

출력 포맷:

```
[프로젝트 상태 보고] {YYYY-MM-DD} · 프로젝트 {N}개
진행중 {A}개 · 긴급/주의 {U}개 · 완료 {D}개

[긴급] {name} (`{slug}`)
  목표: {goal}
  현재: {현재}
  블로커: {blockers}
  → /sj-company (블로커 해소 후)

[주의] {name} (`{slug}`)
  목표: {goal}
  현재: {현재}
  주의: {blockers}
  → /sj-company "{next}"

[진행] {name} (`{slug}`)
  목표: {goal}
  현재: {현재}
  다음: {next}
  → /sj-company "{next}"

[대기] {name} (`{slug}`)
  목표: {goal}
  → /sj-company <새 태스크>

[완료] {name} (`{slug}`)
  → /sj-company <새 태스크>

[레거시] {name} (`{slug}`)
  PROJECT.md 없음 — 구버전 sj-company 사용
  → /sj-company 첫 호출 시 자동 마이그레이션

오늘 어디서 시작할까요?
```

## 비서가 절대 하지 말 것

- 어떤 파일도 수정하지 않는다
- WBS 테이블, KPI, report.md 파싱 없음
- 추측 없음 — PROJECT.md 없으면 레거시/사라짐으로 표기
