import React from 'react'
import { NavLink } from 'react-router-dom'
import { MdDashboard, MdPeople, MdGroupWork, MdStorage, MdDelete, MdSettings } from 'react-icons/md'

const Navbar = () => {
    return (
        <div className="w-1/5 bg-black text-white flex flex-col justify-between">
            {/* Top Section */}
            <div>
                {/* Logo */}
                <div className="p-4 text-center">
                    <h1 className="text-2xl font-bold">Logo</h1>
                </div>

                {/* Links */}
                <ul className="mt-8 space-y-4">
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdDashboard className="mr-3" size={24} />
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/users" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdPeople className="mr-3" size={24} />
                            <span>User</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/groups" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdGroupWork className="mr-3" size={24} />
                            <span>Group</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/storage" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdStorage className="mr-3" size={24} />
                            <span>Storage</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/trash" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdDelete className="mr-3" size={24} />
                            <span>Trash</span>
                        </NavLink>
                    </li>
                    <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <NavLink 
                            to="/settings" 
                            className={({ isActive }) => 
                                `flex items-center ${isActive ? 'text-white' : 'text-gray-txt'}`
                            }
                        >
                            <MdSettings className="mr-3" size={24} />
                            <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </div>

            {/* Bottom Section */}
            <div className="p-4">
                {/* Profile */}
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Profile"
                        className="w-10 bg- h-10 rounded-full object-cover"
                    />
                    <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-gray-400">Admin</p>
                    </div>
                </div>

                {/* Logout Button */}
                <button className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Log Out
                </button>
            </div>
        </div>
    )
}

export default Navbar