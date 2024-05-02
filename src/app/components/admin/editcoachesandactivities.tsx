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
  const [newCoachName, setNewCoachName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCredits, setNewActivityCredits] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false); // State for showing the update form
  const [updateCoachId, setUpdateCoachId] = useState<number | null>(null); // State for the coach being updated
  const [updatedCoachName, setUpdatedCoachName] = useState(''); // State for updated coach name
  const [updatedCoachPicture, setUpdatedCoachPicture] = useState<File | null>(null); // State for updated coach picture

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
  // Adjusted handleAddCoach to pass the file parameter
  const handleAddCoach = async () => {
    await addCoach({ name: newCoachName }, file); // Pass the file parameter
    setNewCoachName('');
    setFile(null);
    refreshData();
  };

  const handleSubmitUpdate = async () => {
    if (updatedCoachName.trim() !== '') {
      await updateCoach(updateCoachId!, { name: updatedCoachName }, updatedCoachPicture);
      setShowUpdateForm(false);
      refreshData();
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
      setUpdatedCoachPicture(event.target.files[0]);
      
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
    <input type="file" onChange={handleFileChange} />
    <button onClick={handleAddCoach} className="bg-blue-500 text-white px-4 py-2 rounded-md">Add Coach</button>
  </div>
  <ul>
    {coaches.map((coach: Coach) => (
      <li key={coach.id} className="bg-gray-100 px-4 py-2 mb-2 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={coach.profile_picture} alt={`Profile of ${coach.name}`} className="w-10 h-10 rounded-full" />
            <span>{coach.name}</span>
          </div>
          <div className="flex">
            <button onClick={() => handleToggleForm(coach.id)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2">Update</button>
            <button onClick={() => handleDeleteCoach(coach.id)} className="bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
          </div>
        </div>

        {showUpdateForm && updateCoachId === coach.id && ( // Only show the update form for the selected coach
          <div className='mx-auto p-4'>
            <input
              type="text"
              value={updatedCoachName}
              onChange={(e) => setUpdatedCoachName(e.target.value)}
              placeholder="New Coach Name"
              className="border border-gray-300 px-3 py-2 rounded-md w-64"
            />
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleSubmitUpdate} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2">Update</button>
          </div>
        )}
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
