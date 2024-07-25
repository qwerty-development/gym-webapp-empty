import React from 'react'
import { Line } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

interface TransactionChartProps {
	chartData: any
	chartLoading: boolean
}

const TransactionChart: React.FC<TransactionChartProps> = ({
	chartData,
	chartLoading
}) => {
	return (
		<div className='bg-gray-800 rounded-xl p-6 shadow-lg mb-8'>
			<h2 className='text-2xl font-semibold mb-4'>Transaction Trend</h2>
			{chartLoading ? (
				<div className='flex justify-center items-center h-64'>
					<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
				</div>
			) : chartData ? (
				<Line
					data={chartData}
					options={{
						responsive: true,
						plugins: {
							legend: {
								position: 'top' as const
							},
							title: {
								display: true,
								text: 'Transaction Trend'
							}
						},
						scales: {
							x: {
								title: {
									display: true,
									text: 'Date'
								}
							},
							y: {
								title: {
									display: true,
									text: 'Amount'
								}
							}
						}
					}}
				/>
			) : (
				<p>No data available for the selected filters.</p>
			)}
		</div>
	)
}

export default TransactionChart
