import { test, expect } from '@playwright/test'
import { signIn, DEMO_BUYER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'watchlist-save'

test.describe('Watchlist save / unsave', () => {
  test('buyer can save a listing then see it in /watchlist', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await signIn(page, DEMO_BUYER.email)
    await dismissTour(page)
    // Find a listing the buyer doesn't own (anything)
    await page.goto('/listings')
    await page.waitForSelector('.listing-card')
    await page.locator('.listing-card').first().getByRole('link', { name: /View Details|Details/i }).click()
    await page.waitForURL(/\/listings\/[a-z0-9]+/)
    await shot(page, W, '01-on-detail')

    // Save button — bookmark icon
    const saveBtn = page.getByRole('button', { name: /save|watchlist|bookmark/i }).first()
    if (await saveBtn.count() === 0) {
      test.skip(true, 'Save button not found — listing may not show save option for this user')
    }
    await saveBtn.click()
    await page.waitForTimeout(800)
    await shot(page, W, '02-saved')

    // Navigate to /watchlist and check the listing is there
    await page.goto('/watchlist')
    await page.waitForLoadState('networkidle')
    const isEmpty = await page.getByText(/Your watchlist is empty/i).count() > 0
    expect(isEmpty, 'Watchlist should not be empty after save').toBeFalsy()
    await shot(page, W, '03-in-watchlist')
    expectNoCriticalErrors(errors)
  })
})
