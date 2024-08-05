import { supabaseClient } from '../supabaseClient'

export const fetchMarket = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('*')
		.gt('quantity', 0)
		.order('id')
	if (error) {
		console.error('Error fetching market:', error.message)
		return []
	}
	return data
}

export const payForItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's current credits
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user credits:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price of selected items
	const totalPrice = selectedItems.reduce(
		(total, item) => total + item.price,
		0
	)

	if (totalPrice === 0) {
		return { error: 'No items selected.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < totalPrice) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Fetch the time slot ID based on activity, coach, date, and start time
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		console.error('Error fetching time slot data:', timeSlotError?.message)
		return { error: timeSlotError?.message || 'Time slot not found.' }
	}

	// Deduct credits from user's account
	const newWalletBalance = userData.wallet - totalPrice
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: newWalletBalance })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user credits:', updateError.message)
		return { error: updateError.message }
	}

	// Add the selected item names to the additions array in the time slot
	const newAdditions = [
		...(timeSlotData.additions || []),
		...selectedItems.map(item => item.name)
	]
	const { error: additionsError } = await supabase
		.from('time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		console.error('Error updating time slot additions:', additionsError.message)
		return { error: additionsError.message }
	}

	for (const item of selectedItems) {
		const { data, error: quantityError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (quantityError) {
			console.error('Error fetching item quantity:', quantityError.message)
			continue
		}

		const newQuantity = Math.max(data.quantity - 1, 0) // Ensure quantity doesn't go below 0

		const { error: updateError } = await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)

		if (updateError) {
			console.error('Error updating item quantity:', updateError.message)
			// You might want to handle this error more gracefully
		}
	}

	const itemNames = selectedItems.map(item => item.name).join(', ')
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Purchased items for individual session: ${itemNames}`,
			type: 'market transaction',
			amount: `-${totalPrice} credits`
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the purchase was successful
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message: 'Items added to time slot and credits deducted.'
	}
}

export const payForGroupItems = async ({
	userId,
	activityId,
	coachId,
	date,
	startTime,
	selectedItems
}) => {
	const supabase = await supabaseClient()

	// Fetch user's current credits
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user credits:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Calculate total price of selected items
	const totalPrice = selectedItems.reduce(
		(total, item) => total + item.price,
		0
	)

	if (totalPrice === 0) {
		return { error: 'No items selected.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < totalPrice) {
		return { error: 'Not enough credits to pay for the items.' }
	}

	// Fetch the group time slot ID based on activity, coach, date, and start time
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('group_time_slots')
		.select('*')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime
		})
		.single()

	if (timeSlotError || !timeSlotData) {
		console.error(
			'Error fetching group time slot data:',
			timeSlotError?.message
		)
		return { error: timeSlotError?.message || 'Group time slot not found.' }
	}

	// Deduct credits from user's account
	const newWalletBalance = userData.wallet - totalPrice
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: newWalletBalance })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user credits:', updateError.message)
		return { error: updateError.message }
	}

	// Create a new addition entry
	const newAddition = {
		user_id: userId,
		items: selectedItems.map(item => ({
			id: item.id,
			name: item.name,
			price: item.price
		}))
	}

	// Add the new addition entry to the additions array in the group time slot
	const newAdditions = [...(timeSlotData.additions || []), newAddition]
	const { error: additionsError } = await supabase
		.from('group_time_slots')
		.update({ additions: newAdditions })
		.eq('id', timeSlotData.id)

	if (additionsError) {
		console.error(
			'Error updating group time slot additions:',
			additionsError.message
		)
		return { error: additionsError.message }
	}

	for (const item of selectedItems) {
		const { data, error: quantityError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (quantityError) {
			console.error('Error fetching item quantity:', quantityError.message)
			continue
		}

		const newQuantity = Math.max(data.quantity - 1, 0) // Ensure quantity doesn't go below 0

		const { error: updateError } = await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)

		if (updateError) {
			console.error('Error updating item quantity:', updateError.message)
			// You might want to handle this error more gracefully
		}
	}
	const itemNames = selectedItems.map(item => item.name).join(', ')
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Purchased items for group session: ${itemNames}`,
			type: 'market transaction',
			amount: `-${totalPrice} credits`
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the purchase was successful
	}

	return {
		data: { ...timeSlotData, additions: newAdditions },
		message: 'Items added to group time slot and credits deducted.'
	}
}

