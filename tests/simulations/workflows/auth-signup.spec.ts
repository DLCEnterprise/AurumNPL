import { test, expect } from '@playwright/test'
import { attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'auth-signup'

test.describe('Sign up', () => {
  test('renders signup page with all required fields', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signup')
    await expect(page.locator('input[type="email"], input#email').first()).toBeVisible()
    await expect(page.locator('input[type="password"], input#password').first()).toBeVisible()
    await shot(page, W, '01-initial-render')
    expectNoCriticalErrors(errors)
  })

  test('rejects empty submission with HTML5 validation', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signup')
    const submit = page.locator('button[type="submit"]').first()
    await submit.click()
    // At least one required field should be invalid
    const anyInvalid = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLInputElement>('input[required]')).some(i => !i.validity.valid)
    )
    expect(anyInvalid, 'Expected at least one required field invalid on empty submit').toBeTruthy()
    await shot(page, W, '02-empty-validation')
    expectNoCriticalErrors(errors)
  })

  test('rejects weak password if password rules enforced', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/signup')
    // Fill obvious dummy values; if there's a password complexity check, this should surface
    const ts = Date.now()
    const fill = async (sel: string, val: string) => {
      const el = page.locator(sel)
      if (await el.count() > 0) await el.first().fill(val)
    }
    await fill('input#name, input[name="name"]', 'Test User')
    await fill('input#email, input[type="email"]', `qa-sim-${ts}@example.invalid`)
    await fill('input#password, input[type="password"]', '123')      // weak
    await fill('input#confirmPassword, input#passwordConfirm', '123')
    const submit = page.locator('button[type="submit"]').first()
    await submit.click()
    await page.waitForTimeout(1500)
    // Should remain on /signup or show validation error — NOT have created an account silently
    const stillOnSignup = page.url().includes('/signup') || page.url().includes('/pending')
    expect(stillOnSignup, 'Weak password should not silently create an account').toBeTruthy()
    await shot(page, W, '03-weak-password')
    expectNoCriticalErrors(errors)
  })
})
