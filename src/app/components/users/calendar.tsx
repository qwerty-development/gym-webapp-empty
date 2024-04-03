"use client"
import React, { useState } from 'react';
import 'tailwindcss/tailwind.css';

interface CalendarProps {
    onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onSelectDate }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        onSelectDate(date);
    };

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(event.target.value);
        setSelectedDate(new Date(selectedDate.getFullYear(), newMonth, 1));
    };

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value);
        setSelectedDate(new Date(newYear, selectedDate.getMonth(), 1));
    };

    const renderDaysOfWeek = () => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return daysOfWeek.map(day => (
            <div key={day} className="text-xs text-gray-500 uppercase font-medium tracking-wide">
                {day}
            </div>
        ));
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
        ).getDate();

        const firstDayOfMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        ).getDay();

        const calendarDays = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-gray-200 w-14 h-14" />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                i
            );

            calendarDays.push(
                <div
                    key={`day-${i}`}
                    className="border-r border-b border-gray-200 w-14 h-14 flex justify-center items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDateClick(currentDate)}
                >
                    {i}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mx-auto">
            <div className="bg-white px-4 py-3 flex justify-between items-center">
                <div>
                    <select
                        className="p-2 mr-2"
                        value={selectedDate.getMonth()}
                        onChange={handleMonthChange}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {new Date(selectedDate.getFullYear(), i, 1).toLocaleString(
                                    undefined,
                                    { month: 'long' }
                                )}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2"
                        value={selectedDate.getFullYear()}
                        onChange={handleYearChange}
                    >
                        {Array.from({ length: 50 }, (_, i) => (
                            <option key={i} value={selectedDate.getFullYear() - 25 + i}>
                                {selectedDate.getFullYear() - 25 + i}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-7">
                {renderDaysOfWeek()}
                {renderCalendar()}
            </div>
        </div>
    );
};

export default Calendar;
