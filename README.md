# next-template

TanStack Start application with localized routing, credential auth, account lifecycle flows, admin/workspace examples, Drizzle/Postgres persistence, and tiered checks.

## Stack

- TanStack Start + TanStack Router
- React 19 + Vite 8
- Drizzle ORM + PostgreSQL
- Vitest + Playwright
- Tailwind CSS 4

## Local setup

1. Copy the environment files:

```bash
cp .env.example .env
cp .env.e2e.example .env.e2e
```

2. Set at least:

- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL` for long-lived database flows
- email provider variables if you want transactional email beyond console output

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

## Checks

```bash
pnpm run checks:nightly
pnpm run checks:beta
pnpm run checks:main
```

- `checks:nightly`: lint, typecheck, unit tests
- `checks:beta`: nightly checks plus integration tests
- `checks:main`: beta checks plus database check, production build, and e2e setup/tests

## Seeded users

- `admin@example.com` / `admin`
- `manager@example.com` / `manager`
- `user@example.com` / `user`

## Notes

- Product and architecture docs live beside the app root.
- Example/demo experiences are exposed under localized `/examples/*` routes.
- High-risk HTTP endpoints are protected by shared rate limiting and audit logging.
