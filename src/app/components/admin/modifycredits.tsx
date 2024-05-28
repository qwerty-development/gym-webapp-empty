'use client'
import React, { useState, useEffect } from 'react'
import { fetchUsers, updateUserCredits } from '../../../../utils/admin-requests'
import toast from 'react-hot-toast'

// Assuming this is the structure of your user data
interface User {
	id: number
	username: string
	first_name: string
	last_name: string
	wallet?: number // Make sure credits property is defined
}

const ModifyCreditsComponent = () => {
	const [users, setUsers] = useState<User[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [newCredits, setNewCredits] = useState('')
	const [isUpdating, setIsUpdating] = useState(false)

	useEffect(() => {
		fetchUsers(searchQuery)
			.then(data => {
				if (data) {
					setUsers(data as User[])
				}
			})
			.catch(error => {
				console.error('Error fetching users:', error)
			})
	}, [searchQuery])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleUpdateCredits = async () => {
		if (selectedUserId !== null && newCredits) {
			setIsUpdating(true)
			try {
				const creditChange = parseInt(newCredits, 10) // Parse the input to get the change in credits
				const currentUser = users.find(user => user.id === selectedUserId) // Find the current user details
				if (currentUser) {
					const updatedCredits = (currentUser.wallet || 0) + creditChange // Calculate new credits total
					// Attempt to update user credits
					const { error } = await updateUserCredits(
						selectedUserId,
						updatedCredits
					)
					if (!error) {
						// Update the credits in the users state
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
			<div className='mb-4'>
				<input
					type='text'
					placeholder='Search by username, first name, or last name'
					value={searchQuery}
					onChange={handleSearchChange}
					className='w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			</div>
			<div className='overflow-x-auto relative shadow-md sm:rounded-lg'>
				<table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
					<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
						<tr>
							<th scope='col' className='py-3 px-6'>
								Username
							</th>
							<th scope='col' className='py-3 px-6'>
								First Name
							</th>
							<th scope='col' className='py-3 px-6'>
								Last Name
							</th>
							<th scope='col' className='py-3 px-6'>
								Wallet
							</th>
							<th scope='col' className='py-3 px-6'>
								Actions
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
