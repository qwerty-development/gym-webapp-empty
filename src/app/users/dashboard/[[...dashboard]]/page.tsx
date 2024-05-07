'use client'
import React, { useState, useEffect } from 'react';
import NavbarComponent from "@/app/components/users/navbar";
import { useUser } from "@clerk/nextjs";
import { fetchReservations, updateUserRecord, cancelReservation, fetchAllActivities } from "../../../../../utils/user-requests";
import { AddToCalendarButton } from 'add-to-calendar-button-react';

type Reservation = {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    coach: {
        name: string;
    };
    activity: {
        name: string;
        credits: number;
    };
};

type Activity = {
    id: number;
    name: string;
    // Add other necessary fields
};


export default function Dashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // State to track loading status

    useEffect(() => {
        const fetchData = async () => {
            if (isLoaded && isSignedIn) {
                setIsLoading(true); 
                await updateUserRecord({
                    userId: user.id,
                    email: user.emailAddresses[0]?.emailAddress,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.username,
                    phone: user.phoneNumbers[0]?.phoneNumber
                });

                const fetchedReservations = await fetchReservations(user.id);
                if (fetchedReservations) {
                    const transformedReservations = fetchedReservations.map((reservation: any) => ({
                        id: reservation.id,
                        date: reservation.date,
                        start_time: reservation.start_time.split(':').slice(0, 2).join(':'),
                        end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
                        coach: { name: reservation.coach.name },
                        activity: {
                            name: reservation.activity.name,
                            credits: reservation.activity.credits
                        }
                    }));

                    setReservations(transformedReservations);
                }

                const fetchedActivities = await fetchAllActivities();
                if (fetchedActivities) {
                    setIsLoading(false);
                    setActivities(fetchedActivities);
                }
            }
        };
        fetchData();
    }, [isLoaded, isSignedIn, user]);


    const handleCancel = async (reservationId: number) => {
        if (user) {
            // Confirm cancellation with a pop-up window
            const confirmed = window.confirm("Are you sure you want to cancel this reservation?");
            if (!confirmed)

                return; // Do nothing if user cancels

            const cancelled = await cancelReservation(reservationId, user.id, setReservations);
            if (cancelled) {
                // Refresh the page after successful cancellation
                window.location.reload();
            } else {
                console.error('Failed to cancel reservation.');
                // You might want to show an error message to the user here
            }
        }
    };

    if (!isLoaded || !isSignedIn) {
        return null;
    }

    return (
        <div>
            <NavbarComponent />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <div className="mx-auto text-xl italic max-w-3xl mt-5">
                    Hello, {user.firstName} {user.lastName}! You are signed in as {user.username}.
                </div>

                <div className="py-10">
                    <header>
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <h1 className="text-3xl font-bold leading-tight tracking-tight dark:text-indigo-300 text-gray-900">Your reservations</h1>
                        </div>
                    </header>
                    <main className="bg-gray-100 mt-5 rounded-3xl py-8">
                        {isLoading ? ( // Display loading icon if data is being fetched
                            <div className="flex justify-center items-center">
                                <svg className="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A8.004 8.004 0 014.01 7.08L2.59 8.495A9.956 9.956 0 002 12c0 5.523 4.477 10 10 10v-4c-2.096 0-4.04-.81-5.497-2.247z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="container mx-auto px-4 lg:px-8">
                                {reservations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {reservations.map((reservation) => (
                                            <div key={reservation.id} className="bg-white p-6 rounded-lg shadow-md">
                                                <h3 className="text-lg dark:text-black font-semibold mb-2">{reservation.activity.name}</h3>
                                                <p className="text-gray-600">Date: {reservation.date}</p>
                                                <p className="text-gray-600">Time: {reservation.start_time} - {reservation.end_time}</p>
                                                <p className="text-gray-600">Coach: {reservation.coach.name}</p>
                                                <p className="text-gray-600 mb-2">Cost: {reservation.activity.credits} credits</p>
                                                <AddToCalendarButton
                                                    name={reservation.activity.name + ' with ' + reservation.coach.name}
                                                    startDate={reservation.date}
                                                    startTime={reservation.start_time}
                                                    endTime={reservation.end_time}
                                                    options={['Apple', 'Google']}
                                                    timeZone="Asia/Beirut"
                                                    buttonStyle='default'
                                                    styleLight="--btn-background: #5c6dc2; --btn-text: #fff;"
                                                    styleDark="--btn-background:#fff #; --btn-text: #000;"
                                                    size='5'
                                                    inline="true"
                                                />
                                                <button onClick={() => handleCancel(reservation.id)} className="bg-red-500 text-white font-bold py-2 px-4 rounded mt-4">Cancel</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xl text-gray-600">NO UPCOMING RESERVATIONS</p>
                                )}
                            </div>
                        )}
                    </main>

                </div>
            </div>
        </div>
    );
}
