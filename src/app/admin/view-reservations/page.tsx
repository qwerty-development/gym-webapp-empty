import React, { useState, useEffect } from 'react'
import CoachesandActivitiesAdminPage from '../../components/admin/editcoachesandactivities'
import NavbarComponent from '@/app/components/users/navbar'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'

import { Suspense } from 'react'
import TimeSlotsList, { FilterParams } from '@/app/TimeSlotsList'

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

	return (
		<div>
			<AdminNavbarComponent />

			<TimeSlotsList filters={filters} />
		</div>
	)
}

// // app/timeslots/page.tsx
// import { Suspense } from 'react'
// import TimeSlotsList, { FilterParams } from '@/app/TimeSlotsList'

// export default function TimeSlotsPage({
// 	searchParams
// }: {
// 	searchParams: { [key: string]: string | string[] | undefined }
// }) {
// 	const filters: FilterParams = {
// 		activity: searchParams.activity as string,
// 		coach: searchParams.coach as string,
// 		user: searchParams.user as string,
// 		date: searchParams.date as string,
// 		startTime: searchParams.startTime as string,
// 		endTime: searchParams.endTime as string,
// 		booked:
// 			searchParams.booked === 'true'
// 				? true
// 				: searchParams.booked === 'false'
// 				? false
// 				: undefined,
// 		isPrivateTraining: searchParams.isPrivateTraining !== 'false'
// 	}

// 	return (
// 		<Suspense fallback={<h1>Loading...</h1>}>
// 			<TimeSlotsList filters={filters} />
// 		</Suspense>
// 	)
// }
