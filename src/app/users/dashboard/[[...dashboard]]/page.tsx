'use client'
import React, { useState, useEffect } from 'react'
import NavbarComponent from '@/app/components/users/navbar'
import { UserButton, useUser } from '@clerk/nextjs'
import {
	fetchReservations,
	fetchReservationsGroup,
	updateUserRecord,
	cancelReservation,
	cancelReservationGroup,
	fetchAllActivities,
	fetchMarket,
	payForItems,
	payForGroupItems
} from '../../../../../utils/user-requests'
import { AddToCalendarButton } from 'add-to-calendar-button-react'
import { RingLoader } from 'react-spinners'
import { useWallet } from '@/app/components/users/WalletContext'
import toast from 'react-hot-toast'
import { showConfirmationToast } from '@/app/components/users/ConfirmationToast'
import Modal from 'react-modal'
import { motion, AnimatePresence } from 'framer-motion'
import { FaUser, FaCalendarAlt, FaUsers, FaBars, FaClock } from 'react-icons/fa'
import Link from 'next/link'
import useConfirmationModal from '../../../../../utils/useConfirmationModel'
import ConfirmationModal from '@/app/components/users/ConfirmationModal'

type Reservation = {
	id: number
	date: string
	start_time: string
	end_time: string
	count?: number
	coach: {
		id?: number
		name: string
	}
	activity: {
		id?: number
		name: string
		credits: number
	}
	additions: string[]
}

type GroupReservation = {
	id: number
	date: string
	start_time: string
	end_time: string
	coach: {
		id?: number
		name: string
	}
	activity: {
		id?: string
		name: string
		credits: number
	}
	count: number
	additions: {
		user_id: string
		items: { id: string; name: string; price: number }[]
	}[]
}

type Activity = {
	id: number
	name: string
}

