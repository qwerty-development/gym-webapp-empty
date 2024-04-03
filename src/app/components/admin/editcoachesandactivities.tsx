'use client'
import React, { useState, useEffect } from 'react';
import {
  addCoach,
  deleteCoach,
  addActivity,
  deleteActivity,
  fetchCoaches,
  fetchActivities,
  updateActivity,
  updateCoach
} from '../../../../utils/admin-requests';
import AdminNavbarComponent from '@/app/components/admin/adminnavbar';

type Coach = {
  id: number;
  name: string;
};

type Activity = {
  id: number;
  name: string;
  credits: number;
  coach_id: number;
};

const CoachesandActivitiesAdminPage = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newCoachName, setNewCoachName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCredits, setNewActivityCredits] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const loadedCoaches = await fetchCoaches();
      const loadedActivities = await fetchActivities();
      setCoaches(loadedCoaches || []);
      setActivities(loadedActivities || []);
    };
    loadInitialData();
  }, [updateTrigger]);

  const refreshData = () => setUpdateTrigger(!updateTrigger);

  // Coach handlers
  const handleAddCoach = async () => {
    const coach = await addCoach({ name: newCoachName });
    if (coach) setCoaches([...coaches, coach]);
    setNewCoachName('');
    fetchCoaches().then(setCoaches);
  };

  const handleDeleteCoach = async (coachId: number) => {
    const success = await deleteCoach(coachId);
    if (success) setCoaches(coaches.filter(coach => coach.id !== coachId));
    fetchCoaches().then(setCoaches); 
  };

  // Activity handlers
  const handleAddActivity = async () => {
    const activity = await addActivity({
      name: newActivityName,
      credits: parseInt(newActivityCredits, 10),
      coach_id: selectedCoachId || 0,
    });
    if (activity) setActivities([...activities, activity]);
    setNewActivityName('');
    setNewActivityCredits('');
    fetchActivities().then(setActivities);
  };

  const handleDeleteActivity = async (activityId: number) => {
    const success = await deleteActivity(activityId);
    if (success) setActivities(activities.filter(activity => activity.id !== activityId));
    fetchActivities().then(setActivities);
  };

  const handleCoachSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const coachId = parseInt(event.target.value, 10);
    setSelectedCoachId(coachId);
    fetchCoaches().then(setCoaches);
  };

  const handleUpdateCoach = async (coachId: number) => {
    const newName = prompt('Enter new name for coach:');
    if (newName) {
      const updatedCoach = await updateCoach({ id: coachId, name: newName });
      fetchCoaches().then(setCoaches);
      if (updatedCoach) {
        setCoaches(coaches.map(coach => coach.id === coachId ? updatedCoach : coach));
        fetchCoaches().then(setCoaches);
      }
    }
  };

  const handleUpdateActivity = async (activityId: number) => {
    const newName = prompt('Enter new name for activity:');
    const creditsInput = prompt('Enter new credits for activity:');
    if (creditsInput !== null) {
      const newCredits = parseInt(creditsInput, 10);
      if (!isNaN(newCredits)) {
        try {
          // Construct the activity object to update
          const updatedActivity = {
            id: activityId,
            name: newName, // Assuming you want to update the name
            credits: newCredits, // Assuming you have a credits field to update
          };

          // Call the update function
          const result = await updateActivity(updatedActivity);
          fetchActivities().then(setActivities);
          if (result) {
            console.log('Activity updated successfully:', result);
            fetchActivities().then(setActivities);
          } else {
            console.error();
            
          }
        } catch (error) {
          console.error('Error updating activity:,', error);
        }
      } else {
        console.error('Invalid credits input.');
      }
    } else {
      console.error('User cancelled the operation.');
    }
  };



  return (
    <div>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl mt-5 font-semibold mb-4">Coaches</h2>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newCoachName}
            onChange={(e) => setNewCoachName(e.target.value)}
            placeholder="New Coach Name"
            className="border border-gray-300 px-3 py-2 rounded-md w-64"
          />
          <button onClick={handleAddCoach} className="bg-blue-500 text-white px-4 py-2 rounded-md">Add Coach</button>
        </div>
        <ul>
          {coaches.map((coach: Coach) => (
            <li key={coach.id} className="flex items-center justify-between bg-gray-100 px-4 py-2 mb-2 rounded-md">
              <span>{coach.name}</span>
              <div className="flex">
                <button onClick={() => handleUpdateCoach(coach.id)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2">Update</button>
                <button onClick={() => handleDeleteCoach(coach.id)} className="bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
              </div>
            </li>
          ))}
        </ul>

      </section>

      <section className="container mt-5 mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold mb-4">Activities</h2>
        <div className=" items-center space-x-2 mb-4">
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="New Activity Name"
            className="border border-gray-300 px-3 py-2 rounded-md w-64"
          />
          <input
            type="number"
            value={newActivityCredits}
            onChange={(e) => setNewActivityCredits(e.target.value)}
            placeholder="Credits"
            className="border border-gray-300 px-3 py-2 rounded-md w-24"
          />
          <select value={selectedCoachId || ''} onChange={handleCoachSelection} className="border mt-6 border-gray-300 px-3 py-2 rounded-md">
            <option value="">Select Coach</option>
            {coaches.map((coach: Coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        </div>
        <button onClick={handleAddActivity} className="bg-blue-500 text-white px-4 py-2 rounded-md">Add Activity</button>
        <ul>
          <div className="grid mt-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activities.map((activity: Activity) => (
              <div key={activity.id} className="bg-gray-100 rounded-md shadow-md p-4 relative"> {/* Added 'relative' class */}
                <h3 className="text-lg font-semibold mb-2">{activity.name}</h3>
                <p className="text-gray-500 mb-2">Credits: {activity.credits}</p>
                <p className="text-gray-500">Assigned to: {coaches.find(coach => coach.id === activity.coach_id)?.name || 'None'}</p>
                <div className="bottom-0 mt-5"> {/* Adjusted positioning */}
                  <button onClick={() => handleUpdateActivity(activity.id)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2">Update</button>
                  <button onClick={() => handleDeleteActivity(activity.id)} className="bg-red-500 text-white px-3 py-1 rounded-md ml-8">Delete</button>
                </div>
              </div>
            ))}
          </div>

        </ul>
      </section>
    </div>
  );
};

export default CoachesandActivitiesAdminPage;
