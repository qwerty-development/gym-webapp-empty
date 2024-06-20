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
	// Add other necessary fields
}

export default function Dashboard() {
	const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
	const [selectedReservation, setSelectedReservation] = useState<
		Reservation | GroupReservation | null
	>(null)
	const [selectedItems, setSelectedItems] = useState<any[]>([])
	const [totalPrice, setTotalPrice] = useState<number>(0)

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
		<div>
			<NavbarComponent />
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center'>
				<div className='mx-auto text-xl italic max-w-3xl mt-5'>
					Hello, {user.firstName} {user.lastName}! You are signed in as{' '}
					{user.username}.
				</div>

				<div className='py-10'>
					<header>
						<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
							<h1 className='text-3xl font-bold leading-tight tracking-tight dark:text-indigo-300 text-gray-900'>
								Your reservations
							</h1>
						</div>
					</header>
					<main className='bg-gray-100 mt-5 rounded-3xl py-8'>
						{isLoading ? ( // Display loading icon if data is being fetched
							<div className='flex justify-center items-center'>
								<RingLoader color={'#367831'} size={100} />
							</div>
						) : (
							<>
								<div className='container mx-auto px-4 lg:px-8'>
									<h2 className='text-2xl font-semibold text-gray-900'>
										Individual Reservations
									</h2>
									{reservations.length > 0 ? (
										<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
											{reservations.map(reservation => (
												<div
													key={reservation.id}
													className='bg-white p-6 rounded-lg shadow-md'>
													<h3 className='text-lg dark:text-black font-semibold mb-2'>
														{reservation.activity.name}
													</h3>
													<p className='text-gray-600 mb-2'>
														Date: {reservation.date}
													</p>
													<p className='text-gray-600 mb-2 '>
														Time: {reservation.start_time} -{' '}
														{reservation.end_time}
													</p>
													<p className='text-gray-600 mb-2'>
														Coach: {reservation.coach.name}
													</p>
													<p className='text-gray-600 mb-2'>
														Cost: {reservation.activity.credits} credits
													</p>
													<p className='text-gray-600 mb-2'>
														Additions:{' '}
														{reservation.additions
															? reservation.additions.join(', ')
															: 'No additions'}
													</p>

													<AddToCalendarButton
														name={
															reservation.activity.name +
															' with ' +
															reservation.coach.name
														}
														startDate={reservation.date}
														startTime={reservation.start_time}
														endTime={reservation.end_time}
														options={['Apple', 'Google']}
														timeZone='Asia/Beirut'
														buttonStyle='default'
														styleLight='--btn-background: #5c6dc2; --btn-text: #fff;'
														styleDark='--btn-background:#fff #; --btn-text: #000;'
														size='5'
														inline='true'
													/>
													<button
														onClick={() => handleCancel(reservation.id)}
														className='bg-red-500 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded mt-4'
														disabled={buttonLoading}>
														Cancel
													</button>
													<button
														onClick={() => openMarketModal(reservation)}
														className='bg-blue-500 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded mt-4'
														disabled={buttonLoading}>
														Add Items
													</button>
												</div>
											))}
										</div>
									) : (
										<p className='text-xl text-gray-600'>
											NO UPCOMING RESERVATIONS
										</p>
									)}
								</div>
							</>
						)}
					</main>
					<div className='bg-gray-100 mt-5 rounded-3xl py-8'>
						<div className='container  mx-auto px-4 lg:px-8'>
							<h2 className='text-2xl font-semibold text-gray-900'>
								Group Reservations
							</h2>
							{groupReservations.length > 0 ? (
								<div className='grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{groupReservations.map(reservation => (
										<div
											key={reservation.id}
											className='bg-white p-6 rounded-lg shadow-md'>
											<h3 className='text-lg dark:text-black font-semibold mb-2'>
												{reservation.activity.name}
											</h3>
											<p className='text-gray-600'>Date: {reservation.date}</p>
											<p className='text-gray-600'>
												Time: {reservation.start_time} - {reservation.end_time}
											</p>
											<p className='text-gray-600'>
												Coach: {reservation.coach.name}
											</p>
											<p className='text-gray-600 mb-2'>
												Cost: {reservation.activity.credits} credits
											</p>
											<p className='text-gray-600 mb-2'>
												Attendance: {reservation.count}
											</p>
											<p className='text-gray-600 mb-2'>
												Additions:
												{reservation.additions.length > 0 ? (
													<ul>
														{reservation.additions.map((addition, index) => (
															<li key={index}>
																<ul>
																	{addition.items.map(item => (
																		<li key={item.id}>
																			{item.name} - {item.price} credits
																		</li>
																	))}
																</ul>
															</li>
														))}
													</ul>
												) : (
													'No additions'
												)}
											</p>
											<AddToCalendarButton
												name={
													reservation.activity.name +
													' with ' +
													reservation.coach.name
												}
												startDate={reservation.date}
												startTime={reservation.start_time}
												endTime={reservation.end_time}
												options={['Apple', 'Google']}
												timeZone='Asia/Beirut'
												buttonStyle='default'
												styleLight='--btn-background: #5c6dc2; --btn-text: #fff;'
												styleDark='--btn-background:#fff #; --btn-text: #000;'
												size='5'
												inline='true'
												disabled={buttonLoading}
											/>
											<button
												onClick={() => handleCancelGroup(reservation.id)}
												className='bg-red-500 disabled:bg-red-300 text-white font-bold py-2 px-4 rounded mt-4'
												disabled={buttonLoading}>
												Cancel
											</button>
											<button
												onClick={() => openMarketModal(reservation)}
												className='bg-blue-500 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded mt-4'
												disabled={buttonLoading}>
												Add Items
											</button>
										</div>
									))}
								</div>
							) : (
								<p className='text-xl text-gray-600'>
									NO UPCOMING GROUP RESERVATIONS
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Market Items'
				className='modal'
				overlayClassName='overlay'>
				<h2 className='text-2xl font-bold mb-4 text-black'>
					Add to your Session
				</h2>
				<div className='grid lg:grid-cols-3 gap-4'>
					{market.map(item => (
						<div key={item.id} className='border p-4 rounded-lg'>
							<div className='flex justify-between items-center text-black'>
								<span>{item.name}</span>
								<span>${item.price}</span>
							</div>
							<button
								className={`mt-2 w-full py-2 ${
									selectedItems.find(
										selectedItem => selectedItem.id === item.id
									)
										? 'bg-red-500 text-white'
										: 'bg-green-500 text-white'
								}`}
								onClick={() => handleItemSelect(item)}>
								{selectedItems.find(selectedItem => selectedItem.id === item.id)
									? 'Remove'
									: 'Add'}
							</button>
						</div>
					))}
				</div>
				<div className='mt-4'>
					<p className='text-xl font-semibold text-black'>
						Total Price: ${totalPrice}
					</p>
					<div>
						<button
							className='mt-4 bg-blue-500 disabled:bg-blue-300 text-white py-2 px-4 rounded mx-5'
							onClick={handlePay}
							disabled={buttonLoading}>
							Pay
						</button>
						<button
							className='mt-4 bg-red-500 text-white py-2 px-4 rounded'
							onClick={() => setModalIsOpen(false)}>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