export default function Dashboard() {
	const {
		isOpen,
		message,
		showConfirmationModal,
		handleConfirm,
		handleCancels
	} = useConfirmationModal()
	const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
	const [selectedReservation, setSelectedReservation] = useState<
		Reservation | GroupReservation | null
	>(null)
	const [selectedItems, setSelectedItems] = useState<any[]>([])
	const [totalPrice, setTotalPrice] = useState<number>(0)
	const [activeTab, setActiveTab] = useState('individual')
	const [sidebarOpen, setSidebarOpen] = useState(false)

	const { isLoaded, isSignedIn, user } = useUser()
	const [reservations, setReservations] = useState<Reservation[]>([])
	const [groupReservations, setGroupReservations] = useState<
		GroupReservation[]
	>([])
	const [activities, setActivities] = useState<Activity[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true) // State to track loading status
	const { refreshWalletBalance } = useWallet()
	const [market, setMarket] = useState<any[]>([])
	useEffect(() => {
		const fetchMarketItems = async () => {
			const marketData = await fetchMarket()
			setMarket(marketData)
		}
		fetchMarketItems()
	}, [])

	useEffect(() => {
		const fetchData = async () => {
			if (isLoaded && isSignedIn) {
				setIsLoading(true)
				await updateUserRecord({
					userId: user.id,
					email: user.emailAddresses[0]?.emailAddress,
					firstName: user.firstName,
					lastName: user.lastName,
					userName: user.username,
					phone: user.phoneNumbers[0]?.phoneNumber
				})

				const fetchedReservations = await fetchReservations(user.id)
				if (fetchedReservations) {
					const transformedReservations = fetchedReservations.map(
						(reservation: any) => ({
							id: reservation.id,
							date: reservation.date,
							start_time: reservation.start_time
								.split(':')
								.slice(0, 2)
								.join(':'),
							end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
							coach: { name: reservation.coach.name, id: reservation.coach.id },
							activity: {
								name: reservation.activity.name,
								credits: reservation.activity.credits,
								id: reservation.activity.id
							},
							additions: reservation.additions
						})
					)

					setReservations(transformedReservations)
				}

				const fetchedGroupReservations = await fetchReservationsGroup(user.id)
				if (fetchedGroupReservations) {
					const transformedGroupReservations = fetchedGroupReservations.map(
						(reservation: any) => ({
							id: reservation.id,
							date: reservation.date,
							start_time: reservation.start_time
								.split(':')
								.slice(0, 2)
								.join(':'),
							end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
							coach: { name: reservation.coach.name, id: reservation.coach.id },
							activity: {
								name: reservation.activity.name,
								credits: reservation.activity.credits,
								id: reservation.activity.id
							},
							count: reservation.count,
							additions: reservation.additions
								? reservation.additions.filter(
										(addition: any) => addition.user_id === user.id
								  )
								: []
						})
					)

					setGroupReservations(transformedGroupReservations)
				}

				const fetchedActivities = await fetchAllActivities()
				if (fetchedActivities) {
					setIsLoading(false)
					setActivities(fetchedActivities)
				}
			}
		}
		fetchData()
	}, [isLoaded, isSignedIn, user])

	const [buttonLoading, setButtonLoading] = useState(false)
	const handleItemSelect = (item: any) => {
		const alreadySelected = selectedItems.find(
			selectedItem => selectedItem.id === item.id
		)
		let newSelectedItems
		if (alreadySelected) {
			newSelectedItems = selectedItems.filter(
				selectedItem => selectedItem.id !== item.id
			)
		} else {
			newSelectedItems = [...selectedItems, item]
		}
		setSelectedItems(newSelectedItems)

		const newTotalPrice = newSelectedItems.reduce(
			(total, currentItem) => total + currentItem.price,
			0
		)
		setTotalPrice(newTotalPrice)
	}

	const handlePay = async () => {
		setButtonLoading(true)
		console.log(selectedReservation)
		const response = selectedReservation?.count
			? await payForGroupItems({
					userId: user?.id,
					activityId: selectedReservation?.activity.id,
					coachId: selectedReservation?.coach.id,
					date: selectedReservation?.date,
					startTime: selectedReservation?.start_time,
					selectedItems
			  })
			: await payForItems({
					userId: user?.id,
					activityId: selectedReservation?.activity.id,
					coachId: selectedReservation?.coach.id,
					date: selectedReservation?.date,
					startTime: selectedReservation?.start_time,
					selectedItems
			  })

		setButtonLoading(false)
		if (response.error) {
			toast.error(response.error)
		} else {
			toast.success('Items Added Successfully')
			setSelectedItems([])
			setTotalPrice(0)
			setModalIsOpen(false)
			refreshWalletBalance()
			const fetchedReservations = await fetchReservations(user?.id)
			if (fetchedReservations) {
				const transformedReservations = fetchedReservations.map(
					(reservation: any) => ({
						id: reservation.id,
						date: reservation.date,
						start_time: reservation.start_time.split(':').slice(0, 2).join(':'),
						end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
						coach: { name: reservation.coach.name, id: reservation.coach.id },
						activity: {
							name: reservation.activity.name,
							credits: reservation.activity.credits,
							id: reservation.activity.id
						},
						additions: reservation.additions
					})
				)

				setReservations(transformedReservations)
			}

			const fetchedGroupReservations = await fetchReservationsGroup(user?.id)
			if (fetchedGroupReservations) {
				const transformedGroupReservations = fetchedGroupReservations.map(
					(reservation: any) => ({
						id: reservation.id,
						date: reservation.date,
						start_time: reservation.start_time.split(':').slice(0, 2).join(':'),
						end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
						coach: { name: reservation.coach.name, id: reservation.coach.id },
						activity: {
							name: reservation.activity.name,
							credits: reservation.activity.credits,
							id: reservation.activity.id
						},
						count: reservation.count,
						additions: reservation.additions
							? reservation.additions.filter(
									(addition: any) => addition.user_id === user?.id
							  )
							: []
					})
				)

				setGroupReservations(transformedGroupReservations)
			}
		}
	}

	const openMarketModal = (reservation: Reservation | GroupReservation) => {
		setSelectedReservation(reservation)
		setModalIsOpen(true)
	}

	const handleCancel = async (reservationId: number) => {
		setButtonLoading(true)
		if (user) {
			const confirmed = await showConfirmationModal(
				'Are you sure you want to cancel this reservation?'
			)
			if (!confirmed) {
				setButtonLoading(false)
				return
			}

			const cancelled = await cancelReservation(
				reservationId,
				user.id,
				setReservations
			)

			if (cancelled) {
				refreshWalletBalance()
				toast.success('Reservation cancelled successfully!')
			} else {
				toast.error('Failed to cancel reservation!')
			}
		}
		setButtonLoading(false)
	}

	const handleCancelGroup = async (reservationId: number) => {
		setButtonLoading(true)
		if (user) {
			const confirmed = await showConfirmationModal(
				'Are you sure you want to cancel this group reservation?'
			)
			if (!confirmed) {
				setButtonLoading(false)
				return
			}

			const cancelled = await cancelReservationGroup(
				reservationId,
				user.id,
				setGroupReservations
			)

			if (cancelled) {
				refreshWalletBalance()
				toast.success('Group reservation cancelled successfully!')
			} else {
				toast.error('Failed to cancel group reservation!')
			}
		}
		setButtonLoading(false)
	}

	if (!isLoaded || !isSignedIn) {
		return null
	}

	type UnifiedReservation = Reservation | GroupReservation

	const allReservations: UnifiedReservation[] = [
		...reservations,
		...groupReservations
	]

	const upcomingThisWeek = allReservations.filter(r => {
		const reservationDate = new Date(r.date)
		const today = new Date()
		const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
		return reservationDate >= today && reservationDate <= weekFromNow
	}).length
	return (
		<div className='min-h-screen bg-gray-700 text-white font-sans'>
			<ConfirmationModal
				isOpen={isOpen}
				message={message}
				onConfirm={handleConfirm}
				onCancel={handleCancels}
			/>
			<NavbarComponent />

			{/* Navigation Tabs */}
			<div className='md:hidden sticky top-0 z-20 bg-gray-800 py-2 mb-4'>
				<div className='flex justify-center space-x-2'>
					<button
						onClick={() => setActiveTab('individual')}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'individual'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}>
						Individual
					</button>
					<button
						onClick={() => setActiveTab('group')}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'group'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}>
						Group
					</button>
				</div>
			</div>

			{/* Sidebar for larger screens */}
			<div className='hidden md:block fixed left-0 top-0 h-full w-max bg-gray-800 z-30 transform transition-transform duration-300 ease-in-out '>
				<h2 className='text-2xl font-bold mb-4 mt-16 md:mt-4 ml-1 text-green-500'>
					Menu
				</h2>
				<ul>
					<li
						className={`mb-5 p-2 px-6 ${
							activeTab === 'individual' ? 'bg-green-500' : ''
						}`}>
						<button
							onClick={() => setActiveTab('individual')}
							className={`flex items-center ${
								activeTab === 'group' ? 'hover:text-green-400' : ''
							} w-full text-left`}>
							<FaCalendarAlt size={35} className='mr-2' /> Individual
							Reservations
						</button>
					</li>
					<li
						className={`mb-10 p-2 px-6 ${
							activeTab === 'group' ? 'bg-green-500' : ''
						}`}>
						<button
							onClick={() => setActiveTab('group')}
							className={`flex items-center ${
								activeTab === 'individual' ? 'hover:text-green-400' : ''
							} w-full text-left`}>
							<FaUsers size={35} className='mr-2' /> Group Reservations
						</button>
					</li>
				</ul>
			</div>

			<div className='md:ml-64 p-4 md:p-8'>
				{/* User Profile Card */}
				<motion.div
					initial={{ opacity: 0, y: -50 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-green-600 rounded-lg p-4 md:p-6 mb-6 md:mb-8'>
					<div className='flex items-center'>
						<div className='mr-5'>
							<UserButton
								userProfileMode='navigation'
								userProfileUrl=''
								afterSignOutUrl='/'
								appearance={{
									elements: {
										userButtonBox: 'scale-150 pointer-events-none',
										userButtonOuterIdentifier: 'bg-green-500'
									}
								}}
							/>
						</div>
						<div>
							<h2 className='text-xl md:text-2xl font-bold'>
								{user.firstName} {user.lastName}
							</h2>
							<p className='text-sm md:text-base text-gray-200'>
								@{user.username}
							</p>
						</div>
					</div>
				</motion.div>

				{/* Reservations */}
				<AnimatePresence mode='wait'>
					{isLoading ? (
						<motion.div
							key='loader'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='flex justify-center items-center h-64'>
							<RingLoader color={'#10B981'} size={100} />
						</motion.div>
					) : (
						<motion.div
							key='content'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='flex flex-col  md:-mt-0 lg:flex-row gap-8 '>
							<div className='lg:w-1/4 space-y-6 mt-0 md:mt-[4.57rem] '>
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className='bg-gray-800 rounded-xl p-6 shadow-lg  hover:shadow-green-500 '>
									<h3 className='text-2xl font-bold text-green-400 mb-4'>
										Quick Stats
									</h3>
									<div className='space-y-4'>
										<div>
											<p className='text-gray-300'>Total Reservations</p>
											<p className='text-3xl font-bold text-white'>
												{reservations.length + groupReservations.length}
											</p>
										</div>
										<div>
											<p className='text-gray-300'>Upcoming This Week</p>
											<p className='text-3xl font-bold text-white'>
												{upcomingThisWeek}
											</p>
										</div>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2 }}
									className='hidden md:block bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500 '>
									<h3 className='text-2xl font-bold text-green-400 mb-4'>
										Popular Activities
									</h3>
									<ul className='space-y-2'>
										{activities.slice(0, 5).map((activity, index) => (
											<li
												key={activity.id}
												className='text-gray-300 flex items-center'>
												<span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
												{activity.name}
											</li>
										))}
									</ul>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.4 }}
									className='hidden md:block bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500'>
									<h3 className='text-2xl font-bold text-green-400 mb-4  '>
										Quick Actions
									</h3>
									<div className='space-y-2'>
										<Link href='/users/bookasession'>
											<button className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200'>
												Book New Session
											</button>
										</Link>
									</div>
								</motion.div>
							</div>
							<div className='lg:w-3/4 space-y-8'>
								<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-6 text-green-400'>
									{activeTab === 'individual'
										? 'Individual Reservations'
										: 'Group Reservations'}
								</h2>
								{(activeTab === 'individual' ? reservations : groupReservations)
									.length === 0 ? (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className='bg-gray-800 rounded-xl p-8 text-center'>
										<FaCalendarAlt className='text-green-500 text-5xl mb-4 mx-auto' />
										<p className='text-xl text-gray-300'>
											No upcoming reservations. Time to book your next session!
										</p>
									</motion.div>
								) : (
									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
										{(activeTab === 'individual'
											? reservations
											: groupReservations
										).map((reservation, index) => (
											<motion.div
												key={reservation.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-green-500/30 transition duration-300'>
												<div className='p-6 space-y-4'>
													<div className='flex justify-between items-center mb-4'>
														<h3 className='text-2xl font-bold text-green-400'>
															{reservation.activity.name}
														</h3>
														<span className='text-sm bg-green-600 text-white px-2 py-1 rounded-full'>
															{reservation.activity.credits} Credits
														</span>
													</div>
													<div className='space-y-2 text-gray-300'>
														<p className='flex items-center'>
															<FaCalendarAlt className='mr-2 text-green-500' />
															{reservation.date}
														</p>
														<p className='flex items-center'>
															<FaClock className='mr-2 text-green-500' />
															{reservation.start_time} - {reservation.end_time}
														</p>
														<p className='flex items-center'>
															<FaUser className='mr-2 text-green-500' />
															{reservation.coach.name}
														</p>
														{activeTab === 'group' && (
															<p className='flex items-center'>
																<FaUsers className='mr-2 text-green-500' />
																Attendance: {reservation.count}
															</p>
														)}
													</div>
													<div className='bg-gray-700 rounded-lg p-3 mt-4'>
														<p className='text-sm text-gray-300'>
															<span className='font-semibold text-green-400'>
																Additions:
															</span>{' '}
															{reservation.additions &&
															reservation.additions.length > 0
																? reservation.additions
																		.map(addition =>
																			typeof addition === 'string'
																				? addition
																				: addition.items
																						.map(item => item.name)
																						.join(', ')
																		)
																		.join(', ')
																: 'No additions'}
														</p>
													</div>
													<div className='flex flex-col space-y-2 mt-4'>
														<div className='flex flex-row justify-center items-center'>
															<AddToCalendarButton
																name={`${reservation.activity.name} with ${reservation.coach.name}`}
																startDate={reservation.date}
																startTime={reservation.start_time}
																endTime={reservation.end_time}
																options={['Apple', 'Google']}
																timeZone='Asia/Beirut'
																buttonStyle='default'
																styleLight='--btn-background: #ffffff; --btn-text: #000; --btn-shadow: none;'
																styleDark='--btn-background: #10B981; --btn-text: #000; --btn-shadow: none;'
																size='3'
																inline
															/>
														</div>

														<div className='flex flex-col md:flex-row justify-between mt-4'>
															<button
																onClick={() => openMarketModal(reservation)}
																className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 mb-2 md:mb-0 rounded-lg transition duration-200 flex-grow mr-0 md:mr-2'
																disabled={buttonLoading}>
																Add Items
															</button>
															<button
																onClick={() =>
																	activeTab === 'individual'
																		? handleCancel(reservation.id)
																		: handleCancelGroup(reservation.id)
																}
																className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex-grow ml-0 md:ml-2'
																disabled={buttonLoading}>
																Cancel
															</button>
														</div>
													</div>
												</div>
											</motion.div>
										))}
									</div>
								)}
							</div>

							{/* New Sidebar */}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Market Modal */}
			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Market Items'
				className='modal rounded-3xl p-4 sm:p-6 md:p-8 mx-auto mt-10 sm:mt-20 w-11/12 md:max-w-4xl'
				style={{
					content: {
						backgroundColor: 'rgba(31, 41, 55, 0.9)',
						backdropFilter: 'blur(16px)'
					}
				}}
				overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
				<h2 className='text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500'>
					Enhance Your Session
				</h2>
				<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8'>
					{market.map(item => (
						<motion.div
							key={item.id}
							className='bg-gray-700 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-green-400 hover:shadow-lg transition-all duration-300'>
							<div className='flex flex-col h-full'>
								<div className='flex justify-between items-center text-gray-300 mb-3 sm:mb-4'>
									<span className='font-semibold text-sm sm:text-lg'>
										{item.name}
									</span>
									<span className='text-lg sm:text-xl font-bold text-green-400'>
										${item.price}
									</span>
								</div>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className={`mt-auto w-full py-2 sm:py-3 rounded-full text-white font-semibold text-sm sm:text-base transition-all duration-300 ${
										selectedItems.find(
											selectedItem => selectedItem.id === item.id
										)
											? 'bg-red-500 hover:bg-red-600'
											: 'bg-green-500 hover:bg-green-600'
									}`}
									onClick={() => handleItemSelect(item)}>
									{selectedItems.find(
										selectedItem => selectedItem.id === item.id
									)
										? 'Remove'
										: 'Add'}
								</motion.button>
							</div>
						</motion.div>
					))}
				</div>
				<div className='text-right'>
					<p className='text-xl sm:text-2xl font-bold text-green-400 mb-4 sm:mb-6'>
						Total Price: ${totalPrice}
					</p>
					<div className='flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-6'>
						<motion.button
							whileHover={{
								scale: 1.05,
								boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
							}}
							whileTap={{ scale: 0.95 }}
							className='bg-green-500 text-white py-2 sm:py-3 px-6 sm:px-8 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-green-600 disabled:opacity-50'
							onClick={handlePay}
							disabled={buttonLoading}>
							{buttonLoading ? 'Processing...' : 'Complete Purchase'}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='bg-red-500 text-white py-2 sm:py-3 px-6 sm:px-8 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-red-600'
							onClick={() => setModalIsOpen(false)}>
							Close
						</motion.button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
