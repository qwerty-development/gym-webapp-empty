import { supabaseClient } from './supabaseClient'

// Function to fetch wallet balance for a user from Supabase
export const getWalletBalance = async ({ userId }) => {
	const supabase = await supabaseClient()
	const { data: userData, error } = await supabase
		.from('users')
		.select('wallet') // Selecting only the wallet column
		.eq('user_id', userId)
		.single() // Assuming each user has a unique user_id

	if (error) {
		console.error('Error fetching wallet balance:', error.message)
		return null
	}

	return userData ? userData.wallet : null
}

export const checkUserExists = async userId => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error checking user existence:', error.message)
		return null
	}

	return data
}

// Function to create or update user record in Supabase
export const updateUserRecord = async ({
	userId,
	email,
	firstName,
	lastName,
	userName
}) => {
	const supabase = await supabaseClient()
	const existingUser = await checkUserExists(userId)

	if (existingUser) {
		const { data, error } = await supabase
			.from('users')
			.update({
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			})
			.eq('user_id', userId)

		if (error) {
			console.error('Error updating user record:', error.message)
			return null
		}

		return data
	} else {
		const { data, error } = await supabase.from('users').insert([
			{
				user_id: userId,
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			}
		])

		if (error) {
			console.error('Error creating user record:', error.message)
			return null
		}

		return data
	}
}

export const fetchReservations = async userId => {
	const supabase = supabaseClient() // Ensure you're correctly initializing this with any necessary tokens
	const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

	const { data, error } = await supabase
		.from('time_slots')
		.select(
			` *,
            id,
            user_id,
            start_time,
            end_time,
            date,
            additions,
            activity:activities (
                id,
                name,
                coach_id,
                credits
            ),
            coach:coaches (
                id,
                name,
                email
            )
        `
		)
		.eq('user_id', userId)
		.gte('date', today) // Use greater than or equal to filter for date

	if (error) {
		console.error('Error fetching reservations:', error.message)
		return null
	}

	return data.map(reservation => {
		return reservation
	})
}

export const fetchReservationsGroup = async userId => {
	const supabase = supabaseClient() // Ensure you're correctly initializing this with any necessary tokens
	const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

	const { data, error } = await supabase
		.from('group_time_slots')
		.select(
			` *,
            id,
            user_id,
            start_time,
            end_time,
            date,
            count,
            additions,
            activity:activities (
                id,
                name,
                coach_id,
                credits
            ),
            coach:coaches (
                id,
                name,
                email
            )
        `
		)
		.contains('user_id', [userId])
		.gte('date', today) // Use greater than or equal to filter for date

	if (error) {
		console.error('Error fetching reservations:', error.message)
		return null
	}

	return data.map(reservation => reservation)
}

// utils/requests.js

