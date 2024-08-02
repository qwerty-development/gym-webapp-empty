'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { FaCheck, FaTimes } from 'react-icons/fa'

interface TableProps {
	timeSlots: any[]
	isPrivateTraining: boolean
	selectedSlots: number[]
	handleCheckboxChange: (index: number) => void
	cancelBooking: (reservation: any) => void
	removeUserFromGroup: (timeSlotId: any, userId: any, credits: any) => void
}

const TableComponent: React.FC<TableProps> = ({
	timeSlots,
	isPrivateTraining,
	selectedSlots,
	handleCheckboxChange,
	cancelBooking,
	removeUserFromGroup
}) => {
	return (
		<div className='overflow-x-auto w-full'>
			<table className='w-full min-w-[800px] table-auto text-sm text-left text-gray-400'>
				<thead className='text-xs uppercase bg-blue-100 sticky top-0'>
					<tr>
						<th className='px-4 py-3'>Select</th>
						<th className='px-4 py-3 text-center'>Cancel</th>
						<th className='px-4 py-3'>Activity</th>
						<th className='px-4 py-3'>Coach Name</th>
						<th className='px-4 py-3'>Date</th>
						<th className='px-4 py-3'>Start Time</th>
						<th className='px-4 py-3'>End Time</th>
						<th className='px-4 py-3'>Name</th>
						<th className='px-4 py-3'>Booked</th>
						<th className='px-4 py-3'>Credits</th>
						{!isPrivateTraining && <th className='px-4 py-3'>Capacity</th>}
					</tr>
				</thead>
				<tbody>
					{timeSlots.map((slot, index) => (
						<motion.tr
							key={index}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3 }}
							className='bg-white border-b border-blue-200 hover:bg-blue-50'>
							<td className='px-4 py-3 truncate'>
								<input
									type='checkbox'
									disabled={slot.booked}
									onChange={() => handleCheckboxChange(index)}
									checked={selectedSlots.includes(index)}
									className='form-checkbox h-5 w-5 text-blue-500'
								/>
							</td>
							<td className='py-3 flex flex-row justify-center'>
								{slot.booked ? (
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() => cancelBooking(slot)}
										className='p-2 bg-orange-500 text-white rounded-full text-center hover:bg-orange-600'>
										<FaTimes className='text-center mx-auto' />
									</motion.button>
								) : (
									<div className='p-2 bg-gray-300 text-white text-center rounded-full opacity-50 cursor-not-allowed'>
										<FaTimes className='text-center mx-auto' />
									</div>
								)}
							</td>
							<td className='px-4 py-3'>{slot.activity?.name ?? 'N/A'}</td>
							<td className='px-4 py-3'>{slot.coach?.name ?? 'N/A'}</td>
							<td className='px-4 py-3'>{slot.date}</td>
							<td className='px-4 py-3'>{slot.start_time}</td>
							<td className='px-4 py-3'>{slot.end_time}</td>
							<td className='px-4 py-3'>
								{slot.user && isPrivateTraining
									? `${slot.user.first_name} ${slot.user.last_name}`
									: slot.users && slot.users.length > 0
									? slot.users.map((user: any, userIndex: any) => (
											<div
												key={userIndex}
												className='flex items-center justify-between bg-blue-50 p-2 rounded-md mb-1'>
												<span>
													{user
														? `${user.first_name} ${user.last_name}`
														: 'N/A'}
												</span>
												<motion.button
													whileHover={{ scale: 1.1 }}
													whileTap={{ scale: 0.9 }}
													onClick={() =>
														removeUserFromGroup(
															slot.id,
															user.user_id,
															slot.activity?.credits
														)
													}
													className='ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600'>
													<FaTimes size={12} />
												</motion.button>
											</div>
									  ))
									: 'N/A'}
							</td>
							<td className='px-4 py-3'>
								{slot.booked ? (
									<FaCheck className='text-green-500' />
								) : (
									<FaTimes className='text-red-500 text-center' />
								)}
							</td>
							<td className='px-4 py-3'>{slot.activity?.credits ?? 'N/A'}</td>
							{!isPrivateTraining && (
								<td className='px-4 py-3'>
									{slot.activity?.capacity ?? 'N/A'}
								</td>
							)}
						</motion.tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default TableComponent
