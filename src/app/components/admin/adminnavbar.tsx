'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { getWalletBalance } from '../../../../utils/user-requests'
import Image from 'next/image'
import {
	FaBars,
	FaTimes,
	FaUsers,
	FaCalendarPlus,
	FaClipboardList,
	FaClock,
	FaStore,
	FaUserPlus,
	FaHome
} from 'react-icons/fa'
import Link from 'next/link'

export default function AdminNavbarComponent() {
	const [currentPage, setCurrentPage] = useState('')
	const [walletBalance, setWalletBalance] = useState(null)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const { userId, getToken, isSignedIn } = useAuth()

	useEffect(() => {
		setCurrentPage(window.location.pathname)
	}, [])

	useEffect(() => {
		const fetchWallet = async () => {
			try {
				if (isSignedIn) {
					const balance = await getWalletBalance({ userId })
					setWalletBalance(balance)
				} else {
					setWalletBalance(null)
				}
			} catch (error) {
				console.error('Error fetching wallet balance:', error)
				setWalletBalance(null)
			}
		}

		fetchWallet()
	}, [isSignedIn, getToken, userId])

	const navItems = [
		{ href: '/admin/manage-users', label: 'Users', icon: FaUsers },
		{
			href: '/admin/add-activities-and-coaches',
			label: 'Coaches & Activities',
			icon: FaCalendarPlus
		},
		{
			href: '/admin/view-reservations',
			label: 'Reservations',
			icon: FaClipboardList
		},
		{ href: '/admin/add-timeslots', label: 'Add Time Slots', icon: FaClock },
		{ href: '/admin/add-market-items', label: 'Items', icon: FaStore },
		{
			href: '/admin/book-for-client',
			label: 'Book for Client',
			icon: FaUserPlus
		}
	]

	return (
		<nav className='bg-gray-900 text-white border-b-2 border-green-500'>
			<div className='mx-auto max-w-7xl px-4 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<div className='lg:hidden flex justify-start w-1/3'>
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500'
							aria-label='Toggle menu'>
							{isMenuOpen ? (
								<FaTimes className='text-red-500' />
							) : (
								<FaBars className='text-green-500' />
							)}
						</button>
					</div>
					<div className='flex justify-center lg:justify-start w-1/3'>
						<Link href='/' className='flex-shrink-0'>
							<Image
								src='/images/logoinverted.png'
								alt='Logo'
								width={40}
								height={40}
								className='h-10 w-auto'
								priority
							/>
						</Link>
					</div>
					<div className='hidden lg:flex justify-end items-center space-x-4'>
						{navItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
									currentPage === item.href
										? 'bg-green-500 text-white'
										: 'text-gray-300 hover:bg-green-300 hover:text-white'
								}`}>
								<item.icon className='mr-2 text-lg' />
								<span className='whitespace-nowrap'>{item.label}</span>
							</Link>
						))}
					</div>
					<div className='flex items-center justify-end w-1/3'>
						<Link
							href={'/users/dashboard'}
							className={`flex items-center px-3 py-2 mr-2 rounded-md text-sm font-medium transition-colors duration-200 `}>
							<FaHome className='mr-2 text-lg hover:text-green-400' size={25} />
						</Link>
						<UserButton
							afterSignOutUrl='/'
							appearance={{
								elements: {
									avatarBox: 'border-2 border-green-500'
								}
							}}
						/>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='lg:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
							{navItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
										currentPage === item.href
											? 'bg-green-500 text-white'
											: 'text-gray-300 hover:bg-green-300 hover:text-white'
									}`}
									onClick={() => setIsMenuOpen(false)}>
									<item.icon className='mr-2 text-lg' />
									<span className='whitespace-nowrap'>{item.label}</span>
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
