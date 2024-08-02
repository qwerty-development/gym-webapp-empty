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
} from '../../../../utils/adminRequests'
import MultiDatePicker from 'react-multi-date-picker'
import DatePanel from 'react-multi-date-picker/plugins/date_panel'
import Icon from 'react-multi-date-picker/components/icon'
import Toolbar from 'react-multi-date-picker/plugins/toolbar'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FaClock } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'
import { DateObject } from 'react-multi-date-picker'

type OptionType = {
	label: string
	value: string
}

// ... (keep the customSelectStyles object as is)
const customSelectStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: '#F2F3F4', // primary white
		borderColor: '#2274A5', // primary blue
		borderRadius: '9999px',
		padding: '0.5rem',
		boxShadow: 'none',
		'&:hover': {
			borderColor: '#1A5D8A' // darker shade of blue
		}
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: '#F2F3F4' // primary white
	}),
	option: (provided: any, state: { isSelected: any }) => ({
		...provided,
		backgroundColor: state.isSelected ? '#2274A5' : '#F2F3F4', // primary blue if selected, primary white if not
		color: state.isSelected ? '#F2F3F4' : '#010B13', // primary white text if selected, primary black text if not
		'&:hover': {
			backgroundColor: '#1A5D8A', // darker shade of blue
			color: '#F2F3F4' // primary white
		}
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: '#010B13' // primary black
	}),
	input: (provided: any) => ({
		...provided,
		color: '#010B13' // primary black
	})
}

