'use client'
import {
	FaRunning,
	FaHeart,
	FaBiking,
	FaDumbbell,
	FaFirstAid
} from 'react-icons/fa'
import { motion } from 'framer-motion'

const ActivitySelection = ({
	activities,
	activitiesGroup,
	selectedActivity,
	handleActivitySelect,
	isPrivateTraining
}: any) => {
	const activityIcons = {
		1: <FaHeart />,
		2: <FaBiking />,
		3: <FaRunning />,
		10: <FaDumbbell />,
		11: <FaFirstAid />
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
			{(isPrivateTraining ? activities : activitiesGroup)?.map(
				(activity: { id: keyof typeof activityIcons; name: string }) => (
					<motion.button
						key={activity.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						whileHover={{
							scale: 1.05,
							boxShadow: '0 0 30px rgba(54, 120, 58, 0.7)'
						}}
						whileTap={{ scale: 0.95 }}
						className={`flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl transition-all duration-300 ${
							selectedActivity === activity.id
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
						}`}
						onClick={() => handleActivitySelect(activity.id)}>
						<span className='text-4xl'>{activityIcons[activity.id]}</span>
						<span className='text-lg font-semibold'>{activity.name}</span>
					</motion.button>
				)
			)}
		</div>
	)
}

export default ActivitySelection
