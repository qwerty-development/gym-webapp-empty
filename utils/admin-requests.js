import { supabaseClient } from './supabaseClient';

// Functions to manage coaches
export const addActivity = async (activity) => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .insert([{ ...activity, coach_id: activity.coach_id }]);
  
    if (error) {
      console.error('Error adding new activity:', error.message);
      return null;
    }
  
    // Only return data[0] if data is not null
    return data ? data[0] : null;
};


  
  export const addCoach = async (coach) => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('coaches')
      .insert([coach]);
  
    if (error) {
      console.error('Error adding new coach:', error.message);
      return null;
    }
  
    // Only return data[0] if data is not null
    return data ? data[0] : null;
  };
  

  export const updateCoach = async (coach) => {
    if (!coach.id) throw new Error('Coach ID is required for update.');
  
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('coaches')
      .update(coach)
      .eq('id', coach.id);
  
    if (error) {
      console.error('Error updating coach:', error.message);
      return null;
    }
  
    return data ? data[0] : null;
  };
  
  export const updateActivity = async (activity) => {
    if (!activity.id) throw new Error('Activity ID is required for update.');
  
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', activity.id);
      console.log('updates successfully')
  
    if (error) {
      console.error('Error updating activity:', error.message);
      return null;
    }
  
    return data ? data[0] : null;
  };
  

export const deleteCoach = async (coachId) => {
  const supabase = await supabaseClient();
  const { error } = await supabase
    .from('coaches')
    .delete()
    .eq('id', coachId);

  if (error) {
    console.error('Error deleting coach:', error.message);
    return false;
  }

  return true;
};



export const deleteActivity = async (activityId) => {
  const supabase = await supabaseClient();
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting activity:', error.message);
    return false;
  }

  return true;
};
export const fetchCoaches = async () => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('coaches')
      .select('*');
  
    if (error) {
      console.error('Error fetching coaches:', error.message);
      return [];
    }
  
    return data;
  };
  
  export const fetchActivities = async () => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*');
  
    if (error) {
      console.error('Error fetching activities:', error.message);
      return [];
    }
  
    return data;
  };

  // In admin-requests.js

// In admin-requests.js
export const fetchTimeSlots = async () => {
  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from('time_slots')
    .select(`
      activities ( name, credits ),
      coaches ( name ),
      date,
      start_time,
      end_time,
      users ( user_id, first_name, last_name ),
      booked
    `)
    // Join logic here based on your database relations

  if (error) {
    console.error('Error fetching time slots:', error.message);
    return [];
  }

  // Transform the data here to match the Reservation[] type, handling nulls
  const transformedData = data.map(slot => {
    return {
      activity: slot.activities ? { name: slot.activities.name, credits: slot.activities.credits } : null,
      coach: slot.coaches ? { name: slot.coaches.name } : null,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      user: slot.users ? {
        user_id: slot.users.user_id,
        first_name: slot.users.first_name,
        last_name: slot.users.last_name
      } : null,
      booked: slot.booked
    };
  });

  return transformedData;
};

// In admin-requests.js
export const addTimeSlot = async (timeSlot) => {
  const supabase = await supabaseClient();
  const { data, error } = await supabase
      .from('time_slots')
      .insert([timeSlot]);

  if (error) {
      console.error('Error adding new time slot:', error.message);
      return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const deleteTimeSlot = async (timeSlotId) => {
  const supabase = await supabaseClient();
  const { error } = await supabase
      .from('time_slots')
      .delete()
      .match({ id: timeSlotId }); // Use `.eq('id', timeSlotId)` if your DB requires

  if (error) {
      console.error('Error deleting time slot:', error.message);
      return false;
  }

  return true;
};

export const updateTimeSlot = async (timeSlot) => {
  if (!timeSlot.id) throw new Error('Time Slot ID is required for update.');

  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from('time_slots')
    .update(timeSlot)
    .eq('id', timeSlot.id);

  if (error) {
    console.error('Error updating time slot:', error.message);
    return null;
  }

  return data ? data[0] : null;
};











  


  