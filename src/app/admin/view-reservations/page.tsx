import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'
import ViewReservationsComponent from '@/app/components/admin/viewreservations'

export default function viewreservations() {
	if (!checkRoleAdmin('admin')) {
		redirect('/')
	}
	return (
		<div>
			<AdminNavbarComponent />
			<section className='mt-5'>
				<ViewReservationsComponent />
			</section>
			<section className='container mt-5 mx-auto px-4 sm:px-6 lg:px-8'></section>
		</div>
	)
}
