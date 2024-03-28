'use client'
// bookasession.tsx
import { Fragment, useEffect, useState } from 'react';
import NavbarComponent from '../components/navbar';
import { currentUser, useUser } from '@clerk/nextjs';
import { fetchFilteredUnbookedTimeSlots, fetchAllActivities, fetchCoaches, bookTimeSlot } from '../../../utils/requests';

export default function Example() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [activities, setActivities] = useState<{ id: number; name: string; credits?: number }[]>([]);
  const [coaches, setCoaches] = useState<{ id: number; name: string }[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedActivityCredits, setSelectedActivityCredits] = useState<number>(0);
  const { user } = useUser();

  useEffect(() => {
    const fetchInitialData = async () => {
      const activitiesData = await fetchAllActivities();
      // Assuming each activity object now includes a 'credits' property
      setActivities(activitiesData);

      setSelectedCoach(null);
      setSelectedDate(null);
      setSelectedTime('');
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchCoachesData = async () => {
      if (selectedActivity !== null) {
        const coachesData = await fetchCoaches(selectedActivity);
        setCoaches(coachesData);

        setSelectedDate(null);
        setSelectedTime('');
        setAvailableTimes([]);
      }
    };

    fetchCoachesData();
  }, [selectedActivity]);

  useEffect(() => {
    if (selectedActivity !== null) {
      const activity = activities.find(a => a.id === selectedActivity);
      setSelectedActivityCredits(activity?.credits || 0);
    }
  }, [selectedActivity, activities]);

  useEffect(() => {
    const fetchDatesAndTimes = async () => {
      if (selectedActivity !== null && selectedCoach !== null) {
        const data = await fetchFilteredUnbookedTimeSlots({
          activityId: selectedActivity,
          coachId: selectedCoach,
          date: selectedDate ? formatDate(selectedDate) : undefined,
        });

        if (data) {
          if (!selectedDate) {
            const newDates = Array.from(new Set(data.map(slot => new Date(slot.date))));
            setAvailableDates(newDates);
          }

          if (selectedDate) {
            const timesForSelectedDate = data.filter(slot => new Date(slot.date).toDateString() === selectedDate.toDateString())
              .map(slot => `${slot.start_time} - ${slot.end_time}`);
            setAvailableTimes(timesForSelectedDate);
          }
        }
      }
    };

    fetchDatesAndTimes();
  }, [selectedActivity, selectedCoach, selectedDate]);

  const handleBookSession = async () => {
    if (!user) {
      console.error("User is not signed in");
      return;
    }
  
    // Format the start time and end time
    const [startTime, endTime] = selectedTime.split(' - ');
  
    const { error, data } = await bookTimeSlot({
      activityId: selectedActivity,
      coachId: selectedCoach,
      date: formatDate(selectedDate),
      startTime: startTime, // Use the formatted start time
      endTime: endTime,     // Use the formatted end time
      userId: user.id,
    });
  
    if (error) {
      console.error("Booking failed:", error);
      // Check if the error message is about insufficient credits
      if (error === 'Not enough credits to book the session.') {
        alert("You don't have enough credits.");
      } else {
        console.error("An error occurred during booking:", error);
      }
    } else {
      console.log("Booking successful:", data);
      // Reload the page to reflect the new booking
      location.reload();
      alert("Booking successful!");
    }
  };
  


  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  const handleSelectDate = (date: Date) => setSelectedDate(date);

  return (
    <div>
      <NavbarComponent />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-12">
          <h1 className="text-3xl font-bold mb-4">Select an Activity</h1>
          <div className="grid grid-cols-3 gap-4">
            {activities.map(activity => (
              <div
                key={activity.id}
                className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedActivity === activity.id ? 'bg-green-200' : ''
                  }`}
                onClick={() => setSelectedActivity(activity.id)}
              >
                <p className="text-lg font-semibold">{activity.name}</p>
              </div>
            ))}
          </div>
        </div>
        {selectedActivity !== null && (
          <Fragment>
            <div className="mt-12">
              <h1 className="text-3xl font-bold mb-4">Select a Coach</h1>
              <div className="grid grid-cols-3 gap-4">
                {coaches.map(coach => (
                  <div
                    key={coach.id}
                    className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedCoach === coach.id ? 'bg-green-200' : ''
                      }`}
                    onClick={() => setSelectedCoach(coach.id)}
                  >
                    <p className="text-lg font-semibold">{coach.name}</p>
                  </div>
                ))}
              </div>
            </div>
            {selectedCoach !== null && (
              <Fragment>
                <div className="mt-12">
                  <h1 className="text-3xl font-bold mb-4">Select a Date</h1>
                  <div className="grid grid-cols-3 gap-4">
                    {availableDates.map(date => (
                      <div
                        key={date.toISOString()}
                        className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedDate?.toISOString() === date.toISOString() ? 'bg-green-200' : ''
                          }`}
                        onClick={() => handleSelectDate(date)}
                      >
                        <p className="text-lg font-semibold">{date.toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedDate && (
                  <Fragment>
                    <div className="mt-12">
                      <h1 className="text-3xl font-bold mb-4">Select a Time</h1>
                      <div className="grid grid-cols-3 gap-4 mb-12">
                        {availableTimes.map(time => (
                          <div
                            key={time}
                            className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-100 ${selectedTime === time ? 'bg-green-200' : ''}`}
                            onClick={() => setSelectedTime(time)}
                          >
                            <p className="text-lg font-semibold">{time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedTime && (
                      <div className="mt-12">
                        <p className="text-xl text-center font-semibold mb-2">
                          You have chosen {activities.find(activity => activity.id === selectedActivity)?.name} with {coaches.find(coach => coach.id === selectedCoach)?.name} at {selectedTime} on {selectedDate?.toLocaleDateString()}.
                        </p>
                        {/* Display the selected activity's credits */}
                        <p className="text-center font-semibold">Cost: {selectedActivityCredits} credits</p>
                        <center>
                          <button
                            type="button"
                            onClick={handleBookSession}
                            className="rounded-md mt-12 mb-12 bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Book Session!
                          </button>
                        </center>
                      </div>
                    )}
                  </Fragment>
                )}

              </Fragment>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
}
