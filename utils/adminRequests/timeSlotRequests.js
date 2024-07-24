import { supabaseClient } from '../supabaseClient'

export const fetchUpcomingSessions = async (type, limit = 6) => {
	const supabase = await supabaseClient()
	const now = new Date().toISOString()

	if (type === 'individual') {
		const { data: individualSessions, error } = await supabase
			.from('time_slots')
			.select(
				`
        id,
        activities ( name, credits ),
        coaches ( name ),
        date,
        start_time,
        end_time,
        users ( user_id, first_name, last_name ),
        booked,
        additions
      `
			)
			.gte('date', now.split('T')[0])
			.eq('booked', true)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })
			.limit(limit)

		if (error) {
			console.error('Error fetching individual sessions:', error.message)
			return []
		}

		return individualSessions || []
	} else {
		const { data: groupSessions, error } = await supabase
			.from('group_time_slots')
			.select(
				`
        id,
        activities ( name, credits, capacity ),
        coaches ( name ),
        date,
        start_time,
        end_time,
        user_id,
        booked,
        additions,
        count
      `
			)
			.gte('date', now.split('T')[0])
			.gt('count', 0)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })
			.limit(limit)

		if (error) {
			console.error('Error fetching group sessions:', error.message)
			return []
		}

		const userIds = groupSessions.flatMap(slot => slot.user_id)
		const { data: usersData, error: usersError } = await supabase
			.from('users')
			.select('user_id, first_name, last_name')
			.in('user_id', userIds)

		if (usersError) {
			console.error('Error fetching users:', usersError.message)
			return []
		}

		const usersMap = usersData.reduce((acc, user) => {
			acc[user.user_id] = user
			return acc
		}, {})

		const transformedSessions = groupSessions.map(session => ({
			...session,
			users: session.user_id
				.map(userId => usersMap[userId] || null)
				.filter(Boolean),
			additions: session.additions || []
		}))

		return transformedSessions
	}
}

export const fetchTimeSlots = async () => {
	const supabase = await supabaseClient()

	const today = new Date()

	const { data, error } = await supabase
		.from('time_slots')
		.select(
			`
            id,
            activities ( name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            users ( user_id, first_name, last_name ),
            booked
        `
		)
		.gte('date', today.toISOString().split('T')[0])

	if (error) {
		console.error('Error fetching time slots:', error.message)
		return []
	}

	// Transform the data to ensure it fits the Reservation type
	const transformedData = data.map(slot => ({
		id: slot.id,
		activity: slot.activities
			? { name: slot.activities.name, credits: slot.activities.credits }
			: null,
		coach: slot.coaches ? { name: slot.coaches.name } : null,
		date: slot.date,
		start_time: slot.start_time,
		end_time: slot.end_time,
		user: slot.users
			? {
					user_id: slot.users.user_id,
					first_name: slot.users.first_name,
					last_name: slot.users.last_name
			  }
			: null,
		booked: slot.booked
	}))

	// Sort the transformed data
	const sortedData = transformedData.sort((a, b) => {
		const dateA = new Date(a.date + 'T' + a.start_time)
		const dateB = new Date(b.date + 'T' + b.start_time)
		return dateA.getTime() - dateB.getTime()
	})

	return sortedData
}

