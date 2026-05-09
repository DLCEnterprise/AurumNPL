# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email: security@aurum.finance  
Response time: 48 hours for acknowledgement, 7 days for triage result.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix

We follow responsible disclosure. Reporters who follow this policy will be credited (if desired) when the fix is released.

## Security Controls

- All API routes require an active session and `approvalStatus === 'APPROVED'`
- Admin operations require `role === 'ADMIN'` verified server-side
- Rate limiting on all auth endpoints (Upstash Redis in production; fails closed for auth routes)
- Admin approval tokens are SHA-256 hashed before database storage
- Password reset tokens are SHA-256 hashed before database storage
- User data is HTML-escaped in all email templates
- Content-Security-Policy, HSTS, X-Frame-Options on all responses
- `RESET_SECRET` is separate from `ADMIN_SECRET` (distinct key boundaries)

## Dependency Updates

Dependabot is configured to send weekly npm security PRs. All `npm audit --audit-level=high` failures block CI.
