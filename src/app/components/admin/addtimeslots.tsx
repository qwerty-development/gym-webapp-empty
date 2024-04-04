// addtimeslots.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fetchCoaches, fetchActivities, addTimeSlot } from '../../../../utils/admin-requests'

type OptionType = {
    label: string;
    value: string;
};

export default function AddTimeSlotComponent() {
    const [coaches, setCoaches] = useState<OptionType[]>([]);
    const [activities, setActivities] = useState<OptionType[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<OptionType | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<OptionType | null>(null);
    const [date, setDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    useEffect(() => {
        const loadCoaches = async () => {
            const fetchedCoaches = await fetchCoaches();
            setCoaches(fetchedCoaches.map(coach => ({ label: coach.name, value: coach.id })));
        };

        const loadActivities = async () => {
            const fetchedActivities = await fetchActivities();
            setActivities(fetchedActivities.map(activity => ({ label: activity.name, value: activity.id })));
        };

        loadCoaches();
        loadActivities();
    }, []);

    const handleAddTimeSlot = async () => {
        if (selectedCoach && selectedActivity && startTime && endTime) {
            const newTimeSlot = {
                coach_id: selectedCoach.value,
                activity_id: selectedActivity.value,
                date: date.toISOString().substring(0, 10), // Formats date as YYYY-MM-DD
                start_time: startTime,
                end_time: endTime,
                booked: false, // Default to false when creating a new time slot
            };
    
            const result = await addTimeSlot(newTimeSlot);
            if (result) {
                alert('Time slot added successfully');
                // Optionally, clear the form or navigate away after successful add
            } else {
                alert('Failed to add time slot', );
                console.log(newTimeSlot)
            }
        } else {
            alert('Please fill in all fields');
        }
    };
    

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Add Time Slot</h1>
            <div className="mb-4">
                <Select
                    placeholder="Select Coach"
                    options={coaches}
                    onChange={setSelectedCoach}
                    value={selectedCoach}
                />
            </div>
            <div className="mb-4">
                <Select
                    placeholder="Select Activity"
                    options={activities}
                    onChange={setSelectedActivity}
                    value={selectedActivity}
                />
            </div>
            <div className="mb-4">
                <DatePicker selected={date}
                    onChange={(selectedDate: Date) => setDate(selectedDate)}
                    dateFormat="yyyy-MM-dd" />
            </div>
            <div className="mb-4">
                <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
            </div>
            <div className="mb-4">
                <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
            </div>
            <div>
                <button onClick={handleAddTimeSlot} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add Time Slot
                </button>
            </div>
        </div>
    );
}
