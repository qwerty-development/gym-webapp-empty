'use client'
import { motion, AnimatePresence } from 'framer-motion'

const TimeSelection = ({
	availableTimes,
	groupAvailableTimes,
	selectedTime,
	handleTimeSelect,
	isPrivateTraining,
	reservationCount,
	getCapacity
}: any) => {
	return (
		<div className='grid grid-cols-2 gap-4'>
			<AnimatePresence>
				{(isPrivateTraining ? availableTimes : groupAvailableTimes).map(
					(time: any) => (
						<motion.button
							key={time}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							whileHover={{
								scale: 1.05,
								boxShadow: '0 0 30px rgba(54, 120, 58, 0.7)'
							}}
							whileTap={{ scale: 0.95 }}
							className={`p-3 sm:p-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 ${
								selectedTime === time
									? 'bg-green-500 text-white'
									: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
							}`}
							onClick={() => handleTimeSelect(time)}>
							{time}
							{!isPrivateTraining && (
								<p className='text-sm mt-2'>
									Capacity: {reservationCount}/{getCapacity()}
								</p>
							)}
						</motion.button>
					)
				)}
			</AnimatePresence>
		</div>
	)
}

export default TimeSelection
