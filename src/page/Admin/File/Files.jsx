import React, { useState, useEffect } from 'react';
import { MdSearch, MdNotifications, MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove } from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import Button from '../../../components/Button';
import ActionButtons from '../../../components/ActionButtons.jsx';
import ProfileBar from '../../../components/ProfileBar';
import { ToastContainer } from "react-toastify";

const initialFolders = {
    '/': [
        {
            id: 1,
            name: "Admin Project Plan.pdf",
            url: "/AdminProjectPlan.pdf",
            type: "application/pdf",
        },
        {
            id: 2,
            name: "Admin Vacation.jpg",
            url: "/AdminVacation.jpg",
            type: "image/jpeg",
        },
        {
            id: 3,
            name: "Admin Notes.txt",
            url: "/AdminNotes.txt",
            type: "text/plain",
        },
        {
            id: 4,
            name: "Admin Work Folder",
            type: "folder",
            fullPath: "/Admin Work Folder",
        },
        {
            id: 7,
            name: "Admin Test Folder",
            type: "folder",
            fullPath: "/Admin Test Folder",
        },
    ],
    '/Admin Work Folder': [
        {
            id: 5,
            name: "Admin Subfile.txt",
            url: "/AdminSubfile.txt",
            type: "text/plain",
        },
        {
            id: 6,
            name: "Admin Another Image.png",
            url: "/AdminAnotherImage.png",
            type: "image/png",
        },
    ],
    '/admin-trash': [],
};

const Files = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState(initialFolders['/']);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    });

    // Dummy handlers for sort
    const handleSort = (sortType, value) => {
        setSortBy((prev) => ({
            ...prev,
            [sortType]: value
        }));
    };

    // Dummy navigation
    const handleNavigate = (item) => {
        setNavigationHistory(prev => [...prev, { path: currentPath, id: currentFolderId }]);
        setCurrentPath(item.fullPath);
        setCurrentFolderId(item.id);
        setItems(initialFolders[item.fullPath] || []);
    };

    const handleBack = () => {
        if (navigationHistory.length === 0) {
            setCurrentPath('/');
            setCurrentFolderId(null);
            setItems(initialFolders['/']);
            return;
        }
        const lastNav = navigationHistory[navigationHistory.length - 1];
        setCurrentPath(lastNav.path);
        setCurrentFolderId(lastNav.id);
        setNavigationHistory(prev => prev.slice(0, -1));
        setItems(initialFolders[lastNav.path] || []);
    };

    // Dummy actions
    const handleCopy = (item) => {
        alert(`Copy: ${item.name}`);
    };
    const handleMove = (item) => {
        alert(`Move: ${item.name}`);
    };
    const handleDelete = (item) => {
        alert(`Delete: ${item.name}`);
    };
    const handleFileOpen = (item) => {
        alert(`Open file: ${item.name}`);
        // window.open(item.url, '_blank');
    };

    const [activeDropdown, setActiveDropdown] = useState(null);

    useEffect(() => {
        // getRootFiles();
        // const handleClickOutside = () => setActiveDropdown(null);
        // document.addEventListener('click', handleClickOutside)
        // return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="flex min-h-screen">
            <Navbar />
            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={(value) => console.log(value)} />
                <div className="p-6">
                    <ActionButtons />
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={handleBack}
                                    disabled={currentPath === '/' && navigationHistory.length === 0}
                                    variant="icon"
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    icon={<MdArrowBack size={20} />}
                                />
                                <span className="text-gray-600">Current Path: {currentPath}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600">Modified:</label>
                                    <select
                                        value={sortBy.modified}
                                        onChange={(e) => handleSort('modified', e.target.value)}
                                        className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600">Uploaded by:</label>
                                    <select
                                        value={sortBy.uploadedBy}
                                        onChange={(e) => handleSort('uploadedBy', e.target.value)}
                                        className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="me">Me</option>
                                        <option value="others">Others</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600">Type:</label>
                                    <select
                                        value={sortBy.type}
                                        onChange={(e) => handleSort('type', e.target.value)}
                                        className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
                                    >
                                        <option value="all">All</option>
                                        <option value="folders">Folders</option>
                                        <option value="files">Files</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Files and Folders Grid */}
                    <div className="grid grid-cols-4 gap-4 ">
                        {items.length > 0 ? items.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    if (item.type === 'folder') handleNavigate(item);
                                    else handleFileOpen(item);
                                }}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {item.type === 'folder' ? (
                                            <MdFolder size={24} className="text-yellow-500" />
                                        ) : (
                                            <MdInsertDriveFile size={24} className="text-blue-500" />
                                        )}
                                        <span
                                            className="text-gray-700 truncate max-w-[150px] block"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <Button
                                            variant="icon"
                                            className="p-2 hover:bg-gray-200 rounded-full"
                                            icon={<MdMoreVert size={20} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(activeDropdown === index ? null : index);
                                            }}
                                        />
                                        {activeDropdown === index && (
                                            <div
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (item.type === 'folder') {
                                                            handleNavigate(item);
                                                        } else {
                                                            handleFileOpen(item);
                                                        }
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                                >
                                                    <MdOpenInNew className="mr-2" size={18} />
                                                    Open
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(item);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <MdContentCopy className="mr-2" size={18} />
                                                    Copy
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMove(item);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <MdDriveFileMove className="mr-2" size={18} />
                                                    Move
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(item);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                                                >
                                                    <MdDelete className="mr-2" size={18} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : <p className="items-center">No Items Create A File or Folder</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Files;