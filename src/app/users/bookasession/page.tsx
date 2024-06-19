'use client'
import { useEffect, useState } from 'react'
import NavbarComponent from '../../components/users/navbar'
import { useUser } from '@clerk/nextjs'
import { useWallet } from '@/app/components/users/WalletContext'
import {
	fetchFilteredUnbookedTimeSlots,
	fetchAllActivities,
	fetchCoaches,
	bookTimeSlot,
	fetchMarket,
	payForItems,
	fetchAllActivitiesGroup,
	fetchFilteredUnbookedTimeSlotsGroup,
	bookTimeSlotGroup,
	payForGroupItems,
	fetchCoachesGroup
} from '../../../../utils/user-requests'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'
import FavoriteIcon from '@mui/icons-material/Favorite'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import HealingIcon from '@mui/icons-material/Healing'
import { RotateLoader } from 'react-spinners'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ReactModal from 'react-modal'
import Modal from 'react-modal'

// Set the app element for accessibility

export default function Example() {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [selectedTime, setSelectedTime] = useState<string>('')
	const [selectedActivity, setSelectedActivity] = useState<number | null>(null)
	const [selectedCoach, setSelectedCoach] = useState<number | null>(null)
	const [market, setMarket] = useState<any[]>([])
	const [selectedItems, setSelectedItems] = useState<any[]>([])
	const [totalPrice, setTotalPrice] = useState<number>(0)
	const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
	const [activities, setActivities] = useState<
		{ id: number; name: string; credits?: number }[]
	>([])
	const [activitiesGroup, setActivitiesGroup] = useState<
		{ id: number; name: string; credits?: number; capacity: number }[]
	>([])
	const [coaches, setCoaches] = useState<
		{
			profile_picture: string | undefined
			id: number
			name: string
		}[]
	>([])
	const [availableTimes, setAvailableTimes] = useState<string[]>([])
	const [groupAvailableTimes, setGroupAvailableTimes] = useState<string[]>([])
	const [highlightDates, setHighlightDates] = useState<Date[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true)
	const [groupActivitiesLoading, setGroupActivitiesLoading] =
		useState<boolean>(true)
	const [coachesLoading, setCoachesLoading] = useState<boolean>(false)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true) // State for toggle
	const { user } = useUser()
	const { refreshWalletBalance } = useWallet()
	useEffect(() => {
		Modal.setAppElement('#__next')
	}, [])

	interface activityIcons {
		[key: number]: JSX.Element
	}

	const activityIcons: { [key: number]: JSX.Element } = {
		1: <SelfImprovementIcon />,
		2: <FavoriteIcon />,
		3: <DirectionsBikeIcon />,
		4: <DirectionsRunIcon />,
		10: <FitnessCenterIcon />,
		11: <HealingIcon />
	}

	const handleBookGroupSession = async () => {
		if (!user) {
			console.error('User is not signed in')
			return
		}
		setLoading(true)
		const [startTime, endTime] = selectedTime.split(' - ')
		const { error, data } = await bookTimeSlotGroup({
			activityId: selectedActivity,
			coachId: selectedCoach,
			date: formatDate(selectedDate),
			startTime,
			endTime,
			userId: user.id
		})
		setLoading(false)
		if (error) {
			console.error('Booking failed:', error)
			toast.error(error) // Display error toast
		} else {
			refreshWalletBalance()
			toast.success('Booking successful!') // Display success toast
			setModalIsOpen(true) // Open the modal after successful booking
		}
	}

	useEffect(() => {
		const fetchInitialData = async () => {
			setActivitiesLoading(true) // Set loading to true while fetching
			const activitiesData = await fetchAllActivities()
			setActivities(activitiesData)
			setActivitiesLoading(false) // Set loading to false after fetching

			setGroupActivitiesLoading(true) // Set loading to true while fetching
			const groupActivitiesData = await fetchAllActivitiesGroup()
			setActivitiesGroup(groupActivitiesData)
			setGroupActivitiesLoading(false) // Set loading to false after fetching

			const marketData = await fetchMarket()
			setMarket(marketData)
		}
		fetchInitialData()
	}, [])

	useEffect(() => {
		const fetchCoachesData = async () => {
			if (selectedActivity) {
				setCoachesLoading(true) // Set loading to true while fetching

				const coachesData = isPrivateTraining
					? await fetchCoaches(selectedActivity)
					: await fetchCoachesGroup(selectedActivity)
				setCoaches(coachesData)
				setSelectedCoach(null) // Reset selectedCoach
				setSelectedDate(null) // Reset selectedDate
				setSelectedTime('')
				setAvailableTimes([])
				setGroupAvailableTimes([])
				setHighlightDates([]) // Reset highlight dates when coach changes
				setCoachesLoading(false) // Set loading to false after fetching
			}
		}
		fetchCoachesData()
	}, [selectedActivity])

	useEffect(() => {
		const resetDateAndTime = () => {
			setSelectedDate(null) // Reset selectedDate
			setSelectedTime('') // Reset selectedTime
		}

		if (selectedActivity && selectedCoach) {
			resetDateAndTime()
		}
	}, [selectedCoach]) // Add selectedCoach as a dependency

	useEffect(() => {
		const fetchDatesAndTimes = async () => {
			if (selectedActivity && selectedCoach) {
				if (isPrivateTraining) {
					const data = await fetchFilteredUnbookedTimeSlots({
						activityId: selectedActivity,
						coachId: selectedCoach,
						date: selectedDate ? formatDate(selectedDate) : undefined
					})
					if (data) {
						if (!selectedDate) {
							const datesForSelectedCoach = data
								.filter(slot => slot.coach_id === selectedCoach)
								.map(slot => new Date(slot.date))
								.filter((date: Date) => date >= new Date())
							setHighlightDates(datesForSelectedCoach)
						}
						if (selectedDate) {
							const timesForSelectedDate = data
								.filter(
									slot =>
										new Date(slot.date).toDateString() ===
										selectedDate.toDateString()
								)
								.map(slot => {
									const startTime = slot.start_time.substr(0, 5) // Take the substring to include only hours and minutes
									const endTime = slot.end_time.substr(0, 5) // Similarly for end time
									return `${startTime} - ${endTime}`
								})
							setAvailableTimes(timesForSelectedDate)
						}
					}
				} else {
					const data = await fetchFilteredUnbookedTimeSlotsGroup({
						activityId: selectedActivity,
						coachId: selectedCoach,
						date: selectedDate ? formatDate(selectedDate) : undefined
					})
					if (data) {
						if (!selectedDate) {
							const datesForSelectedCoach = data
								.filter(slot => slot.coach_id === selectedCoach)
								.map(slot => new Date(slot.date))
								.filter((date: Date) => date >= new Date())
							setHighlightDates(datesForSelectedCoach)
						}
						if (selectedDate) {
							const timesForSelectedDate = data
								.filter(
									slot =>
										new Date(slot.date).toDateString() ===
										selectedDate.toDateString()
								)
								.map(slot => {
									const startTime = slot.start_time.substr(0, 5) // Take the substring to include only hours and minutes
									const endTime = slot.end_time.substr(0, 5) // Similarly for end time
									return `${startTime} - ${endTime}`
								})
							setGroupAvailableTimes(timesForSelectedDate)
						}
					}
				}
			}
		}

		fetchDatesAndTimes()
	}, [selectedActivity, selectedCoach, selectedDate, isPrivateTraining])

	const handleBookSession = async () => {
		if (isPrivateTraining) {
			await handleBookPrivateSession()
		} else {
			await handleBookGroupSession()
		}
	}

	const handleBookPrivateSession = async () => {
		if (!user) {
			console.error('User is not signed in')
			return
		}
		setLoading(true)
		const [startTime, endTime] = selectedTime.split(' - ')
		const { error, data } = await bookTimeSlot({
			activityId: selectedActivity,
			coachId: selectedCoach,
			date: formatDate(selectedDate),
			startTime,
			endTime,
			userId: user.id
		})
		setLoading(false)
		if (error) {
			console.error('Booking failed:', error)
			toast.error(error) // Display error toast
		} else {
			refreshWalletBalance()
			toast.success('Booking successful!') // Display success toast
			setModalIsOpen(true) // Open the modal after successful booking
		}
	}

	const handlePay = async () => {
		setLoading(true)
		if (!user) {
			console.error('User is not signed in')
			return
		}
		const response = isPrivateTraining
			? await payForItems({
					userId: user.id,
					activityId: selectedActivity, // This should be the selected activity ID
					coachId: selectedCoach, // This should be the selected coach ID
					date: formatDate(selectedDate), // This should be the selected date
					startTime: selectedTime.split(' - ')[0], // This should be the start time of the selected slot
					selectedItems
			  })
			: await payForGroupItems({
					userId: user.id,
					activityId: selectedActivity, // This should be the selected activity ID
					coachId: selectedCoach, // This should be the selected coach ID
					date: formatDate(selectedDate), // This should be the selected date
					startTime: selectedTime.split(' - ')[0], // This should be the start time of the selected slot
					selectedItems
			  })

		if (response.error) {
			toast.error(response.error) // Display error toast
		} else {
			setSelectedItems([])
			refreshWalletBalance() // Clear selected items after payment
			setTotalPrice(0) // Reset total price after payment
			setModalIsOpen(false)
			setSelectedActivity(null)
			setSelectedCoach(null)
			setSelectedDate(null)
			setSelectedTime('')
			setAvailableTimes([])
			setGroupAvailableTimes([])
			setHighlightDates([])
			toast.success('Items Added Successfully') // Display success toast
			// Close the modal after payment
			setLoading(false)
		}
	}

	const getCapacity = () => {
		if (selectedActivity === null) {
			return 'No activity selected'
		}
		const activity = activitiesGroup.find(
			activity => activity.id === selectedActivity
		)
		return activity ? `${activity.capacity}` : ''
	}

	const formatDate = (date: Date | null): string =>
		date
			? [
					date.getFullYear(),
					('0' + (date.getMonth() + 1)).slice(-2),
					('0' + date.getDate()).slice(-2)
			  ].join('-')
			: ''

	const handleItemSelect = (item: any) => {
		const alreadySelected = selectedItems.find(
			selectedItem => selectedItem.id === item.id
		)
		let newSelectedItems
		if (alreadySelected) {
			// Remove item from selectedItems
			newSelectedItems = selectedItems.filter(
				selectedItem => selectedItem.id !== item.id
			)
		} else {
			// Add item to selectedItems
			newSelectedItems = [...selectedItems, item]
		}
		setSelectedItems(newSelectedItems)

		// Update total price
		const totalPrice = newSelectedItems.reduce(
			(total, currentItem) => total + currentItem.price,
			0
		)
		setTotalPrice(totalPrice)
	}

	const handleCloseModal = () => {
		setModalIsOpen(false)
		setSelectedItems([])
		setTotalPrice(0) // Reset total price after payment
		setSelectedActivity(null)
		setSelectedCoach(null)
		setSelectedDate(null)
		setSelectedTime('')
		setAvailableTimes([])
		setGroupAvailableTimes([])
		setHighlightDates([])
	}

	const handleToggle = () => {
		setIsPrivateTraining(!isPrivateTraining)
	}

	const getSelectedReservationCount = async () => {
		if (selectedActivity && selectedCoach && selectedDate) {
			const data = await fetchFilteredUnbookedTimeSlotsGroup({
				activityId: selectedActivity,
				coachId: selectedCoach,
				date: formatDate(selectedDate)
			})
			return data ? data.reduce((total, slot) => total + slot.count, 0) : 0
		}
		return 0
	}

	const [reservationCount, setReservationCount] = useState<number>(0)

	useEffect(() => {
		const fetchReservationCount = async () => {
			const count = await getSelectedReservationCount()
			setReservationCount(count)
		}

		fetchReservationCount()
	}, [selectedActivity, selectedCoach, selectedDate, highlightDates])

	return (
		<div id='__next'>
			<NavbarComponent />
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-center items-center py-4'>
					<div className='flex items-center'>
						<button
							className={`px-4 py-2 mr-2 rounded ${
								isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={handleToggle}>
							Private Training
						</button>
						<button
							className={`px-4 py-2 rounded ${
								!isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={handleToggle}>
							Public Training
						</button>
					</div>
				</div>
				{isPrivateTraining ? (
					// Private training content
					<>
						<h1 className='text-3xl font-bold my-4'>Select an activity</h1>
						{activitiesLoading ? ( // Display loading indicator while fetching activities
							<div className='flex items-center justify-center'>
								<RotateLoader
									color={'#367831'}
									loading={activitiesLoading}
									size={15}
								/>
							</div>
						) : (
							<div className='grid lg:grid-cols-3 -1 gap-4'>
								{activities.length === 0 ? ( // Display sad emoji when no activities available
									<p>No activities available 😞</p>
								) : (
									activities.map(activity => (
										<button
											key={activity.id}
											className={`flex border p-4 rounded-lg ${
												selectedActivity === activity.id
													? 'bg-green-200 dark:bg-green-700'
													: 'hover:bg-gray-100 dark:hover:bg-gray-900'
											}`}
											onClick={() => setSelectedActivity(activity.id)}>
											<span className='items-left justify-start'>
												{activityIcons[activity.id]}
											</span>{' '}
											{/* Display the corresponding icon */}
											<span className='mx-auto'>{activity.name}</span>{' '}
											{/* Display the activity name */}
										</button>
									))
								)}
							</div>
						)}

						{/* Coaches section with loading indicator and sad emoji */}
						<div className='mt-12'>
							<h2 className='text-3xl font-bold mb-4'>Select a Coach</h2>
							{selectedActivity === null ? (
								<p>Please choose an activity to be able to see the coaches</p>
							) : coachesLoading ? (
								<div className='flex items-center justify-center'>
									<RotateLoader
										color={'#367831'}
										loading={coachesLoading}
										size={15}
									/>
								</div>
							) : (
								<div className='grid lg:grid-cols-3 gap-4'>
									{coaches.length === 0 ? (
										<p>No coaches available for the chosen activity 😞</p>
									) : (
										coaches.map(coach => (
											<button
												key={coach.id}
												className={`border p-4 rounded-lg ${
													selectedCoach === coach.id
														? 'bg-green-200  dark:bg-green-700'
														: 'hover:bg-gray-100'
												}`}
												onClick={() => setSelectedCoach(coach.id)}>
												<img
													src={coach.profile_picture}
													alt={`${coach.name}`}
													className='w-16 h-16 rounded-full mx-auto mb-2'
												/>
												{coach.name}
											</button>
										))
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<>
						<h1 className='text-3xl font-bold my-4'>Select an activity</h1>
						{groupActivitiesLoading ? ( // Display loading indicator while fetching activities
							<div className='flex items-center justify-center'>
								<RotateLoader
									color={'#367831'}
									loading={groupActivitiesLoading}
									size={15}
								/>
							</div>
						) : (
							<div className='grid lg:grid-cols-3 -1 gap-4'>
								{activitiesGroup.length === 0 ? ( // Display sad emoji when no activities available
									<p>No activities available 😞</p>
								) : (
									activitiesGroup.map(activity => (
										<button
											key={activity.id}
											className={`flex border p-4 rounded-lg ${
												selectedActivity === activity.id
													? 'bg-green-200 dark:bg-green-700'
													: 'hover:bg-gray-100 dark:hover:bg-gray-900'
											}`}
											onClick={() => setSelectedActivity(activity.id)}>
											<span className='items-left justify-start'>
												{activityIcons[activity.id]}
											</span>{' '}
											{/* Display the corresponding icon */}
											<span className='mx-auto'>{activity.name}</span>{' '}
											{/* Display the activity name */}
										</button>
									))
								)}
							</div>
						)}

						{/* Coaches section with loading indicator and sad emoji */}
						<div className='mt-12'>
							<h2 className='text-3xl font-bold mb-4'>Select a Coach</h2>
							{selectedActivity === null ? (
								<p>Please choose an activity to be able to see the coaches</p>
							) : coachesLoading ? (
								<div className='flex items-center justify-center'>
									<RotateLoader
										color={'#367831'}
										loading={coachesLoading}
										size={15}
									/>
								</div>
							) : (
								<div className='grid lg:grid-cols-3 gap-4'>
									{coaches.length === 0 ? (
										<p>No coaches available for the chosen activity 😞</p>
									) : (
										coaches.map(coach => (
											<button
												key={coach.id}
												className={`border p-4 rounded-lg ${
													selectedCoach === coach.id
														? 'bg-green-200  dark:bg-green-700'
														: 'hover:bg-gray-100'
												}`}
												onClick={() => setSelectedCoach(coach.id)}>
												<img
													src={coach.profile_picture}
													alt={`${coach.name}`}
													className='w-16 h-16 rounded-full mx-auto mb-2'
												/>
												{coach.name}
											</button>
										))
									)}
								</div>
							)}
						</div>
						<div className='mx-auto max-w-7xl '>
							<div className='mt-12 sm:flex'>
								<div className='flex-grow'>
									<h2 className='text-3xl mb-10 font-bold'>Select a Date</h2>
									<DatePicker
										selected={selectedDate}
										onChange={setSelectedDate}
										inline
										calendarClassName='react-datepicker-popper'
										minDate={new Date()}
										highlightDates={highlightDates}
									/>
								</div>
								{selectedDate && (
									<div className='lg:ml-4 w-full md:w-1/3'>
										<h2 className='text-3xl font-bold mb-4'>Available Times</h2>
										<div className='flex flex-col'>
											{groupAvailableTimes.map(time => (
												<button
													key={time}
													className={`p-4 mt-6 border rounded-lg text-lg font-semibold mb-2 ${
														selectedTime === time
															? 'bg-green-200 dark'
															: 'hover'
													}`}
													onClick={() => setSelectedTime(time)}>
													{time}
													<p className='text-gray-400 mt-2 text-xs'>
														{' '}
														Capacity: {reservationCount}/{getCapacity()}
													</p>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
							{selectedTime && (
								<div className='mt-12 text-center'>
									<p className='text-xl font-semibold'>
										Booking{' '}
										{activitiesGroup.find(a => a.id === selectedActivity)?.name}{' '}
										with {coaches.find(c => c.id === selectedCoach)?.name} on{' '}
										{selectedDate?.toLocaleDateString()} at {selectedTime}.
									</p>
									<button
										type='button'
										onClick={handleBookSession}
										disabled={loading}
										className='rounded-md mb-12 bg-green-600 px-3.5 py-2.5 disabled:bg-green-300 text-sm font-semibold text-white hover:bg-green-500 mt-4'>
										{loading ? 'Processing...' : 'Confirm Booking'}
									</button>
								</div>
							)}
						</div>
					</>
				)}
			</div>

			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				{isPrivateTraining && (
					<div className='mt-12 sm:flex'>
						<div className='flex-grow'>
							<h2 className='text-3xl mb-10 font-bold'>Select a Date</h2>
							<DatePicker
								selected={selectedDate}
								onChange={setSelectedDate}
								inline
								calendarClassName='react-datepicker-popper'
								minDate={new Date()}
								highlightDates={highlightDates}
							/>
						</div>
						{selectedDate && (
							<div className='lg:ml-4 w-full md:w-1/3'>
								<h2 className='text-3xl font-bold mb-4'>Available Times</h2>
								<div className='flex flex-col'>
									{availableTimes.map(time => (
										<button
											key={time}
											className={`p-4 mt-6 border rounded-lg text-lg font-semibold mb-2 ${
												selectedTime === time ? 'bg-green-200 dark' : 'hover'
											}`}
											onClick={() => setSelectedTime(time)}>
											{time}
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				)}
				{selectedTime && isPrivateTraining && (
					<div className='mt-12 text-center'>
						<p className='text-xl font-semibold'>
							Booking {activities.find(a => a.id === selectedActivity)?.name}{' '}
							with {coaches.find(c => c.id === selectedCoach)?.name} on{' '}
							{selectedDate?.toLocaleDateString()} at {selectedTime}.
						</p>
						<button
							type='button'
							onClick={handleBookSession}
							disabled={loading}
							className='rounded-md mb-12 bg-green-600 px-3.5 py-2.5 disabled:bg-green-300 text-sm font-semibold text-white hover:bg-green-500 mt-4'>
							{loading ? 'Processing...' : 'Confirm Booking'}
						</button>
					</div>
				)}
			</div>

			{/* Modal for Market Items */}
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
							disabled={loading}>
							{loading ? 'Processing...' : 'Pay'}
						</button>
						<button
							className='mt-4 bg-red-500  text-white py-2 px-4 rounded'
							onClick={handleCloseModal}>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
