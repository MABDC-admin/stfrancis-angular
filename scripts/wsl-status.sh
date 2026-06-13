#!/usr/bin/env bash
set -euo pipefail

echo "PostgreSQL:"
pg_lsclusters || true

echo
echo "Listeners:"
ss -ltnp | grep -E ':3000|:4200|:5432' || true

echo
echo "HTTP checks:"
if curl -fsS http://127.0.0.1:4200 >/dev/null 2>&1; then
  echo "Frontend: OK http://127.0.0.1:4200"
else
  echo "Frontend: DOWN http://127.0.0.1:4200"
fi

if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
  echo "Backend: OK http://127.0.0.1:3000"
else
  status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 || true)"
  if [ "$status" = "401" ]; then
    echo "Backend: OK http://127.0.0.1:3000 (auth protected)"
  else
    echo "Backend: DOWN http://127.0.0.1:3000"
  fi
fi
