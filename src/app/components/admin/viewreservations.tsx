'use client'

import React, { useState, useEffect } from 'react'
import {
	fetchTimeSlots,
	deleteTimeSlot,
	updateTimeSlot,
	updateUserCreditsCancellation,
	deleteGroupTimeSlot,
	fetchGroupTimeSlots,
	cancelGroupBooking
} from '../../../../utils/admin-requests'
import { supabaseClient } from '../../../../utils/supabaseClient'

type Activity = {
	name: string
	credits: number
	capacity: number | null
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
	const [privateSession, setPrivateSession] = useState<any[]>([])
	const [publicSession, setPublicSession] = useState<any[]>([])

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		const privateSession = await fetchTimeSlots()
		setPrivateSession(privateSession)

		const publicSession = await fetchGroupTimeSlots()
		setPublicSession(publicSession)

		// Set the initial data based on the isPrivateTraining state
		const initialData = isPrivateTraining ? privateSession : publicSession
		if (Array.isArray(initialData)) {
			setReservations(initialData)
			setFilteredReservations(initialData)
		}
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
			.select('user_id, count, booked, additions')
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
			.select('wallet, isFree')
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

		fetchData()
	}

	useEffect(() => {
		const data = isPrivateTraining ? privateSession : publicSession
		setReservations(data)
		setFilteredReservations(data)
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
			setSelectedReservations([])
		}
	}

	const cancelBooking = async (reservation: Reservation) => {
		if (
			window.confirm(
				`Are you sure you want to cancel the booking for ${reservation.activity?.name}?`
			)
		) {
			if (isPrivateTraining) {
				const supabase = await supabaseClient()
				const { data: reservationData, error: reservationError } =
					await supabase
						.from('time_slots')
						.select('additions')
						.eq('id', reservation.id)
						.single()

				if (reservationError || !reservationData) {
					console.error(
						'Error fetching reservation details:',
						reservationError?.message || 'Reservation not found'
					)
					return
				}

				// Fetch additions prices from the market table
				const { data: additionsData, error: additionsError } = await supabase
					.from('market')
					.select('name, price')
					.in('name', reservationData.additions || [])

				if (additionsError) {
					console.error(
						'Error fetching additions data:',
						additionsError.message
					)
					return
				}

				const additionsTotalPrice = additionsData.reduce(
					(total, item) => total + item.price,
					0
				)

				// Fetch user data
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('isFree')
					.eq('user_id', reservation.user?.user_id)
					.single()

				if (userError || !userData) {
					console.error(
						`Error fetching user data for user ${reservation.user?.user_id}:`,
						userError?.message || 'User not found'
					)
					return
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
				if (success) {
					console.log('Booking cancelled successfully.')
					updateUserCreditsCancellation(reservation.user?.user_id, totalRefund)
					fetchData()
				} else {
					console.error('Failed to cancel booking:', error)
				}
			} else {
				const { success, error } = await cancelGroupBooking(reservation.id)
				if (success) {
					console.log('Group booking cancelled successfully.')
					fetchData()
				} else {
					console.error('Failed to cancel group booking:', error)
				}
			}
		}
	}

	return (
		<section>
			<div className='mb-4'>
				<h1 className='text-2xl text-center font-bold mb-4'>Time Slots</h1>
				<div className='mt-12'>
					<center>
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
					</center>
				</div>
				<div className='lg:mx-80 mx-24 flex'>
					<input
						type='text'
						placeholder='Search...'
						value={searchTerm}
						onChange={handleSearchChange}
						className='border mt-12 mb-6 px-2 mr-12 py-3 rounded w-full'
					/>
					<button
						onClick={() => setShowFilters(!showFilters)}
						className='flex items-center bg-gray-100 hover:bg-gray-200 mt-12 text-black font-bold py-2 px-4 h-12 rounded-full cursor-pointer'>
						🔍
					</button>
				</div>
				<div className='flex mx-12 gap-x-12 justify-center'>
					<button
						onClick={deleteSelectedReservations}
						className='bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-1 rounded'>
						Delete Selected
					</button>
				</div>
				{showFilters && (
					<div className='absolute right-3 top-14  p-2 mt-4 bg-white  rounded shadow-lg z-10'>
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
								Reset
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
								{!isPrivateTraining && <th className='px-4 py-2'>Capacity</th>}
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
											? reservation.users.map((user: any, userIndex: any) => (
													<div
														key={userIndex}
														className='flex items-center border rounded-2xl p-2 justify-between'>
														{user
															? `${user.first_name} ${user.last_name}`
															: 'N/A'}
														<button
															onClick={() =>
																removeUserFromGroup(
																	reservation.id,
																	user.user_id,
																	reservation.activity?.credits
																)
															}
															className='ml-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center'>
															✖
														</button>
													</div>
											  ))
											: 'N/A'}
									</td>
									<td className='px-4 py-2'>
										{reservation.booked ? 'Yes' : 'No'}
									</td>
									<td className='px-4 py-2'>
										{reservation.activity?.credits ?? 'N/A'}
									</td>

									{!isPrivateTraining && (
										<td className='px-4 py-2'>
											{reservation.activity?.capacity ?? 'N/A'}
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)
}
