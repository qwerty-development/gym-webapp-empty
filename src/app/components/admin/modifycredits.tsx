'use client'
import React, { useState, useEffect } from 'react'
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
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [newCredits, setNewCredits] = useState('')
	const [isUpdating, setIsUpdating] = useState(false)
	const [sortOption, setSortOption] = useState('alphabetical')

	useEffect(() => {
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
	}, [searchQuery, sortOption])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

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
				const creditChange = parseInt(newCredits, 10)
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
			}
		}
	}

	return (
		<div className='container mx-auto px-4 py-6'>
			<div className='mb-4 flex flex-col lg:flex-row justify-between gap-5'>
				<input
					type='text'
					placeholder='Search by username, first name, or last name'
					value={searchQuery}
					onChange={handleSearchChange}
					className='w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				<select
					value={sortOption}
					onChange={handleSortChange}
					className='w-fit p-2 border text-gray-400 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'>
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
										checked={user.isFree || false}
										onChange={() =>
											handleToggleFree(user.id, user.isFree || false)
										}
									/>
								</td>
								<td className='py-4 px-6 text-right'>
									{selectedUserId === user.id ? (
										<div className='flex items-center justify-end space-x-2'>
											<input
												type='number'
												placeholder='New Credits'
												value={newCredits}
												onChange={e => setNewCredits(e.target.value)}
												className='p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
											/>
											<button
												onClick={handleUpdateCredits}
												className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
												Update
											</button>
										</div>
									) : (
										<button
											onClick={() => setSelectedUserId(user.id)}
											className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
											+ or -
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default ModifyCreditsComponent
