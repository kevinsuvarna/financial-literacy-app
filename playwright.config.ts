import { defineConfig, devices } from '@playwright/test'

// Visual checks run at the fixed design canvas (spec 9.1, 12.4).
const DESIGN_VIEWPORT = { width: 1280, height: 831 }
const BASE_URL = 'https://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    viewport: DESIGN_VIEWPORT,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: DESIGN_VIEWPORT } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
  },
})
