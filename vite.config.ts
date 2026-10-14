import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // HTTPS (self-signed) so iPad Safari on the LAN allows camera access (spec 10.2).
  plugins: [react(), ...(process.env.VITEST ? [] : [basicSsl()])],
  server: { host: true },
  preview: { host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
