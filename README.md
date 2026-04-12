# next-template

Next.js App Router template with localized routing, credential auth, account lifecycle flows, MDX + Postgres content foundations, admin/workspace examples, Drizzle/Postgres persistence, and tiered checks.

## Stack

- TanStack Start + TanStack Router
- Next.js App Router + React 19
- Drizzle ORM + PostgreSQL
- Vitest + Playwright
- Tailwind CSS 4
- MDX with repo-managed content roots and DB-backed operational content

## Local setup

1. Copy the environment files:

```bash
cp .env.example .env
cp .env.e2e.example .env.e2e
```

2. Set at least:

- `AUTH_SECRET`
- `SITE_URL` or `AUTH_URL`
- `DATABASE_URL` for long-lived database flows
- `INTERNAL_CRON_SECRET` if you want the internal cron jobs endpoint

3. Start local development:

```bash
pnpm install
pnpm run dev
```

`pnpm run dev` starts an ephemeral Postgres database, applies migrations, seeds baseline users, regenerates `db-schema.json`, and launches the app.

## Long-lived local database

```bash
docker compose up -d postgres mailpit
pnpm run db:migrate
pnpm run db:schema:generate
pnpm run db:seed:test-users
pnpm run dev:app
```

Run the outbox worker in another shell if you want queued email and announcement jobs processed locally:

```bash
pnpm run jobs:work
```

## Checks

```bash
pnpm run checks:nightly
pnpm run checks:beta
pnpm run checks:main
```

- `checks:nightly`: lint, typecheck, unit tests
- `checks:beta`: nightly checks plus integration tests
- `checks:main`: beta checks plus database check, production build, and e2e setup/tests

## Staging build with Unlighthouse

```bash
pnpm run build:staging
```

This builds the app with `NEXT_DEPLOY_TARGET=staging`, starts the built server locally on `127.0.0.1:3100`, runs `unlighthouse-ci`, and writes the JSON report to `.generated/unlighthouse/ci-result.json`.

The localized report summary page reads that generated file at `/en/unlighthouse` and `/de/unlighthouse`. The generated report directory is ignored by git.

## Seeded users

- `admin@example.com` / `admin`
- `manager@example.com` / `manager`
- `user@example.com` / `user`

## Notes

- Product and architecture docs live beside the app root.
- Example/demo experiences are exposed under localized `/examples/*` routes.
- High-risk HTTP endpoints are protected by shared rate limiting and audit logging.
- Repo-managed site content lives under `content/pages`, `content/blog`, and `content/changelog`.
- Operational content such as announcements, settings, flags, analytics retention, and jobs live in Postgres.