// Function to cancel a reservation
// Function to cancel a reservation
// Function to cancel a reservation
export const cancelReservation = async (
	reservationId,
	userId,
	setReservations
) => {
	const supabase = await supabaseClient()

	try {
		// Fetch the reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('time_slots')
			.select(
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions, booked_with_token'
			)
			.eq('id', reservationId)
			.single()

		if (reservationError || !reservationData) {
			throw new Error(
				`Error fetching reservation: ${
					reservationError?.message || 'Reservation not found'
				}`
			)
		}

		if (!reservationData.booked || reservationData.user_id !== userId) {
			throw new Error('Unauthorized to cancel this reservation.')
		}

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('wallet, first_name, last_name, email, isFree, private_token')
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		// Initialize refund variables
		let totalCreditRefund = 0
		let tokenRefund = 0

		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits, name')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity credits: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Determine refund type based on how the session was booked
		if (reservationData.booked_with_token) {
			tokenRefund = 1
		} else if (!userData.isFree) {
			totalCreditRefund += activityData.credits
		}

		// Fetch the additions and calculate their total price
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
		totalCreditRefund += additionsTotalPrice

		// Update the time slot to cancel the reservation
		const { error: updateError } = await supabase
			.from('time_slots')
			.update({
				user_id: null,
				booked: false,
				additions: [],
				booked_with_token: false
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		// Update the user's wallet and/or tokens
		const newWalletBalance = userData.wallet + totalCreditRefund
		const newTokenBalance = userData.private_token + tokenRefund

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newTokenBalance
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		// Fetch coach data
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('*')
			.eq('id', reservationData.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		// Prepare email data
		const emailData = {
			user_name: userData.first_name + ' ' + userData.last_name,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_type: reservationData.booked_with_token ? 'token' : 'credits',
			refund_amount: reservationData.booked_with_token ? 1 : totalCreditRefund
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

		// Update reservations state
		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)
		return true
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return false
	}
}

export const cancelReservationGroup = async (
	reservationId,
	userId,
	setReservations
) => {
	const supabase = await supabaseClient()

	try {
		// Fetch the reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('group_time_slots')
			.select(
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions, booked_with_token'
			)
			.eq('id', reservationId)
			.single()

		if (reservationError || !reservationData) {
			throw new Error(
				`Error fetching reservation: ${
					reservationError?.message || 'Reservation not found'
				}`
			)
		}

		if (!reservationData.user_id.includes(userId)) {
			throw new Error('Unauthorized to cancel this reservation.')
		}

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'wallet, first_name, last_name, email, isFree, public_token, semiPrivate_token'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits, name, semi_private')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity data: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Check if the user booked with a token
		const bookedWithToken = reservationData.booked_with_token.includes(userId)

		// Initialize total refund amount and new token balances
		let totalRefund = 0
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token

		// Determine refund type
		let refundType = 'credits'
		if (bookedWithToken) {
			if (activityData.semi_private) {
				refundType = 'semiPrivateToken'
				newSemiPrivateTokenBalance += 1
			} else {
				refundType = 'publicToken'
				newPublicTokenBalance += 1
			}
		} else if (!userData.isFree) {
			totalRefund += activityData.credits
		}

		// Calculate total additions refund
		const userAdditions = reservationData.additions.filter(
			addition => addition.user_id === userId
		)
		const additionsTotalPrice = userAdditions.reduce(
			(total, addition) =>
				total +
				addition.items.reduce((itemTotal, item) => itemTotal + item.price, 0),
			0
		)
		totalRefund += additionsTotalPrice

		// Remove user's additions from the additions array
		const updatedAdditions = reservationData.additions.filter(
			addition => addition.user_id !== userId
		)

		// Remove user from the user_id array
		const updatedUserIds = reservationData.user_id.filter(id => id !== userId)
		const newCount = updatedUserIds.length
		const isBooked = newCount >= activityData.capacity

		// Remove user from the booked_with_token array
		const updatedBookedWithToken = reservationData.booked_with_token.filter(
			id => id !== userId
		)

		const { error: updateError } = await supabase
			.from('group_time_slots')
			.update({
				user_id: updatedUserIds,
				count: newCount,
				booked: isBooked,
				additions: updatedAdditions,
				booked_with_token: updatedBookedWithToken
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		const newWalletBalance = userData.wallet + totalRefund

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				public_token: newPublicTokenBalance,
				semiPrivate_token: newSemiPrivateTokenBalance
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('*')
			.eq('id', reservationData.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		const emailData = {
			user_name: userData.first_name + ' ' + userData.last_name,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_type: refundType,
			refund_amount: refundType === 'credits' ? totalRefund : 1
		}

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
		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)
		return true
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return false
	}
}

/**
 * Function to fetch unbooked time slots from Supabase with optional filters.
 * @param {Object} params - The filter parameters.
 * @param {number} [params.activityId] - Optional activity ID to filter by.
 * @param {number} [params.coachId] - Optional coach ID to filter by.
 * @param {string} [params.date] - Optional date to filter by.
 * @param {string} [params.startTime] - Optional start time to filter by.
 * @param {string} [params.endTime] - Optional end time to filter by.
 * @returns The filtered, unbooked time slots.
 */
export const fetchFilteredUnbookedTimeSlots = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime
}) => {
	const supabase = await supabaseClient()
	let query = supabase
		.from('time_slots')
		.select(
			`
            id,
            start_time,
            end_time,
            date,
            coach_id,
            activity_id,
            booked,
            user_id
        `
		)
		.is('user_id', null) // Adjust based on your logic for determining unbooked slots

	// Apply filters based on provided arguments
	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)
	if (startTime && endTime) {
		// Ensures both startTime and endTime are provided for a valid time slot filter
		query = query.gte('start_time', startTime).lte('end_time', endTime)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching filtered unbooked time slots:', error.message)
		return null
	}

	return data
}

export const fetchFilteredUnbookedTimeSlotsGroup = async ({
	activityId,
	coachId,
	date
}) => {
	const supabase = await supabaseClient()
	let query = supabase
		.from('group_time_slots')
		.select(
			`
            id,
            start_time,
            end_time,
            date,
            coach_id,
            activity_id,
            booked,
            user_id,
			count
        `
		)
		.is('booked', false) // Adjust based on your logic for determining unbooked slots

	// Apply filters based on provided arguments
	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)
	// if (startTime && endTime) {
	// 	// Ensures both startTime and endTime are provided for a valid time slot filter
	// 	query = query.gte('start_time', startTime).lte('end_time', endTime)
	// }

	const { data, error } = await query

	if (error) {
		console.error('Error fetching filtered unbooked time slots:', error.message)
		return null
	}

	return data
}

// Ensure this function is fetching the 'credits' for each activity.
export const fetchAllActivities = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('id, name, credits') // Ensure 'credits' is included
		.eq('group', false)

	if (error) {
		console.error('Error fetching activities:', error.message)
		return []
	}

	return data
}

