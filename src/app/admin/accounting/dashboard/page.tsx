import AccountingDashboard from '@/app/components/admin/accountingdashboard';
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import React from 'react'

const Dashboard = () => {
    return (
        <div className='bg-gray-900'>
            <AdminNavbarComponent />
            <div className=' min-h-screen mx-8'>
                <h1 className='text-3xl mt-8 font-bold mb-8 text-center text-green-400'>
                    Accounting Dashboard
                </h1>
                <AccountingDashboard/>

            </div>
        </div>
    )
}

export default Dashboard;