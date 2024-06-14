'use client'
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode
} from 'react'
import { getWalletBalance } from '../../../../utils/user-requests'
import { useAuth } from '@clerk/nextjs'

interface WalletContextType {
	walletBalance: number | null
	refreshWalletBalance: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
	const [walletBalance, setWalletBalance] = useState<number | null>(null)
	const { userId, isSignedIn } = useAuth()

	const refreshWalletBalance = async () => {
		if (isSignedIn && userId) {
			try {
				const balance = await getWalletBalance({ userId })
				setWalletBalance(balance)
			} catch (error) {
				console.error('Error fetching wallet balance:', error)
				setWalletBalance(null)
			}
		} else {
			setWalletBalance(null)
		}
	}

	useEffect(() => {
		refreshWalletBalance()
	}, [isSignedIn, userId])

	return (
		<WalletContext.Provider value={{ walletBalance, refreshWalletBalance }}>
			{children}
		</WalletContext.Provider>
	)
}

export const useWallet = () => {
	const context = useContext(WalletContext)
	if (!context) {
		throw new Error('useWallet must be used within a WalletProvider')
	}
	return context
}
