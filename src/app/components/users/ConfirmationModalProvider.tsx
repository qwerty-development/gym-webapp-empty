'use client'

import React, { useState, createContext, useContext, ReactNode } from 'react'
import ConfirmationModal from './ConfirmationModal'

type ConfirmationModalContextType = {
	showConfirmationModal: (message: string) => Promise<boolean>
}

const ConfirmationModalContext =
	createContext<ConfirmationModalContextType | null>(null)

export const useConfirmationModal = () => {
	const context = useContext(ConfirmationModalContext)
	if (!context) {
		throw new Error(
			'useConfirmationModal must be used within a ConfirmationModalProvider'
		)
	}
	return context
}

interface ConfirmationModalProviderProps {
	children: ReactNode
}

export const ConfirmationModalProvider: React.FC<
	ConfirmationModalProviderProps
> = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
		null
	)

	const showConfirmationModal = (
		confirmationMessage: string
	): Promise<boolean> => {
		setIsOpen(true)
		setMessage(confirmationMessage)
		return new Promise(resolve => {
			setResolver(() => resolve)
		})
	}

	const handleConfirm = () => {
		setIsOpen(false)
		if (resolver) resolver(true)
	}

	const handleCancel = () => {
		setIsOpen(false)
		if (resolver) resolver(false)
	}

	return (
		<ConfirmationModalContext.Provider value={{ showConfirmationModal }}>
			{children}
			<ConfirmationModal
				isOpen={isOpen}
				message={message}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</ConfirmationModalContext.Provider>
	)
}
