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

// In admin-requests.js

// In admin-requests.js
export const fetchTimeSlots = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('time_slots').select(`
          id,
          activities ( name, credits ),
          coaches ( name ),
          date,
          start_time,
          end_time,
          users ( user_id, first_name, last_name ),
          booked
      `) // Join logic here based on your database relations

	if (error) {
		console.error('Error fetching time slots:', error.message)
		return []
	}

	// Transform the data to ensure it fits the Reservation type
	const transformedData = data.map(slot => ({
		id: slot.id, // Make sure to assign the id to each reservation
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

	return transformedData
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
			user_id: timeSlot.user_id // Ensure you update only necessary fields
		})
		.eq('id', timeSlot.id)

	if (error) {
		console.error('Error updating time slot:', error.message)
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

	return data
}

export const updateUserCredits = async (userId, wallet) => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.update({ wallet })
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

	// Check if the user has enough credits
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet, first_name, last_name, email')
		.eq('user_id', userId)
		.single()

	if (userError || !userData || userData.wallet < activityData.credits) {
		return { error: 'Not enough credits or user not found' }
	}

	// Deduct credits from user's wallet
	const newWalletBalance = userData.wallet - activityData.credits
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
		activity_price: activityData.credits,
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
		message: 'Session booked successfully, credits deducted.',
		timeSlot: bookingData
	}
}

export const updateUserCreditsCancellation = async (userId, creditsToAdd) => {
	const supabase = await supabaseClient()
	const userResponse = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userResponse.data) {
		const newWalletBalance = userResponse.data.wallet + creditsToAdd
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
