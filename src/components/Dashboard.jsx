import React from 'react';
import Navbar from './Navbar';

const Dashboard = () => {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-gray-100 p-8">
                <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
                <p className="mt-4">This is the main content area.</p>
            </div>
        </div>
    );
};

export default Dashboard;