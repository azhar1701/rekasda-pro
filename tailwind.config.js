/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate"
import typography from "@tailwindcss/typography"

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			screens: {
				xs: '475px',
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1536px'
			},
			fontFamily: {
				sans: [
					'Plus Jakarta Sans',
					'system-ui',
					'sans-serif'
				]
			},
			colors: {
				primary: {
					'50': '#EFF6FF',
					'100': '#DBEAFE',
					'500': '#3B82F6',
					'600': '#2563EB',
					'700': '#1D4ED8',
					DEFAULT: '#2563EB',
					foreground: '#F8FAFC'
				},
				accent: {
					'500': '#06B6D4',
					'600': '#0891B2',
					DEFAULT: '#0891B2',
					foreground: '#F8FAFC'
				},
				neutral: {
					'50': '#F8FAFC',
					'100': '#F1F5F9',
					'200': '#E2E8F0',
					'300': '#CBD5E1',
					'400': '#94A3B8',
					'500': '#64748B',
					'600': '#475569',
					'700': '#334155',
					'800': '#1E293B',
					'900': '#0F172A'
				},
				success: '#10B981',
				error: '#EF4444',
				warning: '#F59E0B',
				background: '#F8FAFC',
				foreground: '#0F172A',
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#0F172A'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#0F172A'
				},
				secondary: {
					DEFAULT: '#F1F5F9',
					foreground: '#0F172A'
				},
				muted: {
					DEFAULT: '#F1F5F9',
					foreground: '#64748B'
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#F8FAFC'
				},
				border: '#E2E8F0',
				input: '#E2E8F0',
				ring: '#0F172A',
				chart: {
					'1': '#2563EB',
					'2': '#0891B2',
					'3': '#10B981',
					'4': '#F59E0B',
					'5': '#EF4444'
				}
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem'
			},
			borderRadius: {
				sm: '0.375rem',
				md: '0.5rem',
				lg: '0.75rem',
				xl: '1rem'
			},
			boxShadow: {
				soft: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				card: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
			},
			transitionDuration: {
				fast: '150ms',
				medium: '300ms',
				slow: '500ms'
			},
			transitionTimingFunction: {
				smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
				enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
				exit: 'cubic-bezier(0.4, 0.0, 1, 1)',
				spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
			},
			animation: {
				'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
				'slide-up': 'slideUp 400ms cubic-bezier(0.0, 0.0, 0.2, 1)',
				stagger: 'staggerFadeIn 300ms cubic-bezier(0.0, 0.0, 0.2, 1) backwards'
			},
			keyframes: {
				fadeIn: {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				slideUp: {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				staggerFadeIn: {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				}
			},
			fontFeatureSettings: {
				numeric: 'tnum" on, "lnum" on'
			}
		}
	},
	plugins: [animate, typography],
}
