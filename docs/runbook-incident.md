# Incident Response Runbook

## Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | Production down, data breach, active exploit | 15 min |
| P1 | Auth broken, rate limiting disabled, data exposure | 1 hour |
| P2 | Feature broken for subset of users | 4 hours |
| P3 | Cosmetic / non-critical | Next business day |

---

## P0: Suspected Data Breach

1. **Revoke all active sessions** — rotate `NEXTAUTH_SECRET` in Vercel env immediately (forces re-login for all users)
2. **Rotate secrets** — `ADMIN_SECRET`, `RESET_SECRET`, `RESEND_API_KEY` in Vercel env
3. **Preserve logs** — export Vercel function logs and Upstash Redis logs before rotating
4. **Notify** — inform affected users within 72 hours (GDPR requirement)
5. **Root cause** — review audit logs in DB: `SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 500`

## P1: Rate Limiter Failure (Redis Down)

Symptom: Auth routes returning 500, or Upstash unreachable.

Auth rate limits (`signup`, `signin`, `reset`) **fail closed** — they will return 429 when Redis is down. This is intentional.

1. Check Upstash dashboard for Redis connectivity
2. If Redis is permanently down, provision a new Upstash instance and update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel
3. Redeploy (env change triggers redeployment)

## P1: Admin Approval Email Links Not Working

Symptom: Admins clicking approve/reject links get "Link Expired" or "Already Used".

Possible causes:
- `ADMIN_SECRET` was rotated after tokens were issued (invalidates all existing JWTs)
- Token was already used (single-use by design)
- Token expired (7-day TTL)

Resolution: Re-trigger the signup notification email from the admin dashboard, or manually approve via Prisma Studio (`npx prisma studio`).

## P1: Password Reset Not Working

Symptom: Users not receiving reset emails, or links are invalid.

Checks:
1. `RESEND_API_KEY` is set and valid in Vercel env
2. `RESET_SECRET` is set — if missing, the route throws at startup
3. Reset tokens expire in 1 hour — user may need to re-request
4. Check Resend dashboard for delivery failures

## Useful Queries

```sql
-- Recent audit events
SELECT action, "userId", "listingId", "createdAt", "ipAddress"
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 100;

-- Pending users
SELECT id, email, company, role, "createdAt"
FROM "User"
WHERE "approvalStatus" = 'PENDING'
ORDER BY "createdAt" DESC;

-- Unused admin tokens (not yet clicked)
SELECT t.id, t."expiresAt", u.email
FROM "AdminToken" t
JOIN "User" u ON t."userId" = u.id
WHERE t."usedAt" IS NULL AND t."expiresAt" > NOW();
```
