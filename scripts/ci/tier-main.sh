#!/usr/bin/env bash
set -euo pipefail

./scripts/ci/tier-beta.sh
bun run db:check
bun run build
bun run test:e2e
