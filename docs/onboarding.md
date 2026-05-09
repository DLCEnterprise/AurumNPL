# Developer Onboarding

## Prerequisites

- Node.js 20+
- PostgreSQL (local or remote)
- Upstash Redis account (for rate limiting)
- Resend account (for email)

## First-time Setup

```bash
npm install
cp .env.example .env.local   # fill in all required values (see below)
npx prisma migrate dev        # apply all migrations + seed if needed
npm run dev
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://...`) |
| `NEXTAUTH_SECRET` | Random 32+ char string — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL: `http://localhost:3000` in dev |
| `ADMIN_SECRET` | Random 32+ char string — signs admin approval JWTs |
| `RESET_SECRET` | Separate random string — signs password reset JWTs. **Must not equal ADMIN_SECRET** |
| `RESEND_API_KEY` | From resend.com dashboard |
| `ADMIN_EMAIL` | Where new-registration notifications are sent |
| `BASE_URL` | `http://localhost:3000` in dev; `https://your-domain.com` in prod |
| `UPSTASH_REDIS_REST_URL` | From Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash console |
| `EMAIL_FROM` | Optional — `AURUM <noreply@your-domain.com>` |

> Auth rate limits (`signup`, `signin`, `reset`) **fail closed** in production if Redis is missing — the app will throw at startup. This is intentional.

## Key Architecture

- **Auth**: Auth.js v5 beta with JWT sessions. Session is verified server-side on every dashboard layout render (re-checks `approvalStatus` from DB, not just JWT).
- **Rate limiting**: Upstash Redis via REST API. `src/lib/rate-limit.ts`. Auth limits fail closed on Redis error.
- **Permissions**: `src/lib/permissions.ts` — use `can.*` predicates instead of inline role checks.
- **Audit logging**: `src/lib/audit.ts` — call `logAudit()` for any write that affects data integrity. Use `AuditAction` enum from `src/types/index.ts`.
- **Email**: Resend via `src/lib/email.ts`. All user data is HTML-escaped before template interpolation.
- **Admin tokens**: Stored as SHA-256 hashes in `AdminToken` table. Raw JWTs go in email URLs; hash is used for DB lookup.

## Running Type Check and Lint

```bash
npm run type-check   # tsc --noEmit
npm run lint         # next lint
```

These are the same checks CI runs. Push only after both pass.

## Database

```bash
npm run db:studio    # Prisma Studio GUI
npm run db:migrate   # Create and apply new migration (dev only)
npm run db:deploy    # Apply pending migrations (prod — runs automatically in build)
```

## Deployment

- Hosted on Vercel. Push to `main` triggers a deployment.
- Vercel runs `prisma generate && prisma migrate deploy && next build` automatically.
- Set all env vars in Vercel project settings before first deploy.
- `RESET_SECRET` must be a value distinct from `ADMIN_SECRET`.
