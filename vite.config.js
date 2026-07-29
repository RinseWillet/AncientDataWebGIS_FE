import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(basePath) {
  if (!basePath || basePath.trim() === '') return '/'
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

// https://vitejs.dev/config/
export default defineConfig({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
