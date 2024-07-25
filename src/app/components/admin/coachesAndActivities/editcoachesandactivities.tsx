'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from '../../../../../utils/adminRequests'
import toast from 'react-hot-toast'
import CoachesSection from './CoachesSection'
import ActivitiesSection from './ActivitiesSection'

const CoachesandActivitiesAdminPage = () => {
	const [coaches, setCoaches] = useState<any[]>([])
	const [activities, setActivities] = useState<any[]>([])
	const [groupactivities, setGroupActivities] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [buttonLoading, setButtonLoading] = useState(false)

	// Coaches state
	const [newCoachName, setNewCoachName] = useState('')
	const [newCoachEmail, setNewCoachEmail] = useState('')
	const [newCoachPicture, setNewCoachPicture] = useState<File | null>(null)
	const [showUpdateForm, setShowUpdateForm] = useState(false)
	const [updateCoachId, setUpdateCoachId] = useState<number | null>(null)
	const [updatedCoachName, setUpdatedCoachName] = useState('')
	const [updatedCoachEmail, setUpdatedCoachEmail] = useState('')
	const [updatedCoachPicture, setUpdatedCoachPicture] = useState<File | null>(
		null
	)

	// Activities state
	const [newActivityName, setNewActivityName] = useState('')
	const [newActivityCredits, setNewActivityCredits] = useState('')
	const [newActvityCapacity, setNewActivityCapacity] = useState('')
	const [newActivitySemiPrivate, setNewActivitySemiPrivate] = useState(false)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true)

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
	}, [])

	const refreshData = async () => {
		const loadedCoaches = await fetchCoaches()
		const loadedActivities = await fetchActivities()
		const loadedGroupActivities = await fetchGroupActivities()
		setCoaches(loadedCoaches || [])
		setActivities(loadedActivities || [])
		setGroupActivities(loadedGroupActivities || [])
	}

	// Coach handlers
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
				'Error deleting coach. Check activities and time slots related'
			)
		}
		setButtonLoading(false)
	}

	const handleToggleForm = (id: number) => {
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
	}

	const handleFileChange = (file: File) => {
		if (file) {
			if (showUpdateForm) {
				setUpdatedCoachPicture(file)
			} else {
				setNewCoachPicture(file)
			}
		}
	}

	// Activity handlers
	const handleAddActivity = async () => {
		setButtonLoading(true)
		const activity = await addActivity({
			name: newActivityName,
			credits: parseInt(newActivityCredits, 10),
			capacity: newActvityCapacity || null,
			semi_private: newActivitySemiPrivate
		})
		if (activity) setActivities([...activities, activity])
		setNewActivityName('')
		setNewActivityCredits('')
		setNewActivityCapacity('')
		setNewActivitySemiPrivate(false)
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
			toast.error('Error deleting activity. Check time slots first')
		}
		setButtonLoading(false)
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
			refreshData()
			if (result) {
				console.log('Activity updated successfully:', result)
			} else {
				console.error('Error updating activity.')
			}
		} catch (error) {
			console.error('Error updating activity:', error)
		}
		setButtonLoading(false)
	}

	const handleToggle = () => {
		setIsPrivateTraining(!isPrivateTraining)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gray-900 text-white font-sans p-8'>
			<CoachesSection
				coaches={coaches}
				loading={loading}
				buttonLoading={buttonLoading}
				newCoachName={newCoachName}
				setNewCoachName={setNewCoachName}
				newCoachEmail={newCoachEmail}
				setNewCoachEmail={setNewCoachEmail}
				handleAddCoach={handleAddCoach}
				handleDeleteCoach={handleDeleteCoach}
				handleToggleForm={handleToggleForm}
				handleFileChange={handleFileChange}
				showUpdateForm={showUpdateForm}
				updateCoachId={updateCoachId}
				updatedCoachName={updatedCoachName}
				setUpdatedCoachName={setUpdatedCoachName}
				updatedCoachEmail={updatedCoachEmail}
				setUpdatedCoachEmail={setUpdatedCoachEmail}
				handleSubmitUpdate={handleSubmitUpdate}
			/>

			<hr className='border-gray-700 my-12' />

			<ActivitiesSection
				activities={activities}
				groupactivities={groupactivities}
				loading={loading}
				buttonLoading={buttonLoading}
				isPrivateTraining={isPrivateTraining}
				handleToggle={handleToggle}
				newActivityName={newActivityName}
				setNewActivityName={setNewActivityName}
				newActivityCredits={newActivityCredits}
				setNewActivityCredits={setNewActivityCredits}
				newActvityCapacity={newActvityCapacity}
				setNewActivityCapacity={setNewActivityCapacity}
				newActivitySemiPrivate={newActivitySemiPrivate}
				setNewActivitySemiPrivate={setNewActivitySemiPrivate}
				handleAddActivity={handleAddActivity}
				handleUpdateActivity={handleUpdateActivity}
				handleDeleteActivity={handleDeleteActivity}
			/>
		</motion.div>
	)
}

export default CoachesandActivitiesAdminPage
