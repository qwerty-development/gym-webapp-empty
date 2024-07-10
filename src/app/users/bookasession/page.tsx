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

	const handleActivitySelect = (activityId: any) => {
		setSelectedActivity(activityId)
		setSelectedCoach(null)
		setSelectedDate(null)
		setSelectedTime('')
		setAvailableTimes([])
		setGroupAvailableTimes([])
		setHighlightDates([])
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
		<div
			className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'
			id='__next'>
			<NavbarComponent />
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h1 className='text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-8 sm:mb-12 text-center'>
					Book Your Next Session
				</h1>

				<div className='bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-12'>
					<div className='flex justify-center items-center space-x-4 mb-12'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
								isPrivateTraining
									? 'bg-green-500 text-white shadow-lg'
									: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
							}`}
							onClick={() => handleToggle(true)}>
							<RiUserLine className='inline-block mr-2' />
							Private Training
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
								!isPrivateTraining
									? 'bg-green-500 text-white shadow-lg'
									: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
							}`}
							onClick={() => handleToggle(false)}>
							<RiGroupLine className='inline-block mr-2' />
							Classes
						</motion.button>
					</div>

					<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center'>
						Select Your Activity
					</h2>
					{activitiesLoading ? (
						<div className='flex items-center justify-center'>
							<RotateLoader
								color={'#4ADE80'}
								loading={activitiesLoading}
								size={20}
							/>
						</div>
					) : (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
							{(isPrivateTraining ? activities : activitiesGroup).map(
								activity => (
									<motion.button
										key={activity.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										whileHover={{
											scale: 1.05,
											boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
										}}
										whileTap={{ scale: 0.95 }}
										className={`flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl transition-all duration-300  ${
											selectedActivity === activity.id
												? 'bg-green-500 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
										}`}
										onClick={() => setSelectedActivity(activity.id)}>
										<span className='text-4xl '>
											{activityIcons[activity.id]}
										</span>
										<span className='text-lg font-semibold'>
											{activity.name}
										</span>
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
						className='bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-12'>
						<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center'>
							Choose Your Coach
						</h2>
						{coachesLoading ? (
							<div className='flex items-center justify-center'>
								<RotateLoader
									color={'#4ADE80'}
									loading={coachesLoading}
									size={20}
								/>
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
								<AnimatePresence>
									{coaches.map(coach => (
										<motion.button
											key={coach.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											whileHover={{
												scale: 1.05,
												boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
											}}
											whileTap={{ scale: 0.95 }}
											className={`p-3 sm:p-6 rounded-2xl transition-all duration-300 ${
												selectedCoach === coach.id
													? 'bg-green-500 text-white'
													: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
											}`}
											onClick={() => setSelectedCoach(coach.id)}>
											<img
												src={coach.profile_picture}
												alt={`${coach.name}`}
												className='w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 object-cover border-4 border-green-400'
											/>
											<p className='text-lg sm:text-xl font-semibold'>
												{coach.name}
											</p>
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
						className='bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8'>
						<div className='flex flex-col lg:flex-row lg:space-x-12'>
							<div className='lg:w-1/2 mb-8 lg:mb-0'>
								<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center lg:text-left'>
									Select a Date
								</h2>
								<DatePicker
									selected={selectedDate}
									onChange={setSelectedDate}
									inline
									calendarClassName='rounded-xl shadow-lg bg-gray-700 border-none text-white'
									dayClassName={date =>
										'text-gray-300 hover:bg-green-300 hover:text-white rounded-full'
									}
									monthClassName={() => 'text-green-400'}
									weekDayClassName={() => 'text-blue-400'}
									minDate={new Date()}
									highlightDates={highlightDates}
								/>
							</div>
							{selectedDate && (
								<div className='lg:w-1/2'>
									<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center lg:text-left'>
										Available Times
									</h2>
									<div className='grid grid-cols-2 gap-4'>
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
													whileHover={{
														scale: 1.05,
														boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
													}}
													whileTap={{ scale: 0.95 }}
													className={`p-3 sm:p-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 ${
														selectedTime === time
															? 'bg-green-500 text-white'
															: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
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
								className='mt-12 text-center'>
								<p className='text-xl sm:text-2xl font-semibold text-green-400 mb-4 sm:mb-6'>
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
									whileHover={{
										scale: 1.05,
										boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
									}}
									whileTap={{ scale: 0.95 }}
									type='button'
									onClick={handleBookSession}
									disabled={loading}
									className='rounded-full bg-green-500 px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-bold text-white transition-all duration-300 hover:bg-green-600 disabled:opacity-50'>
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
					className='modal rounded-3xl p-4 sm:p-6 md:p-8 mx-auto mt-10 sm:mt-20 w-11/12 md:max-w-4xl'
					style={{
						content: {
							backgroundColor: 'rgba(31, 41, 55, 0.9)', // This is equivalent to bg-gray-800 with 90% opacity
							backdropFilter: 'blur(16px)' // This adds the blur effect
						}
					}}
					overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
					<h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500'>
						Enhance Your Session
					</h2>
					<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8'>
						{market.map(item => (
							<motion.div
								key={item.id}
								className='bg-gray-700 rounded-xl p-4 sm:p-6 shadow-lg  hover:shadow-green-400 hover:shadow-lg transition-all duration-300  '>
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
						<p className='text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-3 sm:mb-4 md:mb-6'>
							Total Price: ${totalPrice}
						</p>
						<div className='flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-6'>
							<motion.button
								whileHover={{
									scale: 1.05,
									boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
								}}
								whileTap={{ scale: 0.95 }}
								className='bg-green-500 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-green-600 disabled:opacity-50'
								onClick={handlePay}
								disabled={loading}>
								{loading ? 'Processing...' : 'Complete Purchase'}
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className='bg-red-500 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-red-600'
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
