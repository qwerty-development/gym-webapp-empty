// app/admin/view-reservations/not-found.tsx
import React from 'react'
import Link from 'next/link'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'

export default function NotFound() {
	return (
		<div>
			<AdminNavbarComponent />
			<div className='flex flex-col items-center justify-center h-screen'>
				<h2 className='text-2xl font-bold mb-4'>404 - Page Not Found</h2>
				<p className='mb-4'>The page you are looking for does not exist.</p>
				<Link
					href='/admin/view-reservations'
					className='text-green-500 hover:underline'>
					Return to Reservations
				</Link>
			</div>
		</div>
	)
}
