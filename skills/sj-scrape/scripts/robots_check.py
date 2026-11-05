"""robots.txt 판정 — Scrapling 스파이더와 같은 파서(protego, RFC 9309 최장 일치)를 쓴다.

사용: uv run --python 3.12 --with 'scrapling[all]' python robots_check.py <도메인 URL> <대상 URL>...
출력(대상마다 한 줄): 허용 | 차단 | robots 없음(허용으로 간주) | 확인 실패: <이유>
"""
import sys
import urllib.error
import urllib.request

from protego import Protego


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit("사용: robots_check.py <도메인 URL> <대상 URL>...")
    base, targets = sys.argv[1].rstrip("/"), sys.argv[2:]
    req = urllib.request.Request(base + "/robots.txt", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        verdict = "robots 없음(허용으로 간주)" if e.code in (404, 410) else f"확인 실패: HTTP {e.code}"
        for t in targets:
            print(f"{verdict}\t{t}")
        return
    except Exception as e:  # 네트워크 오류는 판정이 아니다 — 미수행으로 기록
        for t in targets:
            print(f"확인 실패: {type(e).__name__}\t{t}")
        return
    rp = Protego.parse(body)
    delay = rp.crawl_delay("*")
    for t in targets:
        print(f"{'허용' if rp.can_fetch(t, '*') else '차단'}\tcrawl-delay={delay}\t{t}")


if __name__ == "__main__":
    main()
