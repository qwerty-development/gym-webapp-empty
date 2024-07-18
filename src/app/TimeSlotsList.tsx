// app/TimeSlotsList.tsx
import { supabaseClient } from '../../utils/supabaseClient'
import { notFound } from 'next/navigation'

import TimeSlotListClient from './TimeSlotListClient'

export interface FilterParams {
	searchTerm?: string
	activity?: string
	coach?: string
	user?: string
	date?: string
	startTime?: string
	endTime?: string
	booked?: boolean | undefined
	isPrivateTraining: boolean
}

async function fetchFilteredTimeSlots(filters: FilterParams) {
	const supabase = supabaseClient()
	const today = new Date().toISOString().split('T')[0]

	let query = filters.isPrivateTraining
		? supabase.from('time_slots').select(`
        id,
        activities (name, credits),
        coaches (name),
        date,
        start_time,
        end_time,
        users (user_id, first_name, last_name),
        booked
      `)
		: supabase.from('group_time_slots').select(`
        id,
        activities (name, credits, capacity),
        coaches (name),
        date,
        start_time,
        end_time,
        user_id,
        booked
      `)

	query = query
		.gte('date', today)
		.order('date', { ascending: true })
		.order('start_time', { ascending: true })

	if (filters.activity) {
		query = query.ilike('activities.name', `%${filters.activity}%`)
	}
	if (filters.date) {
		query = query.filter('date', 'eq', filters.date)
	}
	if (filters.startTime) {
		query = query.gte('start_time', filters.startTime)
	}
	if (filters.endTime) {
		query = query.lte('end_time', filters.endTime)
	}
	if (filters.booked !== undefined) {
		query = query.filter('booked', 'eq', filters.booked)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching time slots:', error.message)
		return []
	}

	let transformedData

	if (filters.isPrivateTraining) {
		transformedData = data.map((slot: any) => ({
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
	} else {
		const userIds = data.flatMap((slot: any) => slot.user_id)
		const { data: usersData, error: usersError } = await supabase
			.from('users')
			.select('user_id, first_name, last_name')
			.in('user_id', userIds)

		if (usersError) {
			console.error('Error fetching users:', usersError.message)
			return []
		}

		const usersMap = usersData.reduce((acc: any, user: any) => {
			acc[user.user_id] = user
			return acc
		}, {})

		transformedData = data.map((slot: any) => ({
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
			users: slot.user_id.map((userId: string) => usersMap[userId] || null),
			booked: slot.booked
		}))
	}

	// Apply coach filter
	if (filters.coach) {
		transformedData = transformedData.filter(
			(slot: any) =>
				slot.coach &&
				slot.coach.name.toLowerCase().includes(filters.coach!.toLowerCase())
		)
	}

	// Apply user filter for private training
	if (filters.isPrivateTraining && filters.user) {
		transformedData = transformedData.filter(
			(slot: any) =>
				slot.user &&
				(slot.user.first_name
					.toLowerCase()
					.includes(filters.user!.toLowerCase()) ||
					slot.user.last_name
						.toLowerCase()
						.includes(filters.user!.toLowerCase()))
		)
	}

	// Apply user filter for group training
	if (!filters.isPrivateTraining && filters.user) {
		transformedData = transformedData.filter((slot: any) =>
			slot.users.some(
				(user: any) =>
					user &&
					(user.first_name
						.toLowerCase()
						.includes(filters.user!.toLowerCase()) ||
						user.last_name.toLowerCase().includes(filters.user!.toLowerCase()))
			)
		)
	}

	// Apply search term filter
	if (filters.searchTerm) {
		const searchTerm = filters.searchTerm.toLowerCase()
		transformedData = transformedData.filter(
			(slot: any) =>
				slot.activity?.name.toLowerCase().includes(searchTerm) ||
				slot.coach?.name.toLowerCase().includes(searchTerm) ||
				(slot.user &&
					(slot.user.first_name.toLowerCase().includes(searchTerm) ||
						slot.user.last_name.toLowerCase().includes(searchTerm))) ||
				(slot.users &&
					slot.users.some(
						(user: any) =>
							user &&
							(user.first_name.toLowerCase().includes(searchTerm) ||
								user.last_name.toLowerCase().includes(searchTerm))
					))
		)
	}

	return transformedData
}
export default async function TimeSlotsList({
	filters
}: {
	filters: FilterParams
}) {
	const timeSlots = await fetchFilteredTimeSlots(filters)

	return (
		<TimeSlotListClient
			initialTimeSlots={timeSlots}
			isPrivateTraining={filters.isPrivateTraining}
		/>
	)
}
