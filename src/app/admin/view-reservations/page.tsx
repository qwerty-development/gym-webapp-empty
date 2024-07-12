import React, { useState, useEffect } from 'react'
import CoachesandActivitiesAdminPage from '../../components/admin/editcoachesandactivities'
import NavbarComponent from '@/app/components/users/navbar'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'
import ViewReservationsComponent from '@/app/components/admin/viewreservations'

export default function viewreservations() {
	if (!checkRoleAdmin('admin')) {
		redirect('/')
	}
	return (
		<div className='bg-gray-900'>
			<AdminNavbarComponent />
			<section className=''>
				<ViewReservationsComponent />
			</section>
		</div>
	)
}
