'use client'
import React, { useState, useEffect } from 'react'
import NavbarComponent from '@/app/components/users/navbar'
import { useUser } from '@clerk/nextjs'
import {
	fetchReservations,
	updateUserRecord,
	cancelReservation,
	fetchAllActivities
} from '../../../../../utils/user-requests'
import { AddToCalendarButton } from 'add-to-calendar-button-react'
import { RingLoader } from 'react-spinners'
import { useWallet } from '@/app/components/users/WalletContext'
import toast from 'react-hot-toast'
import { showConfirmationToast } from '@/app/components/users/ConfirmationToast'

type Reservation = {
	id: number
	date: string
	start_time: string
	end_time: string
	coach: {
		name: string
	}
	activity: {
		name: string
		credits: number
	}
}

type Activity = {
	id: number
	name: string
	// Add other necessary fields
}

export default function Dashboard() {
	const { isLoaded, isSignedIn, user } = useUser()
	const [reservations, setReservations] = useState<Reservation[]>([])
	const [activities, setActivities] = useState<Activity[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(true) // State to track loading status
	const { refreshWalletBalance } = useWallet()

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
							coach: { name: reservation.coach.name },
							activity: {
								name: reservation.activity.name,
								credits: reservation.activity.credits
							}
						})
					)

					setReservations(transformedReservations)
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

	const handleCancel = async (reservationId: number) => {
		if (user) {
			const confirmed = await showConfirmationToast(
				'Are you sure you want to cancel this reservation?'
			)
			if (!confirmed) return // Do nothing if user cancels

			const cancelled = await cancelReservation(
				reservationId,
				user.id,
				setReservations
			)
			if (cancelled) {
				toast.success('Reservation cancelled successfully!')
				refreshWalletBalance()
			} else {
				toast.error('Failed to cancel reservation!')
			}
		}
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
							<div className='container mx-auto px-4 lg:px-8'>
								{reservations.length > 0 ? (
									<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
										{reservations.map(reservation => (
											<div
												key={reservation.id}
												className='bg-white p-6 rounded-lg shadow-md'>
												<h3 className='text-lg dark:text-black font-semibold mb-2'>
													{reservation.activity.name}
												</h3>
												<p className='text-gray-600'>
													Date: {reservation.date}
												</p>
												<p className='text-gray-600'>
													Time: {reservation.start_time} -{' '}
													{reservation.end_time}
												</p>
												<p className='text-gray-600'>
													Coach: {reservation.coach.name}
												</p>
												<p className='text-gray-600 mb-2'>
													Cost: {reservation.activity.credits} credits
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
													className='bg-red-500 text-white font-bold py-2 px-4 rounded mt-4'>
													Cancel
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
						)}
					</main>
				</div>
			</div>
		</div>
	)
}
