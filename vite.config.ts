import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    // Polyfill untuk process.env.API_KEY di browser
    // Ini mengambil nilai dari VITE_API_KEY (yang ada di .env) dan memasukkannya ke kode
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY)
  }
})