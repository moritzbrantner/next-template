# next-template

Next.js 16 App Router platform scaffold with localized routing, credential auth, account lifecycle flows, problem-report triage, MDX + Postgres content foundations, released shared packages, and an internal app-pack seam built around `AppManifest`.

This is suitable today as an internal/full-stack starter. Production SaaS use
requires the hardening checklist in
[docs/production-readiness.md](./docs/production-readiness.md), including SMTP,
object storage, backups, job worker deployment, admin recovery, and security
review.

## Stack

- Next.js 16 App Router + React 19
- Bun workspaces
- Drizzle ORM + PostgreSQL
- Storybook + Vitest + Playwright + Unlighthouse
- Tailwind CSS 4
- MDX with repo-managed content roots and DB-backed operational content
- English, German, French, and Spanish locale catalogs/content roots

## Repository layout

- `app.manifest.ts`: standalone repo/app metadata for scaffold tooling and cross-repo alignment
- `app/`: canonical Next.js App Router entrypoints, pages, and route handlers
- `apps/showcase/`: showcase app-pack manifest, content, messages, example pages, and contract tests
- `packages/app-pack/`: local package that defines the internal `AppManifest` seam
- `packages/app-pack-react/`: local React helpers for app-pack routing and rendering
- `src/`: domain, infrastructure, and foundation code used by the root app runtime
- `docs/`: scaffold guidance for package, app-pack, and update-model contributors

## Local setup

1. Copy the environment files:

```bash
cp .env.example .env
```

2. Set at least:

- `AUTH_SECRET`
- `SITE_URL` or `AUTH_URL`
- `DATABASE_URL` for long-lived database flows
- `INTERNAL_CRON_SECRET` if you want the internal cron jobs endpoint

3. Install dependencies and start development:

```bash
bun install
bun run dev
```

`bun run dev` starts an ephemeral Postgres database, applies migrations, seeds baseline users, regenerates `db-schema.json`, and launches the app.

Playwright e2e runs use `.env.example` as their baseline and then apply a small set of test-specific overrides such as the dedicated base URL, Mailpit email delivery, and the compose-backed test database port.

## Long-lived local services

```bash
docker compose up -d postgres mailpit redis minio minio-create-bucket
bun run db:migrate
bun run db:schema:generate
bun run db:seed:test-users
bun run dev:app
```

Redis is exposed at `redis://127.0.0.1:6379`; set
`RATE_LIMIT_STORE=redis` to exercise Redis-backed rate limits locally.

Run the outbox worker in another shell if you want queued email and announcement jobs processed locally:

```bash
bun run jobs:work
```

## Checks

```bash
bun run test
bun run test:storybook
bun run format:check
bun run lint
bun run lint:semantic
bun run supply-chain
bun run build
bun run bench:unlighthouse
bun run test:unlighthouse
bun run verify
bun run checks:nightly
bun run checks:beta
bun run checks:main
```

- `test`: fastest meaningful test pass, currently unit tests
- `test:storybook`: builds colocated component stories and runs Storybook a11y checks
- `format:check`: non-mutating `oxfmt` check
- `lint:semantic`: ESLint checks for TypeScript, Next.js, and React Hooks issues
- `lint`: formatter check plus semantic lint
- `supply-chain`: critical dependency audit plus package publication surface checks
- `build`: local package build plus production Next build
- `bench:unlighthouse`: builds the static export, benchmarks public routes with Unlighthouse, and enforces route score budgets
- `test:unlighthouse`: aliases the Unlighthouse benchmark gate for CI checks
- `verify`: repo hygiene report plus the full `checks:main` confidence path
- `checks:nightly`: app lint/typecheck/unit tests, Storybook build, and workspace package lint/typecheck/tests
- `checks:beta`: nightly checks plus integration tests
- `checks:main`: beta checks plus database check, production build, Unlighthouse, and Playwright e2e setup/tests

Workspace package commands are also available directly:

```bash
bun run packages:lint
bun run packages:typecheck
bun run packages:test
bun run packages:build
```

These package commands only target the local app-pack packages. The local packages publish built `dist` entrypoints; root typecheck and package tests build them first. `@moritzbrantner/ui` resolves from the public npm registry.

## Showcase examples

The active showcase app-pack registers example pages under `/examples/*` with short aliases such as `/forms`, `/communication`, `/chat`, `/uploads`, `/remocn`, and `/table`. The employee table demo uses the feature-gated `/api/examples/employees` route.

## Support reports

The public `/report-problem` form persists submissions in Postgres and returns a stable `PRB-*` reference ID. Admins can review and triage submissions under `/admin/problem-reports`.

## GitHub Pages build with Unlighthouse

```bash
bun run build:gh-pages
```

The GitHub Pages workflow and `bun run test:unlighthouse` use Bun end to end. They build the static export, run Unlighthouse against the exported public routes for every supported locale, enforce score budgets, then re-export so the localized `/unlighthouse` report pages are present in the final artifact.

## Seeded users

- `superadmin@example.com` / `superadmin`
- `admin@example.com` / `admin`
- `manager@example.com` / `manager`
- `user@example.com` / `user`
- `alice@example.com` / `alice`
- `bob@example.com` / `bob`
- `casey@example.com` / `casey`
- `dana@example.com` / `dana`
- `private@example.com` / `private`
- `delete-account@example.com` / `DeleteAccount123`

## Further docs

- [ARCHITECTURE.md](/home/moenarch/moritzbrantner/next-template/ARCHITECTURE.md)
- [SCAFFOLD_ALIGNMENT.md](./SCAFFOLD_ALIGNMENT.md)
- [docs/development.md](./docs/development.md)
- [docs/platform-layout.md](/home/moenarch/moritzbrantner/next-template/docs/platform-layout.md)
- [docs/adding-an-app-pack.md](/home/moenarch/moritzbrantner/next-template/docs/adding-an-app-pack.md)
- [docs/production-readiness.md](/home/moenarch/moritzbrantner/next-template/docs/production-readiness.md)
- [docs/updating-from-upstream.md](/home/moenarch/moritzbrantner/next-template/docs/updating-from-upstream.md)
- [docs/releasing-packages.md](/home/moenarch/moritzbrantner/next-template/docs/releasing-packages.md)
