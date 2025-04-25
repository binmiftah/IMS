import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdFolder, MdSettings, MdLogout } from 'react-icons/md';

const UserNavbar = () => {
    const location = useLocation();

    const navItems = [
        {
            name: 'Dashboard',
            icon: <MdDashboard size={24} />,
            path: '/user/dashboard'
        },
        {
            name: 'Files',
            icon: <MdFolder size={24} />,
            path: '/user/files'
        },
        {
            name: 'Settings',
            icon: <MdSettings size={24} />,
            path: '/user/settings'
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <nav className="w-1/5 bg-white border-r border-gray-200 min-h-screen p-6">
            <div className="flex flex-col h-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">IMS</h1>
                </div>

                <div className="flex-1">
                    <ul className="space-y-2">
                        {navItems.map((item, index) => (
                            <li key={index}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                        location.pathname === item.path
                                            ? 'bg-black text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <MdLogout size={24} />
                    <span className="ml-3">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default UserNavbar;