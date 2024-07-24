import { supabaseClient } from '../supabaseClient'
export const fetchUsers = async searchQuery => {
	const supabase = await supabaseClient()
	let query = supabase.from('users').select('*')

	if (searchQuery) {
		query = query.or(
			`username.ilike.%${searchQuery}%,` +
				`first_name.ilike.%${searchQuery}%,` +
				`last_name.ilike.%${searchQuery}%`
		)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching users:', error.message)
		return []
	}

	console.log(data)
	return data
}
async function insertRefillRecord(supabase, userId, amount) {
	const { data, error } = await supabase.from('credit_refill').insert({
		user_id: userId,
		amount: amount
	})

	if (error) {
		console.error('Error inserting refill record:', error.message)
		return { error: 'Failed to insert refill record: ' + error.message }
	}

	return { data }
}

export const updateUserCredits = async (userId, wallet, sale, newCredits) => {
	const supabase = await supabaseClient()

	// Fetch user details
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet, first_name, last_name, email, user_id')
		.eq('id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: 'User not found' }
	}

	// Calculate the amount of credits added
	const creditsAdded = wallet - userData.wallet

	// Update user's wallet
	const { data, error } = await supabase
		.from('users')
		.update({ wallet })
		.eq('id', userId)

	if (error) {
		console.error('Error updating user wallet:', error.message)
		return { error: 'Failed to update user wallet: ' + error.message }
	}

	// Insert refill record
	const { error: refillError } = await insertRefillRecord(
		supabase,
		userData.user_id,
		newCredits
	)

	if (refillError) {
		console.error('Error inserting refill record:', refillError.message)
		// Note: We're not returning here, as we want to continue with the process
	}

	// Add transaction records
	const transactions = [
		{
			user_id: userData.user_id,
			name: 'Credit refill',
			type: 'credit refill',
			amount: `+${creditsAdded} credits`
		}
	]

	// If there was a sale, add a transaction for the free tokens
	if (sale && sale > 0) {
		const freeTokens = Math.floor(newCredits * (sale / 100))
		transactions.push({
			user_id: userData.user_id,
			name: 'Free tokens from credit refill sale',
			type: 'credit refill',
			amount: `+${freeTokens} tokens`
		})
	}

	const { error: transactionError } = await supabase
		.from('transactions')
		.insert(transactions)

	if (transactionError) {
		console.error('Error recording transactions:', transactionError.message)
		// Note: We don't return here as the credit update was successful
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		user_wallet: wallet,
		creditsAdded,
		sale,
		newCredits
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-refill-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultUser = await responseUser.json()
		if (responseUser.ok) {
			console.log('User email sent successfully')
		} else {
			console.error(`Failed to send user email: ${resultUser.error}`)
		}
	} catch (error) {
		console.error('Error sending user email:', error)
	}

	return { data, error }
}

export const updateUserisFree = async (userId, isFree) => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.update({ isFree })
		.eq('id', userId)

	return { data, error } // Return an object containing both data and error
}

export const updateUserCreditsCancellation = async (userId, totalRefund) => {
	const supabase = await supabaseClient()
	const userResponse = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userResponse.data) {
		const newWalletBalance = userResponse.data.wallet + totalRefund
		const { data, error } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (error) {
			console.error('Error updating user credits:', error.message)
			return { success: false, error: error.message }
		}
		return { success: true, data }
	} else {
		console.error('User not found or failed to fetch user data')
		return { success: false, error: 'User not found' }
	}
}
export const fetchTotalUsers = async () => {
	const supabase = await supabaseClient()
	const { count, error } = await supabase
		.from('users')
		.select('*', { count: 'exact', head: true })

	if (error) {
		console.error('Error fetching total users:', error.message)
		return 0
	}

	return count || 0
}
