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
        start_url: '/',
        scope: '/',
        // Tablets are held either way round; laptops don't turn.
        orientation: 'any',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Full offline play: everything the game can load is precached on the first visit —
        // the app, the QR decoder's WASM, every sound, the cards' QR codes and the icons — so a
        // classroom with no connection can play from start to certificate.
        globPatterns: ['**/*.{js,css,html,wasm,wav,svg,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Every route is the same single page: open /play or /print offline and get the app.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
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
