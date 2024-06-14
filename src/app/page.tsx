/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
'use client'

import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { UserButton, useUser } from '@clerk/nextjs'

export default function Example() {
	const { isLoaded, isSignedIn, user } = useUser()

	return (
		<div className='dark:bg-[#232623] bg-white min-h-screen flex flex-col justify-center items-center'>
			<div className='mb-8'>
				<img src='/images/logo.png' className='w-auto h-60' />
			</div>

			{/* Welcome back or Sign in message */}
			<SignedIn>
				<div className='flex flex-col items-center mt-12'>
					<UserButton
						appearance={{
							elements: {
								userButtonAvatarBox: 'w-60 h-60', // Increase the width and height
								userButtonAvatarImage: 'w-full h-full' // Ensure the image scales correctly
							}
						}}
					/>
					<p className='dark:text-white text-center mt-4 font-extrabold text-4xl mb-12'>
						Welcome back {user?.fullName}!
					</p>
				</div>
			</SignedIn>

			<SignedOut>
				<p className='dark:text-white text-[#36783a] text-center font-extrabold text-4xl mb-12'>
					Sign in or create an account
				</p>
			</SignedOut>

			{/* Sign In and Sign Up buttons */}
			<div className='flex flex-col gap-4'>
				<SignedOut>
					<a
						href='/sign-in'
						className='rounded-md bg-[#36783a] px-10 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'>
						Sign In
					</a>
					<a
						href='/sign-up'
						className='rounded-md bg-[#36783a] px-10 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'>
						Sign Up
					</a>
				</SignedOut>

				<SignedIn>
					<a
						href='/users/dashboard'
						className='rounded-md bg-[#36783a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'>
						Go to dashboard!
					</a>
				</SignedIn>
			</div>

			{/* Content */}
		</div>
	)
}