export const fetchAllActivitiesGroup = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('id, name, credits, capacity') // Ensure 'credits' is included
		.eq('group', true)

	if (error) {
		console.error('Error fetching activities:', error.message)
		return []
	}

	return data
}

// In your requests.js, ensure fetchAllCoaches function correctly filters by activityId
// utils/requests.js
export const fetchCoaches = async activityId => {
	const supabase = await supabaseClient()
	// Fetch unique coach IDs associated with the activityId from the time_slots table
	const { data: timeSlotsData, error: timeSlotsError } = await supabase
		.from('time_slots')
		.select('coach_id')
		.eq('activity_id', activityId)
		.is('booked', false) // Assuming you want to fetch coaches for unbooked time slots

	if (timeSlotsError || !timeSlotsData) {
		console.error(
			'Error fetching coach IDs from time slots:',
			timeSlotsError?.message
		)
		return []
	}

	// Extract unique coach IDs
	const coachIds = timeSlotsData.map(slot => slot.coach_id)

	// Fetch coaches based on extracted coach IDs
	const { data: coachesData, error: coachesError } = await supabase
		.from('coaches')
		.select('id, name, profile_picture,email')
		.in('id', coachIds) // Filter coaches by extracted IDs

	if (coachesError) {
		console.error('Error fetching coaches:', coachesError.message)
		return []
	}

	return coachesData
}

