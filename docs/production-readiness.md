# Production Readiness

This scaffold is suitable as an internal full-stack starter. For production
SaaS use, treat the checklist below as the minimum hardening baseline before
launch.

## Required Environment

- `NODE_ENV=production`
- `DATABASE_URL`
- `AUTH_SECRET`
- `SITE_URL` or `AUTH_URL`
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `INTERNAL_CRON_SECRET`
- `IMAGE_REMOTE_HOSTS` for any external hosts rendered through `next/image`

## SMTP

Use `EMAIL_PROVIDER=smtp` for production email delivery.

Required SMTP settings:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`

The app fails environment validation when SMTP is selected and the required
settings are incomplete.

## Object Storage

Profile images require these values together:

- `PROFILE_IMAGE_STORAGE_BUCKET`
- `PROFILE_IMAGE_STORAGE_ACCESS_KEY_ID`
- `PROFILE_IMAGE_STORAGE_SECRET_ACCESS_KEY`
- `PROFILE_IMAGE_PUBLIC_BASE_URL`

Set `PROFILE_IMAGE_STORAGE_REGION`, `PROFILE_IMAGE_STORAGE_ENDPOINT`, and
`PROFILE_IMAGE_STORAGE_FORCE_PATH_STYLE` when your storage provider requires
them. Add the public image host to `IMAGE_REMOTE_HOSTS`.

## Database Migrations

Run migrations before deploying app instances:

```bash
bun run db:migrate
bun run db:schema:generate
```

Use `bun run db:check` in CI to catch schema drift.

## Backup And Restore

Production deployments need automated PostgreSQL backups, restore drills, and a
documented recovery point objective. Verify restores into an isolated database
before relying on backups.

## Job Worker

Run a separate worker process for queued jobs:

```bash
bun run jobs:work
```

Protect internal job triggers with `INTERNAL_CRON_SECRET`.

## Rate Limiting

The default rate-limit store is Postgres:

```env
RATE_LIMIT_STORE=postgres
```

Use Redis for horizontally scaled production deployments so every app instance
shares the same counters:

```env
RATE_LIMIT_STORE=redis
REDIS_URL=redis://...
```

`REDIS_URL` is required when `RATE_LIMIT_STORE=redis`; the app fails
environment validation when it is missing.

Route-specific rate-limit policies are built in for sensitive auth, account,
profile-image, and admin actions. Override them only when production traffic
patterns justify it:

```json
{
  "auth.login": { "maxRequests": 5, "windowMs": 60000 },
  "admin.*": { "maxRequests": 60, "windowMs": 60000 }
}
```

Set that JSON as `RATE_LIMIT_OVERRIDES_JSON`. Invalid JSON or non-positive
policy values fail environment validation.

### Retention Cleanup

Analytics pruning is handled by the `pruneAnalytics` job and follows the
configured `analytics.pageVisitRetentionDays` value.

Operational tables are pruned by the `pruneOperationalTables` job. Enqueue it
from the same scheduler that triggers job runs, then let `bun run jobs:work` or
`/api/internal/jobs/run` process it.

Default retention windows:

- Expired `SecurityRateLimitCounter` rows: 7 days after `resetAt`.
- `SecurityAuditLog` rows: 180 days after `timestamp`.
- Completed `JobOutbox` rows: 30 days after `updatedAt`.
- Failed `JobOutbox` rows: 90 days after `updatedAt`.

The job payload may override those windows with positive day counts:

```json
{
  "rateLimitCounterOlderThanDays": 7,
  "auditLogOlderThanDays": 180,
  "completedJobOlderThanDays": 30,
  "failedJobOlderThanDays": 90
}
```

## Admin Bootstrap

Seed or promote at least one `SUPERADMIN` before launch. Keep a documented
superadmin recovery path that uses direct database access only under incident
process controls.

## Admin Repair Mode

Keep `ADMIN_REPAIR_MODE_ENABLED=false` in production except during controlled
incident work. When enabled, the admin data-studio write route permits
superadmin repair writes for selected operational tables such as role,
functionality override, rate-limit, and audit-log rows.

Review repair-mode activity in `/admin/audit-log` after each use and disable
the flag as part of incident closure.

## Security Checklist

- Keep the repair console superadmin-only.
- Keep role editing and user status management superadmin-only by default.
- Review `/admin/audit-log` after privileged changes.
- Configure allowed image hosts instead of wildcard image patterns.
- Use HTTPS, secure cookies, and production security headers.
- Production responses include HSTS with `preload`. Only submit a domain for
  browser preload lists after every subdomain is HTTPS-ready.
- Configure `CSP_REPORT_URI` to collect `Content-Security-Policy-Report-Only`
  violations before enforcing stricter CSP rules. Review reports for Next.js,
  MDX, analytics, and app-pack scripts/styles before removing inline allowances
  from the enforced policy.
- Validate mutating authenticated requests with same-origin `Origin` or
  `Referer` headers.
