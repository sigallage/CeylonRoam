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
  define: {
    'import.meta.env.VITE_BUILD_STAMP': JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.BUILD_STAMP || ''),
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

      // Auth service (Express) uses the /api prefix.
      // Proxying through Vite keeps requests same-origin in web dev,
      // avoiding CORS + SameSite cookie issues for session-based OTP flows.
      '/api/signup': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/login': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/profile': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/forgot-password': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/verify-otp': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/reset-password': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/reset-password/request': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/contact-us': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/debug/users': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/itineraries': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
      '/api/protected': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
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
