#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.vps.yml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.vps}"

if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Run this script from a deployed VPS checkout with docker-compose.vps.yml and .env.vps present." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

trim_cr() {
  local value="${1:-}"
  value="${value//$'\r'/}"
  printf '%s' "$value"
}

POSTGRES_DB="$(trim_cr "${POSTGRES_DB:-}")"
POSTGRES_USER="$(trim_cr "${POSTGRES_USER:-}")"
REPLICATION_USER="$(trim_cr "${REPLICATION_USER:-}")"

if [[ -z "$POSTGRES_DB" || -z "$POSTGRES_USER" || -z "$REPLICATION_USER" ]]; then
  echo "POSTGRES_DB, POSTGRES_USER, and REPLICATION_USER must be set in $ENV_FILE" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

echo "[1/3] Ensuring pg_hba allows remote replication clients"
compose exec -T postgres sh -lc '
  if ! grep -q "^host[[:space:]]\+replication[[:space:]]\+all[[:space:]]\+all[[:space:]]\+scram-sha-256$" "$PGDATA/pg_hba.conf"; then
    printf "\nhost replication all all scram-sha-256\n" >> "$PGDATA/pg_hba.conf"
  fi
  psql -U "$POSTGRES_USER" -d postgres -c "SELECT pg_reload_conf();"
'

echo "[2/3] Creating or verifying publication"
compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'sfxsai_publication'
  ) THEN
    CREATE PUBLICATION sfxsai_publication FOR ALL TABLES;
  END IF;
END
$$;
SQL

echo "[3/3] Current publication state"
compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT pubname, puballtables FROM pg_publication;"

echo "VPS primary publication is ready for Neon subscription."
