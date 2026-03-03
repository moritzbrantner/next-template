# Monorepo (Next.js + Expo + Electron) Template

This folder contains a ready-to-copy Codex policy for monorepo (next.js + expo + electron) projects.

## Best way to use Codex here
1. Copy this folder's `AGENTS.md` into your target repository root.
2. Start Codex with a concrete task and include: **"follow the plan step by step"**.
3. Ask Codex to keep running autonomously until done unless a serious blocker occurs.
4. Require tests and relevant lint/type/build checks before completion.

## Environment setup for testing and benchmarking
1. Install Node.js 20 LTS and the monorepo package manager required by the lockfile (`pnpm` recommended in many workspaces).
2. Install workspace dependencies once from the repository root with frozen lockfile settings.
3. Configure per-app environment files (`apps/web/.env.test`, `apps/mobile/.env.test`, `apps/desktop/.env.test`) plus shared service variables.
4. Run testing by scope: package-level/unit tests first, then integration tests, then cross-app e2e.
5. Build all production artifacts before benchmarking to avoid dev-mode noise.
6. Benchmark each surface separately (web, mobile, desktop) and keep hardware/device profiles fixed for each track.
7. Use workspace task runners (Turbo/Nx/etc.) with cache controls documented so benchmark reruns are intentional.

## Helpful companion docs to add in your target repository
- `PLANS.md`: ordered queue the agent executes without interruption.
- `INFRASTRUCTURE.md`: environments, services, secrets, deploy/rollback constraints.
- `AGENT_WORKFLOW.md`: explicit execution contract for autonomous agents.
- `TASKS.md`: prioritized backlog and acceptance criteria.
- `ARCHITECTURE.md`: boundaries, key data flows, and invariants.
- `TESTING.md`: canonical test commands and CI expectations.
- `OPERATIONS.md`: runbooks, deployment notes, and rollback steps.
- `DECISIONS.md`: brief ADR-style log for major technical choices.
