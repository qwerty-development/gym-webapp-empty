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
			className='bg-gray-700 p-6 rounded-lg shadow-lg mb-6 text-green-500 border border-blue-200'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				<input
					type='text'
					name='activity'
					placeholder='Filter by Activity...'
					value={filter.activity}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
				<input
					type='text'
					name='coach'
					placeholder='Filter by Coach...'
					value={filter.coach}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
				<input
					type='text'
					name='user'
					placeholder='Filter by User...'
					value={filter.user}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
				<select
					onChange={handleBookedFilterChange}
					value={bookedFilter}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'>
					<option value='all'>All</option>
					<option value='booked'>Booked</option>
					<option value='notBooked'>Not Booked</option>
				</select>
				<input
					type='date'
					name='date'
					value={filter.date}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
				<input
					type='time'
					name='startTime'
					value={filter.startTime}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
				<input
					type='time'
					name='endTime'
					value={filter.endTime}
					onChange={handleFilterChange}
					className='w-full p-2 bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
				/>
			</div>
			<div className='flex justify-end mt-4 gap-x-4'>
				<button
					onClick={clearFilters}
					className='bg-red-500 text-white border-solid p-2 rounded-xl cursor-pointer hover:bg-red-600 transition duration-300'>
					Clear Filters
				</button>
				<button
					onClick={applyFilters}
					className='bg-green-500 text-white border-solid p-2 rounded-xl cursor-pointer hover:bg-blue-600 transition duration-300'>
					Apply Filters
				</button>
			</div>
		</motion.div>
	)
}

export default FilterComponent
