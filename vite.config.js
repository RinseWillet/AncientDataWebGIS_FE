import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

function normalizeBasePath(basePath) {
  if (!basePath || basePath.trim() === '') return '/'
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

// maplibre-gl-worker.mjs (copied into dist/assets via the `?url` import in
// mapUtils.ts) has its own hardcoded, unhashed `import ... from
// "./maplibre-gl-shared.mjs"` baked into its source. Vite only traces the one
// file a `?url` import points at, so that sibling chunk is never discovered
// and is silently missing from dist/assets/ in production, breaking the
// worker at runtime. Emit it ourselves, unhashed, next to the worker file.
function copyMaplibreSharedWorkerChunk() {
  return {
    name: 'copy-maplibre-gl-shared-chunk',
    apply: 'build',
    buildStart() {
      const sharedChunkPath = new URL(
        './node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs',
        import.meta.url,
      )
      this.emitFile({
        type: 'asset',
        fileName: 'assets/maplibre-gl-shared.mjs',
        source: readFileSync(sharedChunkPath),
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
  plugins: [react(), copyMaplibreSharedWorkerChunk()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    css: true,
  },
})
