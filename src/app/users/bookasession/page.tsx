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
import { AnimatePresence, motion } from 'framer-motion'
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
import {
	FaRunning,
	FaHeart,
	FaBiking,
	FaDumbbell,
	FaFirstAid
} from 'react-icons/fa'
import { RiGroupLine, RiUserLine } from 'react-icons/ri'
import Image from 'next/image'

export default function Example() {
	const activityIcons: Record<number, JSX.Element> = {
		1: <FaHeart />,
		2: <FaBiking />,
		3: <FaRunning />,
		10: <FaDumbbell />,
		11: <FaFirstAid />
	}
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

	const handleToggle = (bool: any) => {
		setIsPrivateTraining(bool)
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
		<div className='min-h-screen bg-gray-700' id='__next'>
			<NavbarComponent />
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h1 className='text-4xl font-bold text-gray-300 mb-8'>
					Book a Session
				</h1>

				<div className='bg-gray-800 rounded-lg shadow-lg p-6 mb-8'>
					<div className='flex justify-center items-center space-x-4 mb-8'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 py-3 rounded-full ${
								isPrivateTraining
									? 'bg-gray-600 text-white'
									: 'bg-gray-200 text-gray-700'
							}`}
							onClick={() => handleToggle(true)}>
							<RiUserLine className='inline-block mr-2' />
							Private Training
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 py-3 rounded-full ${
								!isPrivateTraining
									? 'bg-gray-600 text-white'
									: 'bg-gray-200 text-gray-700'
							}`}
							onClick={() => handleToggle(false)}>
							<RiGroupLine className='inline-block mr-2' />
							Public Training
						</motion.button>
					</div>

					<h2 className='text-2xl font-semibold text-gray-300 mb-4'>
						Select an Activity
					</h2>
					{activitiesLoading ? (
						<div className='flex items-center justify-center'>
							<RotateLoader
								color={'#1F2937'}
								loading={activitiesLoading}
								size={15}
							/>
						</div>
					) : (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
							{(isPrivateTraining ? activities : activitiesGroup).map(
								activity => (
									<motion.button
										key={activity.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className={`flex items-center justify-center space-x-2 p-4 rounded-lg ${
											selectedActivity === activity.id
												? 'bg-gray-600 text-white'
												: 'bg-gray-200 text-gray-700 hover:bg-gray-400'
										}`}
										onClick={() => setSelectedActivity(activity.id)}>
										<span className='text-2xl'>
											{activityIcons[activity.id]}
										</span>
										<span>{activity.name}</span>
									</motion.button>
								)
							)}
						</div>
					)}
				</div>

				{selectedActivity && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-gray-800 rounded-lg shadow-lg p-6 mb-8'>
						<h2 className='text-2xl font-semibold text-gray-300 mb-4'>
							Select a Coach
						</h2>
						{coachesLoading ? (
							<div className='flex items-center justify-center'>
								<RotateLoader
									color={'#1F2937'}
									loading={coachesLoading}
									size={15}
								/>
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
								<AnimatePresence>
									{coaches.map(coach => (
										<motion.button
											key={coach.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											className={`p-4 rounded-lg ${
												selectedCoach === coach.id
													? 'bg-gray-600 text-white'
													: 'bg-gray-200 text-gray-700 hover:bg-gray-400'
											}`}
											onClick={() => setSelectedCoach(coach.id)}>
											<img
												src={coach.profile_picture}
												alt={`${coach.name}`}
												className='w-24 h-24 rounded-full mx-auto mb-2 object-cover'
											/>
											<p className='text-lg font-semibold'>{coach.name}</p>
										</motion.button>
									))}
								</AnimatePresence>
							</div>
						)}
					</motion.div>
				)}

				{selectedCoach && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-gray-800 rounded-lg shadow-lg p-6'>
						<div className='flex flex-col lg:flex-row lg:space-x-8'>
							<div className='lg:w-1/2 mb-8 lg:mb-0'>
								<h2 className='text-2xl font-semibold text-gray-300 mb-4'>
									Select a Date
								</h2>
								<DatePicker
									selected={selectedDate}
									onChange={setSelectedDate}
									inline
									calendarClassName='rounded-lg shadow-lg'
									minDate={new Date()}
									highlightDates={highlightDates}
								/>
							</div>
							{selectedDate && (
								<div className='lg:w-1/2'>
									<h2 className='text-2xl  font-semibold text-gray-300 mb-4'>
										Available Times
									</h2>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										<AnimatePresence>
											{(isPrivateTraining
												? availableTimes
												: groupAvailableTimes
											).map(time => (
												<motion.button
													key={time}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -20 }}
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className={`p-4 rounded-lg text-lg font-semibold ${
														selectedTime === time
															? 'bg-gray-600 text-white'
															: 'bg-gray-200 text-gray-700 hover:bg-gray-400'
													}`}
													onClick={() => setSelectedTime(time)}>
													{time}
													{!isPrivateTraining && (
														<p className='text-sm mt-2'>
															Capacity: {reservationCount}/{getCapacity()}
														</p>
													)}
												</motion.button>
											))}
										</AnimatePresence>
									</div>
								</div>
							)}
						</div>
						{selectedTime && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className='mt-8 text-center'>
								<p className='text-xl font-semibold text-gray-300 mb-4'>
									Booking{' '}
									{
										(isPrivateTraining ? activities : activitiesGroup).find(
											a => a.id === selectedActivity
										)?.name
									}{' '}
									with {coaches.find(c => c.id === selectedCoach)?.name} on{' '}
									{selectedDate?.toLocaleDateString()} at {selectedTime}.
								</p>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									type='button'
									onClick={handleBookSession}
									disabled={loading}
									className='rounded-full bg-gray-500 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-700 disabled:bg-gray-400'>
									{loading ? 'Processing...' : 'Confirm Booking'}
								</motion.button>
							</motion.div>
						)}
					</motion.div>
				)}

				<Modal
					isOpen={modalIsOpen}
					onRequestClose={() => setModalIsOpen(false)}
					contentLabel='Market Items'
					className='modal bg-white rounded-lg p-8 max-w-2xl mx-auto mt-20'
					overlayClassName='overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
					<h2 className='text-3xl font-bold mb-6 text-gray-800'>
						Add to your Session
					</h2>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
						{market.map(item => (
							<motion.div
								key={item.id}
								whileHover={{ scale: 1.05 }}
								className='border border-gray-200 p-4 rounded-lg'>
								<div className='flex justify-between items-center text-gray-800 mb-2'>
									<span className='font-semibold'>{item.name}</span>
									<span className='text-lg'>${item.price}</span>
								</div>
								<motion.button
									whileTap={{ scale: 0.95 }}
									className={`w-full py-2 rounded-full ${
										selectedItems.find(
											selectedItem => selectedItem.id === item.id
										)
											? 'bg-red-500 text-white'
											: 'bg-green-500 text-white'
									}`}
									onClick={() => handleItemSelect(item)}>
									{selectedItems.find(
										selectedItem => selectedItem.id === item.id
									)
										? 'Remove'
										: 'Add'}
								</motion.button>
							</motion.div>
						))}
					</div>
					<div className='text-right'>
						<p className='text-xl font-semibold text-gray-800 mb-4'>
							Total Price: ${totalPrice}
						</p>
						<div className='space-x-4'>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className='bg-green-500 text-white py-2 px-6 rounded-full disabled:bg-gray-400'
								onClick={handlePay}
								disabled={loading}>
								{loading ? 'Processing...' : 'Pay'}
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className='bg-red-500 text-white py-2 px-6 rounded-full'
								onClick={handleCloseModal}>
								Close
							</motion.button>
						</div>
					</div>
				</Modal>
			</motion.div>
		</div>
	)
}
