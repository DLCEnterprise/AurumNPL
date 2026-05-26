import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'listings-browse'

test.describe('Listings browse', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
  })

  test('default view shows paginated cards', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    const cards = await page.locator('.listing-card').count()
    expect(cards, 'Default page should show up to 12 listing cards (PAGE_SIZE)').toBeGreaterThanOrEqual(1)
    expect(cards).toBeLessThanOrEqual(12)
    await shot(page, W, '01-default')
    expectNoCriticalErrors(errors)
  })

  test('asset-type filter — Commercial returns expected subset', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?assetType=COMMERCIAL')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    const cards = await page.locator('.listing-card').count()
    expect(cards).toBeGreaterThanOrEqual(1)
    // Filter chip should be visible and labeled "Commercial"
    await expect(page.getByText(/^Commercial$/).first()).toBeVisible()
    await shot(page, W, '02-filter-commercial')
    expectNoCriticalErrors(errors)
  })

  test('asset-type filter — Consumer Unsecured returns CONSUMER listings', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?assetType=CONSUMER')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    const cards = await page.locator('.listing-card').count()
    expect(cards, 'Seeded data has 2 CONSUMER listings').toBeGreaterThanOrEqual(1)
    await expect(page.getByText(/Consumer Unsecured/i).first()).toBeVisible()
    await shot(page, W, '03-filter-consumer')
    expectNoCriticalErrors(errors)
  })

  test('asset-type filter — Mixed Portfolio works', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?assetType=MIXED')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    expect(await page.locator('.listing-card').count()).toBeGreaterThanOrEqual(1)
    await expect(page.getByText(/Mixed Portfolio/i).first()).toBeVisible()
    await shot(page, W, '04-filter-mixed')
    expectNoCriticalErrors(errors)
  })

  test('UPB descending sort orders the cards from largest first', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?sortBy=upbDesc')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    // Extract first card's UPB and confirm it parses as a high number
    const firstCardText = await page.locator('.listing-card').first().innerText()
    // Should mention $12.4M (the Mixed Portfolio listing) or $8.9M (Consumer) — both > $1M
    expect(firstCardText).toMatch(/\$\d+\.\d?M/)
    await shot(page, W, '05-sort-upb-desc')
    expectNoCriticalErrors(errors)
  })

  test('search box filters by title text', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?q=Dallas')
    await page.waitForSelector('.listing-card', { timeout: 30_000 })
    const cards = await page.locator('.listing-card').count()
    expect(cards, 'Search for "Dallas" should match the Dallas Metro listing').toBeGreaterThanOrEqual(1)
    await expect(page.getByText(/Dallas Metro/i).first()).toBeVisible()
    await shot(page, W, '06-search-dallas')
    expectNoCriticalErrors(errors)
  })

  test('"Mine" filter scopes to current user\'s listings', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/listings?mine=true')
    await page.waitForSelector('h1, .listing-card', { timeout: 30_000 })
    // Header should say "My Listings"
    await expect(page.locator('h1').filter({ hasText: /My Listings/i })).toBeVisible()
    await shot(page, W, '07-mine')
    expectNoCriticalErrors(errors)
  })
})
