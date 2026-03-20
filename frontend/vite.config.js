/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Capacitor loads your built files via file:// on device.
  // Using a relative base avoids broken asset paths after `vite build`.
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Capacitor loads your built files via file:// on device.
  // Using a relative base avoids broken asset paths after `vite build`.
  base: './',
  plugins: [react()],
  // Prevent Vite from scanning Capacitor/Gradle-generated assets (e.g. `android/**/build/**`)
  // during dependency pre-bundling. Those files can contain unresolved bare imports.
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    port: 5173, // added from new code
    watch: {
      ignored: ['**/android/**', '**/dist/**', '**/build/**'],
    },
    proxy: {
      // Route Optimizer (FastAPI) does NOT use the /api prefix.
      // Use explicit paths (instead of regex keys) to ensure Vite matches them.
      '/api/optimize': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/traffic-route': {
        target: 'http://127.0.0.1:8002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

      // Itinerary Generator (FastAPI) DOES use the /api prefix.
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
