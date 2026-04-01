#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3006}"

pnpm run build
exec pnpm exec srvx serve --prod -s dist/client dist/server/server.js --port "$PORT" --host 127.0.0.1
