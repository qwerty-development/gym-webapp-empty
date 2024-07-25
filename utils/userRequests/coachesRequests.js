import { supabaseClient } from '../supabaseClient'
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
