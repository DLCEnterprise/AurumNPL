import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'dashboard-render'

test.describe('Dashboard render', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
  })

  test('renders greeting, role badge, stats grid', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await expect(page).toHaveURL(/\/dashboard/)
    // Greeting includes "Good morning|afternoon|evening, Rebecca"
    const greeting = page.locator('h1').first()
    await expect(greeting).toContainText(/Rebecca/)
    // Role pill
    await expect(page.getByText(/Seller Account/i).first()).toBeVisible()
    // Company subtitle
    await expect(page.getByText(DEMO_SELLER.company).first()).toBeVisible()
    // Stats cards — 4 grid items with labels
    const statCards = page.locator('.stat-card')
    expect(await statCards.count()).toBeGreaterThanOrEqual(4)
    await shot(page, W, '01-overview')
    expectNoCriticalErrors(errors)
  })

  test('Action Items surface "pending bids awaiting review" for sellers with bids', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    // Rebecca owns Dallas Metro which has 3 bids → "3 pending bids awaiting review" should show
    const pendingText = page.getByText(/pending bid.*awaiting review/i)
    await expect(pendingText.first()).toBeVisible({ timeout: 10_000 })
    await shot(page, W, '02-action-items')
    expectNoCriticalErrors(errors)
  })

  test('Recent Activity feed lists at least one bid event with full amount', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    // Recent activity is loaded via Suspense — give it time
    await page.waitForTimeout(2000)
    const activity = page.locator('text=/Recent Activity/i').first()
    await expect(activity).toBeVisible()
    // At least one bid with full dollar amount ($1,4xx,000)
    const body = await page.locator('body').innerText()
    expect(body).toMatch(/\$1,4\d{2},000|\$1,3\d{2},000/)
    await shot(page, W, '03-recent-activity')
    expectNoCriticalErrors(errors)
  })
})
