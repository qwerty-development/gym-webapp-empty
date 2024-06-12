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

type Activity = {
	name: string
	credits: number // Assuming credits is a number
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
	const [reservations, setReservations] = useState<Reservation[]>([])
	const [filteredReservations, setFilteredReservations] = useState<
		Reservation[]
	>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filter, setFilter] = useState({
		activity: '',
		coach: '',
		user: '',
		date: '',
		startTime: '',
		endTime: ''
	})
	const [bookedFilter, setBookedFilter] = useState('all') // 'all', 'booked', 'notBooked'
	const [showFilters, setShowFilters] = useState(false)
	const [selectedReservations, setSelectedReservations] = useState<number[]>([])

	const fetchData = async () => {
		const data = await fetchTimeSlots()
		if (Array.isArray(data)) {
			setReservations(data)
			setFilteredReservations(data) // Initialize filtered data
		}
	}
	useEffect(() => {
		fetchData()
	}, [])

	useEffect(() => {
		const filteredData = applyFilters(reservations)
		setFilteredReservations(filteredData)
	}, [searchTerm, filter, reservations, bookedFilter]) // Include bookedFilter in dependencies

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
			// Updated booked filter logic
			const bookedMatch =
				bookedFilter === 'all'
					? true
					: bookedFilter === 'booked'
					? reservation.booked === true
					: reservation.booked === false
			const dateMatch = filter.date ? reservation.date === filter.date : true

			// Assuming reservation.start_time and reservation.end_time are in 'HH:MM' format
			// and filter.startTime and filter.endTime are also provided in 'HH:MM' format.
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
		if (window.confirm('Are you sure you want to delete these sessions}?')) {
			for (const index of selectedReservations) {
				const reservation = reservations[index]
				if (!reservation.booked) {
					const success = await deleteTimeSlot(reservation.id)
					if (success) {
						console.log(`Deleted reservation with ID: ${reservation.id}`)
					} else {
						console.error(
							`Failed to delete reservation with ID: ${reservation.id}`
						)
					}
				}
			}
			// Fetch the latest reservations data after deletion
			fetchData()
		}
	}

	const cancelBooking = async (reservation: {
		id?: number
		activity: any
		coach?: Coach
		date?: string
		start_time?: string
		end_time?: string
		user: any
		booked?: boolean
	}) => {
		if (
			window.confirm(
				`Are you sure you want to cancel the booking for ${reservation.activity?.name}?`
			)
		) {
			const updatedSlot = {
				...reservation,
				user_id: null, // Removing the user ID
				booked: false // Setting booked to false
			}

			const { success, error } = await updateTimeSlot(updatedSlot)
			if (success) {
				console.log('Booking cancelled successfully.')
				updateUserCreditsCancellation(
					reservation.user?.user_id,
					reservation.activity?.credits
				)
				fetchData() // Refresh data
			} else {
				console.error('Failed to cancel booking:', error)
			}
		}
	}

	return (
		<section>
			<div className='mb-4'>
				<h1 className='text-2xl text-center font-bold mb-4'>Time Slots</h1>
				<div className='flex justify-between items-center'>
					{/* Filter Toggle */}
					<div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className='flex items-center bg-gray-100 hover:bg-gray-200 text-black font-bold py-2 px-4 rounded cursor-pointer'>
							🔍 Filters
						</button>
					</div>

					{/* Search Bar */}
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

				{/* Filters Sidebar */}
				{showFilters && (
					<div className='absolute left-0 mt-1 bg-white p-4 rounded shadow-lg z-10'>
						{/* Existing filters */}
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
						{/* New Date Filter */}
						<input
							type='date'
							name='date'
							placeholder='Filter by Date...'
							value={filter.date}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>
						{/* Start Time Filter */}
						<input
							type='time'
							name='startTime'
							placeholder='Start Time...'
							value={filter.startTime}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>
						{/* End Time Filter */}
						<input
							type='time'
							name='endTime'
							placeholder='End Time...'
							value={filter.endTime}
							onChange={handleFilterChange}
							className='mb-3 border block w-full'
						/>

						<div className='flex justify-between mt-4'>
							{/* Close Button */}
							<button
								onClick={() => setShowFilters(false)}
								className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out'>
								Close
							</button>

							{/* Reset Filters Button */}
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
								<th className='px-4 py-2'>Cancel</th>{' '}
								{/* Renamed for clarity */}
								<th className='px-4 py-2'>Activity</th>
								<th className='px-4 py-2'>Coach Name</th>
								<th className='px-4 py-2'>Date</th>
								<th className='px-4 py-2'>Start Time</th>
								<th className='px-4 py-2'>End Time</th>
								<th className='px-4 py-2'>User First Name</th>
								<th className='px-4 py-2'>User Last Name</th>
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
									<td className='px-4 py-3 '>
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
										{reservation.user?.first_name ?? 'N/A'}
									</td>
									<td className='px-4 py-2'>
										{reservation.user?.last_name ?? 'N/A'}
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
function setFilteredReservations(filteredData: Reservation[]) {}
