import { supabaseClient } from './supabaseClient'
// Functions to manage coaches

export const addActivity = async activity => {
	const supabase = await supabaseClient()

	// Set group to true if capacity is not null
	if (activity.capacity !== null && activity.capacity !== undefined) {
		activity.group = true
	}

	const { data, error } = await supabase
		.from('activities')
		.insert([{ ...activity, coach_id: activity.coach_id }])

	if (error) {
		console.error('Error adding new activity:', error.message)
		return null
	}

	return data ? data[0] : null
}
// Add this to your existing file or create a new one

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
export const addCoach = async (coach, file) => {
	const supabase = await supabaseClient()

	if (!supabase) {
		console.error('Supabase client is not initialized.')
		return null
	}

	const storage = supabase.storage.from('coach_profile_picture')
	if (!storage) {
		console.error('Supabase storage is not initialized.')
		return null
	}

	if (file) {
		const fileExtension = file.name.split('.').pop()
		const fileName = `${Math.random()}.${fileExtension}`
		const { error: uploadError } = await storage.upload(fileName, file)

		if (uploadError) {
			console.error('Error uploading file:', uploadError.message)
			return null
		}

		// Construct the public URL manually
		const publicURL = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/coach_profile_picture/${fileName}`
		console.log('Constructed public URL: ' + publicURL)
		//hulemzdcxcxolglazzyt.supabase.co/storage/v1/s3
		https: if (publicURL) {
			coach.profile_picture = publicURL
		} else {
			console.error('Public URL is undefined.')
			return null
		}
	}

	const { data, error } = await supabase.from('coaches').insert([coach])

	if (error) {
		console.error('Error adding new coach:', error.message)
		return null
	}

	return data ? data[0] : null
}

export const updateCoach = async (coachId, updates, file) => {
	const supabase = await supabaseClient()

	// If a new file is uploaded, handle the file upload
	if (file) {
		const fileExtension = file.name.split('.').pop()
		const fileName = `${Math.random()}.${fileExtension}`
		const { error: uploadError } = await supabase.storage
			.from('coach_profile_picture')
			.upload(fileName, file)

		if (uploadError) {
			console.error('Error uploading file:', uploadError.message)
			return null
		}

		// Manually construct the public URL for the uploaded file
		const publicURL = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/coach_profile_picture/${fileName}`
		console.log('New Public URL: ' + publicURL)

		// Update the image URL in the coach updates
		updates.profile_picture = publicURL
	}

	// Update the coach in the database
	const { data, error } = await supabase
		.from('coaches')
		.update(updates)
		.eq('id', coachId)

	if (error) {
		console.error('Error updating coach:', error.message)
		return null
	}

	return data ? data[0] : null
}

export const updateActivity = async activity => {
	if (!activity.id) throw new Error('Activity ID is required for update.')

	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.update(activity)
		.eq('id', activity.id)
	console.log('updates successfully')

	if (error) {
		console.error('Error updating activity:', error.message)
		return null
	}

	return data ? data[0] : null
}

export const deleteCoach = async coachId => {
	const supabase = await supabaseClient()
	const { error } = await supabase.from('coaches').delete().eq('id', coachId)

	if (error) {
		console.error('Error deleting coach:', error.message)
		return false
	}

	return true
}

export const deleteActivity = async activityId => {
	const supabase = await supabaseClient()
	const { error } = await supabase
		.from('activities')
		.delete()
		.eq('id', activityId)

	if (error) {
		console.error('Error deleting activity:', error.message)
		return false
	}

	return true
}

export const fetchCoaches = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('coaches').select('*')

	if (error) {
		console.error('Error fetching coaches:', error.message)
		return []
	}

	return data
}

export const fetchCoachesActivities = async activityId => {
	const supabase = await supabaseClient()

	// First, fetch all time slots for the given activityId to get associated coach_ids
	const { data: timeSlots, error: timeSlotsError } = await supabase
		.from('time_slots')
		.select('coach_id')
		.eq('activity_id', activityId)

	if (timeSlotsError || !timeSlots.length) {
		console.error('Error fetching time slots:', timeSlotsError?.message)
		return []
	}

	// Extract unique coach IDs from time slots
	const coachIds = timeSlots.map(slot => slot.coach_id)

	// Then, fetch coach details for the collected coach_ids
	const { data: coaches, error: coachesError } = await supabase
		.from('coaches')
		.select('*')
		.in('id', coachIds) // This fetches all coaches whose ID is in the coachIds arraya

	if (coachesError) {
		console.error('Error fetching coaches:', coachesError.message)
		return []
	}

	return coaches
}

