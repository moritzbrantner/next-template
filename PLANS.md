# PLANS.md

## Current objective

Ship a consistent Next.js App Router platform scaffold where the documentation, package topology, CI, repo manifest, and app-pack contracts all agree on one canonical architecture.

## Active milestone: scaffold-v2 alignment

- Make Next.js 16 App Router the single documented runtime
- Keep `app.manifest.ts` aligned with the standalone scaffold contract
- Consume `ui` and `storytelling` from `platform-packages`
- Add contract coverage around the showcase app-pack seam
- Split oversized service modules behind stable barrel exports

## Follow-up milestone: package and app-pack ergonomics

- Tighten package release documentation
- Keep app-pack route/message/content contracts aligned with tests
- Reassess a future `apps/web` relocation only after package boundaries are stable

## Risks

- App-pack drift if manifest changes land without contract tests
- Workspace package drift if public entrypoints change without verification
- Large service modules still need ongoing decomposition after the first split