export const fetchMarketItems = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('market')
		.select('id, name, price,quantity')
		.gt('quantity', 0)
		.order('id')

	if (error) {
		console.error('Error fetching market items:', error.message)
		return []
	}

	return data
}
export const handlePurchase = async (userId, cart, totalPrice) => {
	const supabase = supabaseClient()

	// Check user's wallet balance
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userError) {
		console.error('Error fetching user wallet:', userError.message)
		return { success: false, error: 'Error fetching user wallet' }
	}

	if (userData.wallet < totalPrice) {
		return {
			success: false,
			error: 'You do not have enough credits to make this purchase.'
		}
	}

	// Check if all items have sufficient quantity
	for (const item of cart) {
		const { data: currentItem, error: fetchError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (fetchError) {
			console.error(
				`Error fetching current quantity for item ${item.id}:`,
				fetchError.message
			)
			return {
				success: false,
				error: `Error fetching quantity for item ${item.id}`
			}
		}

		if (currentItem.quantity < item.quantity) {
			return {
				success: false,
				error: `Not enough quantity available for item ${item.name}`
			}
		}
	}

	// Update user's wallet
	const { error: updateError } = await supabase
		.from('users')
		.update({ wallet: userData.wallet - totalPrice })
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user wallet:', updateError.message)
		return { success: false, error: 'Error updating user wallet' }
	}

	// Transform cart items to an array of UUIDs and decrease quantities
	const items = []
	for (const item of cart) {
		items.push(...Array(item.quantity).fill(item.id))

		// Fetch current quantity
		const { data: currentItem, error: fetchError } = await supabase
			.from('market')
			.select('quantity')
			.eq('id', item.id)
			.single()

		if (fetchError) {
			console.error(
				`Error fetching current quantity for item ${item.id}:`,
				fetchError.message
			)
			continue
		}

		// Decrease the quantity of the item in the market table
		const newQuantity = Math.max(0, currentItem.quantity - item.quantity)
		const { error: quantityError } = await supabase
			.from('market')
			.update({ quantity: newQuantity })
			.eq('id', item.id)

		if (quantityError) {
			console.error(
				`Error updating quantity for item ${item.id}:`,
				quantityError.message
			)
			// You might want to handle this error more gracefully
		}
	}

	console.log('Items to insert:', items) // Log the items array to verify

	// Record transaction in market_transactions table
	const { error: marketTransactionError } = await supabase
		.from('market_transactions')
		.insert({
			user_id: userId,
			items: items,
			date: new Date(),
			claimed: false,
			price: totalPrice
		})

	if (marketTransactionError) {
		console.error(
			'Error recording market transaction:',
			marketTransactionError.message
		)
		return { success: false, error: 'Error recording market transaction' }
	}

	// Record transaction in the new transactions table
	const transactionData = {
		user_id: userId,
		name: `Market purchase: ${cart.length} item${cart.length > 1 ? 's' : ''}`,
		type: 'market transaction',
		amount: `-${totalPrice} credits`
	}

	const { error: transactionError } = await supabase
		.from('transactions')
		.insert(transactionData)

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return false here as the purchase was successful
	}

	return { success: true }
}

export const fetchShopTransactions = async () => {
	const supabase = supabaseClient()
	const { data: transactions, error } = await supabase
		.from('market_transactions')
		.select('*')
		.eq('claimed', false)

	if (error) {
		console.error('Error fetching shop transactions:', error.message)
		return []
	}

	// Fetch user data for each transaction
	const userPromises = transactions.map(transaction =>
		supabase
			.from('users')
			.select('first_name, last_name')
			.eq('user_id', transaction.user_id)
			.single()
	)

	const userResults = await Promise.all(userPromises)

	// Fetch item data for each transaction
	const itemPromises = transactions.map(transaction => {
		const itemIds = transaction.items
		return supabase.from('market').select('id, name').in('id', itemIds)
	})

	const itemResults = await Promise.all(itemPromises)

	// Combine transactions with user and item data
	const enhancedTransactions = transactions.map((transaction, index) => {
		const user = userResults[index].data
		const items = itemResults[index].data

		// Count item quantities
		const itemCounts = transaction.items.reduce((acc, itemId) => {
			acc[itemId] = (acc[itemId] || 0) + 1
			return acc
		}, {})

		const itemDetails = items.map(item => ({
			name: item.name,
			quantity: itemCounts[item.id] || 0
		}))

		return {
			...transaction,
			user_name: `${user.first_name} ${user.last_name}`,
			item_details: itemDetails
		}
	})

	return enhancedTransactions
}

export const claimTransaction = async transactionId => {
	const supabase = supabaseClient()
	const { error } = await supabase
		.from('market_transactions')
		.update({ claimed: true })
		.eq('transaction_id', transactionId)

	if (error) {
		console.error('Error claiming transaction:', error.message)
		return false
	}

	return true
}
