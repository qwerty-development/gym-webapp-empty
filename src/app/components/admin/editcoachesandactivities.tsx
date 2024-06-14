'use client'

import React, { useState, useEffect } from 'react'
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
import { SyncLoader } from 'react-spinners'
import toast, { LoaderIcon } from 'react-hot-toast'

type Coach = {
	id: number
	name: string
	profile_picture: string // Make sure this is being fetched
}

type Activity = {
	id: number
	name: string
	credits: number
	coach_id: number
	capacity: number
	group: boolean
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
		if (newCoachName.trim()) {
			await addCoach({ name: newCoachName }, newCoachPicture)
			setNewCoachName('')
			setNewCoachPicture(null)
			refreshData()
			toast.success('Coach added successfully')
		} else {
			toast.error('Please provide a valid name for the coach')
		}

		setButtonLoading(false)
	}

	const handleSubmitUpdate = async () => {
		setButtonLoading(true)
		if (updatedCoachName.trim() !== '') {
			await updateCoach(
				updateCoachId!,
				{ name: updatedCoachName },
				updatedCoachPicture
			)
			setShowUpdateForm(false)
			refreshData()
			toast.success('Coach updated successfully')
		} else {
			toast.error('Please provide a valid name for the coach')
		}
		setButtonLoading(false)
	}

	const handleDeleteCoach = async (coachId: number) => {
		setButtonLoading(true)
		const success = await deleteCoach(coachId)
		if (success) setCoaches(coaches.filter(coach => coach.id !== coachId))
		fetchCoaches().then(setCoaches)
		refreshData()
		setButtonLoading(false)
	}

	// Activity handlers
	const handleAddActivity = async () => {
		setButtonLoading(true)
		const activity = await addActivity({
			name: newActivityName,
			credits: parseInt(newActivityCredits, 10),
			coach_id: selectedCoachId || 0,
			capacity: newActvityCapacity || null
		})
		if (activity) setActivities([...activities, activity])
		setNewActivityName('')
		setNewActivityCredits('')
		setNewActivityCapacity('')
		fetchActivities().then(setActivities)
		refreshData()
		setButtonLoading(false)
	}

	const handleDeleteActivity = async (activityId: number) => {
		setButtonLoading(true)
		const success = await deleteActivity(activityId)
		if (success)
			setActivities(activities.filter(activity => activity.id !== activityId))
		fetchActivities().then(setActivities)
		refreshData()
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
					newCapacity === null
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

	const [file, setFile] = useState<File | null>(null)

	const handleFileChange: React.ChangeEventHandler<
		HTMLInputElement
	> = event => {
		if (event.target.files && event.target.files.length > 0) {
			if (showUpdateForm) {
				setUpdatedCoachPicture(event.target.files[0])
			} else {
				setNewCoachPicture(event.target.files[0])
			}
		}
	}

	const handleToggleForm = (id: React.SetStateAction<number | null>) => {
		if (updateCoachId === id) {
			// If the form is already open for the same coach, close it
			setShowUpdateForm(false)
			setUpdateCoachId(null)
		} else {
			setShowUpdateForm(true)
			setUpdateCoachId(id)
		}
	}

	// Similarly, adjust handleUpdateCoach to pass the file if it's updated

	const handleToggle = () => {
		setIsPrivateTraining(!isPrivateTraining)
	}

	return (
		<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
			<section className='mt-10'>
				<h2 className='text-xl font-semibold mb-6'>Coaches</h2>
				<div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-x-4 mb-6'>
					<input
						type='text'
						value={newCoachName}
						onChange={e => setNewCoachName(e.target.value)}
						placeholder='New Coach Name'
						className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto flex-grow'
					/>
					<div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4'>
						<input type='file' onChange={handleFileChange} />
						<button
							onClick={handleAddCoach}
							disabled={buttonLoading}
							className='bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded-md '>
							Add Coach
						</button>
					</div>
				</div>
				{loading ? (
					<div className='flex justify-center items-center'>
						<SyncLoader color='#367831' size={25} />
					</div>
				) : (
					<ul>
						{coaches.map((coach: Coach) => (
							<li
								key={coach.id}
								className='bg-gray-100 px-4 py-2 mb-2 rounded-md'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-3'>
										<img
											src={coach.profile_picture}
											alt={`Profile of ${coach.name}`}
											className='w-10 h-10 rounded-full'
										/>
										<span className='dark:text-black'>{coach.name}</span>
									</div>
									<div className='flex'>
										<button
											disabled={buttonLoading}
											onClick={() => handleToggleForm(coach.id)}
											className='bg-yellow-500 disabled:bg-yellow-300 text-white px-3 py-1 rounded-md mr-2'>
											Update
										</button>
										<button
											disabled={buttonLoading}
											onClick={() => handleDeleteCoach(coach.id)}
											className='bg-red-500 disabled:bg-red-300 text-white px-3 py-1 rounded-md'>
											Delete
										</button>
									</div>
								</div>
								{showUpdateForm && updateCoachId === coach.id && (
									<div className='mx-auto p-4'>
										<input
											type='text'
											value={updatedCoachName}
											onChange={e => setUpdatedCoachName(e.target.value)}
											placeholder='New Coach Name'
											className='border border-gray-300 px-3 py-2 mt-4 rounded-md w-64'
										/>
										<input
											className='mt-4'
											type='file'
											onChange={handleFileChange}
										/>
										<button
											disabled={buttonLoading}
											onClick={handleSubmitUpdate}
											className='bg-blue-500 disabled:bg-blue-300 text-white items-center px-4 py-2 rounded-md mt-4'>
											Update
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</section>

			<hr className='my-8 border-gray-900 mt-12 mb-12' />

			<section className='mt-10'>
				<div className='justify-between items-center py-4'>
					<h1 className='text-3xl font-bold'>Activities</h1>
					<div className='flex m-6 justify-center'>
						<button
							disabled={buttonLoading}
							className={`px-4 py-2 mr-2 rounded ${
								isPrivateTraining ? 'bg-green-500  text-white' : 'bg-gray-200 '
							}`}
							onClick={handleToggle}>
							Private Training
						</button>
						<button
							disabled={buttonLoading}
							className={`px-4 py-2 rounded ${
								!isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={handleToggle}>
							Public Training
						</button>
					</div>
				</div>
				{isPrivateTraining ? (
					<>
						<div className='flex flex-col sm:flex-row items-center space-y-4 lg:space-y-0 space-x-4 mb-6'>
							<input
								type='text'
								value={newActivityName}
								onChange={e => setNewActivityName(e.target.value)}
								placeholder='New Activity Name'
								className='border border-gray-300 px-3 py-2  rounded-md w-full sm:w-auto flex-grow'
							/>
							<input
								type='number'
								value={newActivityCredits}
								onChange={e => setNewActivityCredits(e.target.value)}
								placeholder='Credits'
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto'
							/>
							<select
								value={selectedCoachId || ''}
								onChange={handleCoachSelection}
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto'>
								<option value=''>Select Coach</option>
								{coaches.map(coach => (
									<option key={coach.id} value={coach.id}>
										{coach.name}
									</option>
								))}
							</select>
							<button
								disabled={buttonLoading}
								onClick={handleAddActivity}
								className='bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded-md w-full sm:w-auto'>
								Add Activity
							</button>
						</div>
						{loading ? (
							<div className='flex justify-center items-center mt-5'>
								<SyncLoader color='#367831' size={25} />
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-12 lg:grid-cols-4 gap-4'>
								{activities.map(activity => (
									<div
										key={activity.id}
										className='bg-gray-100 rounded-md shadow p-4 relative'>
										<h3 className='text-lg text-black font-semibold mb-2'>
											{activity.name}
										</h3>
										<p className='text-gray-500 mb-2'>
											Credits: {activity.credits}
										</p>
										<p className='text-gray-500'>
											Assigned to:{' '}
											{coaches.find(coach => coach.id === activity.coach_id)
												?.name || 'None'}
										</p>
										<div className='mt-5'>
											<button
												disabled={buttonLoading}
												onClick={() => handleUpdateActivity(activity.id)}
												className='bg-yellow-500 disabled:bg-yellow-300 text-white px-3 py-1 rounded-md mr-2'>
												Update
											</button>
											<button
												disabled={buttonLoading}
												onClick={() => handleDeleteActivity(activity.id)}
												className='bg-red-500 disabled:bg-red-300 text-white px-3 py-1 rounded-md ml-2'>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</>
				) : (
					// Public training content
					<>
						<div className='flex flex-col sm:flex-row items-center space-y-4 lg:space-y-0 space-x-4 mb-6'>
							<input
								type='text'
								value={newActivityName}
								onChange={e => setNewActivityName(e.target.value)}
								placeholder='New Activity Name'
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto flex-grow'
							/>
							<input
								type='number'
								value={newActivityCredits}
								onChange={e => setNewActivityCredits(e.target.value)}
								placeholder='Credits'
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto'
							/>
							<input
								type='number'
								value={newActvityCapacity}
								onChange={e => setNewActivityCapacity(e.target.value)}
								placeholder='Capacity'
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto'
							/>
							<select
								value={selectedCoachId || ''}
								onChange={handleCoachSelection}
								className='border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto'>
								<option value=''>Select Coach</option>
								{coaches.map(coach => (
									<option key={coach.id} value={coach.id}>
										{coach.name}
									</option>
								))}
							</select>
							<button
								disabled={buttonLoading}
								onClick={handleAddActivity}
								className='bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded-md w-full sm:w-auto'>
								Add Activity
							</button>
						</div>{' '}
						<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-12 lg:grid-cols-4 gap-4'>
							{groupactivities.map(activity => (
								<div
									key={activity.id}
									className='bg-gray-100 rounded-md shadow p-4 relative'>
									<h3 className='text-lg text-black font-semibold mb-2'>
										{activity.name}
									</h3>
									<p className='text-gray-500 mb-2'>
										Credits: {activity.credits}
									</p>
									<p className='text-gray-500 mb-2'>
										Assigned to:{' '}
										{coaches.find(coach => coach.id === activity.coach_id)
											?.name || 'None'}
									</p>
									<p className='text-gray-500'>Capacity: {activity.capacity}</p>
									<div className='mt-5'>
										<button
											disabled={buttonLoading}
											onClick={() => handleUpdateActivity(activity.id)}
											className='bg-yellow-500 disabled:bg-yellow-300 text-white px-3 py-1 rounded-md mr-2'>
											Update
										</button>
										<button
											disabled={buttonLoading}
											onClick={() => handleDeleteActivity(activity.id)}
											className='bg-red-500 disabled:bg-red-300 text-white px-3 py-1 rounded-md ml-2'>
											Delete
										</button>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</section>
		</div>
	)
}

export default CoachesandActivitiesAdminPage
