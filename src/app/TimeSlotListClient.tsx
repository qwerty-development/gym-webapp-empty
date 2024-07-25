// pages/admin/view-reservations.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaTrash } from 'react-icons/fa'
import { RotateLoader } from 'react-spinners'
import FilterComponent from './components/admin/FilterComponent'
import TableComponent from './components/admin/TableComponent'
import {
	deleteTimeSlot,
	updateTimeSlot,
	updateUserCreditsCancellation,
	deleteGroupTimeSlot,
	cancelGroupBooking
} from '../../utils/adminRequests'
import { supabaseClient } from '../../utils/supabaseClient'

export default function TimeSlotListClient({
	initialTimeSlots,
	isPrivateTraining: initialIsPrivateTraining,
	currentPage,
	totalPages
}: {
	initialTimeSlots: any[]
	isPrivateTraining: boolean
	currentPage: number
	totalPages: number
}) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isPrivateTraining, setIsPrivateTraining] = useState(
		initialIsPrivateTraining
	)
	const [isLoading, setIsLoading] = useState(false)
	const [timeSlots, setTimeSlots] = useState(initialTimeSlots)
	const [selectedSlots, setSelectedSlots] = useState<number[]>([])
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

	useEffect(() => {
		setTimeSlots(initialTimeSlots)
	}, [initialTimeSlots])

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			applyFilters(newPage)
		}
	}

	const applyFilters = (page: number = 1) => {
		setIsLoading(true)
		const params = new URLSearchParams()
		if (filter.activity) params.set('activity', filter.activity)
		if (bookedFilter !== 'all')
			params.set('booked', bookedFilter === 'booked' ? 'true' : 'false')
		if (filter.coach) params.set('coach', filter.coach)
		if (filter.user) params.set('user', filter.user)
		if (filter.date) params.set('date', filter.date)
		if (filter.startTime) params.set('startTime', filter.startTime)
		if (filter.endTime) params.set('endTime', filter.endTime)
		params.set('isPrivateTraining', isPrivateTraining.toString())
		params.set('page', page.toString())
		router.push(`/admin/view-reservations?${params.toString()}`)
	}

	useEffect(() => {
		applyFilters(currentPage)
	}, [filter, bookedFilter, isPrivateTraining])

	useEffect(() => {
		setIsLoading(false)
	}, [timeSlots])

	const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFilter(prev => ({ ...prev, [name]: value }))
	}

	const handleBookedFilterChange = (
		event: React.ChangeEvent<HTMLSelectElement>
	) => {
		setBookedFilter(event.target.value)
	}

	const handleCheckboxChange = (index: number) => {
		const currentIndex = selectedSlots.indexOf(index)
		const newCheckedState = [...selectedSlots]

		if (currentIndex === -1) {
			newCheckedState.push(index)
		} else {
			newCheckedState.splice(currentIndex, 1)
		}

		setSelectedSlots(newCheckedState)
	}

	const deleteSelectedReservations = async () => {
		if (window.confirm('Are you sure you want to delete these sessions?')) {
			for (const index of selectedSlots) {
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
							.select(
								'additions, coach_id, date, start_time, end_time, booked_with_token, activity_id'
							)
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
						(total, item) => total + item.price,
						0
					)

					// Fetch user data
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select(
							'isFree, first_name, last_name, email, wallet, private_token'
						)
						.eq('user_id', reservation.user?.user_id)
						.single()

					if (userError || !userData) {
						throw new Error(
							`Error fetching user data: ${
								userError?.message || 'User not found'
							}`
						)
					}

					// Fetch activity data
					const { data: activityData, error: activityError } = await supabase
						.from('activities')
						.select('credits')
						.eq('id', reservationData.activity_id)
						.single()

					if (activityError || !activityData) {
						throw new Error(
							`Error fetching activity data: ${
								activityError?.message || 'Activity not found'
							}`
						)
					}

					let totalCreditRefund = additionsTotalPrice
					let tokenRefund = 0

					if (reservationData.booked_with_token) {
						tokenRefund = 1
					} else if (!userData.isFree) {
						totalCreditRefund += activityData.credits
					}

					const updatedSlot = {
						id: reservation.id,
						start_time: reservationData.start_time,
						end_time: reservationData.end_time,
						date: reservationData.date,
						activity_id: reservationData.activity_id,
						coach_id: reservationData.coach_id,
						user_id: null,
						booked: false,
						additions: [],
						booked_with_token: false
					}

					// Update the time slot
					const { error: updateError } = await supabase
						.from('time_slots')
						.update(updatedSlot)
						.eq('id', reservation.id)

					if (updateError) {
						throw new Error(`Failed to cancel booking: ${updateError.message}`)
					}

					// Update user's wallet and tokens
					const newWalletBalance = userData.wallet + totalCreditRefund
					const newTokenBalance = userData.private_token + tokenRefund

					const { error: userUpdateError } = await supabase
						.from('users')
						.update({
							wallet: newWalletBalance,
							private_token: newTokenBalance
						})
						.eq('user_id', reservation.user?.user_id)

					if (userUpdateError) {
						throw new Error(
							`Error updating user data: ${userUpdateError.message}`
						)
					}

					const sessionTransactionData = {
						user_id: reservation.user?.user_id,
						name: `Cancelled individual session: ${reservation.activity?.name}`,
						type: 'individual session',
						amount: reservationData.booked_with_token
							? '+1 private token'
							: userData.isFree
							? '0 credits (free session)'
							: `+${activityData.credits} credits`
					}

					const { error: sessionTransactionError } = await supabase
						.from('transactions')
						.insert(sessionTransactionData)

					if (sessionTransactionError) {
						console.error(
							'Error recording session cancellation transaction:',
							sessionTransactionError.message
						)
					}

					// Add transaction record for refunded additions (if any)
					if (additionsTotalPrice > 0) {
						const marketTransactionData = {
							user_id: reservation.user?.user_id,
							name: `Refunded market items for cancelled session: ${reservation.activity?.name}`,
							type: 'market transaction',
							amount: `+${additionsTotalPrice} credits`
						}

						const { error: marketTransactionError } = await supabase
							.from('transactions')
							.insert(marketTransactionData)

						if (marketTransactionError) {
							console.error(
								'Error recording market refund transaction:',
								marketTransactionError.message
							)
						}
					}

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
						coach_email: coachData.email,
						refund_type: reservationData.booked_with_token
							? 'token'
							: 'credits',
						refund_amount: reservationData.booked_with_token
							? tokenRefund
							: totalCreditRefund
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
					return true
				} catch (error) {
					console.error('Error cancelling booking:', error)
					return false
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
				'user_id, count, booked, additions, activity_id, coach_id, date, start_time, end_time, booked_with_token'
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
			.select(
				'wallet, isFree, first_name, last_name, email, public_token, semiPrivate_token'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			console.error(
				`Error fetching user data for user ${userId}:`,
				userError?.message || 'User not found'
			)
			return
		}

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('name, semi_private')
			.eq('id', existingSlot.activity_id)
			.single()

		if (activityError) {
			console.error('Error fetching activity data:', activityError.message)
			return
		}

		// Check if the user booked with a token
		const bookedWithToken = existingSlot.booked_with_token.includes(userId)

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
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token
		let classTransactionAmount = ''
		let additionsTransactionAmount = ''

		if (bookedWithToken) {
			if (activityData.semi_private) {
				newSemiPrivateTokenBalance += 1
				classTransactionAmount = '+1 semi-private token'
			} else {
				newPublicTokenBalance += 1
				classTransactionAmount = '+1 public token'
			}
		} else if (!userData.isFree) {
			totalRefund += credits
			classTransactionAmount = `+${credits} credits`
		} else {
			classTransactionAmount = '0 credits (free user)'
		}

		if (additionsTotalPrice > 0) {
			totalRefund += additionsTotalPrice
			additionsTransactionAmount = `+${additionsTotalPrice} credits`
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

		// Remove the user from booked_with_token array if present
		const updatedBookedWithToken = existingSlot.booked_with_token.filter(
			(id: any) => id !== userId
		)

		const { data, error } = await supabase
			.from('group_time_slots')
			.update({
				user_id: updatedUserIds,
				count: updatedCount,
				booked: false,
				additions: updatedAdditions,
				booked_with_token: updatedBookedWithToken
			})
			.eq('id', timeSlotId)

		if (error) {
			console.error('Error updating group time slot:', error.message)
			return
		}

		// Update user's wallet or token balance
		await supabase
			.from('users')
			.update({
				wallet: userData.wallet + totalRefund,
				public_token: newPublicTokenBalance,
				semiPrivate_token: newSemiPrivateTokenBalance
			})
			.eq('user_id', userId)

		const { error: classTransactionError } = await supabase
			.from('transactions')
			.insert({
				user_id: userId,
				name: `Cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'class session',
				amount: classTransactionAmount
			})

		if (classTransactionError) {
			console.error(
				'Error recording class session transaction:',
				classTransactionError.message
			)
		}

		// Add transaction record for additions refund if applicable
		if (additionsTotalPrice > 0) {
			const { error: additionsTransactionError } = await supabase
				.from('transactions')
				.insert({
					user_id: userId,
					name: `Refunded additions for cancelled class: ${activityData.name}`,
					type: 'class session',
					amount: additionsTransactionAmount
				})

			if (additionsTransactionError) {
				console.error(
					'Error recording additions refund transaction:',
					additionsTransactionError.message
				)
			}
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
			coach_email: coachData.email,
			refund_type: bookedWithToken
				? activityData.semi_private
					? 'semi-private token'
					: 'public token'
				: 'credits',
			refund_amount: bookedWithToken ? 1 : totalRefund
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

	return (
		<motion.section
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='px-4 py-6 min-h-screen w-full max-w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
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

			<FilterComponent
				filter={filter}
				bookedFilter={bookedFilter}
				handleFilterChange={handleFilterChange}
				handleBookedFilterChange={handleBookedFilterChange}
				clearFilters={() => {
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
				applyFilters={() => applyFilters(1)}
			/>

			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={deleteSelectedReservations}
				className='mb-6 px-6 py-3 bg-red-700 text-white rounded-full hover:bg-red-600'>
				<FaTrash className='inline-block mr-2' /> Delete Selected
			</motion.button>

			{isLoading ? (
				<div className='flex justify-center items-center h-64'>
					<RotateLoader color={'#4ADE80'} loading={true} size={15} />
				</div>
			) : timeSlots.length === 0 ? (
				<div className='text-center py-10'>
					<h2 className='text-2xl font-bold mb-4'>No Time Slots Found</h2>
					<p>Try adjusting your filters or search criteria.</p>
				</div>
			) : (
				<>
					<TableComponent
						timeSlots={timeSlots}
						isPrivateTraining={isPrivateTraining}
						selectedSlots={selectedSlots}
						handleCheckboxChange={handleCheckboxChange}
						cancelBooking={cancelBooking}
						removeUserFromGroup={removeUserFromGroup}
					/>
					<div className='mt-4 flex justify-center items-center space-x-2'>
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className='px-4 py-2 bg-green-600 hover:shadow-xl hover:shadow-green-700 text-white rounded-md disabled:opacity-50'>
							Previous
						</button>
						<span>{`Page ${currentPage} of ${totalPages}`}</span>
						<button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className='px-4 py-2 bg-green-600 hover:shadow-xl hover:shadow-green-700 text-white rounded-md disabled:opacity-50'>
							Next
						</button>
					</div>
				</>
			)}
		</motion.section>
	)
}