export const fetchCoachesGroup = async activityId => {
	const supabase = await supabaseClient()
	// Fetch unique coach IDs associated with the activityId from the time_slots table
	const { data: timeSlotsData, error: timeSlotsError } = await supabase
		.from('group_time_slots')
		.select('coach_id')
		.eq('activity_id', activityId)
		.is('booked', false) // Assuming you want to fetch coaches for unbooked time slots

	if (timeSlotsError || !timeSlotsData) {
		console.error(
			'Error fetching coach IDs from time slots:',
			timeSlotsError?.message
		)
		return []
	}

	// Extract unique coach IDs
	const coachIds = timeSlotsData.map(slot => slot.coach_id)

	// Fetch coaches based on extracted coach IDs
	const { data: coachesData, error: coachesError } = await supabase
		.from('coaches')
		.select('id, name, profile_picture,email')
		.in('id', coachIds) // Filter coaches by extracted IDs

	if (coachesError) {
		console.error('Error fetching coaches:', coachesError.message)
		return []
	}

	return coachesData
}

// Function to book a time slot in Supabase
export const bookTimeSlot = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Check if the time slot is already booked
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('time_slots')
		.select('booked')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime,
			end_time: endTime
		})
		.single()

	if (existingSlotError) {
		console.error(
			'Error checking time slot availability:',
			existingSlotError.message
		)
		return { error: existingSlotError.message }
	}

	if (existingSlot && existingSlot.booked) {
		return { error: 'Time slot is already booked.' }
	}

	// Fetch user data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Fetch activity data
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity data:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	let bookingMethod = 'credits'
	let newWalletBalance = userData.wallet
	let newTokenBalance = userData.private_token

	if (userData.private_token > 0) {
		bookingMethod = 'token'
		newTokenBalance -= 1
	} else if (userData.isFree || userData.wallet >= activityData.credits) {
		if (!userData.isFree) {
			newWalletBalance -= activityData.credits
		}
	} else {
		return { error: 'Not enough credits or tokens to book the session.' }
	}

	// Proceed with booking the time slot
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('time_slots')
		.update({
			user_id: userId,
			booked: true,
			booked_with_token: bookingMethod === 'token'
		})
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime,
			end_time: endTime
		})

	if (timeSlotError) {
		console.error('Error booking time slot:', timeSlotError.message)
		return { error: timeSlotError.message }
	}

	// Update user's account (wallet or tokens)
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			private_token: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('*')
		.eq('id', coachId)
		.single()

	if (coachError || !coachData) {
		console.error('Error fetching coach data:', coachError?.message)
		return { error: coachError?.message || 'Coach not found.' }
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		activity_name: activityData.name,
		activity_price:
			bookingMethod === 'token'
				? '1 token'
				: userData.isFree
				? 0
				: activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		coach_email: coachData.email,
		user_wallet: newWalletBalance,
		user_tokens: newTokenBalance,
		booking_method: bookingMethod
	}

	// Send email notification to admin
	try {
		const responseAdmin = await fetch('/api/send-admin-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultAdmin = await responseAdmin.json()
		if (responseAdmin.ok) {
			console.log('Admin email sent successfully')
		} else {
			console.error(`Failed to send admin email: ${resultAdmin.error}`)
		}
	} catch (error) {
		console.error('Error sending admin email:', error)
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-user-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultUser = await responseUser.json()
		if (responseUser.ok) {
			console.log('User email sent successfully')
		} else {
			console.error(`Failed to send user email: ${resultUser.error}`)
		}
	} catch (error) {
		console.error('Error sending user email:', error)
	}

	return {
		data: timeSlotData,
		message: `Session booked successfully using ${bookingMethod}.`
	}
}

