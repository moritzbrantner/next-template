#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

source "${SCRIPT_DIR}/e2e-env.sh"
load_e2e_env_defaults "$APP_ROOT"

BUN_BINARY="${BUN_BINARY:-bun}"
BUNX_BINARY="${BUNX_BINARY:-bunx}"

cleanup() {
  if [[ "${CI:-false}" == "true" ]]; then
    "${SCRIPT_DIR}/bootstrap-e2e-db.sh" --teardown
  fi
}

ensure_e2e_port_available() {
  "$BUN_BINARY" --eval '
    const net = require("node:net");

    const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3006";
    const url = new URL(baseUrl);
    const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;

    if (!["127.0.0.1", "::1", "localhost"].includes(url.hostname)) {
      process.exit(0);
    }

    const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
    const server = net.createServer();

    server.once("error", (error) => {
      console.error(`E2E app port ${port} on ${host} is unavailable: ${error.message}`);
      console.error("Stop the existing process or set E2E_BASE_URL to a free local port.");
      process.exit(1);
    });

    server.once("listening", () => {
      server.close(() => process.exit(0));
    });

    server.listen(port, host);
  '
}

trap cleanup EXIT

cd "$APP_ROOT"

if [[ "${SKIP_PLAYWRIGHT_INSTALL:-false}" != "true" ]]; then
  if [[ "${CI:-false}" == "true" ]] || sudo -n true >/dev/null 2>&1; then
    "$BUNX_BINARY" playwright install --with-deps chrome
  else
    echo "ℹ️ Passwordless sudo is unavailable; installing Playwright browser without system dependencies."
    "$BUNX_BINARY" playwright install chrome
  fi
fi

"${SCRIPT_DIR}/bootstrap-e2e-db.sh"
"${SCRIPT_DIR}/assert-e2e-prereqs.sh"
ensure_e2e_port_available
E2E_SKIP_GLOBAL_BOOTSTRAP=true E2E_SKIP_GLOBAL_TEARDOWN=true E2E_SKIP_PLAYWRIGHT_INSTALL=true "$BUN_BINARY" run test:e2e
