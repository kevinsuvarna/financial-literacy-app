import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// E2E runs against a fresh production build, not the dev server: it stays independent of
// whatever `pnpm dev` is doing on 5173, and it excludes the dev-only XState inspector (which
// opens a window to stately.ai on every page load).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // The PWA service worker would otherwise cache the app shell between runs.
    serviceWorkers: 'block',
  },
  webServer: {
    command: `pnpm run build && pnpm exec vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
