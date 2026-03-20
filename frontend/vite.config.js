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
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - backend expects /api prefix
      },
    },
  },
})
