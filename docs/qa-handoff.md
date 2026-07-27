# QA / Audit Handoff — picking this work up on another machine

Written 2026-07-27. Branch: `qa/full-site-audit-2026-07`.

This document exists so a full-platform audit can be resumed on a different PC without
re-deriving the environment. Everything here is machine-independent; the pieces that are
*not* portable are called out explicitly.

---

## 1. Get the branch

```bash
git fetch origin
git checkout qa/full-site-audit-2026-07
npm install
```

The repo lives under OneDrive, so files may also arrive via sync — but **git is the
authoritative path**. If OneDrive and git disagree, trust git.

> **Do not run this project on two machines at once.** OneDrive syncs `.next/` and
> `node_modules/` regardless of `.gitignore`. Two dev servers writing the same synced
> build cache produces `*-DESKTOP-XXXX.ts` conflict files scattered through the tree.
> Stop the dev server on the other machine first.

## 2. Environment prerequisites

Required in `.env.local` (already present on the original machine, **not** in git):

| Var | Needed for |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Postgres |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | sessions |
| `ADMIN_SECRET`, `RESET_SECRET`, `ADMIN_EMAIL` | admin + password reset |
| `RESEND_API_KEY` | transactional email |
| `BASE_URL` | CSP origin derivation |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Street View / property sidecar |

`next.config.ts` hard-fails at boot if any of these are missing, so a bad `.env.local`
surfaces immediately rather than at runtime.

Playwright browsers are a per-machine install:

```bash
npx playwright install chromium
```

## 3. Rebuild the QA harness (2 commands)

The auth-state files hold live session cookies and are gitignored — they will **not**
sync. Regenerate them on the new machine:

```bash
npm run dev                      # leave running in its own terminal
node scripts/qa-auth-state.mjs   # writes tests/simulations/.auth-state/*.json
node scripts/qa-warm.mjs         # pre-compiles all 24 routes
```

### `scripts/qa-auth-state.mjs`

Signs in once per role and saves Playwright `storageState`:

| File | Account | Role |
|---|---|---|
| `.auth-state/admin.json` | `qa.admin@aurumqa.test` | ADMIN |
| `.auth-state/seller.json` | `r.calloway@northchase-nh.com` | SELLER |
| `.auth-state/buyer.json` | `j.weston@brightlinecap.com` | BUYER |
| `.auth-state/dual.json` | `a.brennan@riverviewcs.com` | SELLER_BUYER |

Password for all demo fixtures: `Demo!2026Aurum`

The script also provisions the `qa.admin@aurumqa.test` ADMIN fixture if absent, so admin
surfaces can be exercised without using a real operator account. **The real admin
(`edlcsonofdavid@gmail.com`) is deliberately untouched** — it does not use the demo
password and nothing in the QA harness modifies it.

**Why this exists:** sign-in is rate limited to 10 attempts / 15 min per IP
([src/lib/rate-limit.ts](../src/lib/rate-limit.ts)). The May 2026 sweep signed in during
every `beforeEach` and spent most of its runtime blocked by the limiter. Load
`storageState` instead — the limiter is a correct security control and should not be
weakened for tests.

### `scripts/qa-warm.mjs`

Walks all 24 routes so a QA run measures the application rather than the Next dev
compiler. Cold compile is 20-40s per route; warm is ~150-300ms. Prints status + timing
per route, and fails loudly if the admin storageState is missing.

## 4. Known environment gotchas

These cost real time to rediscover:

- **Node scripts must live inside the project.** `node_modules` resolution walks up from
  the *script's* directory, so a driver script in a system temp dir cannot import
  `playwright` or `@prisma/client`. Throwaway scripts go in `tests/simulations/_scratch/`
  (gitignored).
- **Wait for hydration before clicking.** On a cold route the `/signin` client bundle is
  still compiling; a `click()` that lands before React hydrates causes the browser to
  submit the form *natively* (`GET /signin?`), the sign-in silently never happens, and
  you get a confusing 90s timeout. `qa-auth-state.mjs` handles this with
  `waitUntil: 'networkidle'` plus a settle delay. Any new driver script needs the same.
- **The dev server is single-process.** Running ~14 concurrent browser agents against it
  pushes page loads to 25-60s and the Node process past 11 GB RSS. Use ≥120s navigation
  timeouts, and treat general slowness under parallel load as an artifact, not a finding.
- **Prisma query logging is on in dev** ([src/lib/prisma.ts](../src/lib/prisma.ts) logs
  `['query','error','warn']` when `NODE_ENV === 'development'`). The dev log grows fast
  and buries real errors. Filter it: `grep -vE '^prisma:query' devserver.log`. This is
  dev-only and does not ship to production.

## 5. Reading the dev server log

Server-side exceptions appear **only** in the dev server's stdout — not in the browser
console. When a page renders blank or a mutation silently fails, that log is the first
place to look. Redirect it to a file when you start the server:

```bash
npx next dev > devserver.log 2>&1
```

## 6. Existing test assets

- `tests/simulations/workflows/` — 16 Playwright specs from the May sweep, plus
  `_helpers.ts` (sign-in, tour dismissal, console-error collection with a
  known-harmless whitelist).
- `playwright.config.ts` — three viewport projects (desktop 1440, tablet, mobile),
  `workers: 1` because the suite shares one dev server and one DB.
- Run with `npx playwright test`, single spec with
  `npx playwright test tests/simulations/workflows/<name>.spec.ts`.

The specs still call `signIn()` in `beforeEach`. Migrating them to `storageState` via
`playwright.config.ts` `use.storageState` is the obvious next improvement and would make
the suite runnable end-to-end without tripping the limiter.

## 7. Baseline at time of handoff

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx vitest run` | 41/41 pass (2 files: `permissions.test.ts`, `utils.test.ts`) |
| `npx next lint` | 4 warnings — 3 stale eslint-disable directives in `CreateListingForm.tsx`, 1 unused import in `listing-number.ts` |
| Routes returning 200 | 24 / 24 |

Unit-test coverage is thin — two files against ~50 API routes and ~60 components. The
Playwright suite carries most of the real coverage.

## 8. Audit findings

See [`tests/simulations/reports/audit-2026-07-27.md`](../tests/simulations/reports/audit-2026-07-27.md)
for the prioritized findings and improvement roadmap from the July sweep.
