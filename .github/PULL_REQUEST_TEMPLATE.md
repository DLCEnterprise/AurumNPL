## Summary

<!-- What does this PR do and why? 1-3 bullets. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Security fix
- [ ] Performance improvement
- [ ] Refactor (no behavior change)
- [ ] Documentation / config

## Security checklist (required for auth/API changes)

- [ ] No secrets or tokens logged or stored in plaintext
- [ ] User input is validated at the API boundary (Zod schema)
- [ ] User data is HTML-escaped before rendering in email templates
- [ ] New API routes are rate-limited where appropriate
- [ ] New API routes check `approvalStatus === 'APPROVED'` and role before acting
- [ ] Admin-only routes verify `session.user.role === 'ADMIN'`

## Testing

- [ ] `npx tsc --noEmit` passes
- [ ] `npx next lint` passes
- [ ] Manually tested the happy path
- [ ] Manually tested relevant error/edge cases

## Notes for reviewer

<!-- Anything non-obvious about the implementation choices. -->