export default function AddTimeSlotComponent() {
	// States for private sessions
	const [selectedPrivateCoach, setSelectedPrivateCoach] =
		useState<OptionType | null>(null)
	const [selectedPrivateActivity, setSelectedPrivateActivity] =
		useState<OptionType | null>(null)
	const [selectedPrivateDates, setSelectedPrivateDates] = useState<Date[]>([
		new Date()
	])
	const [privateStartTime, setPrivateStartTime] = useState<string>('')
	const [privateEndTime, setPrivateEndTime] = useState<string>('')

	// States for group sessions
	const [selectedGroupCoach, setSelectedGroupCoach] =
		useState<OptionType | null>(null)
	const [selectedGroupActivity, setSelectedGroupActivity] =
		useState<OptionType | null>(null)
	const [selectedGroupDates, setSelectedGroupDates] = useState<Date[]>([
		new Date()
	])
	const [groupStartTime, setGroupStartTime] = useState<string>('')
	const [groupEndTime, setGroupEndTime] = useState<string>('')

	// Shared states
	const [coaches, setCoaches] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<OptionType[]>([])
	const [groupActivities, setGroupActivities] = useState<OptionType[]>([])
	const [buttonLoading, setButtonLoading] = useState(false)

	useEffect(() => {
		async function loadCoachesAndActivities() {
			const fetchedCoaches = await fetchCoaches()
			setCoaches(
				fetchedCoaches.map((coach: any) => ({
					label: coach.name,
					value: coach.id
				}))
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

	const handlePrivateDateChange = (dates: DateObject | DateObject[] | null) => {
		if (Array.isArray(dates)) {
			setSelectedPrivateDates(dates.map(date => date.toDate()))
		}
	}

	const handleGroupDateChange = (dates: DateObject | DateObject[] | null) => {
		if (Array.isArray(dates)) {
			setSelectedGroupDates(dates.map(date => date.toDate()))
		}
	}

	const handleAddPrivateTimeSlot = async () => {
		setButtonLoading(true)
		if (
			!selectedPrivateCoach ||
			!selectedPrivateActivity ||
			selectedPrivateDates.length === 0 ||
			!privateStartTime ||
			!privateEndTime
		) {
			alert('Please fill in all fields for private session')
			setButtonLoading(false)
			return
		}

		for (const date of selectedPrivateDates) {
			const newTimeSlot = {
				coach_id: selectedPrivateCoach.value,
				activity_id: selectedPrivateActivity.value,
				date: date.toISOString().substring(0, 10),
				start_time: privateStartTime,
				end_time: privateEndTime,
				booked: false,
				additions: [],
				user_id: null
			}

			const result = await addTimeSlot(newTimeSlot)
			if (!result.success) {
				toast.error('Error adding new private time slot')
				setButtonLoading(false)
				return
			}
		}

		toast.success('Private time slots added successfully')
		setButtonLoading(false)
	}

	const handleAddGroupTimeSlot = async () => {
		setButtonLoading(true)
		if (
			!selectedGroupCoach ||
			!selectedGroupActivity ||
			selectedGroupDates.length === 0 ||
			!groupStartTime ||
			!groupEndTime
		) {
			alert('Please fill in all fields for group session')
			setButtonLoading(false)
			return
		}

		for (const date of selectedGroupDates) {
			const newGroupTimeSlot = {
				coach_id: selectedGroupCoach.value,
				activity_id: selectedGroupActivity.value,
				date: date.toISOString().substring(0, 10),
				start_time: groupStartTime,
				end_time: groupEndTime,
				booked: false,
				user_id: [],
				count: 0,
				additions: []
			}

			const result = await addTimeSlotGroup(newGroupTimeSlot)
			if (!result.success) {
				toast.error('Error adding new group time slot')
				setButtonLoading(false)
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
			className='min-h-screen bg-white text-black font-sans p-8'>
			<h1 className='text-4xl font-bold mb-8 text-green-500'>
				Add Private Time Slots
			</h1>

			<motion.div className='bg-gray-100 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedPrivateCoach}
						value={selectedPrivateCoach}
						styles={customSelectStyles}
					/>
					<Select
						placeholder='Select Activity'
						options={activities}
						onChange={setSelectedPrivateActivity}
						value={selectedPrivateActivity}
						styles={customSelectStyles}
					/>
				</div>

				<div className='mb-6 flex flex-row justify-center align-middle'>
					<MultiDatePicker
						value={selectedPrivateDates}
						onChange={handlePrivateDateChange}
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
						className='custom-date-picker w-full bg-white border-2 border-blue-400 rounded-full text-black'
						containerClassName='custom-date-picker-container'
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={privateStartTime}
							onChange={e => setPrivateStartTime(e.target.value)}
							className='w-full p-3 pl-10 bg-white border-2 border-green-500 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
						/>
					</div>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={privateEndTime}
							onChange={e => setPrivateEndTime(e.target.value)}
							className='w-full p-3 pl-10 bg-white border-2 border-green-500 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
						/>
					</div>
				</div>

				<motion.button
					onClick={handleAddPrivateTimeSlot}
					disabled={buttonLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='w-full px-6 py-3 bg-green-500 disabled:bg-blue-300 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white transition duration-300'>
					{buttonLoading ? (
						<RingLoader color='#ffffff' size={24} />
					) : (
						'Add Private Time Slots'
					)}
				</motion.button>
			</motion.div>

			<h1 className='text-4xl font-bold mb-8 text-green-500'>
				Add Group Time Slots
			</h1>

			<motion.div className='bg-gray-100 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedGroupCoach}
						value={selectedGroupCoach}
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
						className='custom-date-picker w-full bg-white border-2 border-blue-400 rounded-full text-black'
						containerClassName='custom-date-picker-container'
					/>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={groupStartTime}
							onChange={e => setGroupStartTime(e.target.value)}
							className='w-full p-3 pl-10 bg-white border-2 border-green-500 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
						/>
					</div>
					<div className='relative'>
						<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
						<input
							type='time'
							value={groupEndTime}
							onChange={e => setGroupEndTime(e.target.value)}
							className='w-full p-3 pl-10 bg-white border-2 border-green-500 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
						/>
					</div>
				</div>

				<motion.button
					onClick={handleAddGroupTimeSlot}
					disabled={buttonLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='w-full px-6 py-3 bg-green-500 disabled:bg-blue-300 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white transition duration-300'>
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
