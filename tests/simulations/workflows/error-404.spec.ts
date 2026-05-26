import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'error-404'

test.describe('404 / unknown route handling', () => {
  test('unknown public route shows a friendly 404 page (not a raw error)', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const res = await page.goto('/this-route-should-not-exist-1234')
    expect(res?.status()).toBe(404)
    const body = await page.locator('body').innerText()
    // Should not leak a stack trace
    expect(body).not.toMatch(/at\s+\w+\s*\(.*:\d+:\d+\)/)
    expect(body).not.toMatch(/TypeError|ReferenceError/)
    await shot(page, W, '01-public-404')
    expectNoCriticalErrors(errors)
  })

  test('unknown listing id shows 404 (or graceful fallback) for authed users', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
    const res = await page.goto('/listings/cmtotallyfakelistingidnotreal0000')
    // Either 404 page or a graceful "listing not found" message
    const status = res?.status() ?? 0
    const body = await page.locator('body').innerText()
    expect(status === 404 || /not found|doesn't exist|no longer/i.test(body)).toBeTruthy()
    await shot(page, W, '02-unknown-listing-id')
    expectNoCriticalErrors(errors)
  })
})
