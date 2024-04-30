// utils/requests.js
import { supabaseClient } from './supabaseClient';

// Function to fetch wallet balance for a user from Supabase
export const getWalletBalance = async ({ userId }) => {
    const supabase = await supabaseClient();
    const { data: userData, error } = await supabase
        .from("users")
        .select("wallet") // Selecting only the wallet column
        .eq("user_id", userId)
        .single(); // Assuming each user has a unique user_id

    if (error) {
        console.error('Error fetching wallet balance:', error.message);
        return null;
    }

    return userData ? userData.wallet : null; // Return the wallet balance or null if user not found
};

// Function to create or update user record in Supabase
// utils/requests.js

// Function to check if a user exists in Supabase
export const checkUserExists = async (userId) => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (error) {
        console.error('Error checking user existence:', error.message);
        return null;
    }

    return data;
};

// Function to create or update user record in Supabase
export const updateUserRecord = async ({ userId, email, firstName, lastName, userName, phone }) => {
    const supabase = await supabaseClient();
    const existingUser = await checkUserExists(userId);

    if (existingUser) {
        const { data, error } = await supabase
            .from("users")
            .update({
                email,
                first_name: firstName,
                last_name: lastName,
                username: userName,
                phone
            })
            .eq("user_id", userId);

        if (error) {
            console.error('Error updating user record:', error.message);
            return null;
        }

        return data;
    } else {
        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    user_id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    username: userName,
                    phone
                }
            ]);

        if (error) {
            console.error('Error creating user record:', error.message);
            return null;
        }

        return data;
    }


};

