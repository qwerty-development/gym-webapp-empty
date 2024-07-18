// app/admin/view-reservations/page.tsx
import React, { Suspense } from 'react'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'
import TimeSlotsList, { FilterParams } from '@/app/TimeSlotsList'
import Loading from './loading'

export default function TimeSlotsPage({
	searchParams
}: {
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	if (!checkRoleAdmin('admin')) {
		redirect('/')
	}

	const filters: FilterParams = {
		searchTerm: searchParams.searchTerm as string,
		activity: searchParams.activity as string,
		coach: searchParams.coach as string,
		user: searchParams.user as string,
		date: searchParams.date as string,
		startTime: searchParams.startTime as string,
		endTime: searchParams.endTime as string,
		booked:
			searchParams.booked === 'true'
				? true
				: searchParams.booked === 'false'
				? false
				: undefined,
		isPrivateTraining: searchParams.isPrivateTraining !== 'false'
	}

	// Check if the filters are valid (you may need to implement this function)

	return (
		<div>
			<AdminNavbarComponent />

			<TimeSlotsList filters={filters} />
		</div>
	)
}

// Implement this function to validate your filters
