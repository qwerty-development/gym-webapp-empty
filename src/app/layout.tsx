import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider, authMiddleware } from '@clerk/nextjs'
import './globals.css'
import { WalletProvider } from './components/users/WalletContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Fitness Vista',
	description: 'Generated by QWERTY'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider>
			<html lang='en'>
				<body className={inter.className}>
					<Toaster position='top-center' />
					<WalletProvider>{children}</WalletProvider>
				</body>
			</html>
		</ClerkProvider>
	)
}
