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

	return userData ? userData.wallet : null // Return the wallet balance or null if user not found
}

// Function to create or update user record in Supabase
// utils/requests.js

// Function to check if a user exists in Supabase
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
	userName,
	phone
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
				username: userName,
				phone
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
				username: userName,
				phone
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
                name
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
                name
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
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions'
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

		let totalRefund = activityData.credits

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
		totalRefund += additionsTotalPrice

		const { error: updateError } = await supabase
			.from('time_slots')
			.update({
				user_id: null,
				booked: false,
				additions: []
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('wallet, first_name, last_name, email')
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		const newWalletBalance = userData.wallet + totalRefund

		const { error: walletUpdateError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (walletUpdateError) {
			throw new Error(
				`Error updating user wallet: ${walletUpdateError.message}`
			)
		}

		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name')
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
			coach_name: coachData.name
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
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions'
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

		let totalRefund = activityData.credits

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

		const { error: updateError } = await supabase
			.from('group_time_slots')
			.update({
				user_id: updatedUserIds,
				count: newCount,
				booked: isBooked,
				additions: updatedAdditions
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('wallet, first_name, last_name, email')
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		const newWalletBalance = userData.wallet + totalRefund

		const { error: walletUpdateError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (walletUpdateError) {
			throw new Error(
				`Error updating user wallet: ${walletUpdateError.message}`
			)
		}

		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name')
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
			coach_name: coachData.name
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
		.select('id, name, profile_picture')
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
		.select('id, name, profile_picture')
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

	// Fetch activity credits required
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity credits:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	if (userData.wallet >= activityData.credits) {
		// Proceed with booking the time slot
		const { data: timeSlotData, error: timeSlotError } = await supabase
			.from('time_slots')
			.update({ user_id: userId, booked: true })
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

		// Deduct credits from user's account
		const newWalletBalance = userData.wallet - activityData.credits
		const { error: updateError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (updateError) {
			console.error('Error updating user credits:', updateError.message)
			return { error: updateError.message }
		}

		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name')
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
			activity_price: activityData.credits,
			activity_date: date,
			start_time: startTime,
			end_time: endTime,
			coach_name: coachData.name,
			user_wallet: newWalletBalance
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
			message: 'Session booked and credits deducted.'
		}
	} else {
		return { error: 'Not enough credits to book the session.' }
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
		.select('id, booked, user_id, count')
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
		return { error: 'Time slot is already booked.' }
	}

	if (
		existingSlot &&
		existingSlot.user_id &&
		existingSlot.user_id.includes(userId)
	) {
		return { error: 'You are already enrolled in this class.' }
	}

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

	// Fetch activity details including capacity and credits required
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity details:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	if (userData.wallet >= activityData.credits) {
		let newCount = 1
		let user_id = [userId]
		let isBooked = false
		let slotId

		if (existingSlot) {
			newCount = existingSlot.count + 1
			user_id = existingSlot.user_id
				? [...existingSlot.user_id, userId]
				: [userId]
			isBooked = newCount === activityData.capacity
			slotId = existingSlot.id
		}

		const upsertData = {
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime,
			end_time: endTime,
			user_id,
			count: newCount,
			booked: isBooked
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
				.neq('id')
		}

		if (timeSlotError) {
			console.error('Error booking group time slot:', timeSlotError.message)
			return { error: timeSlotError.message }
		}

		// Deduct credits from user's account
		const newWalletBalance = userData.wallet - activityData.credits
		const { error: updateError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (updateError) {
			console.error('Error updating user credits:', updateError.message)
			return { error: updateError.message }
		}

		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name')
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
			activity_price: activityData.credits,
			activity_date: date,
			start_time: startTime,
			end_time: endTime,
			coach_name: coachData.name,
			user_wallet: newWalletBalance
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
			message: 'Session booked and credits deducted.'
		}
	} else {
		return { error: 'Not enough credits to book the session.' }
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
