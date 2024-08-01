'use client'

import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { FaRocket, FaUserAstronaut } from 'react-icons/fa'
import { RiDashboardLine } from 'react-icons/ri'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Example() {
	const { isLoaded, isSignedIn, user } = useUser()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) return null

	return (
		<div className='bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden'>
			<SignedIn>
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.5 }}
					className='flex flex-col items-center mt-8 mb-12'>
					<div className='relative'>
						<UserButton
							appearance={{
								elements: {
									userButtonAvatarBox: 'w-32 h-32 md:w-40 md:h-40',
									userButtonAvatarImage:
										'w-full h-full rounded-full border-4 border-green-400'
								}
							}}
						/>
						<motion.div
							className='absolute -top-2 -right-2 bg-green-400 rounded-full p-2'
							animate={{ rotate: 360 }}
							transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
							<FaUserAstronaut className='text-gray-900 text-xl' />
						</motion.div>
					</div>
					<motion.p
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
						className='text-green-400 text-center mt-6 font-extrabold text-3xl md:text-4xl'>
						Welcome back, {user?.fullName}!
					</motion.p>
				</motion.div>
			</SignedIn>

			<SignedOut>
				<motion.p
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					className='text-green-400 text-center font-extrabold text-3xl md:text-4xl mb-12'>
					Embark on Your Fitness Journey
				</motion.p>
			</SignedOut>

			<div className='flex flex-col gap-4 w-full max-w-md'>
				<SignedOut>
					<motion.a
						href='/sign-in'
						className='neon-button border-green-500 border-b-4'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}>
						<FaRocket className='mr-2' /> Sign In
					</motion.a>
					<motion.a
						href='/sign-up'
						className='neon-button border-green-500 border-b-4'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}>
						<FaUserAstronaut className='mr-2' /> Join the Community
					</motion.a>
				</SignedOut>

				<SignedIn>
					<motion.a
						href='/users/dashboard'
						className='neon-button'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}>
						<RiDashboardLine className='mr-2' /> Access Control Center
					</motion.a>
				</SignedIn>
			</div>

			<motion.div
				className='mt-16 text-center text-gray-400'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}>
				<p className='text-sm'>Powered by qwerty</p>
				<p className='text-xs mt-1'>Version 1.0.0</p>
			</motion.div>
		</div>
	)
}
