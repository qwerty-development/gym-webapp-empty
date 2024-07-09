'use client'
import React, { useState, useEffect } from 'react'
import NavbarComponent from '@/app/components/users/navbar'
import { useUser } from '@clerk/nextjs'
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
import { FaUser, FaCalendarAlt, FaUsers, FaBars } from 'react-icons/fa'

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
		id?: string
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
			const confirmed = await showConfirmationToast(
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
			const confirmed = await showConfirmationToast(
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

	return (
		<div className='min-h-screen bg-gray-700 text-white font-sans'>
			<NavbarComponent />

			<button
				className='md:hidden fixed top-8 left-2 text-white'
				onClick={() => setSidebarOpen(!sidebarOpen)}>
				<FaBars size={18} />
			</button>

			{/* Sidebar */}
			<div
				className={`fixed left-0 top-0 h-full w-64 bg-gray-800 p-4 transform transition-transform duration-300 ease-in-out z-40 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} md:translate-x-0`}>
				<h2 className='text-2xl font-bold mb-4 mt-16 md:mt-4'>Menu</h2>
				<ul>
					<li className='mb-10'>
						<button
							onClick={() => {
								setActiveTab('individual')
								setSidebarOpen(false)
							}}
							className='flex items-center  hover:text-gray-400'>
							<FaCalendarAlt size={35} className='mr-2' /> Individual
							Reservations
						</button>
					</li>
					<li className='mb-2'>
						<button
							onClick={() => {
								setActiveTab('group')
								setSidebarOpen(false)
							}}
							className='flex items-center  hover:text-gray-400'>
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
					className='bg-gray-800 rounded-lg p-4 md:p-6 mb-6 md:mb-8'>
					<div className='flex items-center'>
						<FaUser className='text-3xl md:text-4xl mr-4' />
						<div>
							<h2 className='text-xl md:text-2xl font-bold'>
								{user.firstName} {user.lastName}
							</h2>
							<p className='text-sm md:text-base text-gray-400'>
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
							<RingLoader color={'#367831'} size={100} />
						</motion.div>
					) : (
						<motion.div
							key='content'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}>
							<h2 className='text-2xl md:text-3xl font-bold mb-4 md:mb-6'>
								{activeTab === 'individual'
									? 'Individual Reservations'
									: 'Group Reservations'}
							</h2>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
								{(activeTab === 'individual'
									? reservations
									: groupReservations
								).map(reservation => (
									<motion.div
										key={reservation.id}
										className='bg-gray-800 rounded-lg shadow-lg overflow-hidden'
										whileHover={{ scale: 1.03 }}
										transition={{ duration: 0.2 }}>
										<div className='p-4 md:p-6'>
											<h3 className='text-lg md:text-xl font-semibold mb-2'>
												{reservation.activity.name}
											</h3>
											<p className='text-sm md:text-base text-gray-400 mb-1 md:mb-2'>
												Date: {reservation.date}
											</p>
											<p className='text-sm md:text-base text-gray-400 mb-1 md:mb-2'>
												Time: {reservation.start_time} - {reservation.end_time}
											</p>
											<p className='text-sm md:text-base text-gray-400 mb-1 md:mb-2'>
												Coach: {reservation.coach.name}
											</p>
											<p className='text-sm md:text-base text-gray-400 mb-2 md:mb-4'>
												Credits: {reservation.activity.credits}
											</p>
											{activeTab === 'group' && (
												<p className='text-sm md:text-base text-gray-400 mb-1 md:mb-2'>
													Attendance: {reservation.count}
												</p>
											)}
											<p className='text-sm md:text-base text-gray-400 mb-2'>
												Additions:{' '}
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
											<AddToCalendarButton
												name={`${reservation.activity.name} with ${reservation.coach.name}`}
												startDate={reservation.date}
												startTime={reservation.start_time}
												endTime={reservation.end_time}
												options={['Apple', 'Google']}
												timeZone='Asia/Beirut'
												buttonStyle='default'
												styleLight='--btn-background: #5c6dc2; --btn-text: #fff;'
												styleDark='--btn-background:#fff #; --btn-text: #000;'
												size='3'
												inline
											/>
											<div className='flex flex-col md:flex-row justify-between mt-4'>
												<button
													onClick={() =>
														activeTab === 'individual'
															? handleCancel(reservation.id)
															: handleCancelGroup(reservation.id)
													}
													className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 mb-2 md:mb-0'
													disabled={buttonLoading}>
													Cancel
												</button>
												<button
													onClick={() => openMarketModal(reservation)}
													className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200'
													disabled={buttonLoading}>
													Add Items
												</button>
											</div>
										</div>
									</motion.div>
								))}
							</div>
							{(activeTab === 'individual' ? reservations : groupReservations)
								.length === 0 && (
								<p className='text-lg md:text-xl text-gray-400'>
									No upcoming reservations
								</p>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Market Modal */}
			<Modal
				isOpen={modalIsOpen}
				style={{ content: { backgroundColor: '#d1ffbd' } }}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Market Items'
				className='modal bg-gray-700 p-4 md:p-8 rounded-lg w-11/12 md:max-w-4xl mx-auto mt-20 overflow-y-auto max-h-[90vh]'
				overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center pt-10 md:pt-20'>
				<h2 className='text-xl md:text-2xl font-bold mb-4 text-gray-500'>
					Add to your Session
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-4'>
					{market.map(item => (
						<div key={item.id} className='bg-gray-600 p-4 rounded-lg'>
							<div className='flex justify-between items-center text-white mb-2'>
								<span className='text-sm md:text-base'>{item.name}</span>
								<span className='text-sm md:text-base'>${item.price}</span>
							</div>
							<button
								className={`w-full py-2 rounded transition duration-200 text-sm md:text-base ${
									selectedItems.find(
										selectedItem => selectedItem.id === item.id
									)
										? 'bg-red-600 hover:bg-red-700 text-white'
										: 'bg-green-600 hover:bg-green-700 text-white'
								}`}
								onClick={() => handleItemSelect(item)}>
								{selectedItems.find(selectedItem => selectedItem.id === item.id)
									? 'Remove'
									: 'Add'}
							</button>
						</div>
					))}
				</div>
				<div className='mt-6'>
					<p className='text-lg md:text-xl font-semibold text-gray-500 mb-4'>
						Total Price: ${totalPrice}
					</p>
					<div className='flex flex-col md:flex-row justify-end'>
						<button
							className='bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded mb-2 md:mb-0 md:mr-4 transition duration-200 text-sm md:text-base'
							onClick={handlePay}
							disabled={buttonLoading}>
							Pay
						</button>
						<button
							className='bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded transition duration-200 text-sm md:text-base'
							onClick={() => setModalIsOpen(false)}>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
