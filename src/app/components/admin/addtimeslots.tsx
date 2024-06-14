'use client' //use clients
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
import MultiDatePicker, { Calendar } from 'react-multi-date-picker'
import { DateObject } from 'react-multi-date-picker'
import DatePanel from 'react-multi-date-picker/plugins/date_panel'
import Icon from 'react-multi-date-picker/components/icon'
import Toolbar from 'react-multi-date-picker/plugins/toolbar'
import toast from 'react-hot-toast'

type OptionType = {
	label: string
	value: string
}

export default function AddTimeSlotComponent() {
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
		<div className='container mx-auto px-4'>
			<h1 className='text-2xl font-bold mb-4'>Add Time Slots</h1>
			<div className='flex flex-wrap mb-4'>
				<div className='w-full md:w-1/2 px-2 mb-4 md:mb-0'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedCoach}
						value={selectedCoach}
					/>
				</div>
				<div className='w-full md:w-1/2 px-2'>
					<Select
						placeholder='Select Activity'
						options={activities}
						onChange={setSelectedActivity}
						value={selectedActivity}
					/>
				</div>
			</div>
			<div className='mb-4 text-center'>
				<MultiDatePicker
					value={selectedDates}
					render={<Icon />}
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
				/>
			</div>
			<div className='flex flex-wrap mb-4'>
				<div className='w-full md:w-1/2 px-2 mb-4 md:mb-0'>
					<input
						type='time'
						value={startTime}
						onChange={e => setStartTime(e.target.value)}
						className='border px-2 py-1 rounded w-full'
					/>
				</div>
				<div className='w-full md:w-1/2 px-2'>
					<input
						type='time'
						value={endTime}
						onChange={e => setEndTime(e.target.value)}
						className='border px-2 py-1 rounded w-full'
					/>
				</div>
			</div>
			<div className='text-center mb-8'>
				<button
					onClick={handleAddTimeSlot}
					className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
					Add Time Slots
				</button>
			</div>
			<hr className='mt-12 mb-12'></hr>
			<h1 className='text-2xl mt-12 font-bold mb-4'>Add Group Time Slots</h1>
			<div className='flex flex-wrap mb-4'>
				<div className='w-full md:w-1/2 px-2 mb-4 md:mb-0'>
					<Select
						placeholder='Select Coach'
						options={coaches}
						onChange={setSelectedCoach}
						value={selectedCoach}
					/>
				</div>
				<div className='w-full md:w-1/2 px-2'>
					<Select
						placeholder='Select Group Activity'
						options={groupActivities}
						onChange={setSelectedGroupActivity}
						value={selectedGroupActivity}
					/>
				</div>
			</div>
			<div className='mb-4 text-center'>
				<MultiDatePicker
					value={selectedGroupDates}
					render={<Icon />}
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
				/>
			</div>
			<div className='flex flex-wrap mb-4'>
				<div className='w-full md:w-1/2 px-2 mb-4 md:mb-0'>
					<input
						type='time'
						value={startTime}
						onChange={e => setStartTime(e.target.value)}
						className='border px-2 py-1 rounded w-full'
					/>
				</div>
				<div className='w-full md:w-1/2 px-2'>
					<input
						type='time'
						value={endTime}
						onChange={e => setEndTime(e.target.value)}
						className='border px-2 py-1 rounded w-full'
					/>
				</div>
			</div>
			<div className='text-center'>
				<button
					onClick={handleAddGroupTimeSlot}
					className='bg-blue-500 hover:bg-green-700 mb-5 text-white font-bold py-2 px-4 rounded'>
					Add Group Time Slots
				</button>
			</div>
		</div>
	)
}
