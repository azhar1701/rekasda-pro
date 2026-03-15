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
				],
				mono: [
					'ui-monospace',
					'Cascadia Code',
					'monospace'
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
				// Base/Neutral - Blue-gray spectrum (Eye-comfort)
				neutral: {
					'50': '#F0F9FF',
					'100': '#E0F2FE',
					'200': '#BAE6FD',
					'300': '#7DD3FC',
					'400': '#38BDF8',
					'500': '#0EA5E9',
					'600': '#0284C7',
					'700': '#0369A1',
					'800': '#075985',
					'900': '#0C4A6E'
				},
				// Primary - Biru profesional
				primary: {
					'50': '#EFF6FF',
					'100': '#DBEAFE',
					'500': '#3B82F6',
					'600': '#2563EB',
					'700': '#1D4ED8',
					DEFAULT: '#2563EB',
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
				background: '#F0F9FF',
				foreground: '#075985',
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#075985'
				},
				secondary: {
					DEFAULT: '#E0F2FE',
					foreground: '#075985'
				},
				muted: {
					DEFAULT: '#E0F2FE',
					foreground: '#0EA5E9'
				},
				destructive: {
					DEFAULT: '#DC2626',
					foreground: '#FFFFFF'
				},
				border: '#BAE6FD',
				input: '#BAE6FD',
				ring: '#2563EB',
				chart: {
					'1': '#2563EB',
					'2': '#10B981',
					'3': '#F59E0B',
					'4': '#8B5CF6',
					'5': '#EC4899'
				}
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem'
			},
			borderRadius: {
				DEFAULT: '0',
				sm: '0',
				md: '0',
				lg: '0',
				xl: '0'
			},
			boxShadow: {
				// Flattened Design: No shadows. Use borders instead.
				DEFAULT: 'none',
				soft: 'none',
				card: 'none'
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
				stagger: 'staggerFadeIn 300ms cubic-bezier(0.0, 0.0, 0.2, 1) backwards',
				flash: 'flash 1.5s ease-in-out infinite'
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
				},
				flash: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				}
			},
			fontFeatureSettings: {
				numeric: 'tnum" on, "lnum" on'
			}
		}
	},
	plugins: [animate, typography],
}
