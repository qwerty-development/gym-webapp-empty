'use client'
import { useEffect, useState } from 'react'
import { getActiveTotalCredits, getTotalSpendActivities, getTotalSpendActivitiesGroup, getTotalBundlePurchaseAmount } from '../../../../utils/admin-requests'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

// Define the types for the fetched data and error
interface FetchResult {
    data: number | null;
    error: string | null;
}

export default function AccountingDashboard() {
    const [totalCredits, setTotalCredits] = useState<number | null>(null)
    const [totalSpend, setTotalSpend] = useState<number | null>(null)
    const [totalSpendGroup, setTotalSpendGroup] = useState<number | null>(null)
    const [totalBundlePurchase, setTotalBundlePurchase] = useState<number | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const results: [FetchResult, FetchResult, FetchResult, FetchResult] = await Promise.all([
                getActiveTotalCredits(),
                getTotalSpendActivities(),
                getTotalSpendActivitiesGroup(),
                getTotalBundlePurchaseAmount()
            ])

            const [creditsResult, spendResult, spendGroupResult, bundlePurchaseResult] = results;

            if (!creditsResult.error) {
                setTotalCredits(creditsResult.data)
            } else {
                console.error('Error fetching active total credits:', creditsResult.error)
            }

            if (!spendResult.error) {
                setTotalSpend(spendResult.data)
            } else {
                console.error('Error fetching total spend on activities:', spendResult.error)
            }

            if (!spendGroupResult.error) {
                setTotalSpendGroup(spendGroupResult.data)
            } else {
                console.error('Error fetching total spend on group activities:', spendGroupResult.error)
            }

            if (!bundlePurchaseResult.error) {
                setTotalBundlePurchase(bundlePurchaseResult.data)
            } else {
                console.error('Error fetching total bundle purchase amount:', bundlePurchaseResult.error)
            }
        }

        fetchData()
    }, [])

    return (
        <dl className="mx-auto grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 lg:grid-cols-4">
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
                    key="Total Spend on Activities"
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
                    key="Total  Spend on Bundle Purchase"
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-gray-800 px-4 py-10 sm:px-6 xl:px-8"
                >
                    <dt className="text-sm font-medium leading-6 text-gray-300">Total Bundle Purchase Amount</dt>
                    <dd className="w-full flex-none text-3xl font-bold leading-10 tracking-tight text-gray-200">
                        ${totalBundlePurchase}
                    </dd>
                </div>
            )}
        </dl>
    )
}