# Next.js Comprehensive Template

This repository is a starter template for building impressive, production-ready Next.js experiences, including foundations for:

- User management
- 3D/animation experiences (Three.js-oriented architecture)
- Video-rich interfaces
- Form and validation flows
- Shared client state management (Zustand-style patterns)

## Documentation-first workflow

Use these root docs before and during implementation:

- [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): product goals, audience, and success criteria.
- [`PLANS.md`](./PLANS.md): active execution plans, milestones, and blockers.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): system design, module boundaries, and runtime decisions.
- [`FEATURES.md`](./FEATURES.md): feature specs and acceptance criteria.
- [`DECISIONS.md`](./DECISIONS.md): architecture and implementation decision log.

## Build instructions

- Prefer Server Components and server prerendering by default to improve SEO and minimize client-side JavaScript.
- Keep UI components donut-shaped (rounded, ring/pill-like geometry) unless a specific feature requires another shape.
- For theme-related UI, read system preferences on first visit and persist explicit user choices.

## Authentication setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Set `AUTH_SECRET`, `AUTH_URL` (or `NEXTAUTH_URL` for equivalent setups), and any OAuth provider credentials you plan to use.

## Local database (Docker)

1. Start the Postgres container:

   ```bash
   docker compose up -d postgres
   ```

2. Wait for the healthcheck to pass and verify status:

   ```bash
   docker compose ps
   ```

## Local startup flow

1. Start DB container:

   ```bash
   docker compose up -d postgres
   ```

2. Run migrations:

   ```bash
   bun run db:generate
   bun run db:migrate
   ```

3. Run Next app:

   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

Start editing by updating `app/page.tsx`; the page auto-updates as you save.

## Testing

1. Run integration tests for credential authorization logic:

   ```bash
   bun run test:integration
   ```

2. Run end-to-end authentication tests (requires Postgres and `.env`):

   ```bash
   docker compose up -d postgres
   bun run test:e2e
   ```

## CI/CD

### Required checks

PRs targeting `main` must pass all CI checks:

- `lint`
- `typecheck`
- `build`
- `db-check` (Drizzle schema validation)

These correspond to the commands run in CI:

```bash
bun run lint
bunx tsc --noEmit
bun run build
bunx drizzle-kit check
```

### Required deploy secrets

Set these environment variables in each deploy environment (preview and production):

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (or `NEXTAUTH_URL` in equivalent Auth.js setups)

If you enable OAuth providers, also set the provider-specific credentials (for example `GITHUB_ID` / `GITHUB_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, or `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`).

### Branch strategy

- `main` is a protected branch.
- All changes should be merged via pull request.
- Require CI checks to pass before merging.

### Preview and production deploy behavior

- **Preview deploys** should run for pull requests, using preview-scoped secrets and infrastructure.
- **Production deploys** should run only after changes are merged to `main`, using production-scoped secrets and infrastructure.

## Suggested next steps

1. Finalize `PRODUCT_BRIEF.md` for your target audience.
2. Add your first milestone plan in `PLANS.md`.
3. Capture core technical choices in `ARCHITECTURE.md` and `DECISIONS.md`.
4. Define your MVP scope in `FEATURES.md`.
