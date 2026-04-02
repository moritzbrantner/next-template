#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3006}"

pnpm run build
exec node ./scripts/serve-prod.mjs --port "$PORT" --host 127.0.0.1
