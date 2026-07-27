/**
 * QA auth-state bootstrap.
 *
 * Signs in once per role and writes Playwright storageState files to
 * tests/simulations/.auth-state/. Specs load these instead of calling signIn()
 * in beforeEach, which is what used to trip the production signin rate limiter
 * (10 / 15 min per IP — see src/lib/rate-limit.ts).
 *
 * Also ensures a dedicated QA ADMIN fixture exists so admin surfaces can be
 * exercised without using a real operator account.
 *
 *   node scripts/qa-auth-state.mjs
 *
 * Env: AURUM_BASE_URL (default http://localhost:3000)
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.AURUM_BASE_URL || 'http://localhost:3000'
const PASSWORD = 'Demo!2026Aurum'
const CURRENT_TERMS_VERSION = '1.0'
const OUT_DIR = resolve('tests/simulations/.auth-state')

const QA_ADMIN = 'qa.admin@aurumqa.test'

const ACCOUNTS = [
  { key: 'admin', email: QA_ADMIN },
  { key: 'seller', email: 'r.calloway@northchase-nh.com' },
  { key: 'buyer', email: 'j.weston@brightlinecap.com' },
  { key: 'dual', email: 'a.brennan@riverviewcs.com' },
]

const prisma = new PrismaClient()

async function ensureQaAdmin() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  const user = await prisma.user.upsert({
    where: { email: QA_ADMIN },
    update: {
      passwordHash,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION,
    },
    create: {
      email: QA_ADMIN,
      name: 'QA Administrator',
      company: 'AURUM QA',
      passwordHash,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION,
    },
  })
  const accepted = await prisma.termsAcceptance.findFirst({
    where: { userId: user.id, version: CURRENT_TERMS_VERSION },
  })
  if (!accepted) {
    await prisma.termsAcceptance.create({
      data: { userId: user.id, version: CURRENT_TERMS_VERSION },
    })
  }
  return user
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  await ensureQaAdmin()

  const browser = await chromium.launch()
  const results = []

  for (const acct of ACCOUNTS) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    try {
      await page.goto(`${BASE}/signin`, { waitUntil: 'networkidle', timeout: 180_000 })
      // The dev server compiles the /signin client bundle on first hit. Clicking
      // before React hydrates makes the browser submit the form natively
      // (GET /signin?) and the sign-in never happens — wait for hydration.
      await page.waitForTimeout(3_000)
      await page.fill('input#email', acct.email)
      await page.fill('input#password', PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/(dashboard|terms-update|admin)/, { timeout: 180_000 })
      await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {})

      // Clear the once-per-user onboarding tour so it does not cover the UI.
      await page.evaluate(() => {
        try {
          Object.keys(localStorage)
            .filter(k => /tour|onboard/i.test(k))
            .forEach(k => localStorage.setItem(k, 'true'))
          localStorage.setItem('aurum-tour-seen', 'true')
          localStorage.setItem('aurum-buyer-tour-seen', 'true')
          localStorage.setItem('aurum-seller-tour-seen', 'true')
        } catch {}
      })

      const file = resolve(OUT_DIR, `${acct.key}.json`)
      await ctx.storageState({ path: file })
      results.push({ ...acct, ok: true, url: page.url(), file })
    } catch (err) {
      results.push({ ...acct, ok: false, error: String(err).split('\n')[0], url: page.url() })
    } finally {
      await ctx.close()
    }
  }

  await browser.close()
  await prisma.$disconnect()

  console.log(JSON.stringify({ baseUrl: BASE, outDir: OUT_DIR, password: PASSWORD, results }, null, 2))
  if (results.some(r => !r.ok)) process.exitCode = 1
}

main().catch(async err => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
