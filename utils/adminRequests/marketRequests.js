import { supabaseClient } from '../supabaseClient'
export const addMarketItem = async (name, price) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.insert([{ name, price }])

	if (error) {
		console.error('Error adding market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item added successfully' }
}

export const deleteMarketItem = async id => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase.from('market').delete().eq('id', id)

	if (error) {
		console.error('Error deleting market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item deleted successfully' }
}
export const modifyMarketItem = async (id, name, price) => {
	const supabase = await supabaseClient()

	const { data, error } = await supabase
		.from('market')
		.update({ name, price })
		.eq('id', id)

	if (error) {
		console.error('Error modifying market item:', error.message)
		return { error: error.message }
	}

	return { data, message: 'Item modified successfully' }
}
