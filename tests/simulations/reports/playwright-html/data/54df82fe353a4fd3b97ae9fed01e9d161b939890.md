# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-forgot-password.spec.ts >> Forgot password >> page renders email input + clear CTA
- Location: tests\simulations\workflows\auth-forgot-password.spec.ts:7:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   Object {
+     "text": "Creating a worker from 'blob:https://aurum-npl-lflx.vercel.app/d96e3e65-3d27-454f-a5e1-bd77dec5b67e' violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com\". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.",
+     "type": "console.error",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ◈
      - generic [ref=e7]: AURUM
    - heading "Reset your password" [level=1] [ref=e8]
    - paragraph [ref=e9]: Enter your email and we'll send you a reset link
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email Address
        - textbox "Email Address" [ref=e13]:
          - /placeholder: you@company.com
      - button "Send Reset Link" [ref=e14] [cursor=pointer]
    - generic [ref=e15]: Remember your password?
    - link "Back to Sign In" [ref=e16] [cursor=pointer]:
      - /url: /signin
  - region
  - alert [ref=e17]
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test'
  2  | 
  3  | // Demo fixture accounts (created by scripts/seed-demo.mjs)
  4  | export const DEMO_PASSWORD = 'Demo!2026Aurum'
  5  | 
  6  | export const DEMO_SELLER = {
  7  |   email: 'r.calloway@northchase-nh.com',
  8  |   name: 'Rebecca Calloway',
  9  |   company: 'Northchase Note Holdings',
  10 |   role: 'SELLER',
  11 | }
  12 | export const DEMO_BUYER = {
  13 |   email: 'j.weston@brightlinecap.com',
  14 |   name: 'Julia Weston',
  15 |   company: 'Brightline Distressed Capital',
  16 |   role: 'BUYER',
  17 | }
  18 | export const DEMO_DUAL = {
  19 |   email: 'a.brennan@riverviewcs.com',
  20 |   name: 'Adam Brennan',
  21 |   company: 'Riverview Credit Strategies',
  22 |   role: 'SELLER_BUYER',
  23 | }
  24 | 
  25 | /** Sign in via the actual /signin page. */
  26 | export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  27 |   await page.goto('/signin')
  28 |   await page.fill('input#email', email)
  29 |   await page.fill('input#password', password)
  30 |   await Promise.all([
  31 |     page.waitForURL(/\/(dashboard|terms-update)/, { timeout: 30000 }).catch(() => {}),
  32 |     page.click('button[type="submit"]'),
  33 |   ])
  34 | }
  35 | 
  36 | /** Dismiss the onboarding tour modal so it doesn't obscure subsequent screenshots. */
  37 | export async function dismissTour(page: Page) {
  38 |   const skip = page.getByText(/Skip tour/i)
  39 |   if (await skip.isVisible().catch(() => false)) {
  40 |     await skip.click()
  41 |     await page.waitForTimeout(300)
  42 |   }
  43 | }
  44 | 
  45 | /** Capture browser console errors during a test. Returns array of {type, text}. */
  46 | export function attachConsoleCollector(page: Page) {
  47 |   const errors: { type: string; text: string }[] = []
  48 |   page.on('console', msg => {
  49 |     if (msg.type() === 'error') errors.push({ type: 'console.error', text: msg.text() })
  50 |   })
  51 |   page.on('pageerror', err => errors.push({ type: 'pageerror', text: err.message }))
  52 |   page.on('requestfailed', req => {
  53 |     const f = req.failure()
  54 |     errors.push({ type: 'requestfailed', text: `${req.method()} ${req.url()} — ${f?.errorText}` })
  55 |   })
  56 |   return errors
  57 | }
  58 | 
  59 | /** Screenshot helper that places files into a workflow-named subdir. */
  60 | export async function shot(page: Page, workflow: string, label: string) {
  61 |   const safe = label.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  62 |   await page.screenshot({ path: `tests/simulations/screenshots/${workflow}/${safe}.png`, fullPage: true })
  63 | }
  64 | 
  65 | /** Assert that no critical console errors fired. Whitelists known harmless ones. */
  66 | export function expectNoCriticalErrors(errors: { type: string; text: string }[]) {
  67 |   const harmless = [
  68 |     /Failed to load resource.*favicon/i,
  69 |     /sentry/i,  // Sentry telemetry beacons may fail in dev without DSN; not a UI issue
  70 |     /sourcemap/i,
  71 |     /Hydration text content did not match server-rendered HTML/i,  // dev-time warning we tolerate
  72 |   ]
  73 |   const critical = errors.filter(e => !harmless.some(re => re.test(e.text)))
  74 |   if (critical.length) {
  75 |     console.log('Critical console errors:\n' + critical.map(e => `  [${e.type}] ${e.text}`).join('\n'))
  76 |   }
> 77 |   expect(critical).toEqual([])
     |                    ^ Error: expect(received).toEqual(expected) // deep equality
  78 | }
  79 | 
```