export const fetchGroupTimeSlots = async () => {
	const supabase = await supabaseClient()

	// Get today's date at the start of the day (midnight)
	const today = new Date()

	const { data, error } = await supabase
		.from('group_time_slots')
		.select(
			`
            id,
            activities ( name, credits, capacity ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            user_id,
            booked
        `
		)
		.gte('date', today.toISOString().split('T')[0]) // Filter for dates from today onwards

	if (error) {
		console.error('Error fetching group time slots:', error.message)
		return []
	}

	const userIds = data.flatMap(slot => slot.user_id)
	const { data: usersData, error: usersError } = await supabase
		.from('users')
		.select('user_id, first_name, last_name')
		.in('user_id', userIds)

	if (usersError) {
		console.error('Error fetching users:', usersError.message)
		return []
	}

	const usersMap = usersData.reduce((acc, user) => {
		acc[user.user_id] = user
		return acc
	}, {})

	const transformedData = data.map(slot => ({
		id: slot.id,
		activity: slot.activities
			? {
					name: slot.activities.name,
					credits: slot.activities.credits,
					capacity: slot.activities.capacity
			  }
			: null,
		coach: slot.coaches ? { name: slot.coaches.name } : null,
		date: slot.date,
		start_time: slot.start_time,
		end_time: slot.end_time,
		users: slot.user_id.map(userId => usersMap[userId] || null),
		booked: slot.booked
	}))

	// Sort the transformed data
	const sortedData = transformedData.sort((a, b) => {
		const dateA = new Date(a.date + 'T' + a.start_time)
		const dateB = new Date(b.date + 'T' + b.start_time)
		return dateA.getTime() - dateB.getTime()
	})

	return sortedData
}