export const fetchCoachesActivitiesGroup = async activityId => {
	const supabase = await supabaseClient()

	// First, fetch all time slots for the given activityId to get associated coach_ids
	const { data: timeSlots, error: timeSlotsError } = await supabase
		.from('group_time_slots')
		.select('coach_id')
		.eq('activity_id', activityId)

	if (timeSlotsError || !timeSlots.length) {
		console.error('Error fetching time slots:', timeSlotsError?.message)
		return []
	}

	// Extract unique coach IDs from time slots
	const coachIds = timeSlots.map(slot => slot.coach_id)

	// Then, fetch coach details for the collected coach_ids
	const { data: coaches, error: coachesError } = await supabase
		.from('coaches')
		.select('*')
		.in('id', coachIds) // This fetches all coaches whose ID is in the coachIds array

	if (coachesError) {
		console.error('Error fetching coaches:', coachesError.message)
		return []
	}

	return coaches
}

export const fetchActivities = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('*')
		.eq('group', false)

	if (error) {
		console.error('Error fetching private activities:', error.message)
		return []
	}

	return data
}

export const fetchGroupActivities = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('*')
		.eq('group', true)

	if (error) {
		console.error('Error fetching group activities:', error.message)
		return []
	}

	return data
}

export const fetchTotalUsers = async () => {
	const supabase = await supabaseClient()
	const { count, error } = await supabase
		.from('users')
		.select('*', { count: 'exact', head: true })

	if (error) {
		console.error('Error fetching total users:', error.message)
		return 0
	}

	return count || 0
}

export const fetchTotalActivities = async () => {
	const supabase = await supabaseClient()
	const { count, error } = await supabase
		.from('activities')
		.select('*', { count: 'exact', head: true })

	if (error) {
		console.error('Error fetching total activities:', error.message)
		return 0
	}

	return count || 0
}