export const bookTimeSlotGroup = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Check if the time slot is already booked
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select('id, booked, user_id, count, booked_with_token')
		.eq('activity_id', activityId)
		.eq('coach_id', coachId)
		.eq('date', date)
		.eq('start_time', startTime)
		.eq('end_time', endTime)
		.single()

	if (existingSlotError && existingSlotError.code !== 'PGRST116') {
		console.error(
			'Error checking group time slot availability:',
			existingSlotError.message
		)
		return { error: existingSlotError.message }
	}

	if (existingSlot && existingSlot.booked) {
		return { error: 'Time slot is already fully booked.' }
	}

	if (
		existingSlot &&
		existingSlot.user_id &&
		existingSlot.user_id.includes(userId)
	) {
		return { error: 'You are already enrolled in this class.' }
	}

	// Fetch user data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Fetch activity details including capacity, credits required, and semi-private status
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity details:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	let bookingMethod = 'credits'
	let newWalletBalance = userData.wallet
	let newPublicTokenBalance = userData.public_token
	let newSemiPrivateTokenBalance = userData.semiPrivate_token

	if (activityData.semi_private && userData.semiPrivate_token > 0) {
		bookingMethod = 'semiPrivateToken'
		newSemiPrivateTokenBalance -= 1
	} else if (!activityData.semi_private && userData.public_token > 0) {
		bookingMethod = 'publicToken'
		newPublicTokenBalance -= 1
	} else if (userData.isFree || userData.wallet >= activityData.credits) {
		if (!userData.isFree) {
			newWalletBalance -= activityData.credits
		}
	} else {
		return { error: 'Not enough credits or tokens to book the session.' }
	}

	let newCount = 1
	let user_id = [userId]
	let isBooked = false
	let slotId
	let booked_with_token = []

	if (existingSlot) {
		newCount = existingSlot.count + 1
		user_id = existingSlot.user_id
			? [...existingSlot.user_id, userId]
			: [userId]
		isBooked = newCount === activityData.capacity
		slotId = existingSlot.id
		booked_with_token = existingSlot.booked_with_token || []
	}

	if (bookingMethod === 'publicToken' || bookingMethod === 'semiPrivateToken') {
		booked_with_token.push(userId)
	}

	const upsertData = {
		activity_id: activityId,
		coach_id: coachId,
		date: date,
		start_time: startTime,
		end_time: endTime,
		user_id,
		count: newCount,
		booked: isBooked,
		booked_with_token
	}

	let timeSlotData, timeSlotError

	if (slotId) {
		// Update existing slot
		;({ data: timeSlotData, error: timeSlotError } = await supabase
			.from('group_time_slots')
			.update(upsertData)
			.eq('id', slotId))
	} else {
		// Insert new slot
		;({ data: timeSlotData, error: timeSlotError } = await supabase
			.from('group_time_slots')
			.insert(upsertData)
			.single())

		// Ensure no duplicates by deleting any older entries
		await supabase
			.from('group_time_slots')
			.delete()
			.eq('activity_id', activityId)
			.eq('coach_id', coachId)
			.eq('date', date)
			.eq('start_time', startTime)
			.eq('end_time', endTime)
			.neq('id', timeSlotData.id)
	}

	if (timeSlotError) {
		console.error('Error booking group time slot:', timeSlotError.message)
		return { error: timeSlotError.message }
	}

	// Update user's account (wallet or tokens)
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			public_token: newPublicTokenBalance,
			semiPrivate_token: newSemiPrivateTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('*')
		.eq('id', coachId)
		.single()

	if (coachError || !coachData) {
		console.error('Error fetching coach data:', coachError?.message)
		return { error: coachError?.message || 'Coach not found.' }
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		activity_name: activityData.name,
		activity_price:
			bookingMethod === 'semiPrivateToken'
				? '1 semi-private token'
				: bookingMethod === 'publicToken'
				? '1 public token'
				: activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		coach_email: coachData.email,
		user_wallet: newWalletBalance,
		user_public_tokens: newPublicTokenBalance,
		user_semi_private_tokens: newSemiPrivateTokenBalance,
		booking_method: bookingMethod,
		is_semi_private: activityData.semi_private
	}

	// Send email notifications (admin and user)
	// ... (keep the existing email sending logic)

	return {
		data: timeSlotData,
		message: `Group session booked successfully using ${
			bookingMethod === 'semiPrivateToken'
				? 'semi-private token'
				: bookingMethod === 'publicToken'
				? 'public token'
				: 'credits'
		}.`
	}
}

