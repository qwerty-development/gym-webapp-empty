// ConfirmationModal.tsx

import React, { useEffect } from 'react'
import Modal from 'react-modal'

interface ConfirmationModalProps {
	isOpen: boolean
	message: string
	onConfirm: () => void
	onCancel: () => void
}

const styles = {
	overlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 9999
	},
	content: {
		position: 'relative' as 'relative',
		top: 'auto',
		left: 'auto',
		right: 'auto',
		bottom: 'auto',
		border: 'none',
		background: '#1F2937', // gray-800
		overflow: 'auto',
		borderRadius: '12px',
		outline: 'none',
		padding: '30px',
		display: 'flex',
		flexDirection: 'column' as 'column',
		alignItems: 'center',
		maxWidth: '90%',
		width: '600px',
		color: '#fff'
	},
	message: {
		marginBottom: '30px',
		fontSize: '24px',
		textAlign: 'center' as 'center'
	},
	buttonContainer: {
		display: 'flex',
		gap: '20px',
		width: '100%',
		justifyContent: 'center'
	},
	button: {
		padding: '12px 24px',
		border: 'none',
		borderRadius: '6px',
		cursor: 'pointer',
		fontSize: '18px',
		fontWeight: 'bold',
		minWidth: '120px'
	},
	confirmButton: {
		backgroundColor: '#4ade80',
		color: '#fff'
	},
	cancelButton: {
		backgroundColor: '#f44336',
		color: '#fff'
	}
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	isOpen,
	message,
	onConfirm,
	onCancel
}) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onCancel}
			style={{
				overlay: styles.overlay,
				content: styles.content
			}}
			contentLabel='Confirmation Modal'
			ariaHideApp={false}>
			<p style={styles.message}>{message}</p>
			<div style={styles.buttonContainer}>
				<button
					style={{ ...styles.button, ...styles.confirmButton }}
					onClick={onConfirm}>
					Confirm
				</button>
				<button
					style={{ ...styles.button, ...styles.cancelButton }}
					onClick={onCancel}>
					Cancel
				</button>
			</div>
		</Modal>
	)
}

export default ConfirmationModal
