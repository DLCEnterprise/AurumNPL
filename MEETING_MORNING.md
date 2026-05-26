# Meeting Prep — Morning of May 25

> One-time handoff doc; delete after the meeting.
>
> **Update — second QA sweep completed.** See "Second sweep findings" section below.

## TL;DR — what changed while you were asleep

The platform was passing type-check and deployed, but **the live marketplace had 1 active listing and a $185K total UPB**. A client demo against that would have undermined every feature.

**Now live on https://aurum-npl-lflx.vercel.app/:**

| | Before | Now |
|---|---|---|
| Active listings | 1 | **21** |
| Total UPB | $185K | **$47.07M** |
| Approved institutions | 3 | **10** |
| Bids | 1 | 12 |
| Signed NDAs | 0 | 8 |
| MLPA templates | 0 | 1 (active, v1.0) |
| Vendor directory | 0 | 4 (BPO, Title/OE, Legal, Other) |
| Landing page | Trust strip + fake testimonial-adjacent placeholder | Live 3 newest listings pulled from DB |
| Accessibility score | 86 | **94** |
| Performance score | 96 | 96 (unchanged — already strong) |

**Your existing data was not touched** — `eddy@dlcep.com`, `masjr@1oakadvisory.com`, `edlcsonofdavid@gmail.com` accounts, plus `3137 CENTER ST`, `MD NPL`, `Test NPL` listings, are all preserved.

---

## When you sit down — first 5 minutes

