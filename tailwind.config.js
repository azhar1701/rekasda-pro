/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // ========== CORE SPACING SYSTEM ==========
    spacing: {
      0: '0',
      1: '0.25rem',    // 4px
      2: '0.5rem',     // 8px
      3: '0.75rem',    // 12px
      4: '1rem',       // 16px (base)
      6: '1.5rem',     // 24px
      8: '2rem',       // 32px
      12: '3rem',      // 48px
      16: '4rem',      // 64px
      20: '5rem',      // 80px
      24: '6rem',      // 96px
    },

    extend: {
      // ========== COLOR SYSTEM ==========
      colors: {
        // Primary Blue - Technical Context
        'primary': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // PRIMARY BLUE
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c2d6b',
        },

        // Success (Green)
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },

        // Warning (Amber)
        'warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },

        // Danger (Red)
        'danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Info (Blue)
        'info': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Semantic Aliases
        'success-teal': '#14b8a6',
        'error': '#ef4444',
      },

      // ========== TYPOGRAPHY ==========
      fontSize: {
        // Headings
        'h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h5': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h6': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        
        // Body
        'body': ['1rem', { lineHeight: '1.625rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5rem' }],
        'body-xs': ['0.75rem', { lineHeight: '1.25rem' }],
        
        // Labels & Captions
        'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1rem' }],
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Menlo', 'monospace'],
      },

      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // ========== SHADOWS ==========
      boxShadow: {
        'none': 'none',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'base': '0 2px 4px 0 rgb(0 0 0 / 0.08)',
        'md': '0 4px 8px 0 rgb(0 0 0 / 0.1)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px rgba(0, 0, 0, 0.08), 0 20px 25px rgba(0, 0, 0, 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },

      // ========== ANIMATIONS ==========
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gentle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },

      // ========== TRANSITIONS ==========
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ========== BORDER RADIUS ==========
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',      // 6px
        'base': '0.5rem',      // 8px
        'md': '0.75rem',       // 12px
        'lg': '1rem',          // 16px
        'xl': '1.25rem',       // 20px
        'full': '9999px',
      },

      // ========== GRADIENTS ==========
      backgroundImage: {
        'gradient-subtle': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        'gradient-primary': 'linear-gradient(135deg, #007fd4 0%, #0369a1 100%)',
      },

      // ========== CUSTOM UTILITIES ==========
      opacity: {
        '2.5': '0.025',
        '7.5': '0.075',
        '15': '0.15',
      },
    },
  },

  plugins: [
    // Custom plugin for form styles
    function ({ addBase, theme }) {
      addBase({
        'input, textarea, select': {
          '@apply px-3 py-2 rounded-md border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all': {},
        },
        'input:disabled, textarea:disabled, select:disabled': {
          '@apply bg-slate-50 text-slate-400 cursor-not-allowed': {},
        },
      });
    },
  ],
}