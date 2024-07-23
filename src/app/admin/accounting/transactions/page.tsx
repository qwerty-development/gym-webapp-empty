'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FaSearch,
	FaFilter,
	FaDownload,
	FaSortAmountDown,
	FaSortAmountUp
} from 'react-icons/fa'
import { supabaseClient } from '../../../../../utils/supabaseClient'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import saveAs from 'file-saver'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'

const TransactionPage = () => {
	const [transactions, setTransactions] = useState<any[]>([])
	const [loading, setLoading] = useState<any>(true)
	const [currentPage, setCurrentPage] = useState<any>(1)
	const [totalPages, setTotalPages] = useState<any>(0)
	const [filter, setFilter] = useState<any>('all')
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [startDate, setStartDate] = useState<any>(null)
	const [endDate, setEndDate] = useState<any>(null)
	const [summary, setSummary] = useState<any>({
		totalCredits: 0,
		totalTokens: 0
	})
	const [sortField, setSortField] = useState<any>('created_at')
	const [sortOrder, setSortOrder] = useState<any>('desc')

	const itemsPerPage = 20

	useEffect(() => {
		fetchTransactions()
	}, [
		currentPage,
		filter,
		searchTerm,
		startDate,
		endDate,
		sortField,
		sortOrder
	])

	const fetchSummaryData = async () => {
		const supabase = await supabaseClient()
		let query = supabase.from('transactions').select('amount')

		if (filter !== 'all') {
			query = query.eq('type', filter)
		}

		if (searchTerm) {
			query = query.or(
				`name.ilike.%${searchTerm}%,amount.ilike.%${searchTerm}%`
			)
		}

		if (startDate && endDate) {
			query = query
				.gte('created_at', startDate.toISOString())
				.lt('created_at', new Date(endDate.getTime() + 86400000).toISOString())
		}

		const { data, error } = await query

		if (error) {
			console.error('Error fetching summary data:', error)
			return { totalCredits: 0, totalTokens: 0 }
		}

		return calculateSummary(data)
	}

	// Modify the fetchTransactions function
	const fetchTransactions = async () => {
		setLoading(true)
		const supabase = await supabaseClient()

		let query = supabase
			.from('transactions')
			.select('*', { count: 'exact' })
			.order(sortField, { ascending: sortOrder === 'asc' })
			.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

		if (filter !== 'all') {
			query = query.eq('type', filter)
		}

		if (searchTerm) {
			query = query.or(
				`name.ilike.%${searchTerm}%,amount.ilike.%${searchTerm}%`
			)
		}

		if (startDate && endDate) {
			const endDateTime = new Date(endDate)
			endDateTime.setHours(23, 59, 59, 999)
			query = query
				.gte('created_at', startDate.toISOString())
				.lte('created_at', endDateTime.toISOString())
		}

		const { data, error, count }: any = await query

		if (error) {
			console.error('Error fetching transactions:', error)
		} else {
			setTransactions(data)
			setTotalPages(Math.ceil(count / itemsPerPage))
		}

		// Fetch summary data
		const summaryData = await fetchSummaryData()
		setSummary(summaryData)

		setLoading(false)
	}
	const calculateSummary = (data: any) => {
		return data.reduce(
			(acc: any, transaction: any) => {
				const amount = parseFloat(transaction.amount)
				if (transaction.amount.includes('credits')) {
					acc.totalCredits += amount
				} else if (transaction.amount.includes('token')) {
					acc.totalTokens += amount
				}
				return acc
			},
			{ totalCredits: 0, totalTokens: 0 }
		)
	}

	const handleFilterChange = (e: { target: { value: any } }) => {
		setFilter(e.target.value)
		setCurrentPage(1)
	}

	const handleSearch = (e: { target: { value: any } }) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1)
	}
	const handleDateChange = (dates: Date[] | [any, any]) => {
		const [start, end] = dates
		setStartDate(start)
		if (end) {
			// If end date is selected, set it to the end of the day
			const endOfDay = new Date(end)
			endOfDay.setHours(23, 59, 59, 999)
			setEndDate(endOfDay)
		} else {
			setEndDate(end)
		}
		setCurrentPage(1)
	}

	const handleSort = (field: string) => {
		setSortOrder(sortField === field && sortOrder === 'desc' ? 'asc' : 'desc')
		setSortField(field)
	}

	const getTransactionColor = (type: any) => {
		switch (type) {
			case 'individual session':
				return 'bg-green-500 text-white'
			case 'class session':
				return 'bg-cyan-600 text-white'
			case 'credit refill':
				return 'bg-yellow-600 text-white'
			case 'bundle purchase':
				return 'bg-emerald-600 text-white'
			case 'market transaction':
				return 'bg-gray-500 text-white'
			default:
				return 'bg-gray-600 text-white'
		}
	}

	const exportToCSV = async () => {
		const transactions = await fetchAllTransactions()

		if (transactions.length === 0) {
			alert('No transactions to export.')
			return
		}

		const csvContent = [
			['Date', 'Description', 'Type', 'Amount', 'User ID'],
			...transactions.map(transaction => [
				new Date(transaction.created_at).toLocaleString(),
				transaction.name,
				transaction.type,
				transaction.amount,
				transaction.user_id
			])
		]
			.map(row => row.join(','))
			.join('\n')

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const fileName = `transactions_export_${new Date().toISOString()}.csv`

		saveAs(blob, fileName)
	}

	const fetchAllTransactions = async () => {
		const supabase = await supabaseClient()

		let query = supabase
			.from('transactions')
			.select('*')
			.order(sortField, { ascending: sortOrder === 'asc' })

		if (filter !== 'all') {
			query = query.eq('type', filter)
		}

		if (searchTerm) {
			query = query.or(
				`name.ilike.%${searchTerm}%,amount.ilike.%${searchTerm}%`
			)
		}

		if (startDate && endDate) {
			query = query
				.gte('created_at', startDate.toISOString())
				.lt('created_at', new Date(endDate.getTime() + 86400000).toISOString())
		}

		const { data, error } = await query

		if (error) {
			console.error('Error fetching all transactions:', error)
			return []
		}

		return data
	}

	const predefinedDateRanges = [
		{
			label: 'Today',
			start: new Date(new Date().setHours(0, 0, 0, 0)),
			end: new Date(new Date().setHours(23, 59, 59, 999))
		},

		{
			label: 'Last 7 days',
			start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'Last 30 days',
			start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'This year',
			start: new Date(new Date().getFullYear(), 0, 1),
			end: new Date()
		}
	]

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-3 '>
			<AdminNavbarComponent />
			<h1 className='text-4xl font-bold mb-8 text-center bg-clip-text mt-6 text-transparent bg-gradient-to-r from-green-400 via-green-600 to-green-700'>
				Transaction Dashboard
			</h1>

			<div className='mx-6'>
				<div className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-400'>
								Transaction Type
							</label>
							<select
								value={filter}
								onChange={handleFilterChange}
								className='w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'>
								<option value='all'>All Types</option>
								<option value='individual session'>Individual Session</option>
								<option value='class session'>Class Session</option>
								<option value='credit refill'>Credit Refill</option>
								<option value='bundle purchase'>Bundle Purchase</option>
								<option value='market transaction'>Market Transaction</option>
							</select>
						</div>
						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-400'>
								Search
							</label>
							<div className='relative'>
								<input
									type='text'
									placeholder='Search transactions...'
									value={searchTerm}
									onChange={handleSearch}
									className='w-full bg-gray-700 text-white rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
								/>
								<FaSearch className='absolute left-3 top-3 text-gray-400' />
							</div>
						</div>
						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-400'>
								Date Range
							</label>
							<DatePicker
								selectsRange={true}
								startDate={startDate}
								endDate={endDate}
								onChange={handleDateChange}
								className='w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
								placeholderText='Select date range'
							/>
						</div>
						<div className='space-y-2'>
							<label className='block text-sm font-medium text-gray-400'>
								Quick Date Ranges
							</label>
							<div className='grid grid-cols-2 gap-2'>
								{predefinedDateRanges.map((range, index) => (
									<button
										key={index}
										onClick={() => handleDateChange([range.start, range.end])}
										className='bg-green-600 hover:bg-green-700 text-white text-sm rounded-md px-3 py-1 transition duration-300'>
										{range.label}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg'>
					<h2 className='text-2xl font-semibold mb-4'>Summary</h2>
					<div className='grid grid-cols-2 gap-8'>
						<div className='bg-gradient-to-r from-green-400 to-green-700 rounded-lg p-4'>
							<p className='text-lg font-medium'>Total Credits</p>
							<p className='text-3xl font-bold'>
								{summary.totalCredits.toFixed(2)}
							</p>
						</div>
						<div className='bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg p-4'>
							<p className='text-lg font-medium'>Total Tokens</p>
							<p className='text-3xl font-bold'>
								{summary.totalTokens.toFixed(2)}
							</p>
						</div>
					</div>
				</div>

				{loading ? (
					<div className='flex justify-center items-center h-64'>
						<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
					</div>
				) : (
					<>
						<div className='overflow-x-auto'>
							<div className='min-w-full inline-block align-middle'>
								<div className='overflow-hidden'>
									<table className='min-w-full divide-y divide-gray-700'>
										<thead className='bg-gray-700'>
											<tr>
												<th
													scope='col'
													className='py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-400 uppercase'>
													Date
												</th>
												<th
													scope='col'
													className='py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-400 uppercase'>
													Description
												</th>
												<th
													scope='col'
													className='py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-400 uppercase'>
													Type
												</th>
												<th
													scope='col'
													className='py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-400 uppercase'>
													Amount
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-700'>
											{transactions.map(transaction => (
												<tr key={transaction.id} className='hover:bg-gray-700'>
													<td className='py-4 px-6 whitespace-nowrap'>
														{new Date(
															transaction.created_at
														).toLocaleDateString()}
													</td>
													<td className='py-4 px-6'>{transaction.name}</td>
													<td className='py-4 px-6'>
														<span
															className={`inline-block px-2 py-1 rounded-lg text-xs font-medium break-words ${getTransactionColor(
																transaction.type
															)}`}>
															{transaction.type}
														</span>
													</td>
													<td className='py-4 px-6 whitespace-nowrap'>
														<span
															className={
																transaction.amount.startsWith('+')
																	? 'text-green-400'
																	: 'text-red-400'
															}>
															{transaction.amount}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>

						<div className='mt-8 flex justify-between items-center'>
							<div>
								<p className='text-sm text-gray-400'>
									Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
									{Math.min(
										currentPage * itemsPerPage,
										totalPages * itemsPerPage
									)}{' '}
									of {totalPages * itemsPerPage} entries
								</p>
							</div>
							<div className='space-x-2'>
								<button
									onClick={() =>
										setCurrentPage((prev: number) => Math.max(prev - 1, 1))
									}
									disabled={currentPage === 1}
									className='px-4 py-2 bg-green-400 text-white rounded-md disabled:opacity-50 hover:bg-green-500 transition duration-300'>
									Previous
								</button>
								<button
									onClick={() =>
										setCurrentPage((prev: number) =>
											Math.min(prev + 1, totalPages)
										)
									}
									disabled={currentPage === totalPages}
									className='px-4 py-2 bg-green-400 text-white rounded-md disabled:opacity-50 hover:bg-green-500 transition duration-300'>
									Next
								</button>
							</div>
						</div>
					</>
				)}

				<div className='mt-8 flex justify-end'>
					<button
						onClick={exportToCSV}
						className='bg-green-700 hover:bg-green-800 mx-auto lg:mx-0 text-white rounded-md px-6 py-3 flex items-center transition duration-300'>
						Download
						<FaDownload className='ml-2' />
					</button>
				</div>
			</div>
		</motion.div>
	)
}

export default TransactionPage
