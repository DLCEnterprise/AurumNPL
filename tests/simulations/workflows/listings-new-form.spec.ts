import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'listings-new-form'

test.describe('Create-listing wizard', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
    await page.goto('/listings/new')
    await page.waitForLoadState('networkidle')
  })

  test('step 1 shows all 4 asset classes including Consumer + Mixed', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await expect(page.getByText(/Residential 1–4 Units/i).first()).toBeVisible()
    await expect(page.getByText(/^Commercial$/).first()).toBeVisible()
    await expect(page.getByText(/Consumer Unsecured/i).first()).toBeVisible()
    await expect(page.getByText(/Mixed Portfolio/i).first()).toBeVisible()
    // Performance status options
    await expect(page.getByText(/Non-Performing/i).first()).toBeVisible()
    await expect(page.getByText(/Performing.*Mod|Sub-Performing/i).first()).toBeVisible()
    await shot(page, W, '01-step-1-deal-setup')
    expectNoCriticalErrors(errors)
  })

  test('wizard step indicators are visible (Deal Setup → Note Terms → Property → …)', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const expectedSteps = ['Deal Setup', 'Note Terms', 'Property', 'Legal', 'Deal Terms', 'Documents', 'Review']
    const body = await page.locator('body').innerText()
    for (const s of expectedSteps) {
      expect(body, `Expected step label "${s}"`).toMatch(new RegExp(s, 'i'))
    }
    await shot(page, W, '02-step-indicators')
    expectNoCriticalErrors(errors)
  })

  test('attempting to skip required fields surfaces validation', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    // Try to advance without filling the listing title
    const continueBtn = page.getByRole('button', { name: /Continue/i }).first()
    await continueBtn.click()
    await page.waitForTimeout(500)
    const body = await page.locator('body').innerText()
    // Either an inline error appears or we don't advance
    const stillOnStep1 = /What are you listing/i.test(body) || /required/i.test(body)
    expect(stillOnStep1, 'Empty form should not silently advance').toBeTruthy()
    await shot(page, W, '03-validation-blocks-advance')
    expectNoCriticalErrors(errors)
  })
})
