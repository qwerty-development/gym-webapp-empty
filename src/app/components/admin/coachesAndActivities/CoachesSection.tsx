'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'
import FileUploadDropzone from '../FileUploadDropzone'

type CoachesSectionProps = {
	coaches: any[]
	loading: boolean
	buttonLoading: boolean
	newCoachName: string
	setNewCoachName: (name: string) => void
	newCoachEmail: string
	setNewCoachEmail: (email: string) => void
	handleAddCoach: () => void
	handleDeleteCoach: (id: number) => void
	handleToggleForm: (id: number) => void
	handleFileChange: (file: File) => void
	showUpdateForm: boolean
	updateCoachId: number | null
	updatedCoachName: string
	setUpdatedCoachName: (name: string) => void
	updatedCoachEmail: string
	setUpdatedCoachEmail: (email: string) => void
	handleSubmitUpdate: () => void
}

const CoachesSection: React.FC<CoachesSectionProps> = ({
	coaches,
	loading,
	buttonLoading,
	newCoachName,
	setNewCoachName,
	newCoachEmail,
	setNewCoachEmail,
	handleAddCoach,
	handleDeleteCoach,
	handleToggleForm,
	handleFileChange,
	showUpdateForm,
	updateCoachId,
	updatedCoachName,
	setUpdatedCoachName,
	updatedCoachEmail,
	setUpdatedCoachEmail,
	handleSubmitUpdate
}) => {
	return (
		<section className='mb-16'>
			<h2 className='text-3xl font-bold mb-8 text-green-400'>Coaches</h2>
			<motion.div
				className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'
				whileHover={{ scale: 1.02 }}>
				<div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4'>
					<input
						type='text'
						value={newCoachName}
						onChange={e => setNewCoachName(e.target.value)}
						placeholder='New Coach Name'
						className='w-full sm:w-1/3 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					<input
						type='email'
						value={newCoachEmail}
						onChange={e => setNewCoachEmail(e.target.value)}
						placeholder='New Coach Email'
						className='w-full sm:w-1/3 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					<FileUploadDropzone onFileChange={handleFileChange} />
					<motion.button
						onClick={handleAddCoach}
						disabled={buttonLoading}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='w-full sm:w-auto px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
						<FaPlus className='inline mr-2' /> Add Coach
					</motion.button>
				</div>
			</motion.div>

			{loading ? (
				<div className='flex justify-center items-center'>
					<RingLoader color='#10B981' size={60} />
				</div>
			) : (
				<AnimatePresence>
					{coaches.map((coach: any) => (
						<motion.div
							key={coach.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
							className='bg-gray-800 rounded-xl p-6 mb-4 shadow-lg hover:shadow-green-500/30 transition duration-300'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-4'>
									<img
										src={coach.profile_picture}
										alt={`Profile of ${coach.name}`}
										className='w-12 h-12 rounded-full border-2 border-green-500'
									/>
									<div>
										<span className='text-xl font-semibold'>{coach.name}</span>
										<p className='text-sm text-gray-400'>{coach.email}</p>
									</div>
								</div>
								<div className='flex space-x-2'>
									<motion.button
										disabled={buttonLoading}
										onClick={() => handleToggleForm(coach.id)}
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										className='p-2 bg-yellow-700 disabled:bg-yellow-300 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
										<FaEdit />
									</motion.button>
									<motion.button
										disabled={buttonLoading}
										onClick={() => handleDeleteCoach(coach.id)}
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										className='p-2 bg-red-700 disabled:bg-red-300 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
										<FaTrash />
									</motion.button>
								</div>
							</div>
							<AnimatePresence>
								{showUpdateForm && updateCoachId === coach.id && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.3 }}
										className='mt-4 space-y-4'>
										<input
											type='text'
											value={updatedCoachName}
											onChange={e => setUpdatedCoachName(e.target.value)}
											placeholder='New Coach Name'
											className='w-full p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
										/>
										<input
											type='email'
											value={updatedCoachEmail}
											onChange={e => setUpdatedCoachEmail(e.target.value)}
											placeholder='New Coach Email'
											className='w-full p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
										/>
										<FileUploadDropzone onFileChange={handleFileChange} />
										<motion.button
											disabled={buttonLoading}
											onClick={handleSubmitUpdate}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className='w-full px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
											Update
										</motion.button>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</AnimatePresence>
			)}
		</section>
	)
}

export default CoachesSection
