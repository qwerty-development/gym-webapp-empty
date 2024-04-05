// addtimeslots.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fetchCoaches, fetchActivities, addTimeSlot } from '../../../../utils/admin-requests';

type OptionType = {
    label: string;
    value: string;
};

export default function AddTimeSlotComponent() {
    const [coaches, setCoaches] = useState<OptionType[]>([]);
    const [activities, setActivities] = useState<OptionType[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<OptionType | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<OptionType | null>(null);
    // Update for date selection to handle multiple dates
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
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
        // Check for all required fields including startDate
        if (!selectedCoach || !selectedActivity || !startTime || !endTime || !startDate) {
            alert('Please fill in all fields');
            return;
        }
    
        // Ensure endDate is not null; if it is, use startDate as endDate
        const finalEndDate = endDate ? new Date(endDate) : new Date(startDate);
    
        // Create an array to hold all the dates between startDate and finalEndDate
        let currentDate = new Date(startDate);
        const datesToAdd = [];
        while (currentDate <= finalEndDate) {
            datesToAdd.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        // Loop through each date and create a time slot
        for (const date of datesToAdd) {
            const newTimeSlot = {
                coach_id: selectedCoach.value,
                activity_id: selectedActivity.value,
                date: date.toISOString().substring(0, 10), // Format date as YYYY-MM-DD
                start_time: startTime,
                end_time: endTime,
                booked: false,
            };
    
            const result = await addTimeSlot(newTimeSlot);
            if (result.success === false) {
                alert(`Error adding new time slot: ${result.error}`);
                return; // Stop adding more if one fails
            }
        }
    
        alert('New time slots added successfully');
    };
    

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Add Time Slots</h1>
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
            <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => {
                      setStartDate(update[0]);
                      setEndDate(update[1]);
                    }}
                    dateFormat="yyyy-MM-dd"
                />
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
                    Add Time Slots
                </button>
            </div>
        </div>
    );
}
