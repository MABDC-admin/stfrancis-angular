#!/usr/bin/env bash
set -euo pipefail

ROOT="/root/sfxsai/sms-angular-registrar-module-starter"
LOG_DIR="/root/sfxsai/logs"
BACKEND_DIR="$ROOT/sms-nestjs-backend"
FRONTEND_DIR="$ROOT/sms-angular-dashboard-starter"

mkdir -p "$LOG_DIR"

pg_ctlcluster 16 main start >/dev/null 2>&1 || true

start_backend() {
  if ss -ltnp | grep -q ':3000 '; then
    echo "Backend already listening on :3000"
    return
  fi

  cd "$BACKEND_DIR"
  npm run build >/tmp/sfxsai-backend-build.log 2>&1
  rm -f "$LOG_DIR/backend.log"
  setsid sh -c 'npm run start:prod > /root/sfxsai/logs/backend.log 2>&1 < /dev/null' &
  echo "$!" > "$LOG_DIR/backend.pid"
}

start_frontend() {
  if ss -ltnp | grep -q ':4200 '; then
    echo "Frontend already listening on :4200"
    return
  fi

  cd "$FRONTEND_DIR"
  rm -f "$LOG_DIR/frontend.log"
  setsid sh -c 'npx ng serve --host 0.0.0.0 --port 4200 --poll 2000 > /root/sfxsai/logs/frontend.log 2>&1 < /dev/null' &
  echo "$!" > "$LOG_DIR/frontend.pid"
}

start_backend
start_frontend

sleep 5
"$ROOT/scripts/wsl-status.sh"
