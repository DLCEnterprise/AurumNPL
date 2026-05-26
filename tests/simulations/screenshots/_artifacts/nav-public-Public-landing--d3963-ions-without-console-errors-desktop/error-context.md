# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nav-public.spec.ts >> Public landing navigation >> landing page renders all sections without console errors
- Location: tests\simulations\workflows\nav-public.spec.ts:7:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 6

- Array []
+ Array [
+   Object {
+     "text": "Creating a worker from 'blob:https://aurum-npl-lflx.vercel.app/7d2eb471-b4cd-422e-b941-c6aadfc569ae' violates the following Content Security Policy directive: \"script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com\". Note that 'worker-src' was not explicitly set, so 'script-src' is used as a fallback. The action has been blocked.",
+     "type": "console.error",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "◈ AURUM" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: ◈
        - generic [ref=e7]: AURUM
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "Home" [ref=e10] [cursor=pointer]:
            - /url: "#home"
        - listitem [ref=e11]:
          - link "Listings" [ref=e12] [cursor=pointer]:
            - /url: "#listings"
        - listitem [ref=e13]:
          - link "Messages" [ref=e14] [cursor=pointer]:
            - /url: "#messages"
        - listitem [ref=e15]:
          - link "Features" [ref=e16] [cursor=pointer]:
            - /url: "#features"
      - generic [ref=e17]:
        - button "Switch to light mode" [ref=e18] [cursor=pointer]:
          - img [ref=e19]
        - link "Sign In" [ref=e25] [cursor=pointer]:
          - /url: /signin
        - link "Get Started" [ref=e26] [cursor=pointer]:
          - /url: /signup
  - generic:
    - generic:
      - link "Home":
        - /url: "#home"
      - link "Listings":
        - /url: "#listings"
      - link "Messages":
        - /url: "#messages"
      - link "Features":
        - /url: "#features"
      - generic:
        - link "Sign In":
          - /url: /signin
        - link "Get Started":
          - /url: /signup
  - main [ref=e27]:
    - generic [ref=e28]:
      - generic [ref=e29]:
        - generic [ref=e30]: Institutional‑Grade NPL Trading Platform
        - heading "Where Distressed Assets Find New Value" [level=1] [ref=e32]:
          - text: Where Distressed
          - text: Assets Find
          - text: New Value
        - paragraph [ref=e33]: AURUM connects sophisticated sellers with qualified buyers in a secure, transparent marketplace for non‑performing loans. Premium analytics. Direct negotiation. Seamless execution.
        - generic [ref=e34]:
          - link "List Your Assets" [ref=e35] [cursor=pointer]:
            - /url: /signup
            - text: List Your Assets
            - img [ref=e36]
          - link "Explore Marketplace" [ref=e38] [cursor=pointer]:
            - /url: /listings
        - generic [ref=e40]:
          - generic [ref=e42]:
            - generic [ref=e43]: "21"
            - text: Active Listings
          - generic [ref=e46]:
            - generic [ref=e47]: $47.1M
            - text: Total UPB
          - generic [ref=e50]:
            - generic [ref=e51]: 10+
            - text: Registered Institutions
      - generic [ref=e54]: Scroll
    - generic [ref=e56]:
      - generic [ref=e57]:
        - generic [ref=e58]: The Platform
        - heading "A marketplace built for the complexity of distressed debt" [level=2] [ref=e59]:
          - text: A marketplace built for the
          - text: complexity of distressed debt
      - generic [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]: "01"
          - heading "List" [level=3] [ref=e63]
          - paragraph [ref=e64]: Upload your non‑performing loan portfolios with detailed data — asset type, UPB, geography, and status — in a structured, institutional format.
        - generic [ref=e65]:
          - generic [ref=e66]: "02"
          - heading "Connect" [level=3] [ref=e67]
          - paragraph [ref=e68]: Receive expressions of interest from vetted, qualified buyers. Communicate directly through our encrypted messaging system.
        - generic [ref=e69]:
          - generic [ref=e70]: "03"
          - heading "Transact" [level=3] [ref=e71]
          - paragraph [ref=e72]: Negotiate terms, share due diligence materials, and close deals — all within a single, secure, auditable environment.
    - generic [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e76]: Capabilities
        - heading "Every tool you need, nothing you don't" [level=2] [ref=e77]:
          - text: Every tool you need,
          - text: nothing you don't
      - generic [ref=e78]:
        - generic [ref=e79]:
          - img [ref=e81]
          - heading "Asset Listings" [level=3] [ref=e84]
          - paragraph [ref=e85]: Structured, searchable listings with granular filters for asset type, geography, UPB range, and loan status.
        - generic [ref=e87]:
          - img [ref=e89]
          - heading "Secure Messaging" [level=3] [ref=e91]
          - paragraph [ref=e92]: End‑to‑end encrypted direct messaging. Share documents, negotiate terms, and maintain a full audit trail.
        - generic [ref=e94]:
          - img [ref=e96]
          - heading "Seller Dashboard" [level=3] [ref=e98]
          - paragraph [ref=e99]: Real‑time analytics on views, inquiries, and market comparables. Track every listing from post to close.
        - generic [ref=e101]:
          - img [ref=e103]
          - heading "Compliance Built‑In" [level=3] [ref=e105]
          - paragraph [ref=e106]: Regulatory‑ready documentation, KYC/AML verification for all participants, and complete transaction logging.
    - generic [ref=e109]:
      - generic [ref=e110]:
        - generic [ref=e111]: Members
        - heading "What Our Members Say" [level=2] [ref=e112]
      - generic [ref=e114]:
        - generic [ref=e115]:
          - generic [ref=e116]: ❝
          - paragraph [ref=e117]: AURUM has transformed how we source and evaluate NPL portfolios. The level of deal transparency is unmatched in the market.
          - generic [ref=e119]:
            - paragraph [ref=e120]: Michael R.
            - paragraph [ref=e121]: Managing Director — Atlas Capital Partners
        - generic [ref=e122]:
          - generic [ref=e123]: ❝
          - paragraph [ref=e124]: The due diligence tools and secure data room have cut our underwriting time in half. This is the future of distressed debt trading.
          - generic [ref=e126]:
            - paragraph [ref=e127]: Sarah L.
            - paragraph [ref=e128]: Portfolio Manager — Meridian Fund
        - generic [ref=e129]:
          - generic [ref=e130]: ❝
          - paragraph [ref=e131]: Finally, a platform built specifically for NPL professionals. The yield calculator alone has saved us countless hours.
          - generic [ref=e133]:
            - paragraph [ref=e134]: James K.
            - paragraph [ref=e135]: Principal — Summit NPL Advisors
    - generic [ref=e137]:
      - generic [ref=e138]:
        - generic [ref=e139]: Demo
        - heading "See AURUM in Action" [level=2] [ref=e140]
      - link "Platform walkthrough coming soon" [ref=e141] [cursor=pointer]:
        - /url: "#"
        - generic [ref=e142]:
          - img [ref=e144]
          - generic [ref=e146]: Platform walkthrough coming soon
    - generic [ref=e148]:
      - generic [ref=e149]:
        - generic [ref=e150]: Marketplace
        - heading "Active Listings" [level=2] [ref=e151]
      - generic [ref=e152]:
        - generic [ref=e153]:
          - generic [ref=e154]: Asset Type
          - combobox "Asset Type" [ref=e155] [cursor=pointer]:
            - option "All Types" [selected]
            - option "Residential"
            - option "Commercial"
            - option "Consumer"
            - option "Mixed"
        - generic [ref=e156]:
          - generic [ref=e157]: UPB Range
          - combobox "UPB Range" [ref=e158] [cursor=pointer]:
            - option "Any" [selected]
            - option "$0 – $5M"
            - option "$5M – $25M"
            - option "$25M – $100M"
            - option "$100M+"
        - generic [ref=e159]:
          - generic [ref=e160]: Location
          - combobox "Location" [ref=e161] [cursor=pointer]:
            - option "All Regions" [selected]
            - option "Northeast"
            - option "Southeast"
            - option "Midwest"
            - option "West"
        - generic [ref=e162]:
          - generic [ref=e163]: Status
          - combobox "Status" [ref=e164] [cursor=pointer]:
            - option "All" [selected]
            - option "Active"
            - option "Under Review"
            - option "Pending"
        - link "Search Listings" [ref=e165] [cursor=pointer]:
          - /url: /signup
      - generic [ref=e166]:
        - generic [ref=e167]:
          - generic [ref=e168]:
            - generic [ref=e169]: Mixed
            - generic [ref=e170]: Active
          - heading "Q2 2026 Mixed-Asset Strategic Disposition (42 Loans)" [level=3] [ref=e171]
          - generic [ref=e172]:
            - generic [ref=e173]:
              - generic [ref=e174]: UPB
              - text: $12.4M
            - generic [ref=e175]:
              - generic [ref=e176]: Loans
              - text: "42"
            - generic [ref=e177]:
              - generic [ref=e178]: Location
              - text: Multi-State
            - generic [ref=e179]:
              - generic [ref=e180]: Avg. Delinquency
              - text: 8 mo.
          - generic [ref=e181]:
            - generic [ref=e182]: Listed 6d ago
            - link "View Details" [ref=e183] [cursor=pointer]:
              - /url: /signup
        - generic [ref=e184]:
          - generic [ref=e185]:
            - generic [ref=e186]: Residential
            - generic [ref=e187]: Active
          - heading "Memphis TN Residential NPL — 7 Notes" [level=3] [ref=e188]
          - generic [ref=e189]:
            - generic [ref=e190]:
              - generic [ref=e191]: UPB
              - text: $638.0K
            - generic [ref=e192]:
              - generic [ref=e193]: Loans
              - text: "7"
            - generic [ref=e194]:
              - generic [ref=e195]: Location
              - text: Memphis, TN
            - generic [ref=e196]:
              - generic [ref=e197]: Avg. Delinquency
              - text: 12 mo.
          - generic [ref=e198]:
            - generic [ref=e199]: Listed 6d ago
            - link "View Details" [ref=e200] [cursor=pointer]:
              - /url: /signup
        - generic [ref=e201]:
          - generic [ref=e202]:
            - generic [ref=e203]: Residential
            - generic [ref=e204]: Active
          - heading "Phoenix Valley Residential Note (Single Asset)" [level=3] [ref=e205]
          - generic [ref=e206]:
            - generic [ref=e207]:
              - generic [ref=e208]: UPB
              - text: $412.0K
            - generic [ref=e209]:
              - generic [ref=e210]: Loans
              - text: "1"
            - generic [ref=e211]:
              - generic [ref=e212]: Location
              - text: Phoenix, AZ
            - generic [ref=e213]:
              - generic [ref=e214]: Avg. Delinquency
              - text: 6 mo.
          - generic [ref=e215]:
            - generic [ref=e216]: Listed 6d ago
            - link "View Details" [ref=e217] [cursor=pointer]:
              - /url: /signup
    - generic [ref=e219]:
      - generic [ref=e220]:
        - generic [ref=e221]: Direct Messaging
        - heading "Secure, institutional‑grade communication" [level=2] [ref=e222]
      - generic [ref=e223]:
        - generic [ref=e224]:
          - generic [ref=e225]:
            - heading "Conversations" [level=4] [ref=e226]
            - button "New message" [ref=e227] [cursor=pointer]:
              - img [ref=e228]
          - generic [ref=e230]:
            - img [ref=e231]
            - textbox "Search conversations…" [ref=e234]
          - generic [ref=e235]:
            - generic [ref=e236] [cursor=pointer]:
              - generic [ref=e237]: PC
              - generic [ref=e238]:
                - generic [ref=e239]: Pacific Capital Group
                - generic [ref=e240]: We'd like to review the tape data…
              - generic [ref=e241]:
                - generic [ref=e242]: 2m
                - generic [ref=e243]: "3"
            - generic [ref=e244] [cursor=pointer]:
              - generic [ref=e245]: HS
              - generic [ref=e246]:
                - generic [ref=e247]: Harbor Stone Advisors
                - generic [ref=e248]: What's the current bid deadline?
              - generic [ref=e250]: 1h
            - generic [ref=e251] [cursor=pointer]:
              - generic [ref=e252]: VR
              - generic [ref=e253]:
                - generic [ref=e254]: Vanguard Resolution
                - generic [ref=e255]: NDA signed. Sending diligence…
              - generic [ref=e257]: 3h
            - generic [ref=e258] [cursor=pointer]:
              - generic [ref=e259]: BM
              - generic [ref=e260]:
                - generic [ref=e261]: Blackmoor Investments
                - generic [ref=e262]: Interested in the FL residential…
              - generic [ref=e264]: 1d
        - generic [ref=e265]:
          - generic [ref=e266]:
            - generic [ref=e267]:
              - generic [ref=e268]: PC
              - generic [ref=e269]:
                - generic [ref=e270]: Pacific Capital Group
                - generic [ref=e271]: Online
            - generic [ref=e273]:
              - button "Attach file" [ref=e274] [cursor=pointer]:
                - img [ref=e275]
              - button "More options" [ref=e277] [cursor=pointer]:
                - img [ref=e278]
          - generic [ref=e283]:
            - generic [ref=e284]: Today
            - generic [ref=e285]:
              - generic [ref=e286]: Hello — we reviewed the Southeast Residential Portfolio listing and are very interested. Could you share the full tape data and servicing notes?
              - generic [ref=e287]: 10:24 AM
            - generic [ref=e288]:
              - generic [ref=e289]: We've completed preliminary pricing and would like to move to diligence quickly if the numbers align.
              - generic [ref=e290]: 10:25 AM
            - generic [ref=e291]:
              - generic [ref=e292]: Thank you for your interest. I'll have the data room access sent to your team within the hour. The servicing transfer memo is also available upon NDA execution.
              - generic [ref=e293]: 10:31 AM
            - generic [ref=e294]:
              - generic [ref=e295]: We'd like to review the tape data for the FL subset specifically. Is a breakout available?
              - generic [ref=e296]: 10:48 AM
          - generic [ref=e297]:
            - button "Attach" [ref=e298] [cursor=pointer]:
              - img [ref=e299]
            - textbox "Type a message…" [ref=e301]
            - button "Send" [ref=e302] [cursor=pointer]:
              - img [ref=e303]
    - generic [ref=e306]:
      - generic [ref=e307]: Start Today
      - heading "Ready to unlock the value in your distressed portfolio?" [level=2] [ref=e308]:
        - text: Ready to unlock the value
        - text: in your distressed portfolio?
      - paragraph [ref=e309]: Join the most trusted NPL marketplace. List your first asset in under 10 minutes.
      - generic [ref=e310]:
        - link "Create Seller Account" [ref=e311] [cursor=pointer]:
          - /url: /signup
          - text: Create Seller Account
          - img [ref=e312]
        - link "Schedule a Demo" [ref=e314] [cursor=pointer]:
          - /url: /signin
  - contentinfo [ref=e315]:
    - generic [ref=e316]:
      - generic [ref=e317]:
        - generic [ref=e318]:
          - link "◈ AURUM" [ref=e319] [cursor=pointer]:
            - /url: /
            - generic [ref=e320]: ◈
            - generic [ref=e321]: AURUM
          - paragraph [ref=e322]: The institutional marketplace for non‑performing loan transactions.
        - generic [ref=e323]:
          - heading "Platform" [level=3] [ref=e324]
          - link "Listings" [ref=e325] [cursor=pointer]:
            - /url: /listings
          - link "Dashboard" [ref=e326] [cursor=pointer]:
            - /url: /dashboard
          - link "Messaging" [ref=e327] [cursor=pointer]:
            - /url: /messages
        - generic [ref=e328]:
          - heading "Company" [level=3] [ref=e329]
          - link "About" [ref=e330] [cursor=pointer]:
            - /url: "#"
          - link "Careers" [ref=e331] [cursor=pointer]:
            - /url: "#"
          - link "Press" [ref=e332] [cursor=pointer]:
            - /url: "#"
          - link "Contact" [ref=e333] [cursor=pointer]:
            - /url: "#"
        - generic [ref=e334]:
          - heading "Legal" [level=3] [ref=e335]
          - link "Terms of Service" [ref=e336] [cursor=pointer]:
            - /url: "#"
          - link "Privacy Policy" [ref=e337] [cursor=pointer]:
            - /url: "#"
          - link "Compliance" [ref=e338] [cursor=pointer]:
            - /url: "#"
      - generic [ref=e339]:
        - generic [ref=e340]: © 2026 AURUM. All rights reserved.
        - generic [ref=e341]: Institutional use only. Not an offer to sell securities.
  - region
  - alert [ref=e342]
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