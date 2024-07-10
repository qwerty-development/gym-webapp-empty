'use client'
import { useState, useCallback } from 'react'

const useConfirmationModal = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
		null
	)

	const openModal = useCallback((msg: string) => {
		setIsOpen(true)
		setMessage(msg)
		return new Promise<boolean>(resolve => {
			setResolver(() => resolve)
		})
	}, [])

	const closeModal = useCallback(() => {
		setIsOpen(false)
		setMessage('')
		setResolver(null)
	}, [])

	const handleConfirm = useCallback(() => {
		if (resolver) {
			resolver(true)
		}
		closeModal()
	}, [resolver, closeModal])

	const handleCancel = useCallback(() => {
		if (resolver) {
			resolver(false)
		}
		closeModal()
	}, [resolver, closeModal])

	return {
		isOpen,
		message,
		openModal,
		handleConfirm,
		handleCancel
	}
}

export default useConfirmationModal
