'use client'
import { SignUp } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { FaUserAstronaut } from 'react-icons/fa'

export default function SignupPage() {
	return (
		<div className='bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen flex flex-col justify-center items-center p-4'>
			<motion.div
				initial={{ y: -50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='w-full max-w-md'>
				<div className='text-center mb-8'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className='inline-block p-3 rounded-full bg-green-400 mb-4'>
						<FaUserAstronaut className='text-gray-900 text-3xl' />
					</motion.div>
					<h2 className='text-3xl font-bold text-green-400'>
						Upgrade your Fitness
					</h2>
					<p className='mt-2 text-gray-400'>Create your account to start</p>
				</div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className='bg-gray-800 p-8 rounded-lg shadow-2xl flex flex-row justify-center'>
					<SignUp
						appearance={{
							elements: {
								formButtonPrimary: 'bg-green-500 hover:bg-green-600 text-white',
								formFieldInput: 'bg-gray-700 text-white border-gray-600',
								formFieldLabel: 'text-gray-300',
								headerTitle: 'text-green-400',
								headerSubtitle: 'text-gray-400',
								socialButtonsBlockButton:
									'border-gray-600 text-white hover:bg-gray-700',
								socialButtonsBlockButtonText: 'text-gray-300',
								footerActionLink: 'text-green-400 hover:text-green-300'
							}
						}}
					/>
				</motion.div>
			</motion.div>
		</div>
	)
}
