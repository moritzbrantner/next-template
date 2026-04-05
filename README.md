# next-template

Syncable TanStack Start application template powered by `Copier`.

## What lives here
- `copier.yml`: template questions and defaults
- `template/`: the actual application skeleton
- generic CI, Playwright, Tailwind 4, and package-wiring defaults

## Current package wiring
- The application uses local UI primitives under `components/ui` plus public npm dependencies.
- No GitHub Packages token is required to install dependencies for this repo.

## Usage

Create a new app:

```bash
copier copy . ../my-next-app
```

Install dependencies in the generated app:

```bash
cd ../my-next-app
pnpm install
```

Update an existing app that tracks the template:

   ```bash
   cp .env.example .env
   ```

2. Set `AUTH_SECRET`, `AUTH_URL` (or `NEXTAUTH_URL` for equivalent setups), and any OAuth provider credentials you plan to use.

3. For account lifecycle emails (sign-up verification + password reset), configure one of:

   - `EMAIL_PROVIDER=console` (default in local development; logs secure links to stdout)
   - `EMAIL_PROVIDER=resend` plus `RESEND_API_KEY` and `EMAIL_FROM`

4. Ensure `DATABASE_URL` is present for scripts that target a long-lived database. During `pnpm dev`, the wrapper script overrides `DATABASE_URL` with an ephemeral local Postgres instance automatically.

5. Configure profile image object storage (S3-compatible):

   - `PROFILE_IMAGE_STORAGE_BUCKET`
   - `PROFILE_IMAGE_STORAGE_REGION`
   - `PROFILE_IMAGE_STORAGE_ENDPOINT`
   - `PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID`
   - `PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY`
   - `PROFILE_IMAGE_PUBLIC_BASE_URL`
   - `PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE` (optional, provider-specific)

   Migration and rollback notes are documented in [`docs/profile-image-storage-migration.md`](./docs/profile-image-storage-migration.md).

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

1. Copy `.env.example` to `.env` and set the auth-related values you need for local sign-in flows.

2. Run the app:

   ```bash
   pnpm run dev
   ```

   `pnpm dev` starts an isolated Postgres 16 container on `127.0.0.1:${DEV_DB_PORT:-55434}`, applies Drizzle migrations, seeds the baseline test users, and then launches Vite. The database uses `tmpfs`, so all changes are discarded automatically when the dev process exits.

3. If you need to use a long-lived local database instead, use the manual flow:

   ```bash
   docker compose up -d postgres
   pnpm run db:generate
   pnpm run db:migrate
   pnpm run db:schema:generate
   pnpm run dev:app
   ```

   `db:schema:generate` derives `db-schema.json` from the Drizzle table configs used by the admin data studio.

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

Start editing by updating the route files in `src/routes/`; the page auto-updates as you save.

## Testing

1. Run tiered checks locally depending on branch target:

   ```bash
   pnpm run checks:nightly
   pnpm run checks:beta
   pnpm run checks:main
   ```

   - `checks:nightly`: lint + typecheck + unit tests
   - `checks:beta`: nightly checks + integration tests
   - `checks:main`: beta checks + database schema check + production build + strict e2e preflight + deterministic DB bootstrap (start Postgres, wait for readiness, apply migrations, seed baseline users) + e2e tests

2. Run integration tests directly when iterating on service logic:

   ```bash
   pnpm run test:integration
   ```

3. Seed default test users (optional, but recommended for manual QA):

   ```bash
   pnpm run db:seed:test-users
   ```

   Default seeded credentials:

   - `admin@example.com` / `admin`
   - `manager@example.com` / `manager`
   - `user@example.com` / `user`

   These same users are seeded automatically for each `pnpm dev` session against the ephemeral database.


   `checks:main` runs `scripts/ci/assert-e2e-prereqs.sh` and then `scripts/ci/bootstrap-e2e-db.sh` before Playwright. The bootstrap step is idempotent, reuses an already reachable `DATABASE_URL` when present (for example CI service containers), and otherwise starts `docker compose` Postgres. It always re-applies migrations plus baseline seeded users (`pnpm run db:migrate` and `pnpm run db:seed:test-users`) so each run has deterministic auth/e2e fixtures.

4. Run end-to-end authentication/profile user-story tests (requires Postgres and `.env`):

   ```bash
   docker compose up -d postgres
   pnpm run test:e2e
   ```

## CI/CD

### Tiered branch and workflow hierarchy

Adopt three long-lived integration branches:

- `nightly`: receives frequent merges; validates fast feedback (`checks:nightly`).
- `beta`: stabilization branch; validates integration behavior (`checks:beta`).
- `main`: release branch; validates full pre-release quality gate (`checks:main`).

GitHub workflows are split by target branch and call a shared reusable workflow:

- `.github/workflows/nightly-tier.yml`
- `.github/workflows/beta-tier.yml`
- `.github/workflows/main-tier.yml`
- `.github/workflows/tier-checks.yml` (shared execution logic)

Each workflow runs the corresponding local command so local and CI behavior stays aligned.

For `main`, CI uses the same strict e2e preflight as local `checks:main`; missing `DATABASE_URL`, missing auth env (`AUTH_SECRET` + `AUTH_URL`/`NEXTAUTH_URL`), or an unreachable Postgres instance will fail the job before Playwright starts. After preflight succeeds, deterministic bootstrap reuses the runner's reachable database service when available (avoiding port-collision conflicts) or starts Postgres via `docker compose up -d postgres`, then waits for readiness, reapplies migrations, and reseeds baseline users before e2e execution.

In CI mode (`CI=true`), `checks:main` also runs bootstrap teardown on exit (`scripts/ci/bootstrap-e2e-db.sh --teardown`) and only removes containers/volumes it started itself. This avoids cross-job contamination on runners while remaining safe for local developer databases.

### Required deploy secrets

Set these environment variables in each deploy environment (preview and production):

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (or `NEXTAUTH_URL` in equivalent Auth.js setups)
- `EMAIL_PROVIDER` (`console` or `resend`)
- `EMAIL_FROM`

If you enable OAuth providers, also set the provider-specific credentials (for example `GITHUB_ID` / `GITHUB_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, or `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`).

For hosted transactional email via Resend, add `RESEND_API_KEY` and set `EMAIL_PROVIDER=resend`.

### Branch strategy

- Protect `nightly`, `beta`, and `main`.
- Merge feature branches into `nightly` first.
- Promote `nightly` -> `beta` after nightly checks stay green.
- Promote `beta` -> `main` only after full `checks:main` passes.
- Require the matching workflow status check on each branch before merging.

### Preview and production deploy behavior

- **Preview deploys** should run for pull requests, using preview-scoped secrets and infrastructure.
- **Production deploys** should run only after changes are merged to `main`, using production-scoped secrets and infrastructure.

## Suggested next steps

1. Finalize `PRODUCT_BRIEF.md` for your target audience.
2. Add your first milestone plan in `PLANS.md`.
3. Capture core technical choices in `ARCHITECTURE.md` and `DECISIONS.md`.
4. Define your MVP scope in `FEATURES.md`.
```bash
copier update
```

## Template authority

The authoritative app skeleton is under [`template/`](./template). Legacy root-level application files are transitional and can be removed in a follow-up cleanup pass once downstream repositories are aligned.
