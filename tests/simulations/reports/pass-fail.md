# Workflow Pass / Fail Summary

Updated after each workflow completes its fix-and-verify cycle.

| Workflow | Status | Issues Found | Issues Fixed | Remaining |
|----------|--------|--------------|--------------|-----------|
| Environment warmup | ✅ PASS (after fix) | 1 (session-guard null) | 1 | 0 |
| Sign in — page render | ⏳ Retesting after CSP fix | 1 (CSP worker-src) | 1 | 0 |
| Sign in — invalid creds | ⏳ Retesting | 1 (CSP) | 1 | 0 |
| Sign in — empty validation | ⏳ Retesting | 1 (CSP) | 1 | 0 |
| Sign in — valid creds → /dashboard | ⏳ Retesting | 1 (CSP) | 1 | 0 |
| Sign up — render | ✅ PASS | 0 | — | 0 |
| Sign up — empty validation | ⏳ Retesting | 1 (suspected: form missing required attrs) | 0 | TBD |
| Sign up — weak password | ✅ PASS | 0 | — | 0 |
| Forgot password — render | ⏳ Retesting after CSP | 1 (CSP) | 1 | 0 |
| Forgot password — privacy | ⏳ Retesting after CSP | 1 (CSP) | 1 | 0 |
| Landing — render | ⏳ Retesting after CSP | 1 (CSP) | 1 | 0 |
| Landing — nav anchors | ✅ PASS | 1 (#features non-existent — pre-known) | 0 (deferred — not blocking) | 1 |
| Landing — CTA → /signup | ✅ PASS | 0 | — | 0 |
| Landing — CTA → /listings | ⏳ Retesting | 1 (timing) | TBD | TBD |

**Suite total:** 14 tests across 4 spec files run. Re-running after CSP fix lands.

Specs written but not yet executed (waiting for stable baseline):
- `listings-browse.spec.ts` — 7 tests (filter/sort/search/mine)
- `listings-detail.spec.ts` — 2 tests (owner view, null-asset rendering)
- `listings-new-form.spec.ts` — 3 tests (wizard steps, validation)
- `dashboard-render.spec.ts` — 3 tests (greeting, action items, recent activity)
- `dashboard-nav-sidebar.spec.ts` — 2 tests (sidebar links, prefs drawer)
- `pipeline-render.spec.ts` — 1 test (stage columns / empty state)
- `profile.spec.ts` — 3 tests (overview, password mismatch, prefs toggles)
- `watchlist-save.spec.ts` — 1 test (save flow end-to-end)

