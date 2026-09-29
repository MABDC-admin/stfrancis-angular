#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.vps.yml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.vps}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-${1:-}}"

trim_cr() {
  local value="${1:-}"
  value="${value//$'\r'/}"
  printf '%s' "$value"
}

POSTGRES_DB="$(trim_cr "${POSTGRES_DB:-}")"
POSTGRES_USER="$(trim_cr "${POSTGRES_USER:-}")"
POSTGRES_PASSWORD="$(trim_cr "${POSTGRES_PASSWORD:-}")"
SOURCE_DATABASE_URL="$(trim_cr "$SOURCE_DATABASE_URL")"

if [[ -z "$SOURCE_DATABASE_URL" ]]; then
  echo "Usage: SOURCE_DATABASE_URL='postgresql://...' $0" >&2
  echo "   or: $0 'postgresql://...'" >&2
  exit 1
fi

sanitize_database_url() {
  local raw_url="$1"
  raw_url="${raw_url//\?pgbouncer=true&/\?}"
  raw_url="${raw_url//&pgbouncer=true/}"
  raw_url="${raw_url//\?pgbouncer=true/}"
  printf '%s' "$raw_url"
}

SOURCE_DATABASE_URL="$(sanitize_database_url "$SOURCE_DATABASE_URL")"

if [[ -z "${POSTGRES_DB:-}" || -z "${POSTGRES_USER:-}" ]]; then
  echo "POSTGRES_DB and POSTGRES_USER must be defined in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "POSTGRES_PASSWORD must be defined in $ENV_FILE" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

run_neon_dump() {
  local dump_mode="$1"
  docker run --rm postgres:18-alpine sh -lc \
    "pg_dump --dbname \"$SOURCE_DATABASE_URL\" --no-owner --no-privileges $dump_mode" |
    sed '/^SET transaction_timeout = /d'
}

echo "[1/6] Stopping app containers that hold DB connections"
compose stop api web

echo "[2/6] Waiting for postgres container"
compose up -d postgres >/dev/null
compose exec -T postgres sh -lc 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 1; done'

echo "[3/6] Recreating target database $POSTGRES_DB"
compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

echo "[4/6] Importing live Neon schema"
run_neon_dump "--schema-only" | compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "[5/6] Importing live Neon data"
run_neon_dump "--data-only" | compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

echo "[6/6] Restarting app containers"
compose up -d api web >/dev/null

echo "Primary rebuild complete."
