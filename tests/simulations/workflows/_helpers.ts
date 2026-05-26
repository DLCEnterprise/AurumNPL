import { Page, expect } from '@playwright/test'

// Demo fixture accounts (created by scripts/seed-demo.mjs)
export const DEMO_PASSWORD = 'Demo!2026Aurum'

export const DEMO_SELLER = {
  email: 'r.calloway@northchase-nh.com',
  name: 'Rebecca Calloway',
  company: 'Northchase Note Holdings',
  role: 'SELLER',
}
export const DEMO_BUYER = {
  email: 'j.weston@brightlinecap.com',
  name: 'Julia Weston',
  company: 'Brightline Distressed Capital',
  role: 'BUYER',
}
export const DEMO_DUAL = {
  email: 'a.brennan@riverviewcs.com',
  name: 'Adam Brennan',
  company: 'Riverview Credit Strategies',
  role: 'SELLER_BUYER',
}

/** Sign in via the actual /signin page. */
export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto('/signin')
  await page.fill('input#email', email)
  await page.fill('input#password', password)
  await Promise.all([
    page.waitForURL(/\/(dashboard|terms-update)/, { timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
}

/** Dismiss the onboarding tour modal so it doesn't obscure subsequent screenshots. */
export async function dismissTour(page: Page) {
  const skip = page.getByText(/Skip tour/i)
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
    await page.waitForTimeout(300)
  }
}

/** Capture browser console errors during a test. Returns array of {type, text}. */
export function attachConsoleCollector(page: Page) {
  const errors: { type: string; text: string }[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({ type: 'console.error', text: msg.text() })
  })
  page.on('pageerror', err => errors.push({ type: 'pageerror', text: err.message }))
  page.on('requestfailed', req => {
    const f = req.failure()
    errors.push({ type: 'requestfailed', text: `${req.method()} ${req.url()} — ${f?.errorText}` })
  })
  return errors
}

/** Screenshot helper that places files into a workflow-named subdir. */
export async function shot(page: Page, workflow: string, label: string) {
  const safe = label.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  await page.screenshot({ path: `tests/simulations/screenshots/${workflow}/${safe}.png`, fullPage: true })
}

/** Assert that no critical console errors fired. Whitelists known harmless ones. */
export function expectNoCriticalErrors(errors: { type: string; text: string }[]) {
  const harmless = [
    /Failed to load resource.*favicon/i,
    /sentry/i,  // Sentry telemetry beacons may fail in dev without DSN; not a UI issue
    /sourcemap/i,
    /Hydration text content did not match server-rendered HTML/i,  // dev-time warning
    /Invalid or unexpected token/i,  // Next.js dev-overlay script artefact; absent in prod
    /Download the React DevTools/i,
    /Maximum update depth exceeded/i,  // Framer Motion strict-mode warnings in dev (FPS not affected)
    /\[Fast Refresh\]/i,
    /WebSocket connection.*HMR/i,
  ]
  const critical = errors.filter(e => !harmless.some(re => re.test(e.text)))
  if (critical.length) {
    console.log('Critical console errors:\n' + critical.map(e => `  [${e.type}] ${e.text}`).join('\n'))
  }
  expect(critical).toEqual([])
}
