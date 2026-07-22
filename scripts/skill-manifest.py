#!/usr/bin/env python3
"""skill-manifest — SKILL.md frontmatter를 진실의 원천으로 한 인벤토리 생성·정합성 검사.

gbrain(garrytan/gbrain)의 skills/manifest.json 패턴 차용. 단, manifest를 손으로
관리하지 않고 frontmatter에서 파생(derive)시켜 이중 관리 drift를 구조적으로 막는다.
"규칙이 병을 만들었으니 가드가 치료한다" — CLAUDE.md 스킬 표·버전 표기가 낡는 것을 CI가 잡는다.

사용법:
  python3 scripts/skill-manifest.py            # 정합성 검사 (drift 있으면 exit 1)
  python3 scripts/skill-manifest.py --check     # 동일
  python3 scripts/skill-manifest.py --write      # manifest.json 재생성
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS_DIR = os.path.join(ROOT, "skills")
MANIFEST = os.path.join(SKILLS_DIR, "manifest.json")
MARKETPLACE = os.path.join(ROOT, ".claude-plugin", "marketplace.json")
RESOLVER = os.path.join(SKILLS_DIR, "RESOLVER.md")
CLAUDE_MD = os.path.join(ROOT, "CLAUDE.md")
PACKAGE_JSON = os.path.join(ROOT, "package.json")


def parse_frontmatter(text):
    """SKILL.md frontmatter를 표준 라이브러리만으로 파싱 (PyYAML 비의존)."""
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not m:
        return None
    fm = m.group(1)
    out = {"raw": fm}
    for key in ("name", "version"):
        mm = re.search(rf"^{key}:\s*(.+)$", fm, re.MULTILINE)
        out[key] = mm.group(1).strip().strip("\"'") if mm else None
    out["has_description"] = bool(re.search(r"^description:", fm, re.MULTILINE))
    out["has_triggers"] = bool(re.search(r"^triggers:", fm, re.MULTILINE))
    # description 첫 의미 줄 (inline 또는 | 블록 다음 줄)
    desc = ""
    dm = re.search(r"^description:\s*(.*)$", fm, re.MULTILINE)
    if dm:
        inline = dm.group(1).strip()
        if inline and inline != "|":
            desc = inline.strip("\"'")
        else:
            tail = fm[dm.end():].lstrip("\n")
            for line in tail.splitlines():
                if line.strip():
                    desc = line.strip()
                    break
    out["description"] = desc
    # triggers 리스트
    triggers = []
    tm = re.search(r"^triggers:\s*$", fm, re.MULTILINE)
    if tm:
        for line in fm[tm.end():].splitlines():
            lm = re.match(r"\s*-\s*(.+)$", line)
            if lm:
                triggers.append(lm.group(1).strip())
            elif line.strip() and not line.startswith(" "):
                break
    out["triggers"] = triggers
    # allowed-tools 리스트
    allowed = []
    am = re.search(r"^allowed-tools:\s*$", fm, re.MULTILINE)
    if am:
        for line in fm[am.end():].splitlines():
            lm = re.match(r"\s*-\s*(.+)$", line)
            if lm:
                allowed.append(lm.group(1).strip())
            elif line.strip() and not line.startswith(" "):
                break
    out["allowed_tools"] = allowed
    # frontmatter 이후 본문 (도구 사용 탐지용)
    out["body"] = text[m.end():]
    return out


def collect_skills():
    """skills/*/SKILL.md 를 디렉토리명 순으로 수집."""
    skills = []
    for name in sorted(os.listdir(SKILLS_DIR)):
        skill_md = os.path.join(SKILLS_DIR, name, "SKILL.md")
        if not os.path.isfile(skill_md):
            continue  # _conventions 등 SKILL.md 없는 디렉토리는 제외
        with open(skill_md, encoding="utf-8") as f:
            fm = parse_frontmatter(f.read())
        skills.append((name, fm))
    return skills


def plugin_version():
    try:
        with open(PACKAGE_JSON, encoding="utf-8") as f:
            return json.load(f).get("version", "")
    except Exception:
        return ""


def build_manifest(skills):
    return {
        "name": "s-skills",
        "version": plugin_version(),
        "generated_by": "scripts/skill-manifest.py --write (do not edit by hand)",
        "skills": [
            {
                "name": fm.get("name") if fm else None,
                "path": f"skills/{name}/SKILL.md",
                "version": fm.get("version") if fm else None,
                "description": fm.get("description") if fm else "",
                "triggers": fm.get("triggers") if fm else [],
            }
            for name, fm in skills
        ],
    }


def check(skills):
    errors = []
    actual_names = {name for name, _ in skills}

    # 1. frontmatter 유효성 + name==dir
    for name, fm in skills:
        if fm is None:
            errors.append(f"[frontmatter] {name}/SKILL.md: --- 블록 파싱 실패")
            continue
        for field, present in (
            ("name", fm.get("name")),
            ("version", fm.get("version")),
            ("description", fm.get("has_description")),
            ("triggers", fm.get("has_triggers")),
        ):
            if not present:
                errors.append(f"[frontmatter] {name}/SKILL.md: '{field}' 누락")
        if fm.get("name") and fm["name"] != name:
            errors.append(f"[name-mismatch] {name}/SKILL.md: name='{fm['name']}' != 디렉토리명 '{name}'")

    # 2. RESOLVER 디스패치 대상이 실제 스킬인가 (트리거 별칭을 스킬명으로 호출하는 버그 탐지)
    with open(RESOLVER, encoding="utf-8") as f:
        resolver_text = f.read()
    for tgt in sorted(set(re.findall(r'Skill\("s-skills:([a-z0-9-]+)"\)', resolver_text))):
        if tgt not in actual_names:
            errors.append(f"[resolver-dispatch] RESOLVER가 Skill(\"s-skills:{tgt}\") 호출 — 그런 스킬 디렉토리 없음 (트리거 별칭을 스킬명으로 호출?)")

    # 3. CLAUDE.md 버전 표기 ↔ frontmatter version
    with open(CLAUDE_MD, encoding="utf-8") as f:
        claude_text = f.read()
    fm_version = {name: fm.get("version") for name, fm in skills if fm}
    for skill, ver in re.findall(r"\*\*s-skills:([a-z0-9-]+)\*\*.*?\bv(\d+\.\d+\.\d+)", claude_text):
        if skill in fm_version and fm_version[skill] and fm_version[skill] != ver:
            errors.append(f"[version-drift] CLAUDE.md: s-skills:{skill} v{ver} 표기 != frontmatter v{fm_version[skill]}")

    # 4. allowed-tools ↔ 본문 도구 사용 (선언 안 한 도구를 본문이 호출하는 drift 탐지)
    #    보수적 시그니처만 검사 — prose 오탐을 피하려 명시적 호출 형태만 본다.
    tool_sigs = {
        "WebFetch": r"\bWebFetch\b",
        "WebSearch": r"\bWebSearch\b",
        "Skill": r"\bSkill\(",
        "Agent": r"\bAgent\(",
        "AskUserQuestion": r"\bAskUserQuestion\b",
        "Edit": r"Edit 툴",
        "Write": r"Write 툴",
    }
    for name, fm in skills:
        if not fm:
            continue
        declared = set(fm.get("allowed_tools") or [])
        if not declared:
            continue  # allowed-tools 미선언 = 전체 허용으로 간주, 검사 제외
        body = fm.get("body", "")
        for tool, sig in tool_sigs.items():
            if re.search(sig, body) and tool not in declared:
                errors.append(f"[tool-undeclared] {name}/SKILL.md: 본문이 {tool} 사용 — allowed-tools에 미선언")

    # 5. manifest.json 최신 여부
    fresh = build_manifest(skills)
    if not os.path.isfile(MANIFEST):
        errors.append("[manifest-stale] skills/manifest.json 없음 — --write로 생성하세요")
    else:
        with open(MANIFEST, encoding="utf-8") as f:
            current = json.load(f)
        if current != fresh:
            errors.append("[manifest-stale] skills/manifest.json이 frontmatter와 불일치 — --write로 재생성하세요")

    # 6. .claude-plugin/marketplace.json 플러그인 버전 ↔ package.json (설치 버전 drift 방지)
    pkg_ver = plugin_version()
    if os.path.isfile(MARKETPLACE) and pkg_ver:
        try:
            with open(MARKETPLACE, encoding="utf-8") as f:
                mkt = json.load(f)
            for p in mkt.get("plugins", []):
                if p.get("name") == "s-skills" and p.get("version") != pkg_ver:
                    errors.append(
                        f"[plugin-version-drift] marketplace.json s-skills v{p.get('version')} != package.json v{pkg_ver} — 릴리즈 시 함께 범프"
                    )
        except Exception as e:
            errors.append(f"[marketplace] .claude-plugin/marketplace.json 파싱 실패: {e}")

    # 7. skills/VERSION ↔ package.json (harness가 설치 버전·업그레이드 안내에 읽는 파일)
    version_file = os.path.join(SKILLS_DIR, "VERSION")
    if pkg_ver:
        if not os.path.isfile(version_file):
            errors.append("[version-file] skills/VERSION 없음 — harness가 설치 버전을 unknown으로 보고함")
        else:
            with open(version_file, encoding="utf-8") as f:
                file_ver = f.read().strip()
            if file_ver != pkg_ver:
                errors.append(
                    f"[version-file-drift] skills/VERSION v{file_ver} != package.json v{pkg_ver} — 릴리즈 시 함께 범프"
                )

    return errors


def main():
    mode = "check"
    if "--write" in sys.argv:
        mode = "write"
    elif "--check" in sys.argv:
        mode = "check"

    skills = collect_skills()

    if mode == "write":
        manifest = build_manifest(skills)
        with open(MANIFEST, "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"manifest 생성: {len(manifest['skills'])}개 스킬 → skills/manifest.json")
        return 0

    errors = check(skills)
    if errors:
        print(f"정합성 검사 실패 — {len(errors)}건 drift:")
        for e in errors:
            print(f"  ✗ {e}")
        return 1
    print(f"정합성 검사 통과 — 스킬 {len(skills)}개, drift 없음")
    return 0


if __name__ == "__main__":
    sys.exit(main())
