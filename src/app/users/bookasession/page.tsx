'use client'
import { Fragment, useEffect, useState } from 'react';
import NavbarComponent from '../../components/users/navbar';
import { useUser } from '@clerk/nextjs';
import { getWalletBalance } from '../../../../utils/user-requests';
import { fetchFilteredUnbookedTimeSlots, fetchAllActivities, fetchCoaches, bookTimeSlot } from '../../../../utils/user-requests';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HealingIcon from '@mui/icons-material/Healing';
import { RotateLoader } from "react-spinners";



export default function Example() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [activities, setActivities] = useState<{ id: number; name: string; credits?: number }[]>([]);
  const [coaches, setCoaches] = useState<{
    profile_picture: string | undefined; id: number; name: string
  }[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [highlightDates, setHighlightDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);
  const [coachesLoading, setCoachesLoading] = useState<boolean>(false);
  const { user } = useUser();


  interface activityIcons {
    [key: number]: JSX.Element;
  }


  const activityIcons: { [key: number]: JSX.Element } = {
    1: <SelfImprovementIcon />,
    2: <FavoriteIcon />,
    3: <DirectionsBikeIcon />,
    4: <DirectionsRunIcon />,
    10: <FitnessCenterIcon />,
    11: <HealingIcon />
  };



  useEffect(() => {
    const fetchInitialData = async () => {
      setActivitiesLoading(true); // Set loading to true while fetching
      const activitiesData = await fetchAllActivities();
      setActivities(activitiesData);
      setActivitiesLoading(false); // Set loading to false after fetching
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchCoachesData = async () => {
      if (selectedActivity) {
        setCoachesLoading(true); // Set loading to true while fetching
        const coachesData = await fetchCoaches(selectedActivity);
        setCoaches(coachesData);
        setSelectedCoach(null); // Reset selectedCoach
        setSelectedDate(null); // Reset selectedDate
        setSelectedTime('');
        setAvailableTimes([]);
        setHighlightDates([]);  // Reset highlight dates when coach changes
        setCoachesLoading(false); // Set loading to false after fetching
      }
    };
    fetchCoachesData();
  }, [selectedActivity]);

  useEffect(() => {
    const resetDateAndTime = () => {
      setSelectedDate(null); // Reset selectedDate
      setSelectedTime(''); // Reset selectedTime
    };

    if (selectedActivity && selectedCoach) {
      resetDateAndTime();
    }
  }, [selectedCoach]); // Add selectedCoach as a dependency


  useEffect(() => {
    const fetchDatesAndTimes = async () => {
      if (selectedActivity && selectedCoach) {
        const data = await fetchFilteredUnbookedTimeSlots({
          activityId: selectedActivity,
          coachId: selectedCoach,
          date: selectedDate ? formatDate(selectedDate) : undefined,
        });
        if (data) {
          if (!selectedDate) {
            const datesForSelectedCoach = data
              .filter(slot => slot.coach_id === selectedCoach)
              .map(slot => new Date(slot.date));
            setHighlightDates(datesForSelectedCoach);
          }
          if (selectedDate) {
            const timesForSelectedDate = data
              .filter(slot => new Date(slot.date).toDateString() === selectedDate.toDateString())
              .map(slot => {
                const startTime = slot.start_time.substr(0, 5); // Take the substring to include only hours and minutes
                const endTime = slot.end_time.substr(0, 5); // Similarly for end time
                return `${startTime} - ${endTime}`;
              });
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
    setLoading(true);
    const [startTime, endTime] = selectedTime.split(' - ');
    const { error, data } = await bookTimeSlot({
      activityId: selectedActivity,
      coachId: selectedCoach,
      date: formatDate(selectedDate),
      startTime,
      endTime,
      userId: user.id,
    });
    setLoading(false);
    if (error) {
      console.error("Booking failed:", error);
      alert("Booking failed: " + error);
    } else {
      alert("Booking successful!");
      window.location.reload();
    }
  };

  const formatDate = (date: Date | null): string => date ? [date.getFullYear(), ('0' + (date.getMonth() + 1)).slice(-2), ('0' + date.getDate()).slice(-2)].join('-') : '';

  return (
    <div>
      <NavbarComponent />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold my-4">Select an activity</h1>
        {activitiesLoading ? ( // Display loading indicator while fetching activities
              <div className="flex items-center justify-center">
              <RotateLoader color={"#367831"} loading={activitiesLoading} size={15} />
            </div>
        ) : (
          <div className="grid lg:grid-cols-3 -1 gap-4">
            {activities.length === 0 ? ( // Display sad emoji when no activities available
              <p>No activities available 😞</p>
            ) : (
              activities.map(activity => (
                <button
                  key={activity.id}
                  className={`flex border p-4 rounded-lg ${selectedActivity === activity.id ? 'bg-green-200 dark:bg-green-700' : 'hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  onClick={() => setSelectedActivity(activity.id)}
                >
                  <span className="items-left justify-start">{activityIcons[activity.id]}</span> {/* Display the corresponding icon */}
                  <span className="mx-auto">{activity.name}</span> {/* Display the activity name */}
                </button>
              ))
            )}
          </div>
        )}

        {/* Coaches section with loading indicator and sad emoji */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-4">Select a Coach</h2>
          {selectedActivity === null ? (
            <p>Please choose an activity to be able to see the coaches</p>
          ) : coachesLoading ? (
            <div className="flex items-center justify-center">
            <RotateLoader color={"#367831"} loading={coachesLoading} size={15} />
          </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              {coaches.length === 0 ? (
                <p>No coaches available for the chosen activity 😞</p>
              ) : (
                coaches.map(coach => (
                  <button key={coach.id} className={`border p-4 rounded-lg ${selectedCoach === coach.id ? 'bg-green-200  dark:bg-green-700' : 'hover:bg-gray-100'}`} onClick={() => setSelectedCoach(coach.id)}>
                    <img src={coach.profile_picture} alt={`${coach.name}`} className="w-16 h-16 rounded-full mx-auto mb-2" />
                    {coach.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

      </div>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className="mt-12 sm:flex">
          <div className="flex-grow">
            <h2 className="text-3xl mb-10 font-bold">Select a Date</h2>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              inline
              calendarClassName="react-datepicker-popper"
              minDate={new Date()}
              highlightDates={highlightDates}
            />
          </div>
          {selectedDate && (
            <div className="lg:ml-4 w-full md:w-1/3">
              <h2 className="text-3xl font-bold mb-4">Available Times</h2>
              <div className="flex flex-col">
                {availableTimes.map(time => (
                  <button key={time} className={`p-4 mt-6 rounded-lg text-lg font-semibold mb-2 ${selectedTime === time ? 'bg-green-200  dark:bg-green-700' : 'hover:bg-gray-100'}`} onClick={() => setSelectedTime(time)}>
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {selectedTime && (
          <div className="mt-12 text-center">
            <p className="text-xl font-semibold">
              Booking {activities.find(a => a.id === selectedActivity)?.name} with {coaches.find(c => c.id === selectedCoach)?.name} on {selectedDate?.toLocaleDateString()} at {selectedTime}.
            </p>
            <button type="button" onClick={handleBookSession} disabled={loading} className="rounded-md mb-12 bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 mt-4">
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}