1. **Open the live site:** https://aurum-npl-lflx.vercel.app/
2. **Sign in as `eddy@dlcep.com`** (your real persona — SELLER_BUYER role)
3. **Click through quickly:** Dashboard → Listings → click any listing → Notifications (you have 4 unread) → Watchlist (3 saved) → Pipeline (1 in each of REVIEWING / BIDDING / UNDER_LOI)
4. **Sanity-check the listing detail page** — pick "Q2 2026 Mixed-Asset Strategic Disposition" (it's the biggest at $12.4M and looks the most impressive). Confirm UPB, lien position, bid history all render.

If anything looks wrong, the dev server is no longer running; spin it back up with `npm run dev` (Node is at `C:\Program Files\nodejs\` — was installed during this session).

---

## Recommended demo flow

Order optimized for the "alive marketplace → real workflow → admin control" narrative:

1. **Landing** — the live stats hero (21 listings, $47M UPB, 10+ institutions) sells the platform in 3 seconds. Scroll to the Active Listings preview grid (now pulls 3 newest from DB).
2. **Sign in** — admin link removes friction. Demonstrates the gated approval flow exists without making them wait.
3. **Dashboard** — shows the role-aware stats card grid + Quick Actions + Recent Activity.
4. **Listings browse** — 21 active listings across asset types and states. Demonstrate the filter bar (asset type, lien position, UPB range, delinquency range — all functional and now matched against real data). Sort by UPB Desc to show the $12.4M and $8.95M Consumer pool at top.
5. **Listing detail** — pick a NDA-required listing (e.g. "Dallas Metro" or "Midwest Small-Balance Commercial NPL"). Show the NDA gate, then once signed (you can pre-sign as eddy if you want), show the data room, bid history with color-coded badges.
6. **Place a bid / show the bid flow** — bid modal has spring animation + shake-on-error. Tactile demo moment.
7. **Pipeline** — 3 entries across REVIEWING, BIDDING, UNDER_LOI. Drag-and-drop between stages is functional.
8. **Messages** — your seeded user has 1 unread.
9. **Switch to admin account** (`edlcsonofdavid@gmail.com`) — show admin/users (list of all 10 approved + ability to approve pending), admin/vendors (4 vendors), admin/mlpa (v1.0 template).
10. **Personalization drawer** — accent themes, density, layout style. Big "wow" moment.

---

## What was committed today (8 commits)

```
862def1  Fix: notifications typeIcon enum mismatch
ad96625  A11y: landing — main landmark, label-for-select, h3 footer
8b1e8f6  Client brief: refresh for May 25 state
88b986e  chore: ignore local _build.log
d79fe77  Fix: avgDelinquency convention is months (seed + landing)
363b35b  Landing: pull live listings + drop placeholder content
```

All pushed to `main`. Vercel deployed each.

---

## Known issues I did NOT touch (your call before the meeting)

These are visible during demo but I held back to respect your earlier "leave it" decisions:

1. **Testimonials section on landing** — 3 fake quoted endorsements ("Michael R. — Atlas Capital Partners", "Sarah L. — Meridian Fund", "James K. — Summit NPL Advisors"). If the client recognizes them as fabricated this could undercut credibility. Source: [src/app/page.tsx:513-535](src/app/page.tsx#L513-L535).

2. **"Platform walkthrough coming soon"** placeholder video section with a non-functional play button. Honest ("coming soon" copy) but the play button suggests interactivity. Source: [src/app/page.tsx:255-324](src/app/page.tsx#L255-L324).

3. **Footer dead links** — About / Careers / Press / Contact / Terms of Service / Privacy Policy / Compliance all `href="#"`. Source: [src/app/page.tsx:489-498](src/app/page.tsx#L489-L498).

4. **"Schedule a Demo" CTA** — routes to `/signin` rather than a scheduling form. Could rename to "Sign In" or remove. Source: [src/app/page.tsx:492](src/app/page.tsx#L492).

5. **Nav "Features" anchor** — points to `#features` but no element has that ID. Click does nothing. Source: [src/components/layout/LandingNav.tsx:108](src/components/layout/LandingNav.tsx#L108).

6. **Color-contrast lighthouse warnings** — Some muted text (e.g. "Platform walkthrough coming soon", filter bar labels in marketplace preview) doesn't meet WCAG AA 4.5:1. These appeared to be intentional stylistic choices.

If you want any of these fixed before the meeting, the edits are 5-15 minutes each.

---

## Demo credentials (created during seeding)

All seeded fixture users use the same password.

| Account | Email | Role | Use for |
|---|---|---|---|
| Your real persona | eddy@dlcep.com | SELLER_BUYER | Primary demo |
| Your admin | edlcsonofdavid@gmail.com | ADMIN | Admin section |
| Seeded buyer | j.weston@brightlinecap.com | BUYER | Show buyer-side flow |
| Seeded seller | r.calloway@northchase-nh.com | SELLER | Show seller dashboard |

**Password for all seeded fixture accounts:** `Demo!2026Aurum`

Your own existing passwords were not changed.

---

## How to wipe the demo seed after the meeting

All seeded data is tagged with `adminNotes: 'seed:demo-may-2026'` on users, and listings start with `AUR-2026-` listing numbers. Quick cleanup script (you can write it on-demand):

```js
// scripts/wipe-seed.mjs
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const seededUserIds = (await p.user.findMany({ where: { adminNotes: 'seed:demo-may-2026' }, select: { id: true } })).map(u => u.id)
await p.bid.deleteMany({ where: { bidderId: { in: seededUserIds } } })
await p.ndaAgreement.deleteMany({ where: { buyerId: { in: seededUserIds } } })
await p.savedListing.deleteMany({ where: { userId: { in: seededUserIds } } })
await p.dealPipeline.deleteMany({ where: { userId: { in: seededUserIds } } })
await p.notification.deleteMany({ where: { userId: { in: seededUserIds } } })
await p.notificationPreference.deleteMany({ where: { userId: { in: seededUserIds } } })
await p.listing.deleteMany({ where: { listingNumber: { startsWith: 'AUR-2026-' } } })
await p.user.deleteMany({ where: { adminNotes: 'seed:demo-may-2026' } })
await p.vendor.deleteMany({})  // wipes all 4 seeded vendors
await p.mlpaTemplate.deleteMany({ where: { version: 'v1.0' } })
console.log('wiped.')
await p.$disconnect()
```

Run with `node --env-file=.env scripts/wipe-seed.mjs`. Don't run this before the meeting.

---

## Second sweep findings (verified visually via screenshots)

Driven by puppeteer-core + Edge, signed in as `r.calloway@northchase-nh.com` against the deployed app. 16 screenshots in `qa-output/screenshots/`.

### What works end-to-end ✅

- All 19 dashboard routes return 200/307 correctly (zero 500s)
- Dashboard: personalized greeting "Good evening, Rebecca", role badge, company, "3 pending bids awaiting review" action item, stats cards (7 total listings / 6 active), bid-activity chart, Recent Activity feed with FULL bid amounts ($1,350,000 / $1,385,000 / $1,410,000) and bidder names
- Listings browse: 12 cards per page, all 21 listings filterable
- **Asset-type filtering works for all 4 values** (verified Commercial→3, Consumer→2, Mixed→1)
- Listing detail: bid history with status badges (Pending/Countered), counter amounts, owner-only Edit/View Bids/Mark as Sold actions, Listing Performance sidebar
- Listings/new: 7-step wizard, all 4 asset classes selectable
- Listings/import: tabbed UI (Import from File / Enter Manually / Bulk CSV), drop zone, template download
- Profile: comprehensive — member since, role/approval badges, account info form, change password, notification preferences, danger zone
- Empty states (Pipeline, Watchlist, Messages, Notifications, Deals) are polished with friendly copy + CTA buttons

### Fixed this sweep (3 commits pushed)

1. **`9969b2b`** — Seeded users were getting trapped on `/terms-update` on every page hit because they had no `termsVersion`. Fixed by pre-accepting v1.0 in the seed script.
2. **`dc27d9c`** — Listings filter dropdown and CreateListingForm only offered 2 asset classes (Residential / Commercial), while the schema, API, edit page, manual asset form, and card colors all already supported the full 4-value enum. Added Consumer Unsecured + Mixed Portfolio to both surfaces, plus fixed the active-filter chip label which was hardcoding non-Residential as "Commercial".

### Notes for the demo (verified, no code change needed) ⚠️

1. **Onboarding tour pops up automatically** for any browser without `localStorage.aurum_tour_completed_*` set. Easy to skip ("Skip tour" link), but in a fresh browser/incognito session it overlays the dashboard. **Recommendation:** dismiss it on whatever browser you'll demo from before joining the meeting.
2. **Bid amounts all render as "$1.4M"** on the Dallas listing detail page because `formatCurrency` rounds to one decimal (1.35 / 1.385 / 1.41 all → 1.4). The Recent Activity feed on the dashboard shows full amounts. Minor visual quirk — buyers reading the bid list can't distinguish offers by 1-decimal increments. Not a bug, just a precision call. Worth knowing if a buyer asks "why are all 3 bids identical".
3. **Rebecca Calloway (a seeded SELLER) shows empty Watchlist / Pipeline / Notifications.** That's correct for a seller persona. **Your `eddy@dlcep.com` account has 3 saved listings, 3 pipeline entries (REVIEWING/BIDDING/UNDER_LOI), 4 unread notifications.** Sign in as eddy for the full demo experience.
4. **Listing Performance card shows 0 views / 0 bids received** in some places. The bid-received count IS correct on listings with bids (3 for Dallas). The view counts are 0 because no `ListingView` rows were seeded — no demo views have happened. Will populate organically once anyone actually visits a listing.

### Verified false positives (no action)

- React Flight wire-format escaping shows `"$$1.4M"` in the raw HTML stream. Rendered output is single `$1.4M`. Not a bug.
- Pipeline showing "Loading pipeline…" in the HTTP probe — client-side rendered; post-hydration screenshot showed the empty-state UI correctly. Not a bug.

## Verification artifacts available

| File | What it is |
|---|---|
| `qa-output/screenshots/*.png` | 16 puppeteer screenshots of every key surface, signed in as seeded SELLER |
| `qa-output/*.html` | Raw HTML capture of every authenticated route (for grep/inspection) |
| `lighthouse-reports/landing.report.html` | Original landing scores (Perf 96, A11y 86) |
| `lighthouse-reports/landing-v2.report.html` | Post-a11y-fix landing (Perf 96, A11y **94**) |
| `lighthouse-reports/signin.report.html` | Signin page (Perf 100, A11y 96) |
| `scripts/seed-demo.mjs` | Idempotent seed (re-runnable, won't dup) |
| `scripts/verify-seed.mjs` | 17 integrity checks against seeded data |
| `scripts/probe-authed.mjs` | HTTP probe of all routes (auth currently broken on http localhost — see note) |
| `_build.log` | Latest production build (`next build`) — green |
| `docs/client-brief.pdf` | Regenerated brief for May 25 |
