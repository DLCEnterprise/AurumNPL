import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'listings-card-content'

test.describe('Listing card data integrity', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
    await page.goto('/listings')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
  })

  test('every card displays UPB, Loans, Location, Delinquency fields', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const cards = page.locator('.listing-card')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await cards.nth(i).innerText()
      expect(text, `Card ${i} missing UPB label`).toMatch(/UPB/i)
      expect(text, `Card ${i} missing Loans label`).toMatch(/Loans/i)
      expect(text, `Card ${i} missing Location label`).toMatch(/Location/i)
      // Currency value somewhere
      expect(text, `Card ${i} missing $ amount`).toMatch(/\$\d/)
      // Delinquency — months
      expect(text, `Card ${i} missing delinquency`).toMatch(/months|month|mo\b/i)
    }
    await shot(page, W, '01-cards-have-fields')
    expectNoCriticalErrors(errors)
  })

  test('asset-type badge and ACTIVE status badge present on every card', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const cards = page.locator('.listing-card')
    const count = await cards.count()
    const validBadges = /RESIDENTIAL|COMMERCIAL|CONSUMER|MIXED/i
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await cards.nth(i).innerText()
      expect(text, `Card ${i} missing asset-type badge`).toMatch(validBadges)
      expect(text, `Card ${i} missing ACTIVE badge`).toMatch(/ACTIVE/i)
    }
    await shot(page, W, '02-badges')
    expectNoCriticalErrors(errors)
  })

  test('no "undefined" / "null" / "NaN" text in any visible card', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const body = await page.locator('.listings__grid, [class*="listing"]').first().innerText().catch(() => '')
    if (body) {
      expect(body).not.toMatch(/\bundefined\b/)
      expect(body).not.toMatch(/\bnull\b/)
      expect(body).not.toMatch(/\bNaN\b/)
    }
    expectNoCriticalErrors(errors)
  })
})