export const fetchMarket = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('market').select('*')
	if (error) {
		console.error('Error fetching market:', error.message)
		return []
	}
	return data
}

export const payForItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's current credits
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user credits:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price of selected items
	const totalPrice = selectedItems.reduce(
		(total, item) => total + item.price,
		0
	)

	if (totalPrice === 0) {
		return { error: 'No items selected.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < totalPrice) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Fetch the time slot ID based on activity, coach, date, and start time
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		console.error('Error fetching time slot data:', timeSlotError?.message)
		return { error: timeSlotError?.message || 'Time slot not found.' }
	}

	// Deduct credits from user's account
	const newWalletBalance = userData.wallet - totalPrice
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: newWalletBalance })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user credits:', updateError.message)
		return { error: updateError.message }
	}

	// Add the selected item names to the additions array in the time slot
	const newAdditions = [
		...(timeSlotData.additions || []),
		...selectedItems.map(item => item.name)
	]
	const { error: additionsError } = await supabase
		.from('time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		console.error('Error updating time slot additions:', additionsError.message)
		return { error: additionsError.message }
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message: 'Items added to time slot and credits deducted.'
	}
}

const classestiers = [
	{
		name: '"I train from time to time"',
		id: 'tier-freelancer',
		href: '#',
		priceMonthly: '25 credits',
		description: '1 class',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		],
		mostPopular: false
	},
	{
		name: '"I train everyday"',
		id: 'tier-startup',
		href: '#',
		priceMonthly: '100 credits',
		description: '5 classes',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		],
		mostPopular: true
	},
	{
		name: 'Eat, sleep, gym, repeat',
		id: 'tier-enterprise',
		href: '#',
		priceMonthly: '150 credits',
		description: '10 classes',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations'
		],
		mostPopular: false
	}
]

const individualtiers = [
	{
		name: 'Workout of the day',
		id: 'tier-basic',
		href: '#',
		price: { monthly: '200', annually: '$12' },
		description: '10 classes',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		]
	},
	{
		name: 'Private training',
		id: 'tier-essential',
		href: '#',
		price: { monthly: '350', annually: '$24' },
		description: '10 classes',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		]
	},
	{
		name: 'Semi-Private',
		id: 'tier-growth',
		href: '#',
		price: { monthly: '300', annually: '$48' },
		description: '10 classes',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations',
			'Custom reporting tools'
		]
	}
]
export const purchaseBundle = async ({ userId, bundleType, bundleName }) => {
	const supabase = await supabaseClient()

	// Fetch user's current data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Determine the bundle details
	let bundlePrice, tokenType, tokenAmount
	if (bundleType === 'classes') {
		const bundle = classestiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for classes.' }
		}
		bundlePrice = parseInt(bundle.priceMonthly)
		tokenType = 'public_token'
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
	} else if (bundleType === 'individual') {
		const bundle = individualtiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for individual training.' }
		}
		bundlePrice = parseInt(bundle.price.monthly)
		switch (bundleName) {
			case 'Workout of the day':
				tokenType = 'workoutDay_token'
				break
			case 'Private training':
				tokenType = 'private_token'
				break
			case 'Semi-Private':
				tokenType = 'semiPrivate_token'
				break
			default:
				return { error: 'Invalid individual bundle type.' }
		}
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
	} else {
		return { error: 'Invalid bundle type.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the bundle.' }
	}

	// Deduct credits and add tokens
	const newWalletBalance = userData.wallet - bundlePrice
	const newTokenBalance = userData[tokenType] + tokenAmount

	// Update user data
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			[tokenType]: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	return {
		data: {
			newWalletBalance,
			[tokenType]: newTokenBalance
		},
		message: 'Bundle purchased successfully.'
	}
}

