#!/usr/bin/env bash
set -euo pipefail

./scripts/ci/tier-nightly.sh
pnpm run test:integration