export const fetchReservations = async (userId) => {
    const supabase = supabaseClient(); // Ensure you're correctly initializing this with any necessary tokens
    const { data, error } = await supabase
        .from('time_slots')
        .select(`
            id,
            user_id,
            start_time,
            end_time,
            date,
            activity:activities (
                id,
                name,
                coach_id,
                credits
            ),
            coach:coaches (
                id,
                name
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching reservations:', error.message);
        return null;
    }

    return data.map((reservation) => {
        return reservation;
    });
};

// utils/requests.js

// Function to cancel a reservation
// Function to cancel a reservation
// Function to cancel a reservation
export const cancelReservation = async (reservationId, userId, setReservations) => {
    const supabase = await supabaseClient();

    // Fetch the reservation to check if it exists and to retrieve its details
    const { data: reservationData, error: reservationError } = await supabase
        .from('time_slots')
        .select('activity_id, user_id, booked')
        .eq('id', reservationId)
        .single();

    if (reservationError || !reservationData) {
        console.error('Error fetching reservation:', reservationError?.message);
        return false;
    }

    // If the reservation is not booked by the current user, return false
    if (!reservationData.booked || reservationData.user_id !== userId) {
        console.error('Unauthorized to cancel this reservation.');
        return false;
    }

    // Fetch activity credits to refund
    const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("credits")
        .eq("id", reservationData.activity_id)
        .single();

    if (activityError || !activityData) {
        console.error('Error fetching activity credits:', activityError?.message);
        return false;
    }

    // Update the reservation in the database
    const { error: updateError } = await supabase
        .from('time_slots')
        .update({
            user_id: null,
            booked: false
        })
        .eq('id', reservationId);

    if (updateError) {
        console.error('Error canceling reservation:', updateError.message);
        return false;
    }

    // Refund credits to the user's wallet
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("wallet") // Selecting only the wallet column
        .eq("user_id", userId)
        .single();

    if (userError || !userData) {
        console.error('Error fetching user data:', userError?.message);
        return false;
    }

    const newWalletBalance = userData.wallet + activityData.credits;

    // Update the wallet balance in the database
    const { error: walletUpdateError } = await supabase
        .from('users')
        .update({ wallet: newWalletBalance })
        .eq('user_id', userId);

    if (walletUpdateError) {
        console.error('Error updating user wallet:', walletUpdateError.message);
        return false;
    }

    // After successfully updating the wallet, update the reservations state
    setReservations(prevReservations => prevReservations.filter(reservation => reservation.id !== reservationId));

    return true; // Cancellation successful
};




/**
 * Function to fetch unbooked time slots from Supabase with optional filters.
 * @param {Object} params - The filter parameters.
 * @param {number} [params.activityId] - Optional activity ID to filter by.
 * @param {number} [params.coachId] - Optional coach ID to filter by.
 * @param {string} [params.date] - Optional date to filter by.
 * @param {string} [params.startTime] - Optional start time to filter by.
 * @param {string} [params.endTime] - Optional end time to filter by.
 * @returns The filtered, unbooked time slots.
 */
export const fetchFilteredUnbookedTimeSlots = async ({ activityId, coachId, date, startTime, endTime }) => {
    const supabase = await supabaseClient();
    let query = supabase
        .from('time_slots')
        .select(`
            id,
            start_time,
            end_time,
            date,
            coach_id,
            activity_id,
            booked,
            user_id
        `)
        .is('user_id', null); // Adjust based on your logic for determining unbooked slots

    // Apply filters based on provided arguments
    if (activityId) query = query.eq('activity_id', activityId);
    if (coachId) query = query.eq('coach_id', coachId);
    if (date) query = query.eq('date', date);
    if (startTime && endTime) {
        // Ensures both startTime and endTime are provided for a valid time slot filter
        query = query.gte('start_time', startTime).lte('end_time', endTime);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching filtered unbooked time slots:', error.message);
        return null;
    }

    return data;
};

// Ensure this function is fetching the 'credits' for each activity.
export const fetchAllActivities = async () => {
    const supabase = await supabaseClient();
    const { data, error } = await supabase
        .from('activities')
        .select('id, name, credits'); // Ensure 'credits' is included

    if (error) {
        console.error('Error fetching activities:', error.message);
        return [];
    }

    return data;
};


// In your requests.js, ensure fetchAllCoaches function correctly filters by activityId
// utils/requests.js
export const fetchCoaches = async (activityId) => {
    const supabase = await supabaseClient();
    // Fetch unique coach IDs associated with the activityId from the time_slots table
    const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('coach_id')
        .eq('activity_id', activityId)
        .is('booked', false) // Assuming you want to fetch coaches for unbooked time slots

    if (timeSlotsError || !timeSlotsData) {
        console.error('Error fetching coach IDs from time slots:', timeSlotsError?.message);
        return [];
    }

    // Extract unique coach IDs
    const coachIds = timeSlotsData.map(slot => slot.coach_id);

    // Fetch coaches based on extracted coach IDs
    const { data: coachesData, error: coachesError } = await supabase
        .from('coaches')
        .select('id, name, profile_picture')
        .in('id', coachIds); // Filter coaches by extracted IDs

    if (coachesError) {
        console.error('Error fetching coaches:', coachesError.message);
        return [];
    }

    return coachesData;
};

// Function to book a time slot in Supabase
export const bookTimeSlot = async ({ activityId, coachId, date, startTime, endTime, userId }) => {
    const supabase = await supabaseClient();

    // Fetch user's current credits
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("wallet") // Selecting only the wallet column
        .eq("user_id", userId)
        .single();

    if (userError || !userData) {
        console.error('Error fetching user credits:', userError?.message);
        return { error: userError?.message || 'User not found.' };
    }

    // Fetch activity credits required
    const { data: activityData, error: activityError } = await supabase
        .from("activities")
        .select("credits")
        .eq("id", activityId)
        .single();

    if (activityError || !activityData) {
        console.error('Error fetching activity credits:', activityError?.message);
        return { error: activityError?.message || 'Activity not found.' };
    }

    if (userData.wallet >= activityData.credits) {
        // Proceed with booking the time slot
        const { data: timeSlotData, error: timeSlotError } = await supabase
            .from('time_slots')
            .update({ user_id: userId, booked: true })
            .match({
                activity_id: activityId,
                coach_id: coachId,
                date: date,
                start_time: startTime,
                end_time: endTime
            });

        if (timeSlotError) {
            console.error('Error booking time slot:', timeSlotError.message);
            return { error: timeSlotError.message };
        }

        // Deduct credits from user's account
        const newWalletBalance = userData.wallet - activityData.credits;
        const { error: updateError } = await supabase
            .from('users')
            .update({ wallet: newWalletBalance })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error updating user credits:', updateError.message);
            // Consider rolling back the booking if credits deduction fails
            return { error: updateError.message };
        }

        return { data: timeSlotData, message: 'Session booked and credits deducted.' };
    } else {
        return { error: 'Not enough credits to book the session.' };
    }
};