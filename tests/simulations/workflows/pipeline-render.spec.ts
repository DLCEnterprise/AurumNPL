import { test, expect } from '@playwright/test'
import { signIn, DEMO_BUYER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'pipeline-render'

test.describe('Deal pipeline', () => {
  test('buyer sees stage columns (Reviewing/Bidding/Under LOI/Closing/Closed)', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await signIn(page, DEMO_BUYER.email)
    await dismissTour(page)
    await page.goto('/pipeline')
    // Pipeline is client-side rendered — wait for any of the stage labels
    await page.waitForSelector('text=/Reviewing|Your pipeline is empty/i', { timeout: 30_000 })
    const body = await page.locator('body').innerText()
    // Either pipeline is empty (with friendly UX) OR all 5 stages are visible
    if (/empty/i.test(body)) {
      // Empty-state must have an action CTA
      await expect(page.getByRole('link', { name: /Browse Listings/i })).toBeVisible()
      await shot(page, W, 'empty-state')
    } else {
      for (const stage of ['Reviewing', 'Bidding', 'Under LOI', 'Closing', 'Closed']) {
        expect(body, `Expected stage label "${stage}"`).toContain(stage)
      }
      await shot(page, W, 'populated')
    }
    expectNoCriticalErrors(errors)
  })
})
