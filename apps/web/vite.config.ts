import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

// LAN HTTPS is opt-in (via `pnpm run dev:lan`) so plain `dev`/`test`/`e2e` stay on
// unencrypted localhost. A phone's camera API requires HTTPS when accessed over LAN.
const useLanHttps = process.env.LAN_HTTPS === 'true';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      manifest: {
        name: 'Save the Savings Account',
        short_name: 'Save Ananya',
        description: 'A phygital financial literacy investigation game for middle-school learners.',
        theme_color: '#0b1440',
        background_color: '#0b1440',
        display: 'standalone',
      },
      workbox: {
        // Precache the QR decoder's WASM and the sound effects too, so both work offline.
        globPatterns: ['**/*.{js,css,html,wasm,wav}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
    ...(useLanHttps ? [basicSsl()] : []),
  ],
  // The decode worker lazy-loads the zxing ponyfill with a dynamic import, which needs ES output.
  worker: {
    format: 'es',
  },
  server: {
    host: true,
  },
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
});
