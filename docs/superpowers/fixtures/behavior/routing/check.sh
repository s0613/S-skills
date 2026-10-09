#!/usr/bin/env bash
# 케이스 L 단언 — out-L{nn}.txt의 ROUTE: 줄만 본다 (근거 문단은 보지 않는다).
# 사용: bash check.sh <out 파일이 있는 디렉토리>
set -u
DIR="${1:?out 디렉토리}"
HERE="$(cd "$(dirname "$0")" && pwd)"
fail=0
while IFS=$'\t' read -r id task expect forbid why; do
  [ "$id" = "id" ] && continue
  out="$DIR/out-$id.txt"
  line=$(grep -m1 '^ROUTE:' "$out" 2>/dev/null)
  if [ -z "$line" ]; then
    echo "FAIL $id: ROUTE 줄 없음 ($out)"; fail=$((fail+1)); continue
  fi
  if ! echo "$line" | grep -qF -- "$expect"; then
    echo "FAIL $id: '$expect' 기대, 실제 → $line"; fail=$((fail+1)); continue
  fi
  if echo "$line" | grep -qE -- "$forbid"; then
    echo "FAIL $id: 금지 대상 매치 ($forbid) → $line"; fail=$((fail+1)); continue
  fi
  echo "PASS $id: $line"
done < "$HERE/cases.tsv"
echo "---"
[ "$fail" -eq 0 ] && echo "케이스 L 통과" || echo "케이스 L 실패 ${fail}건"
exit "$fail"
