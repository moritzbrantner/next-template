# Releasing Packages

This repository keeps only `packages/app-pack` and `packages/app-pack-react` as local packages.

## Local verification

```bash
bun run packages:lint
bun run packages:typecheck
bun run packages:test
bun run packages:build
```

## Publishing expectations

- Publish only from `packages/*`.
- Treat `@moritzbrantner/ui` and `@moritzbrantner/storytelling` as external `platform-packages` dependencies, not local release targets in this repo.
- Treat package `exports` as the supported public API surface.
- Do not commit tarballs, `.turbo` logs, or built `dist/` output back into the repo.
- Keep release notes focused on public entrypoint changes and breaking API shifts.
