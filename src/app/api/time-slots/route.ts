import { NextResponse } from 'next/server'
import { supabaseClient } from '../../../../utils/supabaseClient'
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const isPrivateTraining = searchParams.get('isPrivateTraining') === 'true'
	const activity = searchParams.get('activity')
	const coach = searchParams.get('coach')
	const user = searchParams.get('user')
	const bookedFilter = searchParams.get('bookedFilter')
	const date = searchParams.get('date')
	const startTime = searchParams.get('startTime')
	const endTime = searchParams.get('endTime')

	const supabase = supabaseClient()

	let query = isPrivateTraining
		? supabase.from('time_slots').select(`
        id,
        activities ( name, credits ),
        coaches ( name ),
        date,
        start_time,
        end_time,
        users ( user_id, first_name, last_name ),
        booked
      `)
		: supabase.from('group_time_slots').select(`
        id,
        activities ( name, credits, capacity ),
        coaches ( name ),
        date,
        start_time,
        end_time,
        user_id,
        booked
      `)

	// Apply filters
	if (activity) query = query.ilike('activities.name', `%${activity}%`)
	if (coach) query = query.ilike('coaches.name', `%${coach}%`)
	if (date) query = query.eq('date', date)
	if (startTime) query = query.gte('start_time', startTime)
	if (endTime) query = query.lte('end_time', endTime)

	if (bookedFilter === 'booked') query = query.eq('booked', true)
	else if (bookedFilter === 'notBooked') query = query.eq('booked', false)

	// User filter is more complex and depends on the table structure
	if (user) {
		if (isPrivateTraining) {
			query = query.or(
				`users.first_name.ilike.%${user}%,users.last_name.ilike.%${user}%`
			)
		} else {
			// For group sessions, we'll need to filter after fetching the data
		}
	}

	const { data, error } = await query
		.gte('date', new Date().toISOString().split('T')[0])
		.order('date', { ascending: true })
		.order('start_time', { ascending: true })

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	let transformedData = data.map(
		(slot: {
			id: any
			activities: { name: any; credits: any; capacity: any }
			coaches: { name: any }
			date: any
			start_time: any
			end_time: any
			users: { user_id: any; first_name: any; last_name: any }
			user_id: any
			booked: any
		}) => ({
			id: slot.id,
			activity: slot.activities
				? {
						name: slot.activities.name,
						credits: slot.activities.credits,
						capacity: isPrivateTraining ? null : slot.activities.capacity
				  }
				: null,
			coach: slot.coaches ? { name: slot.coaches.name } : null,
			date: slot.date,
			start_time: slot.start_time,
			end_time: slot.end_time,
			user: isPrivateTraining
				? slot.users
					? {
							user_id: slot.users.user_id,
							first_name: slot.users.first_name,
							last_name: slot.users.last_name
					  }
					: null
				: null,
			users: isPrivateTraining ? null : slot.user_id,
			booked: slot.booked
		})
	)

	// For group sessions, fetch and filter users if needed
	if (
		!isPrivateTraining &&
		(user ||
			transformedData.some(
				(slot: { users: string | any[] }) => slot.users?.length > 0
			))
	) {
		const userIds = transformedData.flatMap(
			(slot: { users: any }) => slot.users || []
		)
		const { data: usersData, error: usersError } = await supabase
			.from('users')
			.select('user_id, first_name, last_name')
			.in('user_id', userIds)

		if (usersError) {
			return NextResponse.json({ error: usersError.message }, { status: 500 })
		}

		const usersMap = usersData.reduce(
			(acc: { [x: string]: any }, user: { user_id: string | number }) => {
				acc[user.user_id] = user
				return acc
			},
			{}
		)

		transformedData = transformedData.map((slot: { users: any[] }) => ({
			...slot,
			users:
				slot.users
					?.map((userId: string | number) => usersMap[userId])
					.filter(
						(user: {
							first_name: string
							toLowerCase: () => any
							last_name: string
						}) =>
							!user ||
							user.first_name.toLowerCase().includes(user?.toLowerCase()) ||
							user.last_name.toLowerCase().includes(user?.toLowerCase())
					) || []
		}))

		// Filter out slots with no matching users if user filter is applied
		if (user) {
			transformedData = transformedData.filter(
				(slot: { users: string | any[] }) => slot.users.length > 0
			)
		}
	}

	return NextResponse.json(transformedData)
}
