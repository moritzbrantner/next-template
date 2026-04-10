#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE_PATH="${APP_ROOT}/docker-compose.yml"
MARKER_FILE="${TMPDIR:-/tmp}/next-template-e2e-db-bootstrap.started"

export POSTGRES_PORT="${POSTGRES_PORT:-55433}"
export DB_BOOTSTRAP_TIMEOUT_SECONDS="${DB_BOOTSTRAP_TIMEOUT_SECONDS:-90}"
export MAILPIT_BASE_URL="${MAILPIT_BASE_URL:-http://127.0.0.1:8025}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${POSTGRES_PORT}/next_template?schema=public"
  echo "ℹ️ DATABASE_URL was not set; defaulting to ${DATABASE_URL}"
fi

BOOTSTRAP_STARTED=0
STARTED_SERVICES=()

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

docker_compose() {
  docker compose -f "$COMPOSE_FILE_PATH" --project-directory "$APP_ROOT" "$@"
}

can_reach_mailpit() {
  node --eval '
    (async () => {
      const baseUrl = process.env.MAILPIT_BASE_URL;

      try {
        const response = await fetch(baseUrl + "/api/v1/info");
        process.exit(response.ok ? 0 : 1);
      } catch {
        process.exit(1);
      }
    })();
  ' >/dev/null 2>&1
}

teardown() {
  if [[ -f "$MARKER_FILE" ]]; then
    mapfile -t STARTED_SERVICES <"$MARKER_FILE"

    echo "ℹ️ Cleaning up compose services started by bootstrap script: ${STARTED_SERVICES[*]}"
    if docker_available && docker_compose_available; then
      (
        cd "$APP_ROOT"
        docker_compose stop "${STARTED_SERVICES[@]}"
        docker_compose rm -f "${STARTED_SERVICES[@]}"
      )
      echo "✅ Compose cleanup complete."
    else
      echo "⚠️ Marker file exists, but Docker is not available for cleanup. Remove the services manually if still running."
    fi
    rm -f "$MARKER_FILE"
  else
    echo "ℹ️ No bootstrap-owned compose services detected; skipping cleanup."
  fi
}

cleanup_on_error() {
  local exit_code=$?
  trap - EXIT

  if [[ $exit_code -ne 0 && $BOOTSTRAP_STARTED -eq 1 ]]; then
    echo "⚠️ Bootstrap failed after starting compose services; cleaning them up..."
    if docker_available && docker_compose_available; then
      (
        cd "$APP_ROOT"
        docker_compose stop "${STARTED_SERVICES[@]}"
        docker_compose rm -f "${STARTED_SERVICES[@]}"
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
  STARTED_SERVICES+=("postgres")
fi

if can_reach_mailpit; then
  echo "ℹ️ Reusing already-reachable Mailpit instance from ${MAILPIT_BASE_URL}."
else
  STARTED_SERVICES+=("mailpit")
fi

if (( ${#STARTED_SERVICES[@]} > 0 )); then
  if ! docker_available; then
    echo "❌ Required e2e services are unavailable, and Docker is not available." >&2
    echo "   Start Postgres/Mailpit yourself or run with Docker available." >&2
    exit 1
  fi

  if ! docker_compose_available; then
    echo "❌ Docker is available, but 'docker compose' is not." >&2
    exit 1
  fi

  for service in "${STARTED_SERVICES[@]}"; do
    if ! (
      cd "$APP_ROOT"
      docker_compose config --services | grep -Fxq "$service"
    ); then
      echo "❌ docker compose service '$service' is not defined in $APP_ROOT." >&2
      exit 1
    fi
  done

  echo "ℹ️ Starting compose services for e2e bootstrap: ${STARTED_SERVICES[*]}"
  (
    cd "$APP_ROOT"
    docker_compose up -d "${STARTED_SERVICES[@]}"
  )
  BOOTSTRAP_STARTED=1
  printf '%s\n' "${STARTED_SERVICES[@]}" >"$MARKER_FILE"
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

echo "ℹ️ Waiting for Mailpit readiness..."
node --eval '
  (async () => {
    const timeoutSeconds = Number(process.env.DB_BOOTSTRAP_TIMEOUT_SECONDS ?? "90");
    const start = Date.now();

    while (Date.now() - start < timeoutSeconds * 1_000) {
      try {
        const response = await fetch(process.env.MAILPIT_BASE_URL + "/api/v1/info");

        if (response.ok) {
          console.log("✅ Mailpit is ready.");
          process.exit(0);
        }
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.error("❌ Timed out waiting for Mailpit after " + timeoutSeconds + "s.");
    process.exit(1);
  })();
'

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
