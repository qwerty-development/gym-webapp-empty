'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import {
	fetchUsers,
	bookTimeSlotForClient,
	bookTimeSlotForClientGroup,
	fetchCoachesActivitiesGroup,
	fetchCoachesActivities
} from '../../../../utils/admin-requests'
import {
	fetchFilteredUnbookedTimeSlots,
	fetchFilteredUnbookedTimeSlotsGroup,
	fetchAllActivities,
	fetchAllActivitiesGroup
} from '../../../../utils/user-requests'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'
import FavoriteIcon from '@mui/icons-material/Favorite'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import HealingIcon from '@mui/icons-material/Healing'
import Select from 'react-select'
import toast from 'react-hot-toast'

export default function BookForClient() {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [selectedTime, setSelectedTime] = useState<string>('')
	const [selectedActivity, setSelectedActivity] = useState<number | null>(null)
	const [selectedCoach, setSelectedCoach] = useState<number | null>(null)
	const [selectedUser, setSelectedUser] = useState<string | null>(null)
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
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [searchResults, setSearchResults] = useState<any[]>([])
	const [deductFromWallet, setDeductFromWallet] = useState(false)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true)

	const userOptions = searchResults.map(user => ({
		label: `${user.first_name} ${user.last_name}`,
		value: user.user_id
	}))

	const { user } = useUser()

	const activityIcons: { [key: number]: JSX.Element } = {
		1: <SelfImprovementIcon />,
		2: <FavoriteIcon />,
		3: <DirectionsBikeIcon />,
		4: <DirectionsRunIcon />,
		10: <FitnessCenterIcon />,
		11: <HealingIcon />
	}

	useEffect(() => {
		const fetchInitialData = async () => {
			const activitiesData = await fetchAllActivities()
			setActivities(activitiesData)

			const groupActivitiesData = await fetchAllActivitiesGroup()
			setActivitiesGroup(groupActivitiesData)
		}
		fetchInitialData()
	}, [])

	useEffect(() => {
		const fetchCoachesData = async () => {
			if (selectedActivity) {
				const coachesData = isPrivateTraining
					? await fetchCoachesActivities(selectedActivity)
					: await fetchCoachesActivitiesGroup(selectedActivity)
				setCoaches(coachesData)
				setSelectedCoach(null)
				setSelectedDate(null)
				setSelectedTime('')
				setAvailableTimes([])
				setGroupAvailableTimes([])
				setHighlightDates([])
			}
		}
		fetchCoachesData()
	}, [selectedActivity, isPrivateTraining])

	useEffect(() => {
		const resetDateAndTime = () => {
			setSelectedDate(null)
			setSelectedTime('')
		}

		if (selectedActivity && selectedCoach) {
			resetDateAndTime()
		}
	}, [selectedCoach])

	useEffect(() => {
		const fetchDatesAndTimes = async () => {
			if (selectedActivity && selectedCoach) {
				const data = isPrivateTraining
					? await fetchFilteredUnbookedTimeSlots({
							activityId: selectedActivity,
							coachId: selectedCoach,
							date: selectedDate ? formatDate(selectedDate) : undefined
					  })
					: await fetchFilteredUnbookedTimeSlotsGroup({
							activityId: selectedActivity,
							coachId: selectedCoach,
							date: selectedDate ? formatDate(selectedDate) : undefined
					  })
				if (data) {
					if (!selectedDate) {
						const datesForSelectedCoach = data
							.filter(
								(slot: { coach_id: number }) => slot.coach_id === selectedCoach
							)
							.map(
								(slot: { date: string | number | Date }) => new Date(slot.date)
							)
						setHighlightDates(datesForSelectedCoach)
					}
					if (selectedDate) {
						const timesForSelectedDate = data
							.filter(
								(slot: { date: string | number | Date }) =>
									new Date(slot.date).toDateString() ===
									selectedDate.toDateString()
							)
							.map((slot: { start_time: string; end_time: string }) => {
								const startTime = slot.start_time.substr(0, 5)
								const endTime = slot.end_time.substr(0, 5)
								return `${startTime} - ${endTime}`
							})
						isPrivateTraining
							? setAvailableTimes(timesForSelectedDate)
							: setGroupAvailableTimes(timesForSelectedDate)
					}
				}
			}
		}

		fetchDatesAndTimes()
	}, [selectedActivity, selectedCoach, selectedDate, isPrivateTraining])

	const handleBookSession = async () => {
		if (
			!selectedUser ||
			!selectedActivity ||
			!selectedCoach ||
			!selectedDate ||
			!selectedTime
		) {
			alert('Please select all booking details')
			return
		}

		setLoading(true)
		const [startTime, endTime] = selectedTime.split(' - ')
		const result = isPrivateTraining
			? await bookTimeSlotForClient({
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime,
					endTime,
					userId: selectedUser
			  })
			: await bookTimeSlotForClientGroup({
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime,
					endTime,
					userId: selectedUser
			  })
		setLoading(false)

		if (result.error) {
			toast.error('Error booking session')
		} else {
			toast.success('Session booked successfully')
			window.location.reload()
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

	useEffect(() => {
		const fetchUsersData = async () => {
			const usersData = await fetchUsers(searchQuery)
			setSearchResults(usersData)
		}
		fetchUsersData()
	}, [searchQuery])

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

	const formatDate = (date: Date | null): string =>
		date
			? [
					date.getFullYear(),
					('0' + (date.getMonth() + 1)).slice(-2),
					('0' + date.getDate()).slice(-2)
			  ].join('-')
			: ''
	return (
		<div>
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-center items-center py-4'>
					<div className='flex items-center'>
						<button
							className={`px-4 py-2 mr-2 rounded ${
								isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={() => setIsPrivateTraining(true)}>
							Private Training
						</button>
						<button
							className={`px-4 py-2 rounded ${
								!isPrivateTraining ? 'bg-green-500 text-white' : 'bg-gray-200'
							}`}
							onClick={() => setIsPrivateTraining(false)}>
							Public Training
						</button>
					</div>
				</div>
				<div className='mb-12'>
					<h1 className='text-3xl font-bold my-4'>Book a Session for a User</h1>
					<Select
						options={userOptions}
						onChange={selectedOption =>
							setSelectedUser(selectedOption ? selectedOption.value : null)
						}
						placeholder='Search for a user'
						isClearable
						isSearchable
						noOptionsMessage={() => 'No users found'}
						className='basic-single'
						classNamePrefix='select'
					/>
				</div>
				{isPrivateTraining ? (
					<>
						<h1 className='text-3xl font-bold my-4'>Select an activity</h1>
						<div className='grid lg:grid-cols-3 -1 gap-4'>
							{activities.map(activity => (
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
							))}
						</div>
						<div className='mt-12'>
							<h2 className='text-3xl font-bold mb-4'>Select a Coach</h2>
							<div className='grid lg:grid-cols-3 gap-4'>
								{coaches.map(coach => (
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
								))}
							</div>
						</div>
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
												className={`p-4 mt-6 rounded-lg text-lg font-semibold mb-2 ${
													selectedTime === time
														? 'bg-green-200  dark:bg-green-700'
														: 'hover:bg-gray-100'
												}`}
												onClick={() => setSelectedTime(time)}>
												{time}
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
									{activities.find(a => a.id === selectedActivity)?.name} with{' '}
									{coaches.find(c => c.id === selectedCoach)?.name} on{' '}
									{selectedDate?.toLocaleDateString()} at {selectedTime}.
								</p>
								<button
									type='button'
									onClick={handleBookSession}
									disabled={loading}
									className='rounded-md mb-12 bg-green-600 disabled:bg-green-300 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 mt-4'>
									{loading ? 'Processing...' : 'Confirm Booking'}
								</button>
							</div>
						)}
					</>
				) : (
					<>
						<h1 className='text-3xl font-bold my-4'>Select an activity</h1>
						<div className='grid lg:grid-cols-3 -1 gap-4'>
							{activitiesGroup.map(activity => (
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
							))}
						</div>
						<div className='mt-12'>
							<h2 className='text-3xl font-bold mb-4'>Select a Coach</h2>
							<div className='grid lg:grid-cols-3 gap-4'>
								{coaches.map(coach => (
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
								))}
							</div>
						</div>
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
												className={`p-4 mt-6 rounded-lg text-lg font-semibold mb-2 ${
													selectedTime === time
														? 'bg-green-200 dark:bg-green-700'
														: 'hover:bg-gray-100'
												}`}
												onClick={() => setSelectedTime(time)}>
												{time}
												<p className='text-gray-400 mt-2 text-xs'>
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
									className='rounded-md mb-12 bg-green-600 disabled:bg-green-300 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 mt-4'>
									{loading ? 'Processing...' : 'Confirm Booking'}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