export const fetchTotalCoaches = async () => {
	const supabase = await supabaseClient()
	const { count, error } = await supabase
		.from('coaches')
		.select('*', { count: 'exact', head: true })

	if (error) {
		console.error('Error fetching total coaches:', error.message)
		return 0
	}

	return count || 0
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
// In admin-requests.js

// In admin-requests.js
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

export const cancelGroupBooking = async timeSlotId => {
	const supabase = await supabaseClient()

	// Fetch existing group time slot data
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select('user_id, count, activity_id, additions')
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
		.select('credits')
		.eq('id', existingSlot.activity_id)
		.single()

	if (activityError || !activityData) {
		console.error(
			'Error fetching activity credits:',
			activityError?.message || 'Activity not found'
		)
		return {
			success: false,
			error: activityError?.message || 'Activity not found'
		}
	}

	const activityCredits = activityData.credits

	// Refund credits to each user in the user_id array including additions
	for (const userAddition of existingSlot.additions) {
		const { user_id: userId, items } = userAddition

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
			continue
		}

		let totalRefund = 0
		if (!userData.isFree) {
			totalRefund += activityCredits
		}

		const additionsTotalPrice = items.reduce(
			(total, item) => total + item.price,
			0
		)
		totalRefund += additionsTotalPrice

		const newWalletBalance = userData.wallet + totalRefund

		const { error: walletUpdateError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (walletUpdateError) {
			console.error(
				`Error updating wallet for user ${userId}:`,
				walletUpdateError.message
			)
		}
	}

	// Update the group time slot to clear users and reset count
	const { data, error } = await supabase
		.from('group_time_slots')
		.update({
			user_id: [],
			count: 0,
			booked: false,
			additions: []
		})
		.eq('id', timeSlotId)

	if (error) {
		console.error('Error updating group time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

// Existing fetchGroupTimeSlots function
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

// In admin-requests.js
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

// In admin-requests.js

export const fetchUsers = async searchQuery => {
	const supabase = await supabaseClient()
	let query = supabase.from('users').select('*')

	if (searchQuery) {
		query = query.or(
			`username.ilike.%${searchQuery}%,` +
				`first_name.ilike.%${searchQuery}%,` +
				`last_name.ilike.%${searchQuery}%`
		)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching users:', error.message)
		return []
	}

	console.log(data)
	return data
}

// src/app/api/update-user-credits/route.js

export const updateUserCredits = async (userId, wallet) => {
	const supabase = await supabaseClient()

	// Fetch user details
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet, first_name, last_name, email')
		.eq('id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: 'User not found' }
	}

	// Update user's wallet
	const { data, error } = await supabase
		.from('users')
		.update({ wallet })
		.eq('id', userId)

	if (error) {
		console.error('Error updating user wallet:', error.message)
		return { error: 'Failed to update user wallet: ' + error.message }
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		user_wallet: wallet,
		creditsAdded: wallet - userData.wallet // Assuming creditsAdded is the difference
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-refill-email', {
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

	return { data, error }
}

export const updateUserisFree = async (userId, isFree) => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.update({ isFree })
		.eq('id', userId)

	return { data, error } // Return an object containing both data and error
}

// admin-requests.js

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
		.select('wallet, first_name, last_name, email, isFree')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		return { error: 'User not found' }
	}

	// Check if the user is free or has enough credits
	let newWalletBalance = userData.wallet
	if (!userData.isFree) {
		if (userData.wallet < activityData.credits) {
			return { error: 'Not enough credits' }
		}
		// Deduct credits from user's wallet
		newWalletBalance -= activityData.credits
		const { error: updateWalletError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (updateWalletError) {
			console.error('Error updating user wallet:', updateWalletError.message)
			return {
				error: 'Failed to update user wallet: ' + updateWalletError.message
			}
		}
	}

	// Proceed with booking the time slot
	const { error: bookingError, data: bookingData } = await supabase
		.from('time_slots')
		.update({ user_id: userId, booked: true })
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

	// Fetch coach name
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
		activity_price: userData.isFree ? 0 : activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		user_wallet: newWalletBalance
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
		message: 'Session booked successfully, credits deducted if applicable.',
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

	// Fetch activity details to get the credits cost and capacity
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('credits, name, capacity')
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
		.select('wallet, first_name, last_name, email, isFree')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		return { error: 'User not found' }
	}

	// Check if the user is free or has enough credits
	let newWalletBalance = userData.wallet
	if (!userData.isFree) {
		if (userData.wallet < activityData.credits) {
			return { error: 'Not enough credits' }
		}
		// Deduct credits from user's wallet
		newWalletBalance -= activityData.credits
		const { error: updateWalletError } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (updateWalletError) {
			console.error('Error updating user wallet:', updateWalletError.message)
			return {
				error: 'Failed to update user wallet: ' + updateWalletError.message
			}
		}
	}

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

	// Proceed with booking the time slot
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

	// Fetch coach name
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
		activity_price: userData.isFree ? 0 : activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		user_wallet: newWalletBalance
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
		message:
			'Group session booked successfully, credits deducted if applicable.',
		timeSlot: timeSlotData
	}
}

export const updateUserCreditsCancellation = async (userId, totalRefund) => {
	const supabase = await supabaseClient()
	const userResponse = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userResponse.data) {
		const newWalletBalance = userResponse.data.wallet + totalRefund
		const { data, error } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (error) {
			console.error('Error updating user credits:', error.message)
			return { success: false, error: error.message }
		}
		return { success: true, data }
	} else {
		console.error('User not found or failed to fetch user data')
		return { success: false, error: 'User not found' }
	}
}

export const addMarketItem = async (name, price) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.insert([{ name, price }])

	if (error) {
		console.error('Error adding market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item added successfully' }
}

export const deleteMarketItem = async id => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase.from('market').delete().eq('id', id)

	if (error) {
		console.error('Error deleting market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item deleted successfully' }
}
export const modifyMarketItem = async (id, name, price) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.update({ name, price })
		.eq('id', id)

	if (error) {
		console.error('Error modifying market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item modified successfully' }
}
