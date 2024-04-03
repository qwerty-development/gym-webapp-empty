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
  