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
				// PUPR Official Colors (GovTech Identity)
				pupr: {
					blue: '#0c3a66',      // Biru institusi PUPR
					yellow: '#f2c114',    // Kuning aksen PUPR
					surface: '#f8fafc',   // Latar netral
					border: '#e2e8f0',    // Border tegas
					text: '#1e293b'       // Teks kontras tinggi
				},
				// Base/Neutral - Slate-based scale tinted toward PUPR blue (#0c3a66)
				neutral: {
					'50': '#f8fafc',
					'100': '#f1f5f9',
					'200': '#e2e8f0',
					'300': '#cbd5e1',
					'400': '#94a3b8',
					'500': '#64748b',
					'600': '#475569',
					'700': '#334155',
					'800': '#1e293b',
					'900': '#0f172a',
					'950': '#020617'
				},
				// Primary - Biru profesional (PUPR Blue)
				primary: {
					'50': '#f0f4f8',
					'100': '#d9e2ec',
					'200': '#bcccdc',
					'300': '#9fb3c8',
					'400': '#829ab1',
					'500': '#627d98',
					'600': '#486581',
					'700': '#334e68',
					'800': '#243b53',
					'900': '#0c3a66', // PUPR Blue
					DEFAULT: '#0c3a66',
					foreground: '#FFFFFF'
				},
				// Semantic
				success: {
					DEFAULT: '#10B981',
					light: '#D1FAE5',
					dark: '#059669'
				},
				error: {
					DEFAULT: '#DC2626',
					light: '#FEE2E2',
					dark: '#991B1B'
				},
				warning: {
					DEFAULT: '#F59E0B',
					light: '#FEF3C7',
					dark: '#D97706'
				},
				// System
				background: '#f8fafc',
				foreground: '#0f172a',
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#0f172a'
				},
				secondary: {
					DEFAULT: '#f1f5f9',
					foreground: '#0f172a'
				},
				muted: {
					DEFAULT: '#f1f5f9',
					foreground: '#64748b'
				},
				accent: {
					DEFAULT: '#f2c114', // PUPR Yellow
					foreground: '#0c3a66'
				},
				destructive: {
					DEFAULT: '#DC2626',
					foreground: '#FFFFFF'
				},
				border: '#e2e8f0',
				input: '#e2e8f0',
				ring: '#0c3a66',
				chart: {
					'1': '#0c3a66',
					'2': '#10B981',
					'3': '#f2c114',
					'4': '#8B5CF6',
					'5': '#EC4899'
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
				sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
				xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
				'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
				soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				card: 'none',
				inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
			},
			transitionDuration: {
				fast: '150ms',
				medium: '300ms',
				slow: '500ms'
			},
			transitionTimingFunction: {
				smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
				enter: 'cubic-bezier(0, 0, 0.2, 1)',
				exit: 'cubic-bezier(0.4, 0, 1, 1)',
				'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)'
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
