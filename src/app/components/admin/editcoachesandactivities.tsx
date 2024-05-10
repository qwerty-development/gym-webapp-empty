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
import { SyncLoader } from 'react-spinners';

type Coach = {
  id: number;
  name: string;
  profile_picture: string; // Make sure this is being fetched
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
  const [loading, setLoading] = useState(true);
  const [newCoachName, setNewCoachName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCredits, setNewActivityCredits] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false); // State for showing the update form
  const [updateCoachId, setUpdateCoachId] = useState<number | null>(null); // State for the coach being updated
  const [updatedCoachName, setUpdatedCoachName] = useState(''); // State for updated coach name
  const [updatedCoachPicture, setUpdatedCoachPicture] = useState<File | null>(null); // State for updated coach picture
  const [newCoachPicture, setNewCoachPicture] = useState<File | null>(null);




  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const loadedCoaches = await fetchCoaches();
      const loadedActivities = await fetchActivities();
      setCoaches(loadedCoaches || []);
      setActivities(loadedActivities || []);
      setLoading(false);
    };
    loadInitialData();
  }, [updateTrigger]);

  const refreshData = () => setUpdateTrigger(!updateTrigger);

  // Coach handlers
  // Adjusted handleAddCoach to pass the file parameter
  const handleAddCoach = async () => {
    if (newCoachName.trim()) {
      await addCoach({ name: newCoachName }, newCoachPicture);
      setNewCoachName('');
      setNewCoachPicture(null);
      refreshData();
      alert("Success!");
    } else {
      alert('Please enter a coach name.');
    }
  };


  const handleSubmitUpdate = async () => {
    if (updatedCoachName.trim() !== '') {
      await updateCoach(updateCoachId!, { name: updatedCoachName }, updatedCoachPicture);
      setShowUpdateForm(false);
      refreshData();
      alert("Success!");
    } else {
      alert('Please provide a valid name for the coach.');
    }
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

  const [file, setFile] = useState<File | null>(null);


  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      if (showUpdateForm) {
        setUpdatedCoachPicture(event.target.files[0]);
      } else {
        setNewCoachPicture(event.target.files[0]);
      }
    }
  };



  const handleToggleForm = (id: React.SetStateAction<number | null>) => {
    if (updateCoachId === id) { // If the form is already open for the same coach, close it
      setShowUpdateForm(false);
      setUpdateCoachId(null);
    } else {
      setShowUpdateForm(true);
      setUpdateCoachId(id);
    }
  };


  // Similarly, adjust handleUpdateCoach to pass the file if it's updated




  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-6">Coaches</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-x-4 mb-6">
          <input
            type="text"
            value={newCoachName}
            onChange={(e) => setNewCoachName(e.target.value)}
            placeholder="New Coach Name"
            className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto flex-grow"
          />
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleAddCoach} className="bg-blue-500 text-white px-4 py-2 rounded-md ">Add Coach</button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center">
            <SyncLoader color="#367831" size={25} />
          </div>
        ) : (
          <ul>
            {coaches.map((coach: Coach) => (
              <li key={coach.id} className="bg-gray-100 px-4 py-2 mb-2 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={coach.profile_picture} alt={`Profile of ${coach.name}`} className="w-10 h-10 rounded-full" />
                    <span className='dark:text-black'>{coach.name}</span>
                  </div>
                  <div className="flex">
                    <button onClick={() => handleToggleForm(coach.id)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2">Update</button>
                    <button onClick={() => handleDeleteCoach(coach.id)} className="bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
                  </div>
                </div>
                {showUpdateForm && updateCoachId === coach.id && (
                  <div className='mx-auto p-4'>
                    <input
                      type="text"
                      value={updatedCoachName}
                      onChange={(e) => setUpdatedCoachName(e.target.value)}
                      placeholder="New Coach Name"
                      className="border border-gray-300 px-3 py-2 mt-4 rounded-md w-64"
                    />
                    <input className='mt-4' type="file" onChange={handleFileChange} />
                    <button onClick={handleSubmitUpdate} className="bg-blue-500 text-white items-center px-4 py-2 rounded-md mt-4">Update</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

        )}
      </section>

      <hr className="my-8 border-gray-900 mt-12 mb-12" />

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-6">Activities</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-x-4 mb-6">
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="New Activity Name"
            className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto flex-grow"
          />
          <input
            type="number"
            value={newActivityCredits}
            onChange={(e) => setNewActivityCredits(e.target.value)}
            placeholder="Credits"
            className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto"
          />
          <select
            value={selectedCoachId || ''}
            onChange={handleCoachSelection}
            className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto"
          >
            <option value="">Select Coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
          <button onClick={handleAddActivity} className="bg-blue-500 text-white px-4 py-2 rounded-md w-full sm:w-auto">Add Activity</button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center mt-5">
            <SyncLoader color="#367831" size={25} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-12 lg:grid-cols-4 gap-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-gray-100 rounded-md shadow p-4 relative">
                <h3 className="text-lg text-black font-semibold mb-2">{activity.name}</h3>
                <p className="text-gray-500 mb-2">Credits: {activity.credits}</p>
                <p className="text-gray-500">Assigned to: {coaches.find(coach => coach.id === activity.coach_id)?.name || 'None'}</p>
                <div className="mt-5">
                  <button onClick={() => handleUpdateActivity(activity.id)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2">Update</button>
                  <button onClick={() => handleDeleteActivity(activity.id)} className="bg-red-500 text-white px-3 py-1 rounded-md ml-2">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>

  );
};

export default CoachesandActivitiesAdminPage;
