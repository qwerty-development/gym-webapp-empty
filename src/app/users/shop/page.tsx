'use client'
import { useState, useEffect } from 'react'
import NavbarComponent from '../../components/users/navbar'
import {
	fetchMarketItems,
	handlePurchase,
	fetchUserData
} from '../../../../utils/userRequests'
import { useUser } from '@clerk/clerk-react'
import Bundles from '@/app/components/users/bundles'

interface MarketItem {
	id: string
	name: string
	price: number
}

interface CartItem extends MarketItem {
	quantity: number
}

const Shop: React.FC = () => {
	const [isBundles, setIsBundles] = useState(false)
	const [items, setItems] = useState<MarketItem[]>([])
	const [cart, setCart] = useState<CartItem[]>([])
	const [isCartOpen, setIsCartOpen] = useState(false)
	const { user } = useUser()

	useEffect(() => {
		const getItems = async () => {
			const marketItems = await fetchMarketItems()
			setItems(marketItems)
		}

		getItems()
	}, [])

	const addToCart = (item: MarketItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem) {
				return prevCart.map(cartItem =>
					cartItem.id === item.id
						? { ...cartItem, quantity: cartItem.quantity + 1 }
						: cartItem
				)
			} else {
				return [...prevCart, { ...item, quantity: 1 }]
			}
		})
	}

	const removeFromCart = (item: MarketItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem) {
				if (existingItem.quantity === 1) {
					return prevCart.filter(cartItem => cartItem.id !== item.id)
				} else {
					return prevCart.map(cartItem =>
						cartItem.id === item.id
							? { ...cartItem, quantity: cartItem.quantity - 1 }
							: cartItem
					)
				}
			}
			return prevCart
		})
	}

	const getTotalPrice = () => {
		return cart
			.reduce((total, item) => total + item.price * item.quantity, 0)
			.toFixed(2)
	}

	const toggleCart = () => {
		setIsCartOpen(!isCartOpen)
	}

	const handlePurchaseClick = async () => {
		if (!user) {
			alert('Please log in to make a purchase.')
			return
		}

		const userId = user.id
		const totalPrice = parseFloat(getTotalPrice())
		const success = await handlePurchase(userId, cart, totalPrice)

		if (success) {
			setCart([])
			alert('Purchase successful!')
		} else {
			alert('Purchase failed. Please try again.')
		}
	}

	return (
		<div className='min-h-screen bg-white' id='__next'>
			<NavbarComponent />
			<div className='max-w-7xl mx-auto lg:ml-32 2xl:mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h1 className='text-4xl sm:text-5xl font-extrabold text-green-500 mb-8 sm:mb-12 text-center'>
					Shop
				</h1>

				{/* Toggle for Large Screens */}
				<div className='hidden lg:block fixed left-0 top-0 h-full bg-gray-100 z-30 transform transition-transform duration-300 ease-in-out'>
					<h2 className='text-2xl font-bold mb-4 mt-16 md:mt-4 ml-1 text-green-500'>
						Menu
					</h2>
					<ul>
						<li
							className={`mb-5 text-blue-700 p-2 px-6 ${
								!isBundles ? 'bg-green-500 text-white' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setIsBundles(false)}>
								<img
									src='https://www.svgrepo.com/show/307607/food-and-drink-food-edible-healthy.svg'
									className='mr-2 h-8 w-8'
									alt='Items Icon'
								/>
								Items
							</button>
						</li>
						<li
							className={`mb-10 text-blue-700 p-2 px-6 ${
								isBundles ? 'bg-green-500 text-white' : ''
							}`}>
							<button
								className='flex items-center hover:text-blue-400 w-full text-left'
								onClick={() => setIsBundles(true)}>
								<img
									src='https://www.svgrepo.com/show/371744/bundle.svg'
									className='mr-2 h-8 w-8'
									alt='Bundles Icon'
								/>
								Bundles
							</button>
						</li>
					</ul>
				</div>

				{/* Toggle for Medium Screens */}
				<div className='hidden md:block lg:hidden sticky top-0 z-20 bg-white py-2 mb-4'>
					<div className='flex justify-center space-x-2'>
						<button
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
								!isBundles
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-blue-700 hover:bg-gray-300'
							}`}
							onClick={() => setIsBundles(false)}>
							Items
						</button>
						<button
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
								isBundles
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-blue-700 hover:bg-gray-300'
							}`}
							onClick={() => setIsBundles(true)}>
							Bundles
						</button>
					</div>
				</div>

				{/* Toggle for Small Screens */}
				<div className='md:hidden sticky top-0 z-20 bg-white py-2 mb-4'>
					<div className='flex justify-center space-x-2'>
						<button
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
								!isBundles
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-blue-700 hover:bg-gray-300'
							}`}
							onClick={() => setIsBundles(false)}>
							Items
						</button>
						<button
							className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
								isBundles
									? 'bg-green-500 text-white'
									: 'bg-gray-200 text-blue-700 hover:bg-gray-300'
							}`}
							onClick={() => setIsBundles(true)}>
							Bundles
						</button>
					</div>
				</div>

				<div className='relative mt-4'>
					<button
						onClick={toggleCart}
						className='fixed right-4 bottom-4 z-50 flex items-center bg-green-500 text-white p-2 rounded-full hover:bg-blue-600'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='feather feather-shopping-cart h-6 w-6'>
							<circle cx='9' cy='21' r='1'></circle>
							<circle cx='20' cy='21' r='1'></circle>
							<path d='M1 1h4l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'></path>
						</svg>
						{cart.length > 0 && (
							<span className='ml-2 text-sm bg-white text-green-500 rounded-full px-2 py-1'>
								{cart.length}
							</span>
						)}
					</button>
					{isBundles ? (
						<div>
							<Bundles />
						</div>
					) : (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
							{items.map(item => (
								<div
									key={item.id}
									className='bg-gray-100 rounded-lg shadow-lg p-6 flex flex-col items-center'>
									<h2 className='text-2xl font-bold text-blue-700 mb-4'>
										{item.name}
									</h2>
									<p className='text-lg text-green-500 mb-4'>
										{item.price.toFixed(2)} credits
									</p>
									<button
										className='mt-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-blue-600'
										onClick={() => addToCart(item)}>
										Add to cart
									</button>
								</div>
							))}
						</div>
					)}

					{isCartOpen && (
						<div className='fixed top-0 right-0 w-full md:w-1/3 h-full bg-white p-6 overflow-auto z-40 shadow-lg'>
							<h2 className='text-2xl font-bold text-blue-700 mb-6'>
								Your Cart
							</h2>
							{cart.map(cartItem => (
								<div
									key={cartItem.id}
									className='flex justify-between items-center mb-4'>
									<span className='text-blue-700'>
										{cartItem.name} (x{cartItem.quantity})
									</span>
									<div className='flex items-center'>
										<span className='text-green-500 mr-4'>
											{(cartItem.price * cartItem.quantity).toFixed(2)} credits
										</span>
										<button
											className='text-red-500 hover:text-red-700'
											onClick={() => removeFromCart(cartItem)}>
											Remove
										</button>
									</div>
								</div>
							))}
							<div className='border-t border-gray-200 pt-4'>
								<h3 className='text-xl font-bold text-blue-700'>
									Total: {getTotalPrice()} credits
								</h3>
							</div>
							<button
								onClick={handlePurchaseClick}
								className='mt-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-blue-600'>
								Buy
							</button>
							<button
								onClick={toggleCart}
								className='mt-6 ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600'>
								Close
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default Shop
