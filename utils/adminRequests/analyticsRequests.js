import { supabaseClient } from '../supabaseClient'

export const getActiveTotalCredits = async () => {
	const { data, error } = await supabaseClient().from('users').select('wallet')

	if (error) {
		console.error('Error fetching active total credits:', error.message)
		return { data: null, error: error.message }
	}

	const totalActiveCredits = data.reduce(
		(total, row) => total + (row.wallet || 0),
		0
	)
	return { data: totalActiveCredits, error: null }
}

/**
 * Fetch the total spend on activities within a date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ data: Record<string, number> | null, error: string | null }>}
 */
export const getTotalSpendActivities = async (startDate, endDate) => {
	const { data, error } = await supabaseClient()
		.from('time_slots')
		.select('activities!inner(credits), created_at')
		.eq('booked', true)
		.gte('created_at', startDate)
		.lte('created_at', endDate)

	if (error) {
		console.error(
			'Error fetching total credits spent on activities:',
			error.message
		)
		return { data: null, error: error.message }
	}

	const groupedData = data.reduce((acc, row) => {
		const date = row.created_at.split('T')[0]
		acc[date] = (acc[date] || 0) + row.activities.credits
		return acc
	}, {})

	return { data: groupedData, error: null }
}

/**
 * Fetch the total spend on group activities within a date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ data: Record<string, number> | null, error: string | null }>}
 */
export const getTotalSpendActivitiesGroup = async (startDate, endDate) => {
	const { data, error } = await supabaseClient()
		.from('group_time_slots')
		.select('activities!inner(credits), count, created_at')
		.gt('count', 0)
		.gte('created_at', startDate)
		.lte('created_at', endDate)

	if (error) {
		console.error(
			'Error fetching total credits spent on group activities:',
			error.message
		)
		return { data: null, error: error.message }
	}

	const groupedData = data.reduce((acc, row) => {
		const date = row.created_at.split('T')[0]
		acc[date] =
			(acc[date] || 0) + (row.activities.credits || 0) * (row.count || 0)
		return acc
	}, {})

	return { data: groupedData, error: null }
}

/**
 * Fetch the total bundle purchase amount within a date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ data: Record<string, number> | null, error: string | null }>}
 */
export const getTotalBundlePurchaseAmount = async (startDate, endDate) => {
	const { data, error } = await supabaseClient()
		.from('bundle_purchase')
		.select('amount, purchased_at')
		.gte('purchased_at', startDate)
		.lte('purchased_at', endDate)

	if (error) {
		console.error('Error fetching total bundle purchase amount:', error.message)
		return { data: null, error: error.message }
	}

	const groupedData = data.reduce((acc, row) => {
		const date = row.purchased_at.split('T')[0]
		acc[date] = (acc[date] || 0) + (row.amount || 0)
		return acc
	}, {})

	return { data: groupedData, error: null }
}

/**
 * Fetch the total shop purchase amount within a date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ data: Record<string, number> | null, error: string | null }>}
 */
export const getTotalShopPurchaseAmount = async (startDate, endDate) => {
	const { data, error } = await supabaseClient()
		.from('market_transactions')
		.select('price, date')
		.gte('date', startDate)
		.lte('date', endDate)

	if (error) {
		console.error('Error fetching total shop purchase amount:', error.message)
		return { data: null, error: error.message }
	}

	const groupedData = data.reduce((acc, row) => {
		const date = row.date.split('T')[0]
		acc[date] = (acc[date] || 0) + (row.price || 0)
		return acc
	}, {})

	return { data: groupedData, error: null }
}

/**
 * Fetch the total credits refilled within a date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Promise<{ data: Record<string, number> | null, error: string | null }>}
 */
export const getTotalCreditsRefilled = async (startDate, endDate) => {
	const { data, error } = await supabaseClient()
		.from('credit_refill')
		.select('amount, refilled_at')
		.gte('refilled_at', startDate)
		.lte('refilled_at', endDate)

	if (error) {
		console.error('Error fetching total credits refilled:', error.message)
		return { data: null, error: error.message }
	}

	const groupedData = data.reduce((acc, row) => {
		const date = row.refilled_at.split('T')[0]
		acc[date] = (acc[date] || 0) + (row.amount || 0)
		return acc
	}, {})

	return { data: groupedData, error: null }
}
