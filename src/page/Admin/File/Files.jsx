import React, { useState, useEffect } from 'react';
import { MdSearch, MdNotifications, MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove } from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import Button from '../../../components/Button';
import apiCall from '../../../pkg/api/internal.js';
import { ToastContainer } from "react-toastify";
import {handleAxiosError} from "../../../pkg/error/error.js";

const Files = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([]);

    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    })


    const getRootFiles = async () =>{
        try{

            const result = await Promise.all([apiCall.getFolder("files/folders"), apiCall.getFile("/files")])
            let allResult = [...result[0], ...result[1]];
            setItems(allResult);
        }catch(error){
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
        setCurrentPath(item.fullPath);

        // Here you would fetch the contents of the new path
        const result = await apiCall.getFolderById(`files/folders/${item.id}`)
        const allResult = [...result.children, ...result.files];
        setItems(allResult);
    };

    const handleBack = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
        // Fetch contents of parent directory
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
                <ToastContainer/>
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

                <div className="p-6">

                    {/*FILTERS AND CURRENT PATH*/}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={handleBack}
                                    disabled={currentPath === '/'}
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
                            )):<p className="items-center">No Items Create A File or Folder</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Files;