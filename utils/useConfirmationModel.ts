'use client'

import { useState } from 'react'

const useConfirmationModal = () => {
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

	const handleCancels = () => {
		setIsOpen(false)
		if (resolver) resolver(false)
	}

	return {
		isOpen,
		message,
		showConfirmationModal,
		handleConfirm,
		handleCancels
	}
}

export default useConfirmationModal
