import { supabaseClient } from '../supabaseClient'
const classestiers = [
	{
		name: '"I train from time to time"',
		id: 'tier-freelancer',
		href: '#',
		priceMonthly: '25 credits',
		description: '1 class',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		],
		mostPopular: false
	},
	{
		name: '"I train everyday"',
		id: 'tier-startup',
		href: '#',
		priceMonthly: '100 credits',
		description: '5 classes',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		],
		mostPopular: true
	},
	{
		name: 'Eat, sleep, gym, repeat',
		id: 'tier-enterprise',
		href: '#',
		priceMonthly: '150 credits',
		description: '10 classes',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations'
		],
		mostPopular: false
	}
]

const individualtiers = [
	{
		name: 'Workout of the day',
		id: 'tier-basic',
		href: '#',
		price: { monthly: '200', annually: '$12' },
		description: '10 classes',
		features: [
			'5 products',
			'Up to 1,000 subscribers',
			'Basic analytics',
			'48-hour support response time'
		]
	},
	{
		name: 'Private training',
		id: 'tier-essential',
		href: '#',
		price: { monthly: '350', annually: '$24' },
		description: '10 classes',
		features: [
			'25 products',
			'Up to 10,000 subscribers',
			'Advanced analytics',
			'24-hour support response time',
			'Marketing automations'
		]
	},
	{
		name: 'Semi-Private',
		id: 'tier-growth',
		href: '#',
		price: { monthly: '300', annually: '$48' },
		description: '10 classes',
		features: [
			'Unlimited products',
			'Unlimited subscribers',
			'Advanced analytics',
			'1-hour, dedicated support response time',
			'Marketing automations',
			'Custom reporting tools'
		]
	}
]
export const purchaseBundle = async ({ userId, bundleType, bundleName }) => {
	const supabase = await supabaseClient()

	// Fetch user's current data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Determine the bundle details
	let bundlePrice, tokenType, tokenAmount
	if (bundleType === 'classes') {
		const bundle = classestiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for classes.' }
		}
		bundlePrice = parseInt(bundle.priceMonthly)
		tokenType = 'public'
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
	} else if (bundleType === 'individual') {
		const bundle = individualtiers.find(tier => tier.name === bundleName)
		if (!bundle) {
			return { error: 'Invalid bundle name for individual training.' }
		}
		bundlePrice = parseInt(bundle.price.monthly)
		tokenAmount = parseInt(bundle.description.split(' ')[0]) // Extract number of classes
		switch (bundleName) {
			case 'Workout of the day':
				tokenType = 'workoutDay'
				break
			case 'Private training':
				tokenType = 'private'
				break
			case 'Semi-Private':
				tokenType = 'semiPrivate'
				break
			default:
				return { error: 'Invalid individual bundle type.' }
		}
	} else {
		return { error: 'Invalid bundle type.' }
	}

	// Check if the user has enough credits
	if (userData.wallet < bundlePrice) {
		return { error: 'Not enough credits to purchase the bundle.' }
	}

	// Deduct credits and add tokens
	const newWalletBalance = userData.wallet - bundlePrice
	const newTokenBalance = userData[`${tokenType}_token`] + tokenAmount

	// Update user data
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			[`${tokenType}_token`]: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Insert bundle purchase record
	const transactionRecords = [
		{
			user_id: userId,
			name: `Purchased ${bundleName} bundle`,
			type: 'bundle purchase',
			amount: `-${bundlePrice} credits`
		},
		{
			user_id: userId,
			name: `Received tokens for ${bundleName} bundle`,
			type: 'bundle purchase',
			amount: `+${tokenAmount} ${tokenType} token${tokenAmount > 1 ? 's' : ''}`
		}
	]

	const { error: transactionError } = await supabase
		.from('transactions')
		.insert(transactionRecords)

	if (transactionError) {
		console.error('Error recording transactions:', transactionError.message)
		// Note: We're not returning here to ensure the purchase is still considered successful
	}

	return {
		data: {
			newWalletBalance,
			[`${tokenType}_token`]: newTokenBalance
		},
		message: 'Bundle purchased successfully.'
	}
}

async function insertBundlePurchaseRecord(
	supabase,
	userId,
	amount,

	tokenAmount,
	tokenType
) {
	if (tokenType === 'public') {
		tokenType = 'class'
	}
	const formattedBundleName = ` ${tokenAmount} ${tokenType} tokens`
	const { data, error } = await supabase.from('bundle_purchase').insert({
		user_id: userId,
		amount: amount,
		bundle_name: formattedBundleName
	})

	if (error) {
		console.error('Error inserting bundle purchase record:', error.message)
		return {
			error: 'Failed to insert bundle purchase record: ' + error.message
		}
	}

	return { data }
}
