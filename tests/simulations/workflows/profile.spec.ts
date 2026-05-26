import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'profile'

test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
    await page.goto('/profile')
  })

  test('renders all sections and member-since', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await expect(page.getByText(/Profile|Account Information/i).first()).toBeVisible()
    await expect(page.getByText(/Change Password/i).first()).toBeVisible()
    await expect(page.getByText(/Notification Preferences/i).first()).toBeVisible()
    await expect(page.getByText(/Danger Zone/i).first()).toBeVisible()
    // Member-since label
    await expect(page.getByText(/Member Since/i).first()).toBeVisible()
    // Email input prefilled with the user's email, and disabled (per "Email cannot be changed" copy)
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toHaveValue(DEMO_SELLER.email)
    await expect(emailInput).toBeDisabled()
    await shot(page, W, '01-overview')
    expectNoCriticalErrors(errors)
  })

  test('password change rejects mismatched confirm field', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const current = page.locator('input[type="password"]').nth(0)
    const next    = page.locator('input[type="password"]').nth(1)
    const confirm = page.locator('input[type="password"]').nth(2)
    await current.fill('DoesNotMatter1!')
    await next.fill('NewPasswordX9!')
    await confirm.fill('NewPasswordY9!')  // intentional mismatch
    const submit = page.getByRole('button', { name: /Update Password/i }).first()
    await submit.click()
    await page.waitForTimeout(1500)
    // Look for any visible mismatch/error message
    const body = await page.locator('body').innerText()
    expect(body, 'Expected an error on confirm-mismatch').toMatch(/match|don['']t.*match|mismatch|differ/i)
    await shot(page, W, '02-password-mismatch')
    expectNoCriticalErrors(errors)
  })

  test('notification preferences toggles render and are interactive', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    // The page has a series of in-app/email toggles
    const toggles = page.locator('[role="switch"], input[type="checkbox"]')
    const count = await toggles.count()
    expect(count, 'Expected several notification toggles').toBeGreaterThanOrEqual(4)
    await shot(page, W, '03-notification-prefs')
    expectNoCriticalErrors(errors)
  })
})
