import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/simulations/workflows',
  fullyParallel: false,           // Sequential — we drive against the same dev server + DB
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'tests/simulations/reports/playwright-html', open: 'never' }]],
  outputDir: 'tests/simulations/screenshots/_artifacts',
  use: {
    baseURL: process.env.AURUM_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 60_000,        // dev cold compile of a route can take 30s+
    navigationTimeout: 120_000,
  },
  projects: [
    { name: 'desktop',  use: { ...devices['Desktop Chrome'],  viewport: { width: 1440, height: 900 } } },
    { name: 'tablet',   use: { ...devices['iPad Pro 11'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],
  timeout: 240_000,                // 4 min per test (dev compile dominates first hit)
  expect: { timeout: 30_000 },
})
