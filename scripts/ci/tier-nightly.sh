#!/usr/bin/env bash
set -euo pipefail

bun run lint
bun run typecheck
bun run packages:lint
bun run packages:typecheck
bun run packages:test
bun run supply-chain
bun run test:unit
bun run test:storybook
bun run bench:ci
