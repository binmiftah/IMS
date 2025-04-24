import React from 'react'
import { MdSearch, MdNotifications } from 'react-icons/md'
import Button from './Button'

const ProfileBar = ({ onSearch }) => {
    return (
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        onChange={(e) => onSearch && onSearch(e.target.value)}  
                        className="w-96 px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <Button
                        variant="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        icon={<MdSearch size={20} />}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Button
                    variant="icon"
                    className="relative p-2"
                >
                    <MdNotifications size={24} />
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        3
                    </span>
                </Button>
                <img
                    src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                />
            </div>
        </div>
    )
}

export default ProfileBar