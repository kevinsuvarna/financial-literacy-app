import { defineConfig, devices } from '@playwright/test';
import { cameraLaunchOptions, cardVideo } from './e2e/fakeCamera';

const PORT = 4173;
/** Specs that need the fake camera are named *.camera.spec.ts. */
const CAMERA_SPEC = /\.camera\.spec\.ts$/;

// E2E runs against a fresh production build, not the dev server: it stays independent of
// whatever `pnpm dev` is doing on 5173, and it excludes the dev-only XState inspector (which
// opens a window to stately.ai on every page load).
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
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
  projects: [
    // No camera at all: every scan goes through the simulated picker.
    { name: 'chromium', testIgnore: CAMERA_SPEC, use: { ...devices['Desktop Chrome'] } },
    // A real camera path: Chromium's fake webcam plays a video of QR codes, and the browser
    // grants the camera without asking. Each spec picks its video (see e2e/fakeCamera.ts);
    // this one, the Savings Account card, is the default.
    {
      name: 'camera',
      testMatch: CAMERA_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['camera'],
        launchOptions: cameraLaunchOptions(cardVideo('account-savings')),
      },
    },
  ],
});
