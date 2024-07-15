'use client'
import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import 'react-datepicker/dist/react-datepicker.css'
import {
	fetchCoaches,
	fetchActivities,
	addTimeSlot,
	fetchGroupActivities,
	addTimeSlotGroup
} from '../../../../utils/admin-requests'
import MultiDatePicker from 'react-multi-date-picker'
import DatePanel from 'react-multi-date-picker/plugins/date_panel'
import Icon from 'react-multi-date-picker/components/icon'
import Toolbar from 'react-multi-date-picker/plugins/toolbar'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCalendarAlt, FaClock, FaUserFriends, FaUser } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'
import { DateObject } from 'react-multi-date-picker'

type OptionType = {
	label: string
	value: string
}

const customSelectStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: '#353b35', // gray-800
		borderColor: '#36783a', // green-400 (primary)
		borderRadius: '9999px',
		padding: '0.5rem',
		boxShadow: 'none',
		'&:hover': {
			borderColor: '#4c6f46' // green-500
		}
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: '#353b35' // gray-800
	}),
	option: (provided: any, state: { isSelected: any }) => ({
		...provided,
		backgroundColor: state.isSelected ? '#36783a' : '#353b35', // green-400 if selected, gray-800 if not
		'&:hover': {
			backgroundColor: '#4c6f46', // green-500
			color: 'white'
		}
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: 'white'
	}),
	input: (provided: any) => ({
		...provided,
		color: 'white'
	})
}
export default function AddTimeSlotComponent() {
	const [isPublic, setIsPublic] = useState(false)
	const [coaches, setCoaches] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<OptionType[]>([])
	const [groupActivities, setGroupActivities] = useState<OptionType[]>([])
	const [selectedCoach, setSelectedCoach] = useState<OptionType | null>(null)
	const [selectedActivity, setSelectedActivity] = useState<OptionType | null>(
		null
	)
	const [buttonLoading, setButtonLoading] = useState(false)
	const [selectedGroupActivity, setSelectedGroupActivity] =
		useState<OptionType | null>(null)
	const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()])
	const [selectedGroupDates, setSelectedGroupDates] = useState<Date[]>([
		new Date()
	])
	const [startTime, setStartTime] = useState<string>('')
	const [endTime, setEndTime] = useState<string>('')

	useEffect(() => {
		async function loadCoachesAndActivities() {
			const fetchedCoaches = await fetchCoaches()
			setCoaches(
				fetchedCoaches.map(coach => ({ label: coach.name, value: coach.id }))
			)
			const fetchedActivities = await fetchActivities()
			setActivities(
				fetchedActivities.map(activity => ({
					label: activity.name,
					value: activity.id
				}))
			)
			const fetchedGroupActivities = await fetchGroupActivities()
			setGroupActivities(
				fetchedGroupActivities.map(activity => ({
					label: activity.name,
					value: activity.id
				}))
			)
		}

		loadCoachesAndActivities()
	}, [])

	const handleDateChange = (dates: DateObject | DateObject[] | null) => {
		if (Array.isArray(dates)) {
			setSelectedDates(dates.map(date => date.toDate()))
		}
	}

	const handleGroupDateChange = (dates: DateObject | DateObject[] | null) => {
		if (Array.isArray(dates)) {
			setSelectedGroupDates(dates.map(date => date.toDate()))
		}
	}

	const handleAddTimeSlot = async () => {
		setButtonLoading(true)
		if (
			!selectedCoach ||
			!selectedActivity ||
			selectedDates.length === 0 ||
			!startTime ||
			!endTime
		) {
			alert('Please fill in all fields')
			setButtonLoading(false)
			return
		}

		for (const date of selectedDates) {
			const newTimeSlot = {
				coach_id: selectedCoach.value,
				activity_id: selectedActivity.value,
				date: date.toISOString().substring(0, 10),
				start_time: startTime,
				end_time: endTime,
				booked: false,
				additions: []
			}

			const result = await addTimeSlot(newTimeSlot)
			if (!result.success) {
				toast.error('Error adding new time slot')
				return
			}
		}

		toast.success('Time slots added successfully')
		setButtonLoading(false)
	}

	const handleAddGroupTimeSlot = async () => {
		setButtonLoading(true)
		if (
			!selectedCoach ||
			!selectedGroupActivity ||
			selectedGroupDates.length === 0 ||
			!startTime ||
			!endTime
		) {
			alert('Please fill in all fields')
			setButtonLoading(false)
			return
		}

		for (const date of selectedGroupDates) {
			const newGroupTimeSlot = {
				coach_id: selectedCoach.value,
				activity_id: selectedGroupActivity.value,
				date: date.toISOString().substring(0, 10),
				start_time: startTime,
				end_time: endTime,
				booked: false,
				user_id: [],
				count: 0,
				additions: []
			}

			const result = await addTimeSlotGroup(newGroupTimeSlot)
			if (!result.success) {
				toast.error('Error adding new group time slot')
				return
			}
		}

		toast.success('Group time slots added successfully')
		setButtonLoading(false)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gray-900 text-white font-sans p-8'>
			<h1 className='text-4xl font-bold mb-8 text-green-400'>Add Time Slots</h1>

			<motion.div className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedCoach}
						value={selectedCoach}
						styles={customSelectStyles}
					/>
					<Select
						placeholder='Select Activity'
						options={activities}
						onChange={setSelectedActivity}
						value={selectedActivity}
						styles={customSelectStyles}
					/>
				</div>

				<div className='mb-6 flex flex-row justify-center align-middle'>
					<MultiDatePicker
						value={selectedDates}
						onChange={handleDateChange}
						format='YYYY-MM-DD'
						plugins={[
							<DatePanel key='date-panel' sort='date' />,
							<Toolbar
								key='toolbar'
								position='bottom'
								sort={['deselect', 'close', 'today']}
							/>
						]}
						render={<Icon />}
						className='custom-date-picker w-full bg-gray-700 border-2 border-green-400 rounded-full text-white'
						containerClassName='custom-date-picker-container'
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={startTime}
							onChange={e => setStartTime(e.target.value)}
							className='w-full p-3 pl-10 bg-gray-700 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
						/>
					</div>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={endTime}
							onChange={e => setEndTime(e.target.value)}
							className='w-full p-3 pl-10 bg-gray-700 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
						/>
					</div>
				</div>

				<motion.button
					onClick={handleAddTimeSlot}
					disabled={buttonLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='w-full px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
					{buttonLoading ? (
						<RingLoader color='#ffffff' size={24} />
					) : (
						'Add Time Slots'
					)}
				</motion.button>
			</motion.div>

			<h1 className='text-4xl font-bold mb-8 text-green-400'>
				Add Group Time Slots
			</h1>

			<motion.div className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedCoach}
						value={selectedCoach}
						styles={customSelectStyles}
					/>
					<Select
						placeholder='Select Group Activity'
						options={groupActivities}
						onChange={setSelectedGroupActivity}
						value={selectedGroupActivity}
						styles={customSelectStyles}
					/>
				</div>

				<div className='mb-6 flex flex-row justify-center align-middle'>
					<MultiDatePicker
						value={selectedGroupDates}
						onChange={handleGroupDateChange}
						format='YYYY-MM-DD'
						plugins={[
							<DatePanel key='date-panel' sort='date' />,
							<Toolbar
								key='toolbar'
								position='bottom'
								sort={['deselect', 'close', 'today']}
							/>
						]}
						render={<Icon />}
						className='custom-date-picker w-full bg-gray-700 border-2 border-green-400 rounded-full text-white'
						containerClassName='custom-date-picker-container'
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={startTime}
							onChange={e => setStartTime(e.target.value)}
							className='w-full p-3 pl-10 bg-gray-700 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
						/>
					</div>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={endTime}
							onChange={e => setEndTime(e.target.value)}
							className='w-full p-3 pl-10 bg-gray-700 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
						/>
					</div>
				</div>

				<motion.button
					onClick={handleAddGroupTimeSlot}
					disabled={buttonLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='w-full px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
					{buttonLoading ? (
						<RingLoader color='#ffffff' size={24} />
					) : (
						'Add Group Time Slots'
					)}
				</motion.button>
			</motion.div>
		</motion.div>
	)
}
