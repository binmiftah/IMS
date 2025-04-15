import React, { use, useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar.jsx';
import { MdSearch, MdNotifications, MdStorage, MdDeleteSweep } from 'react-icons/md';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, plugins } from 'chart.js';


ChartJS.register(ArcElement, Tooltip, Legend);


const Dashboard = () => {
    // Add state for storage
    const [storageInfo, setStorageInfo] = useState({
        used: 0,
        total: 100, // GB
        isLoading: true,
    });

    const [storageDistribution, setStorageDistribution] = useState({
        documents: 30,
        media: 40,
        others: 20,
        available: 10,
    });

    // Chart data
    const chartData = {
        labels: ['Documents', 'Media', 'Others', 'Available'],
        datasets: [
            {
                data: [
                    storageDistribution.documents,
                    storageDistribution.media,
                    storageDistribution.others,
                    storageDistribution.available,
                ],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                // hoverOffset: 4,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 14,
                    },
                },
            },
        },
        cutout: '70%',
        maintainAspectRatio: false,
    };

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

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
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

                    {/* Profile and Notifications */}
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
                    <div className="">
                        <div className="grid grid-cols-2 border border-gray-200 bg-white p-6 rounded-lg shadow-lg mb-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-6 flex items-center">
                                    <MdStorage className="mr-2" />
                                    Storage
                                </h2>

                                {/* Storage Usage */}
                                <div className="mb-6">
                                    <div className="flex flex-col justify-between mb-2">
                                        <h2 className="font-bold text-8xl">
                                            {storageInfo.isLoading ? (
                                                "Loading..."
                                            ) : (
                                                `${storageInfo.used.toFixed(2)}`
                                            )}
                                        </h2>
                                        <p> {`of ${storageInfo.total}GB used`} </p>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex space-x-4">
                                    <button
                                        className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                        disabled={storageInfo.isLoading}
                                    >
                                        Get More Storage
                                    </button>
                                    <button
                                        className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        onClick={handleClearStorage}
                                        disabled={storageInfo.isLoading || storageInfo.used === 0}
                                    >
                                        <MdDeleteSweep className="mr-2" />
                                        Clear Storage
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4">Storage Distribution</h3>
                                <div className="relative h-64 w-full">
                                    <Doughnut data={chartData} options={chartOptions} />
                                </div>
                            </div>


                        </div>

                        {/* Activity Section placeholder */}
                        <div className="bg-white">
                            {/* Activity content will go here */}
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;