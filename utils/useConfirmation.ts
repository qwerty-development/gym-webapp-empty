'use client'
import { useContext } from 'react'
import { ConfirmationModalContext } from '@/app/components/users/ConfirmationModalProvider'

const useConfirmation = () => {
	const context = useContext(ConfirmationModalContext)

	if (context === null) {
		throw new Error(
			'useConfirmation must be used within a ConfirmationModalProvider'
		)
	}

	return context
}

export default useConfirmation
