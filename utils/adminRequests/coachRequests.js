import { supabaseClient } from '../supabaseClient'

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

		const publicURL = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/coach_profile_picture/${fileName}`
		console.log('Constructed public URL: ' + publicURL)

		if (publicURL) {
			coach.profile_picture = publicURL
		} else {
			console.error('Public URL is undefined.')
			return null
		}
	}

	// Ensure the coach object has a name and email
	if (!coach.name || !coach.email) {
		console.error('Coach name and email are required.')
		return null
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

		const publicURL = `https://ofsmbbjjveacrikuuueh.supabase.co/storage/v1/object/public/coach_profile_picture/${fileName}`
		console.log('New Public URL: ' + publicURL)

		updates.profile_picture = publicURL
	}

	// Ensure the updates object has a name and email
	if (!updates.name || !updates.email) {
		console.error('Coach name and email are required for updates.')
		return null
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

export const deleteCoach = async coachId => {
	const supabase = await supabaseClient()
	const { error } = await supabase.from('coaches').delete().eq('id', coachId)

	if (error) {
		console.error('Error deleting coach:', error.message)
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
