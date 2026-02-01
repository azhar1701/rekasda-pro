import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  // Ensure static assets are properly served
  publicDir: 'public',
  build: {
    // Copy public directory to dist
    copyPublicDir: true
  }
})