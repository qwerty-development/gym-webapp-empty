'use client'
// components/FilterComponent.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface FilterProps {
	filter: {
		activity: string
		coach: string
		user: string
		date: string
		startTime: string
		endTime: string
	}
	bookedFilter: string
	handleFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	handleBookedFilterChange: (
		event: React.ChangeEvent<HTMLSelectElement>
	) => void
	clearFilters: () => void
	applyFilters: () => void
}

const FilterComponent: React.FC<FilterProps> = ({
	filter,
	bookedFilter,
	handleFilterChange,
	handleBookedFilterChange,
	clearFilters,
	applyFilters
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className='bg-gray-800 p-6 rounded-lg shadow-lg mb-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				<input
					type='text'
					name='activity'
					placeholder='Filter by Activity...'
					value={filter.activity}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
				<input
					type='text'
					name='coach'
					placeholder='Filter by Coach...'
					value={filter.coach}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
				<input
					type='text'
					name='user'
					placeholder='Filter by User...'
					value={filter.user}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
				<select
					onChange={handleBookedFilterChange}
					value={bookedFilter}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'>
					<option value='all'>All</option>
					<option value='booked'>Booked</option>
					<option value='notBooked'>Not Booked</option>
				</select>
				<input
					type='date'
					name='date'
					value={filter.date}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
				<input
					type='time'
					name='startTime'
					value={filter.startTime}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
				<input
					type='time'
					name='endTime'
					value={filter.endTime}
					onChange={handleFilterChange}
					className='w-full p-2 bg-gray-700 border border-gray-600 rounded-md'
				/>
			</div>
			<div className='flex justify-end mt-4 gap-x-4'>
				<button
					onClick={clearFilters}
					className='bg-red-700 border-solid p-2 rounded-xl cursor-pointer hover:shadow-xl hover:shadow-red-600'>
					Clear Filters
				</button>
				<button
					onClick={applyFilters}
					className='bg-green-400 border-solid p-2 rounded-xl cursor-pointer hover:shadow-xl hover:shadow-green-700'>
					Apply Filters
				</button>
			</div>
		</motion.div>
	)
}

export default FilterComponent
