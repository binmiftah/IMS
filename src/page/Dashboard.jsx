import React from 'react';
import Navbar from '../components/Navbar';
import { MdSearch, MdNotifications } from 'react-icons/md';

const Dashboard = () => {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-white">
                {/* Top Section with Search and Profile */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    {/* Search Bar */}
                    <div className="flex items-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-96 px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <MdSearch size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Profile and Notifications */}
                    <div className="flex items-center space-x-4">
                        {/* Notification Bell */}
                        <button className="relative p-2 text-gray-500 hover:text-gray-700">
                            <MdNotifications size={24} />
                            {/* Notification Badge */}
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* Profile Picture */}
                        <img
                            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 grid grid-cols-3 gap-6">
                    {/* Card */}
                    <div className="relative bg-white rounded-lg overflow-hidden">
                        {/* Card Content */}
                        <div
                            className="p-6 bg-gray-100"
                            style={{
                                clipPath: 'polygon(65% 0, 100% 0%, 100% 100%, 0% 100%, 0 15%, 48% 15%)',
                                borderRadius: '0.5rem' // 8px to match rounded-lg
                            }}
                        >
                            <h2 className="text-xl font-semibold mb-4">Card Title</h2>
                            <p className="text-gray-600">
                                This is some sample content for the card.
                                You can add any content here.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;