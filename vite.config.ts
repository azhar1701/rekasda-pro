import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'docs/**/*.pdf'],
      manifest: {
        name: 'Rekasda Pro',
        short_name: 'Rekasda',
        description: 'Rekayasa Analisis SDA & Hidrologi',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5242880, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  publicDir: 'public',
  build: {
    copyPublicDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - node_modules splitting
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Charts & visualization
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Excel & utilities
            if (id.includes('exceljs') || id.includes('file-saver') || id.includes('katex') || id.includes('zustand')) {
              return 'vendor-utils';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Other vendors
            return 'vendor';
          }

          // App code splitting
          if (id.includes('src/services')) return 'services';
          if (id.includes('src/lib/engine')) return 'lib-engine';
          if (id.includes('src/lib/utils')) return 'lib-utils';
          if (id.includes('src/lib/api')) return 'lib-api';
          if (id.includes('src/types')) return 'types';
          if (id.includes('src/hooks') || id.includes('src/components/ui')) return 'ui-shared';
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