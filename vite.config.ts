import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  publicDir: 'public',
  build: {
    copyPublicDir: true,
    chunkSizeWarningLimit: 600,
    commonjsOptions: {
      include: [/node_modules/], 
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', '@headlessui/react'],
          'vendor-charts': ['recharts', 'recharts-scale'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-google': ['@google/generative-ai'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'zod'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ["recharts", "react", "react-dom", "prop-types"],
    exclude: ['react-smooth']
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
})