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
  // maplibre-gl instantiates its worker via `new Worker(new URL(..., import.meta.url))`;
  // esbuild's dep pre-bundling rewrites that import.meta.url reference to point inside
  // .vite/deps/, where the worker file was never copied, so the worker 404s at runtime.
  // Excluding both packages keeps them served as native ESM straight from node_modules,
  // where the relative worker URL resolves correctly.
  optimizeDeps: {
    exclude: ['maplibre-gl', '@maplibre/maplibre-gl-leaflet'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
