// Runs first (sorted by filename). Forces dev server to compile every
// route we'll touch so subsequent specs hit warm caches.
import { test } from '@playwright/test'

const ROUTES_TO_PREWARM = [
  '/', '/signin', '/signup', '/forgot-password', '/reset-password',
  '/dashboard', '/listings', '/listings/new', '/listings/import',
  '/messages', '/notifications', '/pipeline', '/watchlist', '/deals',
  '/profile', '/admin', '/admin/users', '/admin/listings', '/admin/vendors', '/admin/mlpa',
  '/tools/yield-calculator',
]

test.describe.configure({ timeout: 900_000 })

test('warm up all routes (cold-compile pass)', async ({ page }) => {
  for (const r of ROUTES_TO_PREWARM) {
    try {
      await page.goto(r, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      console.log(`  warm: ${r} → ${page.url()}`)
    } catch (e) {
      console.log(`  warm-fail: ${r} — ${(e as Error).message.slice(0, 80)}`)
    }
  }
})
