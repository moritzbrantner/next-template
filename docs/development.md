# Development Workflow

## Setup

Install Bun `1.3.14`, then install dependencies:

```bash
bun install --frozen-lockfile
```

Create local environment files from the examples:

```bash
cp .env.example .env
```

At minimum, set `AUTH_SECRET`, `SITE_URL` or `AUTH_URL`, and `DATABASE_URL` for long-lived database flows. Set `INTERNAL_CRON_SECRET` when testing internal cron endpoints.

## Daily Development

For the default local app with an ephemeral test database:

```bash
bun run dev
```

For long-lived local services:

```bash
docker compose up -d postgres mailpit redis minio minio-create-bucket
bun run db:migrate
bun run db:schema:generate
bun run db:seed:test-users
bun run dev:app
```

Redis is exposed at `redis://127.0.0.1:6379` for experiments such as
`RATE_LIMIT_STORE=redis`.

Run the background job worker separately when testing queued email,
announcement, analytics pruning, or operational retention jobs:

```bash
bun run jobs:work
```

## Standard Checks

```bash
bun run test
bun run format:check
bun run lint
bun run build
bun run verify
```

- `bun run test`: fastest meaningful test pass, currently unit tests.
- `bun run test:storybook`: builds colocated Storybook stories and runs
  Storybook a11y checks.
- `bun run format:check`: non-mutating `oxfmt` check.
- `bun run lint:format`: non-mutating `oxfmt` check.
- `bun run lint:semantic`: ESLint checks for TypeScript, Next.js, and React
  Hooks issues.
- `bun run lint`: formatter check plus semantic lint.
- `bun run build`: package build plus production Next build.
- `bun run supply-chain`: critical dependency audit plus package publication
  surface checks. Use `bun run supply-chain:audit:all` to review all known
  advisories.
- `bun run bench:unlighthouse`: builds the static export, benchmarks public
  routes with Unlighthouse, and enforces route score budgets.
- `bun run test:unlighthouse`: aliases the Unlighthouse benchmark gate for CI.
- `bun run verify`: hygiene report plus the full `checks:main` confidence path.

CI tiers are also available directly. `checks:nightly` includes supply-chain
checks before unit and Storybook tests:

```bash
bun run checks:nightly
bun run checks:beta
bun run checks:main
```

`checks:nightly` includes the Storybook build and a11y checks. `checks:main` includes Unlighthouse benchmarks, e2e setup, and Playwright tests, so expect it to be slower and to require Docker-compatible local services.

## Repo Hygiene

Run the lightweight hygiene report before handing off a branch:

```bash
bun run hygiene
```

It reports dirty status, untracked files, upstream/ahead/behind state, tracked generated directories, generated directories that are present but unignored, and local-only ignore coverage.

Generated and local-only paths should stay out of commits: `.next/`, `out/`, `dist/`, `packages/*/dist/`, `coverage/`, `test-results/`, `playwright-report/`, `.generated/`, `public/local-profile-images/`, `.env*`, and `*.tsbuildinfo`.

## Release Notes

There is no safe root release command. The repository has two local packages, `packages/app-pack` and `packages/app-pack-react`; package release expectations are documented in `docs/releasing-packages.md`.

Before publishing a package, run:

```bash
bun run packages:lint
bun run packages:typecheck
bun run packages:build
bun run packages:test
```

Publish only from the package directory and do not commit built `dist/` output or tarballs.

## Troubleshooting

- Shared runtime packages resolve from the public npm registry; no root `.npmrc` is required for them.
- E2E commands use `.env.example` plus test overrides and compose-backed services. Use `bun run test:e2e:setup` and `bun run test:e2e:teardown` when debugging setup separately.
- If `next-env.d.ts`, `db-schema.json`, Drizzle snapshots, or lockfiles change, confirm they came from the normal generator or package-manager command before committing.
