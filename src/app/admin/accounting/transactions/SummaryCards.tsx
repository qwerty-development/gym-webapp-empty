'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from 'react-tooltip'

interface SummaryCardsProps {
	totalCredits: number
	totalTokens: number
	totalTransactions: number
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
	totalCredits,
	totalTokens,
	totalTransactions
}) => {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
			<motion.div
				whileHover={{ scale: 1.05 }}
				className='bg-gray-800 rounded-xl p-6 shadow-lg'
				data-tooltip-id='credits-tooltip'
				data-tooltip-content='Total credits across all transactions'>
				<h2 className='text-2xl font-semibold mb-4 text-green-500'>
					Total Credits
				</h2>
				<p className='text-4xl font-bold text-green-400'>
					{totalCredits.toFixed(2)}
				</p>
				<Tooltip id='credits-tooltip' place='top' />
			</motion.div>

			<motion.div
				whileHover={{ scale: 1.05 }}
				className='bg-gray-800 rounded-xl p-6 shadow-lg'
				data-tooltip-id='tokens-tooltip'
				data-tooltip-content='Total tokens across all transactions'>
				<h2 className='text-2xl font-semibold mb-4 text-green-500'>
					Total Tokens
				</h2>
				<p className='text-4xl font-bold text-blue-400'>
					{totalTokens.toFixed(2)}
				</p>
				<Tooltip id='tokens-tooltip' place='top' />
			</motion.div>

			<motion.div
				whileHover={{ scale: 1.05 }}
				className='bg-gray-800 rounded-xl p-6 shadow-lg'
				data-tooltip-id='transactions-tooltip'
				data-tooltip-content='Total number of transactions'>
				<h2 className='text-2xl font-semibold mb-4 text-green-500'>
					Total Transactions
				</h2>
				<p className='text-4xl font-bold text-purple-400'>
					{totalTransactions}
				</p>
				<Tooltip id='transactions-tooltip' place='top' />
			</motion.div>
		</div>
	)
}

export default SummaryCards
