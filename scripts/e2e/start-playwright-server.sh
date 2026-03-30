#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3006}"

pnpm run build
exec pnpm run start -- --port "$PORT"
