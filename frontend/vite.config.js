import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // SPA fallback for local dev (fixes /admin 404 on refresh)
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    // Generate source maps for easier debugging on Render
    sourcemap: false,
  },
  preview: {
    // SPA fallback for `vite preview` (production preview mode)
    port: 4173,
  },
})
