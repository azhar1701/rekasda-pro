/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'safety-orange': '#ff5722',
        'safety-blue': '#0057b7',
        'field-green': '#2e7d32',
        'alert-red': '#d32f2f',
        'high-contrast-bg': '#f5f5f5',
        'high-contrast-text': '#121212',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}