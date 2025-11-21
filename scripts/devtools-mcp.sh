#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-9223}
USER_DIR=${USER_DIR:-/tmp/chrome-headless}
LOG=${LOG:-/tmp/chrome-mcp.log}
CHROME_BIN=${CHROME_BIN:-$(ls -d "$PWD"/chrome/linux-*/chrome-linux64/chrome 2>/dev/null | head -n1)}
PYTHON_BIN=${PYTHON_BIN:-python3}

start() {
  if [[ -z "${CHROME_BIN}" ]]; then
    echo "Chrome binary not found. Install via: npx @puppeteer/browsers install chrome@stable" >&2
    exit 1
  fi

  nohup "$CHROME_BIN" --headless=new --remote-debugging-port="$PORT" \
    --remote-debugging-address=0.0.0.0 --user-data-dir="$USER_DIR" \
    --no-sandbox >"$LOG" 2>&1 &
  echo "Chrome started on $PORT, log: $LOG, pid: $!"
}

endpoint() {
  "${PYTHON_BIN}" - <<'PY'
import json
import os
import urllib.request

port = os.environ.get("PORT", "9223")
url = f"http://localhost:{port}/json/version"
try:
    with urllib.request.urlopen(url, timeout=2) as resp:
        data = json.load(resp)
    print(data.get("webSocketDebuggerUrl", "(not running)"))
except Exception as e:
    print(f"(error: {e})")
PY
}

stop() {
  pkill -f "--remote-debugging-port=${PORT}" || true
}

case "${1:-}" in
  start) start ;;
  endpoint) endpoint ;;
  stop) stop ;;
  *) echo "usage: $0 {start|endpoint|stop} [env: PORT USER_DIR LOG CHROME_BIN]" ;;
esac
