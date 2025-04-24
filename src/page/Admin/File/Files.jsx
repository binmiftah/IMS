import React, { useState, useEffect } from 'react';
import { MdSearch, MdNotifications, MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove } from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import Button from '../../../components/Button';
import ActionButtons from '../../../components/ActionButtons.jsx';
import ProfileBar from '../../../components/ProfileBar';
import apiCall from '../../../pkg/api/internal.js';
import { ToastContainer } from "react-toastify";
import { handleAxiosError } from "../../../pkg/error/error.js";

const Files = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([]);

    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    })


    const getRootFiles = async () => {
        try {

            const result = await Promise.all([apiCall.getFolder("files/folders"), apiCall.getFile("/files")])
            let allResult = [...result[0], ...result[1]];
            setItems(allResult);
        } catch (error) {
            console.log(error);
            handleAxiosError(error)
        }
    }

    const [activeDropdown, setActiveDropdown] = useState(null);

    const handleSort = (sortType) => {
        setSortBy((prev) => ({
            ...prev,
            [sortType]: value
        }))
    }



    const handleNavigate = async (item) => {
        try {
            setNavigationHistory(prev => [...prev, { path: currentPath, id: currentFolderId }]);
            setCurrentPath(item.fullPath);
            setCurrentFolderId(item.id);

            const result = await apiCall.getFolderById(`files/folders/${item.id}`);
            const allResult = [...result.children, ...result.files];
            setItems(allResult);
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleBack = async () => {
        try {
            if (navigationHistory.length === 0) {
                // If we're at root, get root files
                setCurrentPath('/');
                setCurrentFolderId(null);
                getRootFiles();
                return;
            }

            const lastNav = navigationHistory[navigationHistory.length - 1];

            setCurrentPath(lastNav.path);
            setCurrentFolderId(lastNav.id);

            setNavigationHistory(prev => prev.slice(0, -1));

            if (lastNav.id) {
                const result = await apiCall.getFolderById(`files/folders/${lastNav.id}`);
                const allResult = [...result.children, ...result.files];
                setItems(allResult);
            } else {
                // If we're going back to root
                getRootFiles();
            }
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleActionClick = (e, action, item) => {
        e.stopPropagation(); // Prevent folder navigation when clicking actions
        switch (action) {
            case 'open':
                if (item.type === 'folder') {
                    handleNavigate(item.path);
                } else {
                    // Handle file opening logic
                }
                break;
            case 'delete':
                // Handle delete logic
                console.log('Delete:', item);
                break;
            case 'copy':
                // Handle copy logic
                console.log('Copy:', item);
                break;
            case 'move':
                // Handle move logic
                console.log('Move:', item);
                break;
        }
        setActiveDropdown(null);
    };

    useEffect(() => {
        getRootFiles();
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside);

    }, []);


    return (
        <div className="flex min-h-screen">
            <Navbar />

            {/* Main Content */}
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
                                {/*<span className="text-gray-600">Current Path: {currentPath == null ? "/" : currentPath}</span>*/}
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
                                onClick={() => item.type === 'folder' && handleNavigate(item)}
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
                                            title={item.name || item.fileName}
                                        >
                                            {item.name || item.fileName}
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
                                                    onClick={(e) => handleActionClick(e, 'open', item)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                                >
                                                    <MdOpenInNew className="mr-2" size={18} />
                                                    Open
                                                </button>
                                                <button
                                                    onClick={(e) => handleActionClick(e, 'copy', item)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <MdContentCopy className="mr-2" size={18} />
                                                    Copy
                                                </button>
                                                <button
                                                    onClick={(e) => handleActionClick(e, 'move', item)}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <MdDriveFileMove className="mr-2" size={18} />
                                                    Move
                                                </button>
                                                <button
                                                    onClick={(e) => handleActionClick(e, 'delete', item)}
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