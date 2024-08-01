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
					200: '#FFB3A7', // Lighter shade of bittersweet
					300: '#FF9281', // Light shade of bittersweet
					400: '#FF715B', // Primary bittersweet
					500: '#2274A5', // Primary blue
					600: '#1D6089', // Darker shade of blue
					700: '#18506E', // Even darker shade of blue
					800: '#134054', // Much darker shade of blue
					900: '#0E303A' // Very dark shade of blue
				},
				gray: {
					200: '#1B252F', // Darker shade of primary black
					300: '#010B13', // Primary black
					400: '#0E1821', // Slightly lighter shade of primary black
					500: '#28323D', // Light shade of primary black
					600: '#D1D5D9', // Darker shade of primary white
					700: '#E2E5E8', // Dark shade of primary white
					800: '#F2F3F4', // Primary white
					900: '#F7F8F9' // Slightly lighter shade of primary white
				},
				// Adding default color overrides
				white: '#F2F3F4', // Dark blue-gray shade
				black: '#010B13' // Same as primary black
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
