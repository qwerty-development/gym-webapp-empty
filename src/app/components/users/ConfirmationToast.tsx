// ConfirmationToast.jsx
import React from 'react'
import toast from 'react-hot-toast'

const styles: {
	container: React.CSSProperties
	message: React.CSSProperties & {
		textAlign?: React.CSSProperties['textAlign']
	}
	buttonContainer: React.CSSProperties
	confirmButton: React.CSSProperties
	cancelButton: React.CSSProperties
} = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		padding: '16px',
		backgroundColor: '#fff',
		borderRadius: '8px',
		boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
	},
	message: {
		marginBottom: '16px',
		fontSize: '16px',
		textAlign: 'center'
	},
	buttonContainer: {
		display: 'flex',
		gap: '30px'
	},
	confirmButton: {
		padding: '8px 24px',
		backgroundColor: '#4caf50',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '14px'
	},
	cancelButton: {
		padding: '8px 24px',
		backgroundColor: '#f44336',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '14px'
	}
}

const ConfirmationToast = ({ message, onConfirm, onCancel }: any) => (
	<div style={styles.container}>
		<p style={styles.message}>{message}</p>
		<div style={styles.buttonContainer}>
			<button style={styles.confirmButton} onClick={onConfirm}>
				Yes
			</button>
			<button style={styles.cancelButton} onClick={onCancel}>
				No
			</button>
		</div>
	</div>
)

export const showConfirmationToast = (message: any) =>
	new Promise(resolve => {
		const onConfirm = () => {
			resolve(true)
			toast.dismiss()
		}

		const onCancel = () => {
			resolve(false)
			toast.dismiss()
		}

		toast(
			<ConfirmationToast
				message={message}
				onConfirm={onConfirm}
				onCancel={onCancel}
			/>,
			{
				duration: Infinity // keep the toast open until user responds
			}
		)
	})

export default ConfirmationToast
