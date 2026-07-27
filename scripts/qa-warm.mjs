/**
 * Pre-compile every dev route so QA runs don't each pay the 20-40s cold-compile
 * cost. Uses the admin storageState from scripts/qa-auth-state.mjs.
 *
 *   node scripts/qa-warm.mjs
 */
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const BASE = process.env.AURUM_BASE_URL || 'http://localhost:3000'
const STATE = resolve('tests/simulations/.auth-state/admin.json')

const ROUTES = [
  '/', '/terms', '/signin', '/signup', '/forgot-password', '/reset-password',
  '/pending-approval', '/tools/yield-calculator', '/terms-update',
  '/dashboard', '/listings', '/listings/new', '/listings/import',
  '/watchlist', '/deals', '/pipeline', '/messages', '/notifications', '/profile',
  '/admin', '/admin/users', '/admin/listings', '/admin/mlpa', '/admin/vendors',
]

if (!existsSync(STATE)) {
  console.error(`Missing ${STATE} — run: node scripts/qa-auth-state.mjs`)
  process.exit(1)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: STATE })
const page = await ctx.newPage()

for (const route of ROUTES) {
  const t0 = Date.now()
  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    console.log(`${String(res?.status() ?? '---').padEnd(4)} ${String(Date.now() - t0).padStart(6)}ms  ${route}`)
  } catch (err) {
    console.log(`ERR  ${String(Date.now() - t0).padStart(6)}ms  ${route}  ${String(err).split('\n')[0]}`)
  }
}

// One listing detail + edit + bids page, to compile the dynamic segments.
try {
  await page.goto(`${BASE}/listings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const href = await page.locator('a[href^="/listings/"]').first().getAttribute('href')
  if (href && !/\/(new|import)$/.test(href)) {
    for (const sub of ['', '/edit', '/bids']) {
      const t0 = Date.now()
      const res = await page.goto(`${BASE}${href}${sub}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      console.log(`${String(res?.status() ?? '---').padEnd(4)} ${String(Date.now() - t0).padStart(6)}ms  ${href}${sub}`)
    }
  }
} catch (err) {
  console.log(`ERR  listing detail warm — ${String(err).split('\n')[0]}`)
}

await browser.close()
