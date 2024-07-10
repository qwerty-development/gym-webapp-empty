'use client'
import React from 'react'
import ConfirmationModal from './ConfirmationModal'
import useConfirmationModal from './useConfirmationModal'

const ConfirmationModalContext =
	React.createContext((message: string) => Promise<boolean>) | (null > null)

const ConfirmationModalProvider: React.FC<{
	children: React.ReactNode
}> = ({ children }) => {
	const { isOpen, message, openModal, handleConfirm, handleCancel } =
		useConfirmationModal()

	return (
		<ConfirmationModalContext.Provider value={openModal}>
			{children}
			{isOpen && (
				<ConfirmationModal
					message={message}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			)}
		</ConfirmationModalContext.Provider>
	)
}
export { ConfirmationModalProvider, ConfirmationModalContext }
