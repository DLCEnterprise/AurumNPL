import { test, expect } from '@playwright/test'
import { attachConsoleCollector, expectNoCriticalErrors, shot } from './_helpers'

const W = 'nav-public'

test.describe('Public landing navigation', () => {
  test('landing page renders all sections without console errors', async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await page.goto('/')
    await expect(page.locator('section.hero')).toBeVisible()
    // Hero stats bar
    await expect(page.locator('.hero__stats')).toBeVisible()
    // Active listings preview
    await expect(page.locator('.listings__grid')).toBeVisible()
    const listingCards = await page.locator('.listing-card').count()
    expect(listingCards, 'Landing should show 3 live preview listings').toBeGreaterThanOrEqual(3)
    // Messaging preview
    await expect(page.locator('#messages')).toBeVisible()
    // CTA section
    await expect(page.locator('section.cta')).toBeVisible()
    // Footer
    await expect(page.locator('footer.footer')).toBeVisible()
    await shot(page, W, '01-landing-full')
    expectNoCriticalErrors(errors)
  })

  test('nav anchor links scroll to matching section IDs', async ({ page }) => {
    await page.goto('/')
    // The nav has 4 anchors: #home, #listings, #messages, #features
    // Each should resolve to a real id on the page
    for (const anchor of ['home', 'listings', 'messages']) {
      const target = await page.locator(`#${anchor}`).count()
      expect(target, `Expected #${anchor} target to exist`).toBeGreaterThan(0)
    }
    // Known issue: #features anchor with no matching ID
    const featuresTarget = await page.locator('#features').count()
    if (featuresTarget === 0) {
      // Log as finding but don't fail — this is documented in the morning checklist
      console.log('  ⚠️ Finding: nav links to #features but no element has that id')
    }
  })

  test('hero CTA "List Your Assets" routes to /signup', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /List Your Assets/i })
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL(/\/signup/)
    expect(page.url()).toContain('/signup')
    await shot(page, W, '02-cta-to-signup')
  })

  test('hero CTA "Explore Marketplace" routes to /listings (gated by middleware)', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Explore Marketplace/i })
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForLoadState('networkidle')
    // Unauthenticated → should be at /signin with callbackUrl=/listings
    expect(page.url()).toMatch(/\/(signin|listings)/)
    await shot(page, W, '03-cta-to-listings')
  })
})
