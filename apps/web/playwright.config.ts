import { defineConfig, devices } from '@playwright/test';
import { fakeCameraFile } from './e2e/fakeCamera';

const PORT = 4173;
const CAMERA_SPEC = /camera-scan\.spec\.ts/;

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
    // A fake webcam that plays a video of one QR code (written by globalSetup), with the
    // browser's permission prompt auto-accepted.
    {
      name: 'chromium-fake-camera',
      testMatch: CAMERA_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['camera'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            `--use-file-for-fake-video-capture=${fakeCameraFile}`,
            // No internet: if the decoder tried to fetch its WASM from a CDN instead of the
            // bundled copy, nothing would decode and the test would fail.
            '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
          ],
        },
      },
    },
  ],
});
