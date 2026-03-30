#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
MARKER_FILE="${TMPDIR:-/tmp}/next-template-e2e-db-bootstrap.started"

export POSTGRES_PORT="${POSTGRES_PORT:-55433}"
export DB_BOOTSTRAP_TIMEOUT_SECONDS="${DB_BOOTSTRAP_TIMEOUT_SECONDS:-90}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${POSTGRES_PORT}/next_template?schema=public"
  echo "ℹ️ DATABASE_URL was not set; defaulting to ${DATABASE_URL}"
fi

BOOTSTRAP_STARTED=0

can_reach_database() {
  (
    cd "$APP_ROOT"
    node --eval '
      (async () => {
        const { Client } = require("pg");
        if (!process.env.DATABASE_URL) process.exit(1);

        const client = new Client({ connectionString: process.env.DATABASE_URL });

        try {
          await client.connect();
          await client.query("SELECT 1");
          process.exit(0);
        } catch {
          process.exit(1);
        } finally {
          await client.end().catch(() => undefined);
        }
      })();
    ' >/dev/null 2>&1
  )
}

docker_available() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

docker_compose_available() {
  docker compose version >/dev/null 2>&1
}

teardown() {
  if [[ -f "$MARKER_FILE" ]]; then
    echo "ℹ️ Cleaning up Postgres service started by bootstrap script..."
    if docker_available && docker_compose_available; then
      (
        cd "$APP_ROOT"
        docker compose down -v --remove-orphans
      )
      echo "✅ Postgres cleanup complete."
    else
      echo "⚠️ Marker file exists, but Docker is not available for cleanup. Remove the DB manually if still running."
    fi
    rm -f "$MARKER_FILE"
  else
    echo "ℹ️ No bootstrap-owned Postgres service detected; skipping cleanup."
  fi
}

cleanup_on_error() {
  local exit_code=$?
  trap - EXIT

  if [[ $exit_code -ne 0 && $BOOTSTRAP_STARTED -eq 1 ]]; then
    echo "⚠️ Bootstrap failed after starting Postgres; cleaning it up..."
    if docker_available && docker_compose_available; then
      (
        cd "$APP_ROOT"
        docker compose down -v --remove-orphans
      ) || true
    fi
    rm -f "$MARKER_FILE"
  fi

  exit "$exit_code"
}

if [[ "${1:-}" == "--teardown" ]]; then
  teardown
  exit 0
fi

trap cleanup_on_error EXIT

if can_reach_database; then
  echo "ℹ️ Reusing already-reachable Postgres instance from DATABASE_URL."
else
  if ! docker_available; then
    echo "❌ Could not connect to DATABASE_URL, and Docker is not available." >&2
    echo "   Either start Postgres yourself and set DATABASE_URL, or run under an act image with Docker available." >&2
    exit 1
  fi

  if ! docker_compose_available; then
    echo "❌ Docker is available, but 'docker compose' is not." >&2
    exit 1
  fi

  if ! (
    cd "$APP_ROOT"
    docker compose config --services | grep -Fxq "postgres"
  ); then
    echo "❌ docker compose service 'postgres' is not defined in $APP_ROOT." >&2
    exit 1
  fi

  echo "ℹ️ Starting Postgres service for e2e bootstrap..."
  (
    cd "$APP_ROOT"
    docker compose up -d postgres
  )
  BOOTSTRAP_STARTED=1
  touch "$MARKER_FILE"
fi

echo "ℹ️ Waiting for Postgres readiness..."
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
          console.log("✅ Postgres is ready.");
          process.exit(0);
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } finally {
          await client.end().catch(() => undefined);
        }
      }

      console.error("❌ Timed out waiting for Postgres after " + timeoutSeconds + "s.");
      process.exit(1);
    })();
  '
)

echo "ℹ️ Applying migrations..."
(
  cd "$APP_ROOT"
  pnpm run db:migrate
)

echo "ℹ️ Seeding baseline e2e users..."
(
  cd "$APP_ROOT"
  pnpm run db:seed:test-users
)

echo "✅ E2E DB bootstrap complete."
trap - EXIT