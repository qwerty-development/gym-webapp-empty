// app/admin/view-reservations/loading.tsx
import React from 'react'
import { RotateLoader } from 'react-spinners'

export default function Loading() {
	return (
		<div className='flex justify-center items-center h-screen bg-gray-800 '>
			<RotateLoader color={'#00B2FF'} loading={true} size={15} />
		</div>
	)
}