export const addTimeSlot = async timeSlot => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('time_slots').insert([timeSlot])

	if (error) {
		console.error('Error adding new time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const addTimeSlotGroup = async timeSlot => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('group_time_slots')
		.insert([timeSlot])

	if (error) {
		console.error('Error adding new time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const deleteTimeSlot = async timeSlotId => {
	const supabase = await supabaseClient()
	const { error } = await supabase
		.from('time_slots')
		.delete()
		.match({ id: timeSlotId }) // Use `.eq('id', timeSlotId)` if your DB requires

	if (error) {
		console.error('Error deleting time slot:', error.message)
		return false
	}

	return true
}

export const deleteGroupTimeSlot = async timeSlotId => {
	const supabase = await supabaseClient()
	const { error } = await supabase
		.from('group_time_slots')
		.delete()
		.match({ id: timeSlotId }) // Use `.eq('id', timeSlotId)` if your DB requires

	if (error) {
		console.error('Error deleting time slot:', error.message)
		return false
	}
	return true
}

export const updateTimeSlot = async timeSlot => {
	if (!timeSlot.id) {
		console.error('Time Slot ID is required for update.')
		return { success: false, error: 'Time Slot ID is required for update.' }
	}

	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('time_slots')
		.update({
			booked: timeSlot.booked,
			user_id: timeSlot.user_id,
			additions: timeSlot.additions // Ensure you update only necessary fields
		})
		.eq('id', timeSlot.id)

	if (error) {
		console.error('Error updating time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

// File: updateGroupTimeSlot.js

export const updateGroupTimeSlot = async timeSlot => {
	if (!timeSlot.id) {
		console.error('Group Time Slot ID is required for update.')
		return {
			success: false,
			error: 'Group Time Slot ID is required for update.'
		}
	}

	const supabase = await supabaseClient()

	// Fetch existing group time slot data
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select('user_id, count, activity_id')
		.eq('id', timeSlot.id)
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

	// Add the new user_id to the existing user_id array

	// Fetch activity details to check the capacity
	// Determine if the slot should be marked as booked

	// Update the group time slot
	const { data, error } = await supabase
		.from('group_time_slots')
		.update({
			user_id: [],
			count: 0,
			booked: false
		})
		.eq('id', timeSlot.id)

	if (error) {
		console.error('Error updating group time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const bookTimeSlotForClient = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Fetch activity details to get the credits cost
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('credits, name')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity data:', activityError?.message)
		return {
			error:
				'Failed to fetch activity data: ' +
				(activityError?.message || 'Activity not found')
		}
	}

	// Fetch user data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet, first_name, last_name, email, isFree, private_token')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		return { error: 'User not found' }
	}

	// Determine booking method and update user's account
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
		return { error: 'Not enough credits or tokens' }
	}

	// Update user's account (wallet or tokens)
	const { error: updateUserError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			private_token: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateUserError) {
		console.error('Error updating user data:', updateUserError.message)
		return {
			error: 'Failed to update user data: ' + updateUserError.message
		}
	}

	// Proceed with booking the time slot
	const { error: bookingError, data: bookingData } = await supabase
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

	if (bookingError) {
		console.error('Error booking time slot:', bookingError.message)
		return { error: bookingError.message }
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

	// Fetch coach name
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
		success: true,
		message: `Session booked successfully using ${bookingMethod}.`,
		timeSlot: bookingData
	}
}

export const bookTimeSlotForClientGroup = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Fetch activity details to get the credits cost, capacity, and semi-private status
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('credits, name, capacity, semi_private')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity data:', activityError?.message)
		return {
			error:
				'Failed to fetch activity data: ' +
				(activityError?.message || 'Activity not found')
		}
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
		return { error: 'User not found' }
	}

	// Determine booking method and update balances
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

	// Proceed with booking the time slot
	let newCount = 1
	let user_id = [userId]
	let isBooked = false
	let slotId
	let booked_with_token = existingSlot?.booked_with_token || []

	if (existingSlot) {
		newCount = existingSlot.count + 1
		user_id = existingSlot.user_id
			? [...existingSlot.user_id, userId]
			: [userId]
		isBooked = newCount === activityData.capacity
		slotId = existingSlot.id
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

	// Update user's account (wallet, public tokens, or semi-private tokens)
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

	// Fetch coach name
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
				: userData.isFree
				? 0
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
		success: true,
		message: `Group session booked successfully using ${
			bookingMethod === 'semiPrivateToken'
				? 'semi-private token'
				: bookingMethod === 'publicToken'
				? 'public token'
				: 'credits'
		}.`,
		timeSlot: timeSlotData
	}
}

export const cancelGroupBooking = async timeSlotId => {
	const supabase = await supabaseClient()

	// Fetch existing group time slot data
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select(
			'user_id, count, activity_id, additions, coach_id, date, start_time, end_time, booked_with_token'
		)
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

	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('credits, name, semi_private')
		.eq('id', existingSlot.activity_id)
		.single()

	if (activityError || !activityData) {
		console.error(
			'Error fetching activity data:',
			activityError?.message || 'Activity not found'
		)
		return {
			success: false,
			error: activityError?.message || 'Activity not found'
		}
	}

	const activityCredits = activityData.credits

	// Fetch coach data
	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('name, email')
		.eq('id', existingSlot.coach_id)
		.single()

	if (coachError) {
		console.error('Error fetching coach data:', coachError.message)
		return { success: false, error: coachError.message }
	}

	// Process refunds and send emails to all users in the user_id array
	for (const userId of existingSlot.user_id) {
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
			continue
		}

		const bookedWithToken = existingSlot.booked_with_token.includes(userId)
		let totalRefund = 0
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token

		if (bookedWithToken) {
			if (activityData.semi_private) {
				newSemiPrivateTokenBalance += 1
			} else {
				newPublicTokenBalance += 1
			}
		} else if (!userData.isFree) {
			totalRefund += activityCredits
		}

		// Check if user has any additions
		const userAddition = existingSlot.additions.find(
			addition => addition.user_id === userId
		)
		let additionsTotalPrice = 0
		if (userAddition) {
			additionsTotalPrice = userAddition.items.reduce(
				(total, item) => total + item.price,
				0
			)
			totalRefund += additionsTotalPrice
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
			console.error(
				`Error updating user data for user ${userId}:`,
				userUpdateError.message
			)
		}

		// Create transaction for class session cancellation
		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: bookedWithToken
				? activityData.semi_private
					? '+1 semi-private token'
					: '+1 public token'
				: `+${activityCredits} credits`
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

		// Create transaction for market items refund if applicable
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
		// Prepare email data for each user
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

		// Send cancellation email to user
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
				console.error(
					`Failed to send user cancellation email: ${resultUser.error}`
				)
			}
		} catch (error) {
			console.error('Error sending user cancellation email:', error)
		}
	}

	// Update the group time slot to clear users and reset count
	const { data, error } = await supabase
		.from('group_time_slots')
		.update({
			user_id: [],
			count: 0,
			booked: false,
			additions: [],
			booked_with_token: []
		})
		.eq('id', timeSlotId)

	if (error) {
		console.error('Error updating group time slot:', error.message)
		return { success: false, error: error.message }
	}

	// Send cancellation email to admin
	const adminEmailData = {
		activity_name: activityData.name,
		activity_date: existingSlot.date,
		start_time: existingSlot.start_time,
		end_time: existingSlot.end_time,
		coach_name: coachData.name,
		coach_email: coachData.email,
		cancelled_users: existingSlot.count
	}

	try {
		const responseAdmin = await fetch('/api/send-cancel-admin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(adminEmailData)
		})

		if (!responseAdmin.ok) {
			const resultAdmin = await responseAdmin.json()
			console.error(
				`Failed to send admin cancellation email: ${resultAdmin.error}`
			)
		}
	} catch (error) {
		console.error('Error sending admin cancellation email:', error)
	}

	return { success: true, data }
}
export const fetchAllBookedSlotsToday = async () => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
	const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false }) // Get current time in HH:MM:SS format

	// Fetch booked time slots for today
	const { data: individualSlots, error: individualError } = await supabase
		.from('time_slots')
		.select(
			`
            id,
            activities ( name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            users ( user_id, first_name, last_name ),
            booked
        `
		)
		.eq('date', today)
		.eq('booked', true)
		.gt('end_time', currentTime)

	if (individualError) {
		console.error(
			'Error fetching individual time slots:',
			individualError.message
		)
		return []
	}

	// Fetch booked group time slots for today
	const { data: groupSlots, error: groupError } = await supabase
		.from('group_time_slots')
		.select(
			`
            id,
            activities ( name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            user_id,
            booked
        `
		)
		.eq('date', today)
		.eq('booked', true)
		.gt('end_time', currentTime)

	if (groupError) {
		console.error('Error fetching group time slots:', groupError.message)
		return []
	}

	// Fetch users for group slots
	const userIds = groupSlots.flatMap(slot => slot.user_id)
	const { data: usersData, error: usersError } = await supabase
		.from('users')
		.select('user_id, first_name, last_name')
		.in('user_id', userIds)

	if (usersError) {
		console.error('Error fetching users:', usersError.message)
		return []
	}

	const usersMap = usersData.reduce((acc, user) => {
		acc[user.user_id] = user
		return acc
	}, {})

	// Transform individual slots
	const transformedIndividualSlots = individualSlots.map(slot => ({
		coachName: slot.coaches?.name || 'N/A',
		activityName: slot.activities?.name || 'N/A',
		startTime: slot.start_time,
		endTime: slot.end_time,
		date: slot.date,
		users: slot.users
			? [`${slot.users.first_name} ${slot.users.last_name}`]
			: []
	}))

	// Transform group slots
	const transformedGroupSlots = groupSlots.map(slot => ({
		coachName: slot.coaches?.name || 'N/A',
		activityName: slot.activities?.name || 'N/A',
		startTime: slot.start_time,
		endTime: slot.end_time,
		date: slot.date,
		users: slot.user_id.map(userId => {
			const user = usersMap[userId]
			return user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
		})
	}))

	// Combine and sort all slots
	const allSlots = [
		...transformedIndividualSlots,
		...transformedGroupSlots
	].sort((a, b) => a.startTime.localeCompare(b.startTime))

	return allSlots
}

export const fetchTodaysSessions = async () => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0]

	const { count: individualCount, error: individualError } = await supabase
		.from('time_slots')
		.select('*', { count: 'exact', head: true })
		.eq('date', today)
		.eq('booked', true)

	const { count: groupCount, error: groupError } = await supabase
		.from('group_time_slots')
		.select('*', { count: 'exact', head: true })
		.eq('date', today)
		.eq('booked', true)

	if (individualError || groupError) {
		console.error(
			"Error fetching today's sessions:",
			individualError?.message || groupError?.message
		)
		return 0
	}

	return (individualCount || 0) + (groupCount || 0)
}
