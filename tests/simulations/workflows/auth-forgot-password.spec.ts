import { test, expect } from '@playwright/test'
import { attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'auth-forgot-password'

test.describe('Forgot password', () => {
  test('page renders email input + clear CTA', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"], input#email').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await shot(page, W, '01-initial')
    expectNoCriticalErrors(errors)
  })

  test('submits unknown email without leaking existence (privacy)', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/forgot-password')
    const emailInput = page.locator('input[type="email"], input#email').first()
    await emailInput.fill('nobody-such-account-exists@example.invalid')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(2500)
    // Privacy convention: do NOT reveal "user not found". Should show a generic success-style message.
    const body = await page.locator('body').innerText()
    const leaksExistence = /not found|doesn'?t exist|no such user|unknown account/i.test(body)
    expect(leaksExistence, 'Response should not reveal whether an account exists').toBeFalsy()
    await shot(page, W, '02-unknown-email')
    expectNoCriticalErrors(errors)
  })
})
