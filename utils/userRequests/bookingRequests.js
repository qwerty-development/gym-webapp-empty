import { supabaseClient } from '../supabaseClient'
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

		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled individual session: ${activityData.name}`,
			type: 'individual session',
			amount: reservationData.booked_with_token
				? '+1 private token'
				: `+${activityData.credits} credits`
		}

		const { error: sessionTransactionError } = await supabase
			.from('transactions')
			.insert(sessionTransactionData)

		if (sessionTransactionError) {
			console.error(
				'Error recording session transaction:',
				sessionTransactionError.message
			)
		}

		// Add transaction record for market item refunds
		if (additionsTotalPrice > 0) {
			const marketTransactionData = {
				user_id: userId,
				name: `Refunded market items for cancelled session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${additionsTotalPrice} credits`
			}

			const { error: marketTransactionError } = await supabase
				.from('transactions')
				.insert(marketTransactionData)

			if (marketTransactionError) {
				console.error(
					'Error recording market transaction:',
					marketTransactionError.message
				)
			}
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

		let sessionTransactionAmount = ''
		if (refundType === 'credits') {
			sessionTransactionAmount = `+${activityData.credits} credits`
		} else if (refundType === 'semiPrivateToken') {
			sessionTransactionAmount = '+1 semi-private token'
		} else if (refundType === 'publicToken') {
			sessionTransactionAmount = '+1 public token'
		}

		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: sessionTransactionAmount
		}

		const { error: sessionTransactionError } = await supabase
			.from('transactions')
			.insert(sessionTransactionData)

		if (sessionTransactionError) {
			console.error(
				'Error recording session transaction:',
				sessionTransactionError.message
			)
		}

		// Add transaction record for market item refunds
		if (additionsTotalPrice > 0) {
			const marketTransactionData = {
				user_id: userId,
				name: `Refunded market items for cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${additionsTotalPrice} credits`
			}

			const { error: marketTransactionError } = await supabase
				.from('transactions')
				.insert(marketTransactionData)

			if (marketTransactionError) {
				console.error(
					'Error recording market transaction:',
					marketTransactionError.message
				)
			}
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
	let transactionAmount = ''

	if (userData.private_token > 0) {
		bookingMethod = 'token'
		newTokenBalance -= 1
		transactionAmount = '-1 private token'
	} else if (userData.isFree || userData.wallet >= activityData.credits) {
		if (!userData.isFree) {
			newWalletBalance -= activityData.credits
			transactionAmount = `-${activityData.credits} credits`
		} else {
			transactionAmount = '0 credits (free user)'
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

	// Add transaction record
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Booked individual session: ${activityData.name}`,
			type: 'individual session',
			amount: transactionAmount
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the booking was successful
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
	let transactionAmount = ''

	if (activityData.semi_private && userData.semiPrivate_token > 0) {
		bookingMethod = 'semiPrivateToken'
		newSemiPrivateTokenBalance -= 1
		transactionAmount = '-1 semi-private token'
	} else if (!activityData.semi_private && userData.public_token > 0) {
		bookingMethod = 'publicToken'
		newPublicTokenBalance -= 1
		transactionAmount = '-1 public token'
	} else if (userData.isFree || userData.wallet >= activityData.credits) {
		if (!userData.isFree) {
			newWalletBalance -= activityData.credits
			transactionAmount = `-${activityData.credits} credits`
		} else {
			transactionAmount = '0 credits (free user)'
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

	// Add transaction record
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Booked ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: transactionAmount
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the booking was successful
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
