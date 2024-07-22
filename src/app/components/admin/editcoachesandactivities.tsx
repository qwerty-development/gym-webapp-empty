'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaUserFriends, FaUser } from 'react-icons/fa'
import FileUploadDropzone from './FileUploadDropzone'
import { RingLoader } from 'react-spinners'
import {
	addCoach,
	deleteCoach,
	addActivity,
	deleteActivity,
	fetchCoaches,
	fetchActivities,
	updateActivity,
	updateCoach,
	fetchGroupActivities
} from '../../../../utils/admin-requests'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
declare global {
	interface HTMLElement {
		__react_dropzone_state__?: any // replace 'any' with the type of '__react_dropzone_state__' if known
	}
}

import toast, { LoaderIcon } from 'react-hot-toast'

type Coach = {
	id: number
	name: string
	email: string // Add this line
	profile_picture: string
}

type Activity = {
	id: number
	name: string
	credits: number
	coach_id: number
	capacity: number | null
	group: boolean
	semi_private: boolean
}

type GroupActivity = {
	id: number
	name: string
	credits: number
	coach_id: number
	capacity: number
	group: boolean
}

const CoachesandActivitiesAdminPage = () => {
	const [newActivitySemiPrivate, setNewActivitySemiPrivate] = useState(false)
	const [coaches, setCoaches] = useState<Coach[]>([])
	const [activities, setActivities] = useState<Activity[]>([])
	const [groupactivities, setGroupActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)
	const [newCoachName, setNewCoachName] = useState('')
	const [newActivityName, setNewActivityName] = useState('')
	const [newActivityCredits, setNewActivityCredits] = useState('')
	const [newActvityCapacity, setNewActivityCapacity] = useState('')
	const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null)
	const [updateTrigger, setUpdateTrigger] = useState(false)
	const [showUpdateForm, setShowUpdateForm] = useState(false) // State for showing the update form
	const [updateCoachId, setUpdateCoachId] = useState<number | null>(null) // State for the coach being updated
	const [updatedCoachName, setUpdatedCoachName] = useState('') // State for updated coach name
	const [updatedCoachPicture, setUpdatedCoachPicture] = useState<File | null>(
		null
	) // State for updated coach picture
	const [newCoachPicture, setNewCoachPicture] = useState<File | null>(null)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true) // State for toggle under activities
	const [buttonLoading, setButtonLoading] = useState(false)
	const [newCoachEmail, setNewCoachEmail] = useState('')
	const [updatedCoachEmail, setUpdatedCoachEmail] = useState('')
	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true)
			const loadedCoaches = await fetchCoaches()
			const loadedActivities = await fetchActivities()
			const loadedGroupActivities = await fetchGroupActivities()
			setCoaches(loadedCoaches || [])
			setActivities(loadedActivities || [])
			setGroupActivities(loadedGroupActivities || [])
			setLoading(false)
		}
		loadInitialData()
	}, [updateTrigger])

	const refreshData = () => setUpdateTrigger(!updateTrigger)

	// Coach handlers
	// Adjusted handleAddCoach to pass the file parameter
	const handleAddCoach = async () => {
		setButtonLoading(true)
		if (newCoachName.trim() && newCoachEmail.trim()) {
			await addCoach(
				{ name: newCoachName, email: newCoachEmail },
				newCoachPicture
			)
			setNewCoachName('')
			setNewCoachEmail('')
			setNewCoachPicture(null)
			refreshData()
			toast.success('Coach added successfully')
		} else {
			toast.error('Please provide a valid name and email for the coach')
		}
		setButtonLoading(false)
	}
	const handleSubmitUpdate = async () => {
		setButtonLoading(true)
		if (updatedCoachName.trim() !== '' && updatedCoachEmail.trim() !== '') {
			await updateCoach(
				updateCoachId!,
				{ name: updatedCoachName, email: updatedCoachEmail },
				updatedCoachPicture
			)
			setShowUpdateForm(false)
			refreshData()
			toast.success('Coach updated successfully')
		} else {
			toast.error('Please provide a valid name and email for the coach')
		}
		setButtonLoading(false)
	}

	const handleDeleteCoach = async (coachId: number) => {
		setButtonLoading(true)
		const success = await deleteCoach(coachId)
		if (success) {
			setCoaches(coaches.filter(coach => coach.id !== coachId))
			refreshData()
			toast.success('Coach deleted successfully')
		} else {
			toast.error(
				'Error deleting coach check activities and time slots related'
			)
		}
		setButtonLoading(false)
	}

	// Activity handlers
	const handleAddActivity = async () => {
		setButtonLoading(true)
		const activity = await addActivity({
			name: newActivityName,
			credits: parseInt(newActivityCredits, 10),
			coach_id: selectedCoachId || 0,
			capacity: newActvityCapacity || null,
			semi_private: newActivitySemiPrivate
		})
		if (activity) setActivities([...activities, activity])
		setNewActivityName('')
		setNewActivityCredits('')
		setNewActivityCapacity('')
		setNewActivitySemiPrivate(false)
		fetchActivities().then(setActivities)
		refreshData()
		setButtonLoading(false)
	}

	const handleDeleteActivity = async (activityId: number) => {
		setButtonLoading(true)
		const success = await deleteActivity(activityId)
		if (success) {
			setActivities(activities.filter(activity => activity.id !== activityId))
			refreshData()
			toast.success('Activity deleted successfully')
		} else {
			toast.error('Error deleting activity check time slots first')
		}
		setButtonLoading(false)
	}

	const handleCoachSelection = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		const coachId = parseInt(event.target.value, 10)
		setSelectedCoachId(coachId)
		fetchCoaches().then(setCoaches)
	}

	const handleUpdateActivity = async (activityId: number) => {
		setButtonLoading(true)
		const newName = prompt('Enter new name for activity (leave empty to skip):')
		const creditsInput = prompt(
			'Enter new credits for activity (leave empty to skip):'
		)
		const capacityInput = prompt('Enter new capacity (leave empty to skip):')
		const semiPrivateInput = prompt(
			'Is this a semi-private activity? (yes/no, leave empty to skip):'
		)

		const updatedActivity = { id: activityId } as any

		if (newName !== null && newName.trim() !== '') {
			updatedActivity.name = newName
		}

		if (creditsInput !== null && creditsInput.trim() !== '') {
			const newCredits = parseInt(creditsInput, 10)
			if (!isNaN(newCredits)) {
				updatedActivity.credits = newCredits
			} else {
				console.error('Invalid credits input.')
				return
			}
		}
		if (capacityInput !== null && capacityInput.trim() !== '') {
			let newCapacity = parseInt(capacityInput, 10)
			if (!isNaN(newCapacity)) {
				if (newCapacity === 1 || newCapacity === 0) {
					newCapacity = 0
					updatedActivity.group = false
				} else {
					updatedActivity.group = true
				}
				updatedActivity.capacity = newCapacity
			} else {
				console.error('Invalid capacity input.')
				return
			}
		}

		if (semiPrivateInput !== null && semiPrivateInput.trim() !== '') {
			updatedActivity.semi_private = semiPrivateInput.toLowerCase() === 'yes'
		}

		try {
			const result = await updateActivity(updatedActivity)
			fetchActivities().then(setActivities)
			fetchGroupActivities().then(setGroupActivities)
			if (result) {
				console.log('Activity updated successfully:', result)
			} else {
				console.error('Error updating activity.')
			}
		} catch (error) {
			console.error('Error updating activity:', error)
		}
		refreshData()
		setButtonLoading(false)
	}

	const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

	const handleFileChange = (file: File) => {
		if (file) {
			if (showUpdateForm) {
				setUpdatedCoachPicture(file)
			} else {
				setNewCoachPicture(file)
			}
			setUploadedFileName(file.name)
		}
	}

	const handleToggleForm = (id: React.SetStateAction<number | null>) => {
		if (updateCoachId === id) {
			setShowUpdateForm(false)
			setUpdateCoachId(null)
			setUpdatedCoachName('')
			setUpdatedCoachEmail('')
			setUpdatedCoachPicture(null)
		} else {
			setShowUpdateForm(true)
			setUpdateCoachId(id)
			const coach = coaches.find(coach => coach.id === id)
			setUpdatedCoachName(coach?.name || '')
			setUpdatedCoachEmail(coach?.email || '')
			setUpdatedCoachPicture(null)
		}

		// Reset the FileUploadDropzone
		const dropzones = document.querySelectorAll(
			'.file-dropzone'
		) as NodeListOf<HTMLElement>
		dropzones.forEach(dropzone => {
			if (dropzone.__react_dropzone_state__) {
				dropzone.__react_dropzone_state__.reset()
			}
		})
	}
	// Similarly, adjust handleUpdateCoach to pass the file if it's updated

	const handleToggle = () => {
		setIsPrivateTraining(!isPrivateTraining)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gray-900 text-white font-sans p-8'>
			<section className='mb-16'>
				<h2 className='text-3xl font-bold mb-8 text-green-400'>Coaches</h2>
				<motion.div
					className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'
					whileHover={{ scale: 1.02 }}>
					<div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4'>
						<input
							type='text'
							value={newCoachName}
							onChange={e => setNewCoachName(e.target.value)}
							placeholder='New Coach Name'
							className='w-full sm:w-1/3 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
						<input
							type='email'
							value={newCoachEmail}
							onChange={e => setNewCoachEmail(e.target.value)}
							placeholder='New Coach Email'
							className='w-full sm:w-1/3 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
						<FileUploadDropzone onFileChange={handleFileChange} />
						<motion.button
							onClick={handleAddCoach}
							disabled={buttonLoading}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='w-full sm:w-auto px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
							<FaPlus className='inline mr-2' /> Add Coach
						</motion.button>
					</div>
				</motion.div>

				{loading ? (
					<div className='flex justify-center items-center'>
						<RingLoader color='#10B981' size={60} />
					</div>
				) : (
					<AnimatePresence>
						{coaches.map((coach: Coach) => (
							<motion.div
								key={coach.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className='bg-gray-800 rounded-xl p-6 mb-4 shadow-lg hover:shadow-green-500/30 transition duration-300'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-4'>
										<img
											src={coach.profile_picture}
											alt={`Profile of ${coach.name}`}
											className='w-12 h-12 rounded-full border-2 border-green-500'
										/>
										<div>
											<span className='text-xl font-semibold'>
												{coach.name}
											</span>
											<p className='text-sm text-gray-400'>{coach.email}</p>
										</div>
									</div>
									<div className='flex space-x-2'>
										<motion.button
											disabled={buttonLoading}
											onClick={() => handleToggleForm(coach.id)}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className='p-2 bg-yellow-700 disabled:bg-yellow-300 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
											<FaEdit />
										</motion.button>
										<motion.button
											disabled={buttonLoading}
											onClick={() => handleDeleteCoach(coach.id)}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className='p-2 bg-red-700 disabled:bg-red-300 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
											<FaTrash />
										</motion.button>
									</div>
								</div>
								<AnimatePresence>
									{showUpdateForm && updateCoachId === coach.id && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.3 }}
											className='mt-4 space-y-4'>
											<input
												type='text'
												value={updatedCoachName}
												onChange={e => setUpdatedCoachName(e.target.value)}
												placeholder='New Coach Name'
												className='w-full p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
											/>
											<input
												type='email'
												value={updatedCoachEmail}
												onChange={e => setUpdatedCoachEmail(e.target.value)}
												placeholder='New Coach Email'
												className='w-full p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
											/>
											<FileUploadDropzone onFileChange={handleFileChange} />
											<motion.button
												disabled={buttonLoading}
												onClick={handleSubmitUpdate}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className='w-full px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
												Update
											</motion.button>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						))}
					</AnimatePresence>
				)}
			</section>

			<hr className='border-gray-700 my-12' />

			<section className='mt-16'>
				<h2 className='text-3xl font-bold mb-8 text-green-400'>Activities</h2>
				<div className='flex justify-center mb-8'>
					<motion.button
						disabled={buttonLoading}
						onClick={handleToggle}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className={`px-6 py-3 rounded-l-full ${
							isPrivateTraining
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300'
						} focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300`}>
						<FaUser className='inline mr-2' /> Private Training
					</motion.button>
					<motion.button
						disabled={buttonLoading}
						onClick={handleToggle}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className={`px-6 py-3 rounded-r-full ${
							!isPrivateTraining
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300'
						} focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300`}>
						<FaUserFriends className='inline mr-2' /> Classes
					</motion.button>
				</div>

				<motion.div
					className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'
					whileHover={{ scale: 1.02 }}>
					<div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4'>
						<input
							type='text'
							value={newActivityName}
							onChange={e => setNewActivityName(e.target.value)}
							placeholder='New Activity Name'
							className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
						<input
							type='number'
							value={newActivityCredits}
							onChange={e => setNewActivityCredits(e.target.value)}
							placeholder='Credits'
							className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
						{!isPrivateTraining && (
							<>
								<input
									type='number'
									value={newActvityCapacity}
									onChange={e => setNewActivityCapacity(e.target.value)}
									placeholder='Capacity'
									className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
								/>
								<div className='flex items-center'>
									<input
										type='checkbox'
										id='semi-private'
										checked={newActivitySemiPrivate}
										onChange={e => setNewActivitySemiPrivate(e.target.checked)}
										className='mr-2'
									/>
									<label htmlFor='semi-private text-nowrap'>Semi-Private</label>
								</div>
							</>
						)}
						<select
							value={selectedCoachId || ''}
							onChange={handleCoachSelection}
							className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'>
							<option value=''>Select Coach</option>
							{coaches.map(coach => (
								<option key={coach.id} value={coach.id}>
									{coach.name}
								</option>
							))}
						</select>
						<motion.button
							disabled={buttonLoading}
							onClick={handleAddActivity}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='w-full sm:w-auto px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
							<FaPlus className='inline mr-2' /> Add Activity
						</motion.button>
					</div>
				</motion.div>

				{loading ? (
					<div className='flex justify-center items-center'>
						<RingLoader color='#10B981' size={60} />
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
						<AnimatePresence>
							{(isPrivateTraining ? activities : groupactivities).map(
								activity => (
									<motion.div
										key={activity.id}
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{ duration: 0.3 }}
										className='bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500/30 transition duration-300 flex flex-col justify-between'>
										<div>
											<h3 className='text-xl font-semibold mb-2 text-green-400'>
												{activity.name}
											</h3>
											<p className='text-gray-300 mb-2'>
												Credits: {activity.credits}
											</p>
											<p className='text-gray-300 mb-2'>
												Coach:{' '}
												{coaches.find(coach => coach.id === activity.coach_id)
													?.name || 'None'}
											</p>
											{!isPrivateTraining && (
												<>
													<p className='text-gray-300'>
														Capacity: {activity.capacity}
													</p>
													<p className='text-gray-300'>
														Semi-Private: {activity.semi_private ? 'Yes' : 'No'}
													</p>
												</>
											)}
										</div>
										<div className='flex justify-end space-x-2 mt-4'>
											<motion.button
												disabled={buttonLoading}
												onClick={() => handleUpdateActivity(activity.id)}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												className='p-2 bg-yellow-700 disabled:bg-yellow-300 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
												<FaEdit />
											</motion.button>
											<motion.button
												disabled={buttonLoading}
												onClick={() => handleDeleteActivity(activity.id)}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												className='p-2 bg-red-700 disabled:bg-red-300 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
												<FaTrash />
											</motion.button>
										</div>
									</motion.div>
								)
							)}
						</AnimatePresence>
					</div>
				)}
			</section>
		</motion.div>
	)
}

export default CoachesandActivitiesAdminPage
