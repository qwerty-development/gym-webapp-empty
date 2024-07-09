'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useWallet } from './WalletContext'
import Image from 'next/image'
import { FaBars, FaTimes, FaUser, FaCalendarAlt, FaCog } from 'react-icons/fa'

export default function NavbarComponent() {
	const { walletBalance } = useWallet()
	const [currentPage, setCurrentPage] = useState('')
	const { user } = useUser()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	useEffect(() => {
		setCurrentPage(window.location.pathname)
	}, [])

	const navItems = [
		{ href: '/users/dashboard', label: 'Dashboard', icon: FaUser },
		{
			href: '/users/bookasession',
			label: 'Book a session',
			icon: FaCalendarAlt
		},
		...(user?.publicMetadata?.role === 'admin'
			? [{ href: '/admin/manage-users', label: 'Admin', icon: FaCog }]
			: [])
	]

	return (
		<nav className='bg-gray-900 text-white'>
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<div className='flex ml-36 lg:mx-0 items-center'>
						<a href='/' className='flex-shrink-0'>
							<Image
								src='/images/logoinverted.png'
								alt='Logo'
								width={40}
								height={40}
								className='h-10 w-auto'
							/>
						</a>
					</div>
					<div className='hidden md:block'>
						<div className='ml-10 flex items-baseline space-x-4'>
							{navItems.map(item => (
								<a
									key={item.href}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
										currentPage === item.href
											? 'bg-gray-800 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white'
									}`}>
									<item.icon className='mr-2' />
									{item.label}
								</a>
							))}
						</div>
					</div>
					<div className='hidden md:block'>
						<div className='ml-4 flex items-center md:ml-6'>
							{walletBalance !== null && (
								<div className='bg-gray-800 text-white px-3 py-1 rounded-full mr-4'>
									{walletBalance} credits
								</div>
							)}
							<UserButton afterSignOutUrl='/' />
						</div>
					</div>
					<div className='md:hidden flex items-center'>
						{walletBalance !== null && (
							<div className='bg-gray-800 text-white px-3 py-1 rounded-full mr-4'>
								{walletBalance} credits
							</div>
						)}
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'>
							{isMenuOpen ? <FaTimes /> : <FaBars />}
						</button>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='md:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
							{navItems.map(item => (
								<a
									key={item.href}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
										currentPage === item.href
											? 'bg-gray-800 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white'
									}`}
									onClick={() => setIsMenuOpen(false)}>
									<item.icon className='mr-2' />
									{item.label}
								</a>
							))}
						</div>
						<div className='pt-4 pb-3 border-t border-gray-700'>
							<div className='flex items-center px-5'>
								<UserButton afterSignOutUrl='/' />
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
