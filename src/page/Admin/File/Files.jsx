import React, { useState } from 'react';
import { MdSearch, MdNotifications, MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert } from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import Button from '../../../components/Button';

const Files = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([
        { type: 'folder', name: 'Documents', path: '/Documents' },
        { type: 'folder', name: 'Images', path: '/Images' },
        { type: 'file', name: 'report.pdf', path: '/report.pdf' },
        { type: 'file', name: 'data.xlsx', path: '/data.xlsx' },
    ]);

    const handleNavigate = (path) => {
        setCurrentPath(path);
        // Here you would fetch the contents of the new path
    };

    const handleBack = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
        // Fetch contents of parent directory
    };

    return (
        <div className="flex min-h-screen">
            <Navbar />
            
            {/* Main Content */}
            <div className="w-4/5 bg-white">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search files..."
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

                {/* Path Navigation */}
                <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                        <Button
                            onClick={handleBack}
                            disabled={currentPath === '/'}
                            variant="icon"
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            icon={<MdArrowBack size={20} />}
                        />
                        <span className="text-gray-600">Current Path: {currentPath}</span>
                    </div>

                    {/* Files and Folders Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => item.type === 'folder' && handleNavigate(item.path)}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {item.type === 'folder' ? (
                                            <MdFolder size={24} className="text-yellow-500" />
                                        ) : (
                                            <MdInsertDriveFile size={24} className="text-blue-500" />
                                        )}
                                        <span className="text-gray-700">{item.name}</span>
                                    </div>
                                    <Button
                                        variant="icon"
                                        className="p-2 hover:bg-gray-200 rounded-full"
                                        icon={<MdMoreVert size={20} />}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Files;