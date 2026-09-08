#!/usr/bin/env bash
set -euo pipefail

export AUTH_SECRET="${AUTH_SECRET:-ci-build-secret-ci-build-secret}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/next_template?schema=public}"
export SITE_URL="${SITE_URL:-http://127.0.0.1:3000}"
export EMAIL_PROVIDER="${EMAIL_PROVIDER:-smtp}"
export EMAIL_FROM="${EMAIL_FROM:-no-reply@example.com}"
export SMTP_HOST="${SMTP_HOST:-localhost}"
export SMTP_PORT="${SMTP_PORT:-1025}"
export SMTP_USER="${SMTP_USER:-ci}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-ci}"
export SMTP_SECURE="${SMTP_SECURE:-false}"
export INTERNAL_CRON_SECRET="${INTERNAL_CRON_SECRET:-ci-cron-secret}"

exec bun run build
