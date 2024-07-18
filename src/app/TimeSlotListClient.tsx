'use client'
import {
	deleteTimeSlot,
	updateTimeSlot,
	updateUserCreditsCancellation,
	deleteGroupTimeSlot,
	cancelGroupBooking
} from '@/../utils/admin-requests'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSearch, FaFilter, FaTrash, FaCheck, FaTimes } from 'react-icons/fa'
import { supabaseClient } from '../../utils/supabaseClient'

export default function TimeSlotListClient({
	initialTimeSlots,
	isPrivateTraining: initialIsPrivateTraining
}: {
	initialTimeSlots: any[]
	isPrivateTraining: boolean
}) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isPrivateTraining, setIsPrivateTraining] = useState(
		initialIsPrivateTraining
	)
	const [timeSlots, setTimeSlots] = useState(initialTimeSlots)
	const [selectedslots, setSelectedSlots] = useState<number[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filter, setFilter] = useState({
		activity: searchParams.get('activity') || '',
		coach: searchParams.get('coach') || '',
		user: searchParams.get('user') || '',
		date: searchParams.get('date') || '',
		startTime: searchParams.get('startTime') || '',
		endTime: searchParams.get('endTime') || ''
	})
	const [bookedFilter, setBookedFilter] = useState(
		searchParams.get('booked') || 'all'
	)
	const [showFilters, setShowFilters] = useState(false)

	useEffect(() => {
		setTimeSlots(initialTimeSlots)
	}, [initialTimeSlots])

	const applyFilters = () => {
		const params = new URLSearchParams()
		if (searchTerm) params.set('searchTerm', searchTerm)
		else params.delete('searchTerm')
		if (filter.activity) params.set('activity', filter.activity)
		if (bookedFilter !== 'all')
			params.set('booked', bookedFilter === 'booked' ? 'true' : 'false')
		if (filter.coach) params.set('coach', filter.coach)
		if (filter.user) params.set('user', filter.user)
		if (filter.date) params.set('date', filter.date)
		if (filter.startTime) params.set('startTime', filter.startTime)
		if (filter.endTime) params.set('endTime', filter.endTime)

		params.set('isPrivateTraining', isPrivateTraining.toString())
		router.push(`/admin/view-reservations?${params.toString()}`)
	}

	const removeUserFromGroup = async (
		timeSlotId: any,
		userId: any,
		credits: any
	) => {
		const confirm = window.confirm(
			'Are you sure you want to remove this user from the group?'
		)
		if (!confirm) {
			return
		}

		const supabase = await supabaseClient()

		// Fetch existing group time slot data
		const { data: existingSlot, error: existingSlotError } = await supabase
			.from('group_time_slots')
			.select(
				'user_id, count, booked, additions, activity_id, coach_id, date, start_time, end_time'
			)
			.eq('id', timeSlotId)
			.single()

		if (existingSlotError) {
			console.error(
				'Error fetching existing group time slot:',
				existingSlotError.message
			)
			return
		}

		if (!existingSlot) {
			return
		}

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('wallet, isFree, first_name, last_name, email')
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			console.error(
				`Error fetching user data for user ${userId}:`,
				userError?.message || 'User not found'
			)
			return
		}

		// Calculate total additions refund for the user
		const userAdditions = existingSlot.additions.filter(
			(addition: { user_id: any }) => addition.user_id === userId
		)
		const additionsTotalPrice = userAdditions.reduce(
			(total: any, addition: { items: any[] }) =>
				total +
				addition.items.reduce(
					(itemTotal: any, item: { price: any }) => itemTotal + item.price,
					0
				),
			0
		)

		let totalRefund = 0
		if (!userData.isFree) {
			totalRefund += credits + additionsTotalPrice
		} else {
			totalRefund += additionsTotalPrice
		}

		// Remove user's additions from the additions array
		const updatedAdditions = existingSlot.additions.filter(
			(addition: { user_id: any }) => addition.user_id !== userId
		)

		// Remove the user from the group_time_slots
		const updatedUserIds = existingSlot.user_id.filter(
			(id: any) => id !== userId
		)
		const updatedCount = updatedUserIds.length

		const { data, error } = await supabase
			.from('group_time_slots')
			.update({
				user_id: updatedUserIds,
				count: updatedCount,
				booked: false,
				additions: updatedAdditions
			})
			.eq('id', timeSlotId)

		if (error) {
			console.error('Error updating group time slot:', error.message)
			return
		}

		// Refund the credits to the user
		if (totalRefund > 0) {
			await updateUserCreditsCancellation(userId, totalRefund)
		}

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('name')
			.eq('id', existingSlot.activity_id)
			.single()

		if (activityError) {
			console.error('Error fetching activity data:', activityError.message)
			return
		}

		// Fetch coach data
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name, email')
			.eq('id', existingSlot.coach_id)
			.single()

		if (coachError) {
			console.error('Error fetching coach data:', coachError.message)
			return
		}

		// Prepare email data
		const emailData = {
			user_name: `${userData.first_name} ${userData.last_name}`,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: existingSlot.date,
			start_time: existingSlot.start_time,
			end_time: existingSlot.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email
		}

		// Send removal email to admin
		try {
			const responseAdmin = await fetch('/api/send-cancel-admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailData)
			})

			if (!responseAdmin.ok) {
				const resultAdmin = await responseAdmin.json()
				throw new Error(
					`Failed to send admin removal email: ${resultAdmin.error}`
				)
			}
		} catch (error) {
			console.error('Error sending admin removal email:', error)
		}

		// Send removal email to user
		try {
			const responseUser = await fetch('/api/send-cancel-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailData)
			})

			if (!responseUser.ok) {
				const resultUser = await responseUser.json()
				throw new Error(
					`Failed to send user removal email: ${resultUser.error}`
				)
			}
		} catch (error) {
			console.error('Error sending user removal email:', error)
		}

		router.refresh()
	}
	useEffect(() => {
		applyFilters()
	}, [searchTerm, filter, bookedFilter, isPrivateTraining])

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
	}

	const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFilter(prev => ({ ...prev, [name]: value }))
	}

	const handleBookedFilterChange = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		setBookedFilter(event.target.value)
	}

	const handlePrivatePublicToggle = () => {
		setIsPrivateTraining(prev => !prev)
	}

	const addOneMinuteToTime = (time: string) => {
		const [hours, minutes] = time.split(':').map(part => parseInt(part, 10))
		const totalMinutes = hours * 60 + minutes
		const adjustedTotalMinutes = totalMinutes + 1
		const adjustedHours = Math.floor(adjustedTotalMinutes / 60)
		const adjustedMinutes = adjustedTotalMinutes % 60
		return `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes
			.toString()
			.padStart(2, '0')}`
	}

	const handleCheckboxChange = (index: number) => {
		const currentIndex = selectedslots.indexOf(index)
		const newCheckedState = [...selectedslots]

		if (currentIndex === -1) {
			newCheckedState.push(index)
		} else {
			newCheckedState.splice(currentIndex, 1)
		}

		setSelectedSlots(newCheckedState)
	}

	const deleteSelectedReservations = async () => {
		if (window.confirm('Are you sure you want to delete these sessions?')) {
			for (const index of selectedslots) {
				const reservation = timeSlots[index]
				if (!reservation.booked) {
					const success = isPrivateTraining
						? await deleteTimeSlot(reservation.id)
						: await deleteGroupTimeSlot(reservation.id)
					if (success) {
						console.log(`Deleted reservation with ID: ${reservation.id}`)
					} else {
						console.error(
							`Failed to delete reservation with ID: ${reservation.id}`
						)
					}
				}
			}
			router.refresh()
			setSelectedSlots([])
		}
	}

	const cancelBooking = async (reservation: any) => {
		if (
			window.confirm(
				`Are you sure you want to cancel the booking for ${reservation.activity?.name}?`
			)
		) {
			if (isPrivateTraining) {
				const supabase = await supabaseClient()

				try {
					// Fetch reservation details
					const { data: reservationData, error: reservationError } =
						await supabase
							.from('time_slots')
							.select('additions, coach_id, date, start_time, end_time')
							.eq('id', reservation.id)
							.single()

					if (reservationError || !reservationData) {
						throw new Error(
							reservationError?.message || 'Reservation not found'
						)
					}

					// Fetch additions prices from the market table
					const { data: additionsData, error: additionsError } = await supabase
						.from('market')
						.select('name, price')
						.in('name', reservationData.additions || [])

					if (additionsError) {
						throw new Error(
							`Error fetching additions data: ${additionsError.message}`
						)
					}

					const additionsTotalPrice = additionsData.reduce(
						(total: any, item: any) => total + item.price,
						0
					)

					// Fetch user data
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('isFree, first_name, last_name, email')
						.eq('user_id', reservation.user?.user_id)
						.single()

					if (userError || !userData) {
						throw new Error(
							`Error fetching user data: ${
								userError?.message || 'User not found'
							}`
						)
					}

					let totalRefund = additionsTotalPrice
					if (!userData.isFree) {
						totalRefund += reservation.activity?.credits || 0
					}

					const updatedSlot = {
						...reservation,
						user_id: null,
						booked: false,
						additions: [] // Clear additions after cancellation
					}

					const { success, error } = await updateTimeSlot(updatedSlot)
					if (!success) {
						throw new Error(`Failed to cancel booking: ${error}`)
					}

					// Update user credits
					await updateUserCreditsCancellation(
						reservation.user?.user_id,
						totalRefund
					)

					// Fetch coach data
					const { data: coachData, error: coachError } = await supabase
						.from('coaches')
						.select('name, email')
						.eq('id', reservationData.coach_id)
						.single()

					if (coachError) {
						throw new Error(`Error fetching coach data: ${coachError.message}`)
					}

					// Prepare email data
					const emailData = {
						user_name: `${userData.first_name} ${userData.last_name}`,
						user_email: userData.email,
						activity_name: reservation.activity?.name,
						activity_date: reservationData.date,
						start_time: reservationData.start_time,
						end_time: reservationData.end_time,
						coach_name: coachData.name,
						coach_email: coachData.email
					}

					// Send cancellation email to admin
					const responseAdmin = await fetch('/api/send-cancel-admin', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(emailData)
					})

					if (!responseAdmin.ok) {
						const resultAdmin = await responseAdmin.json()
						throw new Error(
							`Failed to send admin cancellation email: ${resultAdmin.error}`
						)
					}

					// Send cancellation email to user
					const responseUser = await fetch('/api/send-cancel-user', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(emailData)
					})

					if (!responseUser.ok) {
						const resultUser = await responseUser.json()
						throw new Error(
							`Failed to send user cancellation email: ${resultUser.error}`
						)
					}

					console.log('Booking cancelled successfully.')
					router.refresh()
				} catch (error) {
					console.error('Error cancelling booking:')
				}
			} else {
				const { success, error } = await cancelGroupBooking(reservation.id)
				if (success) {
					console.log('Group booking cancelled successfully.')
					router.refresh()
				} else {
					console.error('Failed to cancel group booking:', error)
				}
			}
		}
	}

	return (
		<motion.section
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='px-4 py-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
			<h1 className='text-3xl font-bold mb-8 text-center text-green-400'>
				Time Slots
			</h1>

			<div className='flex justify-center space-x-4 mb-8'>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setIsPrivateTraining(true)}
					className={`px-6 py-3 rounded-full ${
						isPrivateTraining
							? 'bg-green-500 text-white'
							: 'bg-gray-700 text-gray-300'
					}`}>
					Private Sessions
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setIsPrivateTraining(false)}
					className={`px-6 py-3 rounded-full ${
						!isPrivateTraining
							? 'bg-green-500 text-white'
							: 'bg-gray-700 text-gray-300'
					}`}>
					Public Sessions
				</motion.button>
			</div>

			<div className='flex items-center mb-6'>
				<input
					type='text'
					placeholder='Search...'
					value={searchTerm}
					onChange={handleSearchChange}
					className='w-full p-3 bg-gray-800 border-2 border-green-500 rounded-l-full focus:outline-none focus:ring-2 focus:ring-green-400'
				/>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={applyFilters}
					className='px-6 py-3 bg-green-500 text-white rounded-r-full hover:bg-green-600'>
					<FaSearch />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setShowFilters(!showFilters)}
					className='ml-4 p-3 bg-gray-700 rounded-full hover:bg-gray-600'>
					<FaFilter />
				</motion.button>
			</div>

			{showFilters && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					className='bg-gray-800 p-6 rounded-lg shadow-lg mb-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						<input
							type='text'
							name='activity'
							placeholder='Filter by Activity...'
							value={filter.activity}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
						<input
							type='text'
							name='coach'
							placeholder='Filter by Coach...'
							value={filter.coach}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
						<input
							type='text'
							name='user'
							placeholder='Filter by User...'
							value={filter.user}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
						<select
							onChange={handleBookedFilterChange}
							value={bookedFilter}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'>
							<option value='all'>All</option>
							<option value='booked'>Booked</option>
							<option value='notBooked'>Not Booked</option>
						</select>
						<input
							type='date'
							name='date'
							value={filter.date}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
						<input
							type='time'
							name='startTime'
							value={filter.startTime}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
						<input
							type='time'
							name='endTime'
							value={filter.endTime}
							onChange={handleFilterChange}
							className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
						/>
					</div>
					<div className='flex justify-end mt-4 gap-x-4'>
						<button
							onClick={() => {
								setFilter({
									activity: '',
									coach: '',
									user: '',
									date: '',
									startTime: '',
									endTime: ''
								})
								setBookedFilter('all')
								setSearchTerm('')
							}}
							className='bg-red-700 border-solid p-2 rounded-xl cursor-pointer hover:shadow-xl hover:shadow-red-600'>
							Clear Filters
						</button>
						<button
							onClick={applyFilters}
							className='bg-green-400 border-solid p-2 rounded-xl cursor-pointer hover:shadow-xl hover:shadow-green-700'>
							Apply Filters
						</button>
					</div>
				</motion.div>
			)}
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={deleteSelectedReservations}
				className='mb-6 px-6 py-3 bg-red-700 tex</motion.button>t-white rounded-full hover:bg-red-600'>
				<FaTrash className='inline-block mr-2' /> Delete Selected
			</motion.button>
			{/* Render your time slots table here using the timeSlots state */}
			<table className='w-full text-sm text-left text-gray-300'>
				<thead className='text-xs uppercase bg-gray-800'>
					<tr>
						<th className='px-4 py-3'>Select</th>
						<th className='px-4 py-3 text-center '>Cancel</th>
						<th className='px-4 py-3'>Activity</th>
						<th className='px-4 py-3'>Coach Name</th>
						<th className='px-4 py-3'>Date</th>
						<th className='px-4 py-3'>Start Time</th>
						<th className='px-4 py-3'>End Time</th>
						<th className='px-4 py-3'>Name</th>
						<th className='px-4 py-3'>Booked</th>
						<th className='px-4 py-3'>Credits</th>
						{!isPrivateTraining && <th className='px-4 py-3'>Capacity</th>}
					</tr>
				</thead>
				<tbody>
					{timeSlots.map((slot, index) => (
						<motion.tr
							key={index}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3 }}
							className='bg-gray-700 border-b border-gray-600 hover:bg-gray-600'>
							<td className='px-4 py-3'>
								<input
									type='checkbox'
									disabled={slot.booked}
									onChange={() => handleCheckboxChange(index)}
									checked={selectedslots.includes(index)}
									className='form-checkbox h-5 w-5 text-green-500'
								/>
							</td>
							<td className='py-3 flex flex-row justify-center'>
								{slot.booked ? (
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => cancelBooking(slot)}
										className='p-2 bg-orange-500 text-white rounded-full text-center hover:bg-orange-600'>
										<FaTimes className='text-center mx-auto' />
									</motion.button>
								) : (
									<div className='p-2 bg-gray-500 text-white text-center rounded-full opacity-50 cursor-not-allowed'>
										<FaTimes className='text-center mx-auto' />
									</div>
								)}
							</td>
							<td className='px-4 py-3'>{slot.activity?.name ?? 'N/A'}</td>
							<td className='px-4 py-3'>{slot.coach?.name ?? 'N/A'}</td>
							<td className='px-4 py-3'>{slot.date}</td>
							<td className='px-4 py-3'>{slot.start_time}</td>
							<td className='px-4 py-3'>{slot.end_time}</td>
							<td className='px-4 py-3'>
								{slot.user && isPrivateTraining
									? `${slot.user.first_name} ${slot.user.last_name}`
									: slot.users && slot.users.length > 0
									? slot.users.map((user: any, userIndex: any) => (
											<div
												key={userIndex}
												className='flex items-center justify-between bg-gray-800 p-2 rounded-md mb-1'>
												<span>
													{user
														? `${user.first_name} ${user.last_name}`
														: 'N/A'}
												</span>
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={() =>
														removeUserFromGroup(
															slot.id,
															user.user_id,
															slot.activity?.credits
														)
													}
													className='ml-2 p-1 bg-red-700 text-white rounded-full hover:bg-red-600'>
													<FaTimes size={12} />
												</motion.button>
											</div>
									  ))
									: 'N/A'}
							</td>
							<td className='px-4 py-3'>
								{slot.booked ? (
									<FaCheck className='text-green-500' />
								) : (
									<FaTimes className='text-red-700 text-center' />
								)}
							</td>
							<td className='px-4 py-3'>{slot.activity?.credits ?? 'N/A'}</td>
							{!isPrivateTraining && (
								<td className='px-4 py-3'>
									{slot.activity?.capacity ?? 'N/A'}
								</td>
							)}
						</motion.tr>
					))}
				</tbody>
			</table>
		</motion.section>
	)
}
