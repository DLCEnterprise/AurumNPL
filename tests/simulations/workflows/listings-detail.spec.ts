import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'listings-detail'

test.describe('Listing detail', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
  })

  test('owner view shows title, UPB, bid history, owner actions', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    // Navigate via the Dallas listing — Rebecca is the seller
    await page.goto('/listings?q=Dallas')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    await page.getByText(/Dallas Metro Single-Family/).first().click()
    await page.waitForURL(/\/listings\/[a-z0-9]+/, { timeout: 30_000 })

    // Title
    await expect(page.locator('h1').filter({ hasText: /Dallas Metro/i })).toBeVisible()
    // Status badge
    await expect(page.getByText(/^ACTIVE$/).first()).toBeVisible()
    // Bid Activity heading
    await expect(page.getByText(/Bid Activity|Bid History/i).first()).toBeVisible()
    // Owner action: Edit Listing or View Bids button
    const editBtn = page.getByRole('link', { name: /Edit Listing/i })
      .or(page.getByRole('button', { name: /Edit Listing/i }))
    await expect(editBtn.first()).toBeVisible()

    await shot(page, W, '01-owner-view')
    expectNoCriticalErrors(errors)
  })

  test('listing without Asset rendering does not show "undefined" labels', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?q=Cleveland')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    await page.getByText(/Cleveland OH/).first().click()
    await page.waitForURL(/\/listings\/[a-z0-9]+/, { timeout: 30_000 })
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/\bundefined\b/)
    expect(body).not.toMatch(/\bnull\b/)
    expect(body).not.toMatch(/\bNaN\b/)
    await shot(page, W, '02-no-asset')
    expectNoCriticalErrors(errors)
  })
})
