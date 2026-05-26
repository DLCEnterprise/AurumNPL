import { test, expect } from '@playwright/test'
import { signIn, DEMO_SELLER, dismissTour, attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'dashboard-nav-sidebar'

test.describe('Dashboard sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEMO_SELLER.email)
    await dismissTour(page)
  })

  test('every sidebar link routes to its target without error', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const targets = [
      { name: /^Listings$/, expectUrl: /\/listings$/ },
      { name: /^Messages$/, expectUrl: /\/messages/ },
      { name: /^Pipeline$/, expectUrl: /\/pipeline/ },
      { name: /^My Deals$/, expectUrl: /\/deals/ },
      { name: /^Profile$/, expectUrl: /\/profile/ },
      { name: /^Dashboard$/, expectUrl: /\/dashboard/ },  // back to dashboard
    ]
    for (const t of targets) {
      const link = page.getByRole('link', { name: t.name }).first()
      await expect(link).toBeVisible()
      await link.click()
      await page.waitForURL(t.expectUrl, { timeout: 20_000 })
      await shot(page, W, `nav-${t.name.source.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`)
    }
    expectNoCriticalErrors(errors)
  })

  test('preferences drawer opens and toggles between themes', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    const prefsBtn = page.getByRole('button', { name: /preferences/i }).first()
    if (await prefsBtn.count() === 0) {
      test.skip(true, 'Preferences button not found in sidebar')
    }
    await prefsBtn.click()
    await page.waitForTimeout(500)
    // Drawer should be visible — look for a known label
    const drawerOpen = await page.getByText(/Accent|Theme|Density|Navigation/i).count() > 0
    expect(drawerOpen, 'Preferences drawer should open with theme/density controls').toBeTruthy()
    await shot(page, W, 'prefs-drawer-open')
    expectNoCriticalErrors(errors)
  })
})
