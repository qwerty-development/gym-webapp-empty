'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSearch } from 'react-icons/fa'

export const SearchUsers = () => {
	const router = useRouter()
	const pathname = usePathname()

	return (
		<div className='max-w-lg mx-auto my-8 p-6 bg-gray-800 rounded-2xl shadow-lg hover:shadow-green-500/30 transition duration-300'>
			<form
				onSubmit={async e => {
					e.preventDefault()
					const form = e.currentTarget
					const formData = new FormData(form)
					const queryTerm = formData.get('search') as string
					router.push(pathname + '?search=' + queryTerm)
				}}
				className='flex flex-col space-y-4'>
				<label htmlFor='search' className='text-lg font-medium text-green-400'>
					Search for Users
				</label>
				<div className='relative'>
					<input
						id='search'
						name='search'
						type='text'
						className='w-full px-4 py-3 bg-gray-700 text-white border-2 border-green-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						placeholder='Enter a name or email'
					/>
					<button
						type='submit'
						className='absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-300'>
						<FaSearch />
					</button>
				</div>
			</form>
		</div>
	)
}
