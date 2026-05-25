import { test, expect } from '@playwright/test'
import { DEMO_SELLER, DEMO_PASSWORD, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'auth-signin'

test.describe('Sign in', () => {
  test('renders sign-in page cleanly', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signin')
    await expect(page).toHaveTitle(/AURUM|Sign In/i)
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await shot(page, W, '01-initial-render')
    expectNoCriticalErrors(errors)
  })

  test('rejects invalid credentials with error UI', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signin')
    await page.fill('input#email', DEMO_SELLER.email)
    await page.fill('input#password', 'wrong-password-deliberately')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1500)  // wait for error
    // Look for a visible error message (text or role=alert)
    const errorVisible =
      (await page.getByText(/invalid|incorrect|wrong|failed/i).count()) > 0 ||
      (await page.locator('[role="alert"]').count()) > 0
    expect(errorVisible, 'Expected an error message on invalid signin').toBeTruthy()
    await shot(page, W, '02-invalid-creds-error')
    // Should still be on /signin
    expect(page.url()).toContain('/signin')
    expectNoCriticalErrors(errors)
  })

  test('rejects empty submission with field validation', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signin')
    // Click submit without filling — browser HTML5 validation should kick in (required attr)
    await page.click('button[type="submit"]')
    const emailEl = page.locator('input#email')
    const invalid = await emailEl.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(invalid, 'Empty email should fail browser validation').toBeTruthy()
    await shot(page, W, '03-empty-validation')
    expectNoCriticalErrors(errors)
  })

  test('signs in valid user and redirects to /dashboard', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signin')
    await page.fill('input#email', DEMO_SELLER.email)
    await page.fill('input#password', DEMO_PASSWORD)
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ])
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(DEMO_SELLER.name).first()).toBeVisible({ timeout: 10000 })
    await shot(page, W, '04-signed-in-dashboard')
    expectNoCriticalErrors(errors)
  })
})
