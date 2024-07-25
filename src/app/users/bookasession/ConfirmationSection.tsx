'use client'
import { motion } from 'framer-motion'

const ConfirmationSection = ({
	selectedActivity,
	selectedCoach,
	selectedDate,
	selectedTime,
	handleBookSession,
	loading,
	isPrivateTraining,
	activities,
	activitiesGroup,
	coaches
}: any) => {
	return (
		<div className='mt-12 text-center'>
			<p className='text-xl sm:text-2xl font-semibold text-green-400 mb-4 sm:mb-6'>
				Booking {isPrivateTraining ? 'private session' : 'class'} for{' '}
				{
					(isPrivateTraining ? activities : activitiesGroup).find(
						(a: any) => a.id === selectedActivity
					)?.name
				}{' '}
				with {coaches.find((c: any) => c.id === selectedCoach)?.name} on{' '}
				{selectedDate?.toLocaleDateString()} at {selectedTime}.
			</p>
			<motion.button
				whileHover={{
					scale: 1.05,
					boxShadow: '0 0 30px rgba(54, 120, 58, 0.7)'
				}}
				whileTap={{ scale: 0.95 }}
				type='button'
				onClick={handleBookSession}
				disabled={loading}
				className='rounded-full bg-green-500 px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-bold text-white transition-all duration-300 hover:bg-green-600 disabled:opacity-50'>
				{loading ? 'Processing...' : 'Confirm Booking'}
			</motion.button>
		</div>
	)
}

export default ConfirmationSection
