'use client'
import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import {
	fetchUsers,
	updateUserCredits,
	updateUserisFree
} from '../../../../utils/admin-requests'
import toast from 'react-hot-toast'

interface User {
	id: number
	username: string
	first_name: string
	last_name: string
	created_at: string
	wallet?: number
	isFree?: boolean
}

const ModifyCreditsComponent = () => {
	const [users, setUsers] = useState<User[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [searchTrigger, setSearchTrigger] = useState(0)
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [newCredits, setNewCredits] = useState('')
	const [isUpdating, setIsUpdating] = useState(false)
	const [sortOption, setSortOption] = useState('alphabetical')
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [sale, setSale] = useState(0)

	useEffect(() => {
		setIsLoading(true)
		fetchUsers(searchQuery)
			.then(data => {
				if (data) {
					let sortedUsers = data as User[]
					if (sortOption === 'alphabetical') {
						sortedUsers = sortedUsers.sort((a, b) =>
							a.first_name.localeCompare(b.first_name)
						)
					} else if (sortOption === 'newest') {
						sortedUsers = sortedUsers.sort(
							(a, b) =>
								new Date(b.created_at).getTime() -
								new Date(a.created_at).getTime()
						)
					}
					setUsers(sortedUsers)
				}
			})
			.catch(error => {
				console.error('Error fetching users:', error)
			})
			.finally(() => {
				setIsLoading(false)
			})
	}, [searchTrigger, sortOption])

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortOption(e.target.value)
	}

	const handleToggleFree = async (userId: number, currentIsFree: boolean) => {
		setIsUpdating(true)
		try {
			const { error } = await updateUserisFree(userId, !currentIsFree)
			if (!error) {
				setUsers(prevUsers =>
					prevUsers.map(user => {
						if (user.id === userId) {
							return { ...user, isFree: !currentIsFree }
						}
						return user
					})
				)
				toast.success('User free status updated successfully')
			} else {
				toast.error('Failed to update user free status.')
			}
		} catch (error) {
			console.error('Update failed:', error)
			toast.error('Failed to update user free status.')
		} finally {
			setIsUpdating(false)
		}
	}

	const handleUpdateCredits = async () => {
		if (selectedUserId !== null && newCredits) {
			setIsUpdating(true)
			try {
				let creditChange = parseInt(newCredits, 10)
				creditChange = creditChange * (1 + sale / 100)
				const currentUser = users.find(user => user.id === selectedUserId)
				if (currentUser) {
					const updatedCredits = (currentUser.wallet || 0) + creditChange
					const { error } = await updateUserCredits(
						selectedUserId,
						updatedCredits
					)
					if (!error) {
						setUsers(prevUsers =>
							prevUsers.map(user => {
								if (user.id === selectedUserId) {
									return { ...user, wallet: updatedCredits }
								}
								return user
							})
						)
						toast.success('User credits updated successfully')
					} else {
						toast.error('Failed to update user credits.')
					}
				} else {
					console.error('User not found:', selectedUserId)
					toast.error('User not found. Please try again.')
				}
			} catch (error) {
				console.error('Update failed:', error)
				toast.error('Failed to update user credits.')
			} finally {
				setIsUpdating(false)
				setSelectedUserId(null)
				setNewCredits('')
				setModalIsOpen(false)
			}
		}
	}

	const openModal = (userId: number) => {
		setSelectedUserId(userId)
		setModalIsOpen(true)
	}
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleSearch = () => {
		setSearchTrigger(prev => prev + 1) // Increment to trigger useEffect
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}
	return (
		<div className='container mx-auto px-4 py-6'>
			<div className='mb-4 flex flex-col lg:flex-row gap-5'>
				<div className='flex-grow flex'>
					<input
						type='text'
						placeholder='Search by username, first name, or last name'
						value={searchQuery}
						onChange={handleSearchChange}
						onKeyPress={handleKeyPress}
						disabled={isUpdating || isLoading}
						className='w-full p-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none text-gray-500 focus:ring-2 focus:ring-blue-500'
					/>
					<button
						onClick={handleSearch}
						disabled={isUpdating || isLoading}
						className='px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
						Search
					</button>
				</div>

				<select
					value={sortOption}
					onChange={handleSortChange}
					disabled={isUpdating || isLoading}
					className='w-fit p-2 text-gray-400 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'>
					<option value='alphabetical'>Sort Alphabetically</option>
					<option value='newest'>Sort by Newest</option>
				</select>
			</div>

			<div className='overflow-x-auto relative shadow-md sm:rounded-lg'>
				<table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
					<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
						<tr>
							<th scope='col' className='py-3 px-6 text-left'>
								Username
							</th>
							<th scope='col' className='py-3 px-6 text-left'>
								First Name
							</th>
							<th scope='col' className='py-3 px-6 text-left'>
								Last Name
							</th>
							<th scope='col' className='py-3 px-6 text-left'>
								Wallet
							</th>
							<th scope='col' className='py-3 px-6 text-center'>
								is Free
							</th>
							<th scope='col' className='py-3 px-6 text-right'>
								Add or Remove Credits
							</th>
						</tr>
					</thead>
					<tbody>
						{users.map(user => (
							<tr
								key={user.id}
								className='bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'>
								<td className='py-4 px-6'>{user.username}</td>
								<td className='py-4 px-6'>{user.first_name}</td>
								<td className='py-4 px-6'>{user.last_name}</td>
								<td className='py-4 px-6'>{user.wallet}</td>
								<td className='py-4 px-6 text-center'>
									<input
										type='checkbox'
										disabled={isUpdating || isLoading}
										checked={user.isFree || false}
										onChange={() =>
											handleToggleFree(user.id, user.isFree || false)
										}
									/>
								</td>
								<td className='py-4 px-6 text-right'>
									<button
										onClick={() => openModal(user.id)}
										disabled={isUpdating || isLoading}
										className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
										Modify
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Update Credits'
				className='modal'
				overlayClassName='overlay'>
				<h2 className='text-2xl font-bold mb-4 text-black'>Update Credits</h2>
				<div className='flex flex-col items-center'>
					<input
						type='number'
						placeholder='New Credits'
						value={newCredits}
						disabled={isUpdating || isLoading}
						onChange={e => setNewCredits(e.target.value)}
						className='p-2 border text-gray-400 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 '
					/>
					<div className='flex flex-row justify-center items-center gap-1'>
						<label className='text-gray-400' htmlFor='sales'>
							Sale %
						</label>
						<input
							id='sales'
							type='number'
							placeholder='Sale %'
							value={sale}
							min={0}
							max={100}
							disabled={isUpdating || isLoading}
							onChange={e => setSale(parseInt(e.target.value))}
							className='p-2 border text-gray-400 border-gray-300 mt-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4'
						/>
					</div>
					<div className='flex flex-row justify-between gap-5'>
						<button
							onClick={handleUpdateCredits}
							disabled={isUpdating || isLoading}
							className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 '>
							Update
						</button>
						<button
							onClick={() => setModalIsOpen(false)}
							className='px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ModifyCreditsComponent
