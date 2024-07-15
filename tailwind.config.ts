import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				green: {
					200: '#c3d1bb',
					300: '#a5b89a',
					400: '#36783a',
					500: '#4c6f46',
					600: '#446340',
					700: '#3c583a',
					800: '#344d33',
					900: '#2c422c'
				},
				gray: {
					200: '#d1d4d1',
					300: '#b8bcb8',
					400: '#9fa39f',
					500: '#868a86',
					600: '#6d726d',
					700: '#454c45', // primary color
					800: '#353b35',
					900: '#232623'
				}
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic':
					'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
			}
		}
	},
	plugins: []
}
export default config
