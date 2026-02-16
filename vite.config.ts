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
    copyPublicDir: true,
    // Adjust chunk size warning limit
    chunkSizeWarningLimit: 600,
    commonjsOptions: {
      // IMPORTANT: This forces Rollup to fix interop for Recharts modules and dependencies
      include: [/node_modules/], 
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@google/generative-ai')) return 'vendor-google'
            if (id.includes('leaflet')) return 'vendor-leaflet'
            return 'vendor'
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ["recharts", "react", "react-dom"],
    exclude: ['react-smooth']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
})