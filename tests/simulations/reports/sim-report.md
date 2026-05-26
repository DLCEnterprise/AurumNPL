# AURUM Platform — Full Workflow Simulation Report

**Platform:** AURUM — Institutional NPL Marketplace
**Date started:** 2026-05-25
**Engine:** Playwright (Chromium) against local dev (`http://localhost:3000`)
**Demo data:** seeded fixtures tagged `seed:demo-may-2026`

---

## Format

- **Workflow** — name of the surface or flow being simulated
- **Finding** — Bug / UX Friction / Visual Defect / Accessibility Gap / Performance Issue
- **Severity** — Critical / High / Medium / Low
- **Root cause** — file:line where the defect lives
- **Fix** — what was changed and where
- **Re-verified** — Yes / Skipped (with reason)

Each entry is appended in execution order. Pass-fail summary lives in [pass-fail.md](./pass-fail.md).

---

## Findings & fixes (running log)

### #1 — Dashboard pages crash with `session!.user` if null session reaches them

- **Workflow:** environment warmup (visiting `/listings` unauthenticated)
- **Category:** Bug
- **Severity:** Medium — the `(dashboard)/layout.tsx` already redirects, so production users don't hit this. But in Next.js 15 dev mode the page handler can render concurrently with the layout, log a `TypeError: Cannot read properties of null (reading 'user')`, and pollute logs / Sentry. If the layout's redirect ever fails or is bypassed, the crash becomes user-visible.
- **Root cause:** 8 dashboard route handlers use the non-null assertion `session!.user.id`. Files:
  - [src/app/(dashboard)/dashboard/page.tsx](src/app/(dashboard)/dashboard/page.tsx)
  - [src/app/(dashboard)/listings/page.tsx](src/app/(dashboard)/listings/page.tsx)
  - [src/app/(dashboard)/listings/[id]/page.tsx](src/app/(dashboard)/listings/[id]/page.tsx)
  - [src/app/(dashboard)/listings/[id]/bids/page.tsx](src/app/(dashboard)/listings/[id]/bids/page.tsx)
  - [src/app/(dashboard)/watchlist/page.tsx](src/app/(dashboard)/watchlist/page.tsx)
  - [src/app/(dashboard)/deals/page.tsx](src/app/(dashboard)/deals/page.tsx)
  - [src/app/(dashboard)/profile/page.tsx](src/app/(dashboard)/profile/page.tsx)
  - [src/app/(dashboard)/messages/page.tsx](src/app/(dashboard)/messages/page.tsx)
- **Fix:** introduced [`src/lib/session-guard.ts`](src/lib/session-guard.ts) → `requireSession()` (returns a non-null typed session or `redirect('/signin')`). Replaced `const session = await auth(); session!.user.x` with `const session = await requireSession(); session.user.x` across all 8 dashboard route handlers.
- **Re-verified:** Yes. Re-ran the warmup spec that originally crashed — `npx playwright test _00-warmup.spec.ts` — all 21 routes resolve correctly with zero TypeError entries in the dev server log. Middleware-redirect path works (every authenticated route now resolves to `/signin` cleanly, no page handler crash trailing behind).

### #2 — CSP missing `worker-src`; every page logs blob-worker violations

- **Workflow:** every page (caught by `expectNoCriticalErrors` in nav-public + auth specs)
- **Category:** Bug (high-end perception: a console-error storm reads as unprofessional when a client opens devtools during the demo)
- **Severity:** High — visible in console on every authenticated and unauthenticated page
- **Root cause:** [next.config.ts:47-58](next.config.ts#L47-L58) defines CSP `script-src`/`style-src`/`font-src`/`img-src`/`connect-src` but **no `worker-src`**. Browsers fall back to `script-src` for workers — and `script-src` doesn't allow `blob:`. Sentry's instrumentation creates workers from blob URLs, so every page emits:
  > Creating a worker from 'blob:…' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com". Note that 'worker-src' was not explicitly set…
- **Fix:** add `worker-src 'self' blob:` to the CSP directive list. Allows same-origin workers and dynamic blob workers (Sentry, web worker libs). Doesn't widen any other surface.
- **Re-verified:** see retest after deploy


