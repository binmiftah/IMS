import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar.jsx';
import { MdSearch, MdNotifications, MdUpload, MdCreateNewFolder } from 'react-icons/md';



const Dashboard = () => {
    // Add state for storage
    const [storageInfo, setStorageInfo] = useState({
        used: 0,
        total: 100, // GB
        isLoading: true,
    });

    // Calculate percentage
    const percentageUsed = (storageInfo.used / storageInfo.total) * 100;

    // Fetch storage info
    useEffect(() => {
        // Simulate API call to get storage info
        const fetchStorageInfo = async () => {
            try {
                // Replace with actual API call
                const response = await fetch('');
                const data = await response.json();
                setStorageInfo({
                    used: data.used,
                    total: data.total,
                    isLoading: false,
                });
            } catch (error) {
                console.error('Error fetching storage info:', error);
                // Set default values if fetch fails
                setStorageInfo({
                    used: 0,
                    total: 100,
                    isLoading: false,
                });
            }
        };

        fetchStorageInfo();
    }, []);

    // Handle clear storage
    const handleClearStorage = async () => {
        if (window.confirm('Are you sure you want to clear storage?')) {
            try {
                // Replace with actual API call
                await fetch('/api/clear-storage', { method: 'POST' });
                setStorageInfo(prev => ({
                    ...prev,
                    used: 0,
                }));
            } catch (error) {
                console.error('Error clearing storage:', error);
            }
        }
    };

    // Sample data for the table (replace with actual data)
    const tableData = [
        {
            email: "admin11@gmail.com",
            action: "Read",
            path: "/documents/report.pdf",
            time: "2024-04-15 10:30 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Read",
            path: "/media/image.jpg",
            time: "2024-04-15 09:45 AM"
        },
        // Add more items as needed
    ];


    return (
        <div className="flex min-h-screen">
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-white">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
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

                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-500 hover:text-gray-700">
                            <MdNotifications size={24} />
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                3
                            </span>
                        </button>
                        <img
                            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-end items-right">
                            <span className="flex space-x-4">
                                <button
                                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    onClick={() => {/* Handle upload */ }}
                                >
                                    <MdUpload className="mr-2" size={20} />
                                    Upload
                                </button>
                                <button
                                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    onClick={() => {/* Handle folder creation */ }}
                                >
                                    <MdCreateNewFolder className="mr-2" size={20} />
                                    Create Folder
                                </button>
                            </span>
                        </div>
                    </div>

                    {/* Activity Table */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Path
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tableData.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-100 mb-2 hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.action}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.path}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;