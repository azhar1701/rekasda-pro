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
      // PENTING: Ini memaksa Rollup untuk memperbaiki interop module Recharts dan dependencies
      include: [/node_modules/], 
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('@google/generative-ai')) {
              return 'vendor-google'
            }
            if (id.includes('leaflet')) {
              return 'vendor-leaflet'
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react'
            }
            if (id.includes('recharts')) {
              return 'vendor-recharts'
            }
            // Other vendors in a common chunk
            return 'vendor-common'
          }
          
          // Application chunks - organized by feature
          if (id.includes('calculationService') || id.includes('manning') || id.includes('rational')) {
            return 'calculations'
          }
          if (id.includes('locationService') || id.includes('LocationSelector')) {
            return 'location'
          }
          if (id.includes('databaseService') || id.includes('DatabaseTest')) {
            return 'database'
          }
          if (id.includes('geminiService') || id.includes('GeminiConsultant')) {
            return 'gemini'
          }
          if (id.includes('components/ui')) {
            return 'ui'
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ["recharts", "react", "react-dom"],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'react': 'react',
      'react-dom': 'react-dom'
    }
  },
})