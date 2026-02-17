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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only chunk app-level code, let Rollup handle vendor dependencies
          // to avoid initialization order issues
          
          // App services - shared across features
          if (id.includes('src/services')) {
            return 'services';
          }
          
          // Library chunks
          if (id.includes('src/lib/supabase') || id.includes('src/lib/debugSupabase')) {
            return 'lib-supabase';
          }
          if (id.includes('src/lib/engine')) {
            return 'lib-engine';
          }
          if (id.includes('src/lib/utils')) {
            return 'lib-utils';
          }
          if (id.includes('src/lib/api')) {
            return 'lib-api';
          }
          
          // Shared hooks and types
          if (id.includes('src/hooks')) {
            return 'hooks';
          }
          if (id.includes('src/types')) {
            return 'types';
          }
          if (id.includes('src/components/common') || id.includes('src/components/ui')) {
            return 'ui-components';
          }
        },
      },
    },
  },
  resolve: {
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