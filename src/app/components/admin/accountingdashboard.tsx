'use client'
import { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import { getActiveTotalCredits, getTotalSpendActivities, getTotalSpendActivitiesGroup, getTotalShopPurchaseAmount, getTotalBundlePurchaseAmount, getTotalCreditsRefilled } from '../../../../utils/admin-requests';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface FetchResult {
    data: number | null;
    error: string | null;
}

interface ChartData {
    date: string;
    totalCredits: number | null;
    totalSpend: number | null;
    totalSpendGroup: number | null;
    totalBundlePurchase: number | null;
    totalShopPurchase: number | null;
    totalCreditsRefilled: number | null;
}

export default function AccountingDashboard() {
    const [totalCredits, setTotalCredits] = useState<number | null>(null);
    const [totalSpend, setTotalSpend] = useState<number | null>(null);
    const [totalSpendGroup, setTotalSpendGroup] = useState<number | null>(null);
    const [totalBundlePurchase, setTotalBundlePurchase] = useState<number | null>(null);
    const [totalShopPurchase, setTotalShopPurchase] = useState<number | null>(null);
    const [totalCreditsRefilled, setTotalCreditsRefilled] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);
    const [selectedRange, setSelectedRange] = useState<any>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
    });
    const [chartData, setChartData] = useState<ChartData[]>([]);

    const fetchDailyData = async (startDate: string | number | Date, endDate: string | number | Date) => {
        // Ensure startDate and endDate are strings
        const startDateString = new Date(startDate).toISOString();
        const endDateString = new Date(endDate).toISOString();

        const results = await Promise.all([
            getActiveTotalCredits(),
            getTotalSpendActivities(startDateString, endDateString),
            getTotalSpendActivitiesGroup(startDateString, endDateString),
            getTotalBundlePurchaseAmount(startDateString, endDateString),
            getTotalShopPurchaseAmount(startDateString, endDateString),
            getTotalCreditsRefilled(startDateString, endDateString)
        ]);

        const [
            creditsResult,
            spendResult,
            spendGroupResult,
            bundlePurchaseResult,
            shopPurchaseResult,
            creditsRefilledResult
        ] = results;

        if (creditsResult.error || spendResult.error || spendGroupResult.error || bundlePurchaseResult.error || shopPurchaseResult.error || creditsRefilledResult.error) {
            console.error('Error fetching data for chart.');
            return [];
        }

        const generateDateRange = (start: string | number | Date, end: number | Date) => {
            const dates = [];
            let currentDate = new Date(start);
            const endDate = new Date(end);
            while (currentDate <= endDate) {
                dates.push(new Date(currentDate).toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates;
        };
        

        const dateRange = generateDateRange(new Date(startDate), new Date(endDate));

        const getDailyData = (data: Record<string, number> | null, dateRange: any[]) => {
            if (!data) return dateRange.map(() => 0);
            return dateRange.map(date => data[date] || 0);
        };


        const dailySpend = getDailyData(spendResult.data, dateRange);
        const dailySpendGroup = getDailyData(spendGroupResult.data, dateRange);
        const dailyBundlePurchase = getDailyData(bundlePurchaseResult.data, dateRange);
        const dailyShopPurchase = getDailyData(shopPurchaseResult.data, dateRange);
        const dailyCreditsRefilled = getDailyData(creditsRefilledResult.data, dateRange);

        const chartData = dateRange.map((date, index) => ({
            date,
            totalCredits: creditsResult.data || 0,
            totalSpend: dailySpend[index] || 0,
            totalSpendGroup: dailySpendGroup[index] || 0,
            totalBundlePurchase: dailyBundlePurchase[index] || 0,
            totalShopPurchase: dailyShopPurchase[index] || 0,
            totalCreditsRefilled: dailyCreditsRefilled[index] || 0
        }));

        // Set state for totals
        setTotalCredits(creditsResult.data);
        setTotalSpend(spendResult.data ? Object.values(spendResult.data).reduce((a, b) => a + b, 0) : 0);
        setTotalSpendGroup(spendGroupResult.data ? Object.values(spendGroupResult.data).reduce((a, b) => a + b, 0) : 0);
        setTotalBundlePurchase(bundlePurchaseResult.data ? Object.values(bundlePurchaseResult.data).reduce((a, b) => a + b, 0) : 0);
        setTotalShopPurchase(shopPurchaseResult.data ? Object.values(shopPurchaseResult.data).reduce((a, b) => a + b, 0) : 0);
        setTotalCreditsRefilled(creditsRefilledResult.data ? Object.values(creditsRefilledResult.data).reduce((a, b) => a + b, 0) : 0);

        return chartData;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (startDate && endDate) {
                console.log('Fetching data for date range:', startDate, endDate);
                const newChartData = await fetchDailyData(startDate, endDate);
                console.log('Fetched chart data:', newChartData);
                setChartData(newChartData);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    useEffect(() => {
        console.log('Chart data:', chartData);
    }, [chartData]);

    const handleDateRangeChange = (range: string) => {
        const today = new Date();
        let start, end;

        switch (range) {
            case 'today':
                start = new Date(today.setHours(0, 0, 0, 0) ).toISOString();
                end = new Date(today.setHours(23, 59, 59, 999)+1).toISOString();
                break;
            case 'week':
                start = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
                end = new Date().toISOString();
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
                end = new Date(today.setHours(23, 59, 59, 999) + 1).toISOString();
                break;
            case 'custom':
                setShowDateRangePicker(true);
                return;
            default:
                start = end = '';
        }

        setStartDate(start);
        setEndDate(end);
        setChartData([]); // Clear chart data when date range changes
    };

    const handleSelect = (ranges: any) => {
        const { selection } = ranges;
        setSelectedRange(selection);
        setStartDate(selection.startDate.toISOString());
        const endDate = new Date(selection.endDate);
        endDate.setHours(23, 59, 59, 999); // Ensure end includes the entire day
        setEndDate(endDate.toISOString());
        setShowDateRangePicker(false);
    };

    return (
        <div>
            <div className="date-range-selector flex space-x-4 justify-center mt-6">
                <button
                    className="bg-[#154c76] text-white py-2 px-4 rounded hover:bg-[#123a5e] transition duration-200"
                    onClick={() => handleDateRangeChange('today')}
                >
                    Today
                </button>
                <button
                    className="bg-[#154c76] text-white py-2 px-4 rounded hover:bg-[#123a5e] transition duration-200"
                    onClick={() => handleDateRangeChange('week')}
                >
                    This Week
                </button>
                <button
                    className="bg-[#154c76] text-white py-2 px-4 rounded hover:bg-[#123a5e] transition duration-200"
                    onClick={() => handleDateRangeChange('month')}
                >
                    This Month
                </button>
                <button
                    className="bg-[#154c76] text-white py-2 px-4 rounded hover:bg-[#123a5e] transition duration-200"
                    onClick={() => handleDateRangeChange('custom')}
                >
                    Custom
                </button>
            </div>

            {showDateRangePicker && (
                <div className="flex justify-center mt-4">
                    <DateRangePicker
                        ranges={[selectedRange]}
                        onChange={handleSelect}
                        className="bg-white p-4 rounded-lg shadow-md"
                    />
                </div>
            )}

            <dl className="mx-auto mt-12 grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
                {totalCredits !== null && (
                    <div
                        key="Total Active Credits"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Active Credits</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalCredits}
                        </dd>
                    </div>
                )}
                {totalSpend !== null && (
                    <div
                        key="Total Spend on Individual Activities"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Spend on Individual Activities</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalSpend}
                        </dd>
                    </div>
                )}
                {totalSpendGroup !== null && (
                    <div
                        key="Total Spend on Group Activities"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Spend on Group Activities</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalSpendGroup}
                        </dd>
                    </div>
                )}
                {totalBundlePurchase !== null && (
                    <div
                        key="Total Bundle Purchase Amount"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Bundle Purchase Amount</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalBundlePurchase}
                        </dd>
                    </div>
                )}
                {totalShopPurchase !== null && (
                    <div
                        key="Total Shop Purchase Amount"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Shop Purchase Amount</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalShopPurchase}
                        </dd>
                    </div>
                )}
                {totalCreditsRefilled !== null && (
                    <div
                        key="Total Credits Refilled"
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                    >
                        <dt className="text-sm font-medium leading-6 text-gray-300">Total Credits Refilled</dt>
                        <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                            ${totalCreditsRefilled}
                        </dd>
                    </div>
                )}
            </dl>
            <div className="mt-12">
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalCredits" stroke="#8884d8" />
                        <Line type="monotone" dataKey="totalSpend" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="totalSpendGroup" stroke="#ffc658" />
                        <Line type="monotone" dataKey="totalBundlePurchase" stroke="#ff7300" />
                        <Line type="monotone" dataKey="totalShopPurchase" stroke="#387908" />
                        <Line type="monotone" dataKey="totalCreditsRefilled" stroke="#ff0000" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
