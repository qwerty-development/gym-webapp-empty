'use client'
import DatePicker from 'react-datepicker'

const DateSelection = ({
	selectedDate,
	handleDateSelect,
	highlightDates
}: any) => {
	return (
		<DatePicker
			selected={selectedDate}
			onChange={date => handleDateSelect(date)}
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
	)
}

export default DateSelection
