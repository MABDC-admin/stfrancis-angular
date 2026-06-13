#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/root/sfxsai/logs"

stop_pid_file() {
  local file="$1"
  if [ -s "$file" ]; then
    local pid
    pid="$(cat "$file")"
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

stop_pid_file "$LOG_DIR/backend.pid"
stop_pid_file "$LOG_DIR/frontend.pid"

pkill -f 'node dist/src/main' >/dev/null 2>&1 || true
pkill -f 'ng serve --host 0.0.0.0 --port 4200' >/dev/null 2>&1 || true
pkill -f 'npm run start:prod' >/dev/null 2>&1 || true

rm -f "$LOG_DIR/backend.pid" "$LOG_DIR/frontend.pid"

echo "Stopped SFXSAI backend/frontend. PostgreSQL remains running."
