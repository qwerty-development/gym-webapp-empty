'use client'

import React, { useState, useEffect } from 'react'
import {
	fetchTimeSlots,
	deleteTimeSlot,
	updateTimeSlot,
	updateUserCredits,
	updateUserCreditsCancellation,
	deleteGroupTimeSlot,
	fetchGroupTimeSlots,
	updateGroupTimeSlot
} from '../../../../utils/admin-requests'
import { supabaseClient } from '../../../../utils/supabaseClient'

type Activity = {
	name: string
	credits: number
} | null

type Coach = {
	name: string
} | null

type User = {
	user_id: string
	first_name: string
	last_name: string
} | null

type Reservation = {
	id: number
	activity: Activity
	coach: Coach
	date: string
	start_time: string
	end_time: string
	user: User
	booked: boolean
}

export default function ViewReservationsComponent() {
	const [reservations, setReservations] = useState<any[]>([])
	const [filteredReservations, setFilteredReservations] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filter, setFilter] = useState({
		activity: '',
		coach: '',
		user: '',
		date: '',
		startTime: '',
		endTime: ''
	})
	const [bookedFilter, setBookedFilter] = useState('all')
	const [showFilters, setShowFilters] = useState(false)
	const [selectedReservations, setSelectedReservations] = useState<number[]>([])
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true)

	const fetchData = async () => {
		const data = isPrivateTraining
			? await fetchTimeSlots()
			: await fetchGroupTimeSlots()
		if (Array.isArray(data)) {
			setReservations(data)
			setFilteredReservations(data)
		}
	}

	useEffect(() => {
		fetchData()
	}, [isPrivateTraining])

	useEffect(() => {
		const filteredData = applyFilters(reservations)
		setFilteredReservations(filteredData)
	}, [searchTerm, filter, reservations, bookedFilter])

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

	const applyFilters = (data: Reservation[]) => {
		return data.filter(reservation => {
			const activityMatch = filter.activity
				? reservation.activity?.name
						.toLowerCase()
						.includes(filter.activity.toLowerCase())
				: true
			const coachMatch = filter.coach
				? reservation.coach?.name
						.toLowerCase()
						.includes(filter.coach.toLowerCase())
				: true
			const userMatch = filter.user
				? reservation.user?.first_name
						.toLowerCase()
						.includes(filter.user.toLowerCase()) ||
				  reservation.user?.last_name
						.toLowerCase()
						.includes(filter.user.toLowerCase())
				: true
			const searchTermMatch = searchTerm
				? reservation.activity?.name
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
				  reservation.coach?.name
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
				  reservation.user?.first_name
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
				  reservation.user?.last_name
						.toLowerCase()
						.includes(searchTerm.toLowerCase())
				: true
			const bookedMatch =
				bookedFilter === 'all'
					? true
					: bookedFilter === 'booked'
					? reservation.booked === true
					: reservation.booked === false
			const dateMatch = filter.date ? reservation.date === filter.date : true
			const startTimeMatch = filter.startTime
				? reservation.start_time >= filter.startTime
				: true
			const endTimeAdjusted = filter.endTime
				? addOneMinuteToTime(filter.endTime)
				: null
			const endTimeMatch = endTimeAdjusted
				? reservation.end_time <= endTimeAdjusted
				: true

			return (
				activityMatch &&
				coachMatch &&
				userMatch &&
				searchTermMatch &&
				bookedMatch &&
				dateMatch &&
				startTimeMatch &&
				endTimeMatch
			)
		})
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
		const currentIndex = selectedReservations.indexOf(index)
		const newCheckedState = [...selectedReservations]

		if (currentIndex === -1) {
			newCheckedState.push(index)
		} else {
			newCheckedState.splice(currentIndex, 1)
		}

		setSelectedReservations(newCheckedState)
	}

	const deleteSelectedReservations = async () => {
		if (window.confirm('Are you sure you want to delete these sessions?')) {
			for (const index of selectedReservations) {
				const reservation = reservations[index]
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
			fetchData()
		}
	}

	const cancelBooking = async (reservation: Reservation) => {
		if (
			window.confirm(
				`Are you sure you want to cancel the booking for ${reservation.activity?.name}?`
			)
		) {
			if (isPrivateTraining) {
				const updatedSlot = {
					...reservation,
					user_id: null,
					booked: false
				}

				const { success, error } = await updateTimeSlot(updatedSlot)
				if (success) {
					console.log('Booking cancelled successfully.')
					updateUserCreditsCancellation(
						reservation.user?.user_id,
						reservation.activity?.credits
					)
					fetchData()
				} else {
					console.error('Failed to cancel booking:', error)
				}
			} else {
				const { success, error } = await cancelGroupBooking(
					reservation.id,
					reservation.activity?.credits
				)
				if (success) {
					console.log('Group booking cancelled successfully.')
					fetchData()
				} else {
					console.error('Failed to cancel group booking:', error)
				}
			}
		}
	}

	const cancelGroupBooking = async (
		timeSlotId: number,
		credits: number | undefined
	) => {
		const supabase = await supabaseClient()

		// Fetch existing group time slot data
		const { data: existingSlot, error: existingSlotError } = await supabase
			.from('group_time_slots')
			.select('user_id, count, activity_id')
			.eq('id', timeSlotId)
			.single()

		if (existingSlotError) {
			console.error(
				'Error fetching existing group time slot:',
				existingSlotError.message
			)
			return { success: false, error: existingSlotError.message }
		}

		if (!existingSlot) {
			return { success: false, error: 'Group Time Slot not found.' }
		}

		// Refund credits to each user in the user_id array
		for (const userId of existingSlot.user_id) {
			await updateUserCreditsCancellation(userId, credits)
		}

		// Update the group time slot to clear users and reset count
		const { data, error } = await supabase
			.from('group_time_slots')
			.update({
				user_id: [],
				count: 0,
				booked: false
			})
			.eq('id', timeSlotId)

		if (error) {
			console.error('Error updating group time slot:', error.message)
			return { success: false, error: error.message }
		}

		return { success: true, data }
	}

	return (
		<section>
			<div className='mb-4'>
				<h1 className='text-2xl text-center font-bold mb-4'>Time Slots</h1>
				<div className='flex justify-between items-center'>
					<div className='flex items-center'>
						<button
							className={`px-4 py-2 mr-2 rounded ${
								isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={() => setIsPrivateTraining(true)}>
							Private Sessions
						</button>
						<button
							className={`px-4 py-2 rounded ${
								!isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={() => setIsPrivateTraining(false)}>
							Public Sessions
						</button>
					</div>
					<div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className='flex items-center bg-gray-100 hover:bg-gray-200 text-black font-bold py-2 px-4 rounded cursor-pointer'>
							🔍 Filters
						</button>
					</div>
					<div>
						<input
							type='text'
							placeholder='Search...'
							value={searchTerm}
							onChange={handleSearchChange}
							className='border px-2 py-1 rounded'
						/>
					</div>
					<button
						onClick={deleteSelectedReservations}
						className='bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-1 rounded'>
						Delete Selected
					</button>
				</div>
				{showFilters && (
					<div className='absolute left-0 mt-1 bg-white p-4 rounded shadow-lg z-10'>
						<input
							type='text'
							name='activity'
							placeholder='Filter by Activity...'
							value={filter.activity}
							onChange={handleFilterChange}
							className='mb-2 block w-full'
						/>
						<input
							type='text'
							name='coach'
							placeholder='Filter by Coach...'
							value={filter.coach}
							onChange={handleFilterChange}
							className='mb-2 block w-full'
						/>
						<input
							type='text'
							name='user'
							placeholder='Filter by User...'
							value={filter.user}
							onChange={handleFilterChange}
							className='mb-2 block w-full'
						/>
						<select
							onChange={handleBookedFilterChange}
							value={bookedFilter}
							className='block w-full'>
							<option value='all'>All</option>
							<option value='booked'>Booked</option>
							<option value='notBooked'>Not Booked</option>
						</select>
						<input
							type='date'
							name='date'
							placeholder='Filter by Date...'
							value={filter.date}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>
						<input
							type='time'
							name='startTime'
							placeholder='Start Time...'
							value={filter.startTime}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>
						<input
							type='time'
							name='endTime'
							placeholder='End Time...'
							value={filter.endTime}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>
						<div className='flex justify-between mt-4'>
							<button
								onClick={() => setShowFilters(false)}
								className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out'>
								Close
							</button>
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
								}}
								className='bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out'>
								Reset Filters
							</button>
						</div>
					</div>
				)}
				<div className='overflow-x-auto mt-5'>
					<table className='table-auto w-full'>
						<thead>
							<tr className='bg-gray-200 dark:bg-blue-950'>
								<th className='px-4 py-2'>Select</th>
								<th className='px-4 py-2'>Cancel</th>
								<th className='px-4 py-2'>Activity</th>
								<th className='px-4 py-2'>Coach Name</th>
								<th className='px-4 py-2'>Date</th>
								<th className='px-4 py-2'>Start Time</th>
								<th className='px-4 py-2'>End Time</th>
								<th className='px-4 py-2'>Name</th>
								<th className='px-4 py-2'>Booked</th>
								<th className='px-4 py-2'>Credits</th>
							</tr>
						</thead>

						<tbody>
							{filteredReservations.map((reservation, index) => (
								<tr className='text-center' key={index}>
									<td className='px-4 py-2'>
										<input
											type='checkbox'
											disabled={reservation.booked}
											onChange={() => handleCheckboxChange(index)}
											checked={selectedReservations.includes(index)}
										/>
									</td>
									<td className='px-4 py-3'>
										{reservation.booked ? (
											<center>
												<button
													onClick={() => cancelBooking(reservation)}
													className='bg-orange-500 hover:bg-orange-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center'>
													✖
												</button>
											</center>
										) : (
											<center>
												<div className='bg-gray-300 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center cursor-not-allowed'>
													✖
												</div>
											</center>
										)}
									</td>
									<td className='px-4 py-2'>
										{reservation.activity?.name ?? 'N/A'}
									</td>
									<td className='px-4 py-2'>
										{reservation.coach?.name ?? 'N/A'}
									</td>
									<td className='px-4 py-2'>{reservation.date}</td>
									<td className='px-4 py-2'>{reservation.start_time}</td>
									<td className='px-4 py-2'>{reservation.end_time}</td>
									<td className='px-4 py-2'>
										{reservation.user && isPrivateTraining
											? `${reservation.user.first_name} ${reservation.user.last_name}`
											: reservation.users && reservation.users.length > 0
											? reservation.users

													.map((user: any) =>
														user
															? `${user.first_name} ${user.last_name}`
															: 'N/A'
													)
													.join(', ')
											: 'N/A'}
									</td>
									<td className='px-4 py-2'>
										{reservation.booked ? 'Yes' : 'No'}
									</td>
									<td className='px-4 py-2'>
										{reservation.activity?.credits ?? 'N/A'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}