export const payForGroupItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's current credits
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user credits:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price of selected items
	const totalPrice = selectedItems.reduce(
		(total, item) => total + item.price,
		0
	)

	if (totalPrice === 0) {
		return { error: 'No items selected.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < totalPrice) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Fetch the group time slot ID based on activity, coach, date, and start time
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('group_time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		console.error(
			'Error fetching group time slot data:',
			timeSlotError?.message
		)
		return { error: timeSlotError?.message || 'Group time slot not found.' }
	}

	// Deduct credits from user's account
	const newWalletBalance = userData.wallet - totalPrice
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: newWalletBalance })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user credits:', updateError.message)
		return { error: updateError.message }
	}

	// Create a new addition entry
	const newAddition = {
		user_id: userId,
		items: selectedItems.map(item => ({
			id: item.id,
			name: item.name,
			price: item.price
		}))
	}

	// Add the new addition entry to the additions array in the group time slot
	const newAdditions = [...(timeSlotData.additions || []), newAddition]
	const { error: additionsError } = await supabase
		.from('group_time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		console.error(
			'Error updating group time slot additions:',
			additionsError.message
		)
		return { error: additionsError.message }
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message: 'Items added to group time slot and credits deducted.'
	}
}

export const fetchMarketItems = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('id, name, price')

	if (error) {
		console.error('Error fetching market items:', error.message)
		return []
	}

	return data
}

export const fetchUserData = async userId => {
	const supabase = supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user data:', error.message)
		return null
	}

	return data
}

export const handlePurchase = async (userId, cart, totalPrice) => {
	const supabase = supabaseClient()

	// Check user's wallet balance
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userError) {
		console.error('Error fetching user wallet:', userError.message)
		return false
	}

	if (userData.wallet < totalPrice) {
		alert('You do not have enough credits to make this purchase.')
		return false
	}

	// Update user's wallet
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: userData.wallet - totalPrice })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user wallet:', updateError.message)
		return false
	}

	// Transform cart items to an array of UUIDs
	const items = cart.flatMap(item => Array(item.quantity).fill(item.id))
	console.log('Items to insert:', items) // Log the items array to verify

	// Record transaction
	const { error: transactionError } = await supabase
		.from('market_transactions')
		.insert({
			user_id: userId,
			items: items,
			date: new Date(),
			claimed: false
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		return false
	}

	return true
}

export const fetchShopTransactions = async () => {
	const supabase = supabaseClient()
	const { data: transactions, error } = await supabase
		.from('market_transactions')
		.select('*')
		.eq('claimed', false)

	if (error) {
		console.error('Error fetching shop transactions:', error.message)
		return []
	}

	// Fetch user data for each transaction
	const userPromises = transactions.map(transaction =>
		supabase
			.from('users')
			.select('first_name, last_name')
			.eq('user_id', transaction.user_id)
			.single()
	)

	const userResults = await Promise.all(userPromises)

	// Fetch item data for each transaction
	const itemPromises = transactions.map(transaction => {
		const itemIds = transaction.items
		return supabase.from('market').select('id, name').in('id', itemIds)
	})

	const itemResults = await Promise.all(itemPromises)

	// Combine transactions with user and item data
	const enhancedTransactions = transactions.map((transaction, index) => {
		const user = userResults[index].data
		const items = itemResults[index].data

		// Count item quantities
		const itemCounts = transaction.items.reduce((acc, itemId) => {
			acc[itemId] = (acc[itemId] || 0) + 1
			return acc
		}, {})

		const itemDetails = items.map(item => ({
			name: item.name,
			quantity: itemCounts[item.id] || 0
		}))

		return {
			...transaction,
			user_name: `${user.first_name} ${user.last_name}`,
			item_details: itemDetails
		}
	})

	return enhancedTransactions
}

export const claimTransaction = async transactionId => {
	const supabase = supabaseClient()
	const { error } = await supabase
		.from('market_transactions')
		.update({ claimed: true })
		.eq('transaction_id', transactionId)

	if (error) {
		console.error('Error claiming transaction:', error.message)
		return false
	}

	return true
}
