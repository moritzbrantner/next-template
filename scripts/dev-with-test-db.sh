#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="$(basename "$APP_ROOT" | tr -cs '[:alnum:]' '-' | sed 's/^-*//; s/-*$//')"

export DEV_DB_PORT="${DEV_DB_PORT:-55434}"
export DEV_DB_NAME="${DEV_DB_NAME:-next_template}"
export DEV_DB_USER="${DEV_DB_USER:-postgres}"
export DEV_DB_PASSWORD="${DEV_DB_PASSWORD:-postgres}"
export DEV_DB_CONTAINER_NAME="${DEV_DB_CONTAINER_NAME:-${APP_NAME}-dev-postgres}"
export DEV_DATABASE_URL="${DEV_DATABASE_URL:-postgresql://${DEV_DB_USER}:${DEV_DB_PASSWORD}@127.0.0.1:${DEV_DB_PORT}/${DEV_DB_NAME}?schema=public}"
export DATABASE_URL="$DEV_DATABASE_URL"
export DB_BOOTSTRAP_TIMEOUT_SECONDS="${DB_BOOTSTRAP_TIMEOUT_SECONDS:-90}"
DEV_APP_PID=""

docker_available() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

container_exists() {
  docker container inspect "$DEV_DB_CONTAINER_NAME" >/dev/null 2>&1
}

stop_database() {
  if container_exists; then
    echo "Stopping ephemeral dev database..."
    docker rm -f "$DEV_DB_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM

  if [[ -n "$DEV_APP_PID" ]] && kill -0 "$DEV_APP_PID" >/dev/null 2>&1; then
    kill "$DEV_APP_PID" >/dev/null 2>&1 || true
    wait "$DEV_APP_PID" >/dev/null 2>&1 || true
  fi

  stop_database

  exit "$exit_code"
}

wait_for_database() {
  (
    cd "$APP_ROOT"
    node --eval '
      (async () => {
        const { Client } = require("pg");
        const timeoutSeconds = Number(process.env.DB_BOOTSTRAP_TIMEOUT_SECONDS ?? "90");
        const start = Date.now();

        while (Date.now() - start < timeoutSeconds * 1_000) {
          const client = new Client({ connectionString: process.env.DATABASE_URL });

          try {
            await client.connect();
            await client.query("SELECT 1");
            process.exit(0);
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } finally {
            await client.end().catch(() => undefined);
          }
        }

        console.error("Timed out waiting for Postgres after " + timeoutSeconds + "s.");
        process.exit(1);
      })();
    '
  )
}

if ! docker_available; then
  echo "Docker is required for pnpm dev because it now starts an ephemeral Postgres database." >&2
  exit 1
fi

trap cleanup EXIT INT TERM

stop_database

echo "Starting ephemeral dev database on port ${DEV_DB_PORT}..."
docker run \
  --detach \
  --rm \
  --name "$DEV_DB_CONTAINER_NAME" \
  --tmpfs /var/lib/postgresql/data:rw \
  --publish "${DEV_DB_PORT}:5432" \
  --env "POSTGRES_DB=${DEV_DB_NAME}" \
  --env "POSTGRES_USER=${DEV_DB_USER}" \
  --env "POSTGRES_PASSWORD=${DEV_DB_PASSWORD}" \
  postgres:16-alpine >/dev/null

echo "Waiting for dev database readiness..."
wait_for_database

echo "Applying migrations to ephemeral dev database..."
(
  cd "$APP_ROOT"
  pnpm run db:migrate
)

echo "Generating db-schema.json for local admin tooling..."
(
  cd "$APP_ROOT"
  pnpm run db:schema:generate
)

echo "Seeding baseline users into ephemeral dev database..."
(
  cd "$APP_ROOT"
  pnpm run db:seed:test-users
)

echo "Launching app against the ephemeral database on port ${DEV_DB_PORT}..."
(
  cd "$APP_ROOT"
  pnpm run dev:app -- "$@"
) &
DEV_APP_PID=$!
wait "$DEV_APP_PID"
