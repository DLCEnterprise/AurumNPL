// Capture screenshots of key surfaces using puppeteer-core driving Edge.
// Authenticates by signing in (no cookie injection needed — real flow).

import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'fs'

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
const BASE = 'https://aurum-npl-lflx.vercel.app'
const SEEDED_EMAIL = 'r.calloway@northchase-nh.com'
const SEEDED_PASSWORD = 'Demo!2026Aurum'
const OUT = 'qa-output/screenshots'

mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
})
const page = await browser.newPage()
console.log('▸ Browser launched')

// Sign in via the actual /signin page so cookies, redirects, and state are real
await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.type('input#email', SEEDED_EMAIL)
await page.type('input#password', SEEDED_PASSWORD)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
  page.click('button[type="submit"]'),
])
const finalUrl = page.url()
console.log(`▸ Signed in. Now at: ${finalUrl}`)

if (finalUrl.includes('/signin')) {
  console.error('  ✗ Still on /signin — sign-in may have failed.')
  await page.screenshot({ path: `${OUT}/00-signin-failed.png`, fullPage: true })
  await browser.close()
  process.exit(1)
}

const SHOTS = [
  { path: '/',                              label: '01-landing-public',        waitFor: 1200 },
  { path: '/dashboard',                     label: '02-dashboard',             waitFor: 1800 },
  { path: '/listings',                      label: '03-listings-browse',       waitFor: 1500 },
  { path: '/listings?assetType=COMMERCIAL', label: '04-listings-commercial',   waitFor: 1500 },
  { path: '/listings?assetType=CONSUMER',   label: '05-listings-consumer',     waitFor: 1500 },
  { path: '/listings?assetType=MIXED',      label: '06-listings-mixed',        waitFor: 1500 },
  { path: '/listings?sortBy=upbDesc',       label: '07-listings-sort-upb',     waitFor: 1500 },
  { path: '/pipeline',                      label: '08-pipeline-hydrated',     waitFor: 3500 },
  { path: '/notifications',                 label: '09-notifications',         waitFor: 1500 },
  { path: '/watchlist',                     label: '10-watchlist',             waitFor: 1500 },
  { path: '/messages',                      label: '11-messages',              waitFor: 2000 },
  { path: '/deals',                         label: '12-deals',                 waitFor: 1500 },
  { path: '/profile',                       label: '13-profile',               waitFor: 1500 },
  { path: '/listings/new',                  label: '14-listings-new-form',     waitFor: 2000 },
  { path: '/listings/import',               label: '15-listings-import',       waitFor: 1500 },
]

for (const s of SHOTS) {
  try {
    await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, s.waitFor))
    await page.screenshot({ path: `${OUT}/${s.label}.png`, fullPage: true })
    console.log(`  📸 ${OUT}/${s.label}.png`)
  } catch (e) {
    console.error(`  ✗ ${s.label}: ${e.message.slice(0, 100)}`)
  }
}

// Listing detail with bid history
import('@prisma/client').then(async ({ PrismaClient }) => {
  const p = new PrismaClient()
  const dallas = await p.listing.findFirst({ where: { listingNumber: 'AUR-2026-00001' }, select: { id: true } })
  if (dallas) {
    await page.goto(`${BASE}/listings/${dallas.id}`, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 2500))
    await page.screenshot({ path: `${OUT}/16-listing-detail-dallas.png`, fullPage: true })
    console.log(`  📸 ${OUT}/16-listing-detail-dallas.png`)
  }
  await p.$disconnect()
  await browser.close()
  console.log('\nDone.')
})
