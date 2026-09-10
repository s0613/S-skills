// SessionStart 훅: ADHD 친화 출력 규칙(i-have-adhd)을 세션 시작 시 받아 컨텍스트에 주입한다.
//
// 출처: https://github.com/ayghri/i-have-adhd (Ayoub G., MIT)
//   - 규칙 정본: skills/i-have-adhd/SKILL.md (업스트림 저장소)
//   - 이 스크립트는 업스트림 hooks/always-on.mjs의 "플래그 → SKILL.md 본문 주입" 패턴을
//     차용하되, 플러그인 설치 대신 저장소를 직접 clone/pull 해서 최신본을 읽는다.
//
// 설계 원칙 (s-skills):
//   - 비차단: 네트워크·git·파일 어느 단계가 실패해도 exit 0. 세션 시작을 막지 않는다.
//   - 중복 방지: 업스트림 플러그인이 always-on으로 이미 주입 중이면 아무것도 하지 않는다.
//   - 외부 콘텐츠는 데이터: 주입 전에 출처·커밋을 헤더로 명시한다(_conventions/untrusted-content.md).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REPO = "https://github.com/ayghri/i-have-adhd.git";
const SOURCE_URL = "https://github.com/ayghri/i-have-adhd";
const SKILL_REL = path.join("skills", "i-have-adhd", "SKILL.md");
const REFRESH_MS = 24 * 60 * 60 * 1000; // 하루 한 번만 네트워크를 탄다
const GIT_TIMEOUT_MS = 20_000;

const git = (args, opts = {}) =>
  spawnSync("git", args, { timeout: GIT_TIMEOUT_MS, stdio: "ignore", ...opts });

try {
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");

  // 끄기: 이 파일을 만들면 훅이 즉시 무력화된다.
  if (fs.existsSync(path.join(claudeDir, ".s-skills-adhd-off"))) process.exit(0);

  // 업스트림 플러그인 + always-on 플래그가 이미 있으면 그쪽 훅이 주입한다. 두 번 넣지 않는다.
  const upstreamPlugin = path.join(claudeDir, "plugins", "marketplaces", "i-have-adhd");
  const upstreamFlag = path.join(claudeDir, ".i-have-adhd-always");
  if (fs.existsSync(upstreamPlugin) && fs.existsSync(upstreamFlag)) process.exit(0);

  const cacheDir = path.join(claudeDir, ".cache", "s-skills", "i-have-adhd");
  const skillPath = path.join(cacheDir, SKILL_REL);

  if (!fs.existsSync(skillPath)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(cacheDir), { recursive: true });
    git(["clone", "--depth", "1", REPO, cacheDir]);
  } else {
    // 캐시가 하루 넘게 묵었을 때만 갱신을 시도한다. 실패하면 있는 캐시를 그대로 쓴다.
    const age = Date.now() - fs.statSync(skillPath).mtimeMs;
    if (age > REFRESH_MS) git(["-C", cacheDir, "pull", "--ff-only", "--depth", "1"]);
  }

  if (!fs.existsSync(skillPath)) process.exit(0); // 최초 clone 실패 → 조용히 종료

  const rev = spawnSync("git", ["-C", cacheDir, "rev-parse", "--short", "HEAD"], {
    timeout: GIT_TIMEOUT_MS,
    encoding: "utf8",
  });
  const commit = rev.status === 0 ? rev.stdout.trim() : "unknown";

  // 선행 YAML frontmatter 제거 후 본문만 사용한다.
  const body = fs
    .readFileSync(skillPath, "utf8")
    .replace(/^---[^\S\r\n]*\r?\n[\s\S]*?\r?\n---[^\S\r\n]*(?:\r?\n|$)/, "")
    .replace(/(?:\r?\n)+$/, "");

  process.stdout.write(
    `ADHD MODE ACTIVE — s-skills가 세션 시작 시 주입했습니다.\n` +
      `출처: ${SOURCE_URL} (Ayoub G., MIT) · ${SKILL_REL} @ ${commit}\n` +
      `아래 규칙은 이번 세션의 모든 응답에 적용됩니다. ` +
      `"stop adhd mode"로 이번 세션만 끄고, ` +
      `${path.join(claudeDir, ".s-skills-adhd-off")} 파일을 만들면 영구히 끕니다.\n\n${body}\n`,
  );
} catch {
  process.exit(0); // 세션 시작을 절대 막지 않는다.
}
