#!/usr/bin/env bash
set -euo pipefail

pnpm run lint
pnpm run typecheck
pnpm run test:unit
