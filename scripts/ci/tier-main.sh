#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ "${CI:-false}" == "true" ]]; then
    ./scripts/ci/bootstrap-e2e-db.sh --teardown
  fi
}

trap cleanup EXIT

./scripts/ci/tier-beta.sh
pnpm run db:check
pnpm run build
./scripts/ci/assert-e2e-prereqs.sh
./scripts/ci/bootstrap-e2e-db.sh
pnpm run test:e2e
