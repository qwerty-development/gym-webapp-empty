'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useWallet } from './WalletContext'
import Image from 'next/image'
import {
	FaBars,
	FaTimes,
	FaUser,
	FaCalendarAlt,
	FaCog,
	FaShoppingCart,
	FaInfo
} from 'react-icons/fa'
import Link from 'next/link'
import TokenInfo from './TokenInfo'
import { supabaseClient } from '../../../../utils/supabaseClient'

export default function NavbarComponent() {
	const { walletBalance } = useWallet()
	const [currentPage, setCurrentPage] = useState('')
	const { user } = useUser()
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [showTokenInfo, setShowTokenInfo] = useState(false)
	const [userTokens, setUserTokens] = useState<any>(null)

	useEffect(() => {
		setCurrentPage(window.location.pathname)
		if (user) {
			fetchUserTokens(user.id).then(setUserTokens)
		}
	}, [user])

	const fetchUserTokens = async (id: any) => {
		const supabase = await supabaseClient()
		const { data, error } = await supabase
			.from('users')
			.select(
				'private_token, semiPrivate_token, public_token, workoutDay_token'
			)
			.eq('user_id', id)
			.single()

		if (error) throw error

		return data
	}

	const navItems = [
		{ href: '/users/dashboard', label: 'Dashboard', icon: FaUser },
		{ href: '/users/bookasession', label: 'Book', icon: FaCalendarAlt },
		{ href: '/users/shop', label: 'Shop', icon: FaShoppingCart },
		...(user?.publicMetadata?.role === 'admin'
			? [{ href: '/admin/manage-users', label: 'Admin', icon: FaCog }]
			: [])
	]

	return (
		<nav className='bg-gray-900 text-white border-b-2 border-blue-500'>
			<div className='mx-auto max-w-7xl px-4 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<div className='flex items-center'>
						<Link href="/">
							<Image
								src="/logoGym.png"
								alt="Gym Logo"
								width={40}
								height={40}
								className="mr-64"
							/>
						</Link>
						<div className='md:hidden'>
							<button
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500'
								aria-label='Toggle menu'>
								{isMenuOpen ? (
									<FaTimes className='text-red-500' />
								) : (
									<FaBars className='text-blue-500' />
								)}
							</button>
						</div>
					</div>

					<div className='hidden md:flex justify-center items-center space-x-2 flex-grow'>
						{navItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center justify-center w-min px-7 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-center ${currentPage === item.href
										? 'bg-blue-500 text-white'
										: 'text-gray-300 hover:bg-blue-300 hover:text-white'
									}`}>
								<item.icon className='mr-2' />
								{item.label}
							</Link>
						))}
					</div>
					<div className='flex items-center justify-end'>
						<div
							className='bg-gray-800 text-blue-300 px-3 py-1 flex rounded-full mr-3 text-sm border text-nowrap border-blue-500 relative'
							onMouseEnter={() => setShowTokenInfo(true)}
							onMouseLeave={() => setShowTokenInfo(false)}>
							{walletBalance ? walletBalance : 0} credits
							{showTokenInfo && userTokens && <TokenInfo tokens={userTokens} />}
						</div>

						<UserButton
							afterSignOutUrl='/'
							appearance={{
								elements: {
									avatarBox: 'border-2 border-blue-500'
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
						className='md:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
							{navItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center justify-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${currentPage === item.href
											? 'bg-blue-500 text-white'
											: 'text-gray-300 hover:bg-blue-300 hover:text-white'
										}`}
									onClick={() => setIsMenuOpen(false)}>
									<item.icon className='mr-2' />
									{item.label}
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}