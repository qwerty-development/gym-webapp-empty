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

async function fetchFilteredTimeSlots(
	filters: FilterParams,
	page: number = 1,
	pageSize: number = 30
) {
	const supabase = supabaseClient()
	const today = new Date().toISOString().split('T')[0]

	let query = filters.isPrivateTraining
		? supabase.from('time_slots').select(
				`
        id,
        activities!inner (name, credits),
        coaches!inner (name),
        date,
        start_time,
        end_time,
        user_id,
        booked,
        users!left (user_id, first_name, last_name)
      `,
				{ count: 'exact' }
		  )
		: supabase.from('group_time_slots').select(
				`
        id,
        activities!inner (name, credits, capacity),
        coaches!inner (name),
        date,
        start_time,
        end_time,
        user_id,
        booked
      `,
				{ count: 'exact' }
		  )
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
	if (filters.coach) {
		query = query.ilike('coaches.name', `%${filters.coach}%`)
	}

	if (filters.user) {
		const userQuery = supabase
			.from('users')
			.select('user_id')
			.or(
				`first_name.ilike.%${
					filters.user || filters.searchTerm
				}%,last_name.ilike.%${filters.user || filters.searchTerm}%`
			)

		const { data: matchingUsers, error: userError } = await userQuery

		if (userError) {
			console.error('Error fetching matching users:', userError.message)
			return []
		}

		const matchingUserIds = matchingUsers.map(user => user.user_id)

		if (filters.isPrivateTraining) {
			query = query.in('user_id', matchingUserIds)
		} else {
			query = query.contains('user_id', matchingUserIds)
		}
	}

	const from = (page - 1) * pageSize
	const to = from + pageSize - 1

	query = query.range(from, to)
	const { data, error, count } = await query

	if (error) {
		console.error('Error fetching time slots:', error.message)
		return []
	}

	let transformedData = await Promise.all(
		data.map(async (slot: any) => {
			let users: any[] = []
			if (
				!filters.isPrivateTraining &&
				slot.user_id &&
				slot.user_id.length > 0
			) {
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('user_id, first_name, last_name')
					.in('user_id', slot.user_id)

				if (userError) {
					console.error(
						'Error fetching users for group time slot:',
						userError.message
					)
				} else {
					users = userData
				}
			}

			return {
				id: slot.id,
				activity: {
					name: slot.activities.name,
					credits: slot.activities.credits,
					capacity: filters.isPrivateTraining
						? undefined
						: slot.activities.capacity
				},
				coach: { name: slot.coaches.name },
				date: slot.date,
				start_time: slot.start_time,
				end_time: slot.end_time,
				user: filters.isPrivateTraining ? slot.users : null,
				users: filters.isPrivateTraining ? undefined : users,
				booked: slot.booked
			}
		})
	)

	return { timeSlots: transformedData, totalCount: count ?? 0 }
}
export default async function TimeSlotsList({
	filters,
	page = 1
}: {
	filters: FilterParams
	page: number
}) {
	const pageSize = 30
	const { timeSlots, totalCount }: any = await fetchFilteredTimeSlots(
		filters,
		page,
		pageSize
	)
	const totalPages = Math.ceil(totalCount / pageSize)

	return (
		<TimeSlotListClient
			initialTimeSlots={timeSlots}
			isPrivateTraining={filters.isPrivateTraining}
			currentPage={page}
			totalPages={totalPages}
		/>
	)
}
