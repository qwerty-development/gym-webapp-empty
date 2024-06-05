'use client'
import { useState, useEffect } from 'react'
import {
	addMarketItem,
	modifyMarketItem,
	deleteMarketItem
} from '../../../../utils/admin-requests'
import { fetchMarket } from '../../../../utils/user-requests'
import NavbarComponent from '@/app/components/users/navbar'
import toast, { Toaster } from 'react-hot-toast'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'

interface MarketItem {
	id: number
	name: string
	price: number
}

export default function MarketManagement() {
	const [items, setItems] = useState<MarketItem[]>([])
	const [newItemName, setNewItemName] = useState<string>('')
	const [newItemPrice, setNewItemPrice] = useState<string>('')
	const [editingItem, setEditingItem] = useState<number | null>(null)
	const [editName, setEditName] = useState<string>('')
	const [editPrice, setEditPrice] = useState<string>('')

	const fetchMarketItems = async () => {
		const data = await fetchMarket()
		setItems(data)
	}

	useEffect(() => {
		fetchMarketItems()
	}, [])

	const handleAddItem = async () => {
		const price = parseFloat(newItemPrice)
		if (!newItemName || isNaN(price)) {
			toast.error('Please enter valid name and price.')
			return
		}
		const { error, message } = await addMarketItem(newItemName, price)
		if (error) {
			toast.error(error)
		} else {
			toast.success('Item added successfully!')
			setNewItemName('')
			setNewItemPrice('')
			fetchMarketItems()
		}
	}

	const handleDeleteItem = async (id: number) => {
		const { error, message } = await deleteMarketItem(id)
		if (error) {
			toast.error(error)
		} else {
			toast.success('Item deleted successfully!')
			fetchMarketItems()
		}
	}

	const handleModifyItem = async (id: number) => {
		const price = parseFloat(editPrice)
		if (!editName || isNaN(price)) {
			toast.error('Please enter valid name and price.')
			return
		}
		const { error, message } = await modifyMarketItem(id, editName, price)
		if (error) {
			toast.error(error)
		} else {
			toast.success('Item modified successfully!')
			setEditingItem(null)
			setEditName('')
			setEditPrice('')
			fetchMarketItems()
		}
	}

	return (
		<>
			<AdminNavbarComponent />
			<div className='container mx-auto p-6 h-screen  '>
				<h1 className='text-4xl font-bold mb-6 text-center'>
					Market Management
				</h1>

				{/* Add New Item */}
				<div className=' p-6 rounded-lg shadow-md mb-6'>
					<h2 className='text-2xl font-bold mb-4'>Add New Item</h2>
					<div className='flex flex-col space-y-4'>
						<input
							type='text'
							className='p-3 border rounded-lg text-black'
							placeholder='Item Name'
							value={newItemName}
							onChange={e => setNewItemName(e.target.value)}
						/>
						<input
							type='number'
							className='p-3 border rounded-lg text-black'
							placeholder='Item Price'
							value={newItemPrice}
							min={0}
							onChange={e => setNewItemPrice(e.target.value)}
						/>
						<button
							onClick={handleAddItem}
							className='bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700'>
							Add Item
						</button>
					</div>
				</div>

				{/* List of Items */}
				<div className=' p-6 rounded-lg shadow-md'>
					<h2 className='text-2xl font-bold mb-4'>Items List</h2>
					{items.map(item => (
						<div
							key={item.id}
							className='flex justify-between items-center p-3 border-b last:border-b-0'>
							{editingItem === item.id ? (
								<div className='flex flex-col space-y-2 flex-grow'>
									<input
										type='text'
										className='p-3 border rounded-lg text-black'
										placeholder='Edit Name'
										value={editName}
										onChange={e => setEditName(e.target.value)}
									/>
									<input
										type='number'
										className='p-3 border rounded-lg text-black'
										placeholder='Edit Price'
										value={editPrice}
										min={0}
										onChange={e => setEditPrice(e.target.value)}
									/>
									<div className='flex space-x-2'>
										<button
											onClick={() => handleModifyItem(item.id)}
											className='bg-green-500 text-white p-2 rounded-lg hover:bg-green-700'>
											Save
										</button>
										<button
											onClick={() => setEditingItem(null)}
											className='bg-red-500 text-white p-2 rounded-lg hover:bg-red-700'>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<>
									<div className='flex-grow'>
										<span className='font-semibold'>{item.name}</span> - $
										{item.price}
									</div>
									<div className='flex space-x-2'>
										<button
											onClick={() => {
												setEditingItem(item.id)
												setEditName(item.name)
												setEditPrice(item.price.toString())
											}}
											className='bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600'>
											Edit
										</button>
										<button
											onClick={() => handleDeleteItem(item.id)}
											className='bg-red-500 text-white  p-2 rounded-lg hover:bg-red-600'>
											Delete
										</button>
									</div>
								</>
							)}
						</div>
					))}
				</div>
			</div>
		</>
	)
}
