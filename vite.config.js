import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path support: when this app is served behind a reverse proxy at a
// sub-path (e.g. https://rinsewillet.net/webGIS/), set VITE_BASE_PATH=/webGIS/
// at build time. Defaults to '/' for local dev and standalone deployments.
const basePath = process.env.VITE_BASE_PATH || '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
