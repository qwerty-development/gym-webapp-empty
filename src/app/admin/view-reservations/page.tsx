// app/admin/view-reservations/page.tsx
import React, { Suspense } from 'react'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'
import TimeSlotsList, { FilterParams } from '@/app/TimeSlotsList'
import Loading from './loading'

export default function ViewReservationsPage({
	searchParams
}: {
	searchParams: { [key: string]: string | string[] | undefined }
}) {
	const page = parseInt(searchParams.page as string) || 1
	const filters: FilterParams = {
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
		isPrivateTraining: searchParams.isPrivateTraining === 'true'
	}

	return (
		<div>
			<AdminNavbarComponent />
			<Suspense fallback={<Loading />}>
				<TimeSlotsList filters={filters} page={page} />
			</Suspense>
		</div>
	)
}

// Implement this function to validate your filters
