// app/admin/view-reservations/loading.tsx
import React from 'react'
import { RotateLoader } from 'react-spinners'

export default function Loading() {
	return (
		<div className='flex justify-center items-center h-screen'>
			<RotateLoader color={'#4ADE80'} loading={true} size={15} />
		</div>
	)
}
