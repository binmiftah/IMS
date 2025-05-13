import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert } from 'react-icons/md';
import UserNavbar from '../../../component/UserNavbar';
import ProfileBar from '../../../component/ProfileBar';
import ActionButtons from '../../../component/ActionButtons';
import Button from '../../../component/Button';
import { ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import {handleError} from "../../../pkg/error/error.js";
import { useAuth } from '../../../context/AuthContext';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([]);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const displayLimit = 8;


    useEffect(() => {
        getRootFiles();
    }, []);


    const getFolderId = () =>{
        return currentFolderId;
    }

    const getRootFiles = async () => {
        try {
            const result = await apiCall.getRootLevelFiles("files/folders/root")

            // Sort by date, newest first
            result.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.updatedAt);
                const dateB = new Date(b.createdAt || b.updatedAt);
                return dateB - dateA;
            });

            setItems(result);
        } catch (error) {
            handleError(error);
        }
    };

    const handleNavigate = async (item) => {
        try {
            setNavigationHistory(prev => [...prev, {
                path: currentPath,
                id: currentFolderId
            }]);

            setCurrentPath(item.fullPath);
            setCurrentFolderId(item.id);

            const result = await apiCall.getFolderById(`files/folders/${item.id}`);
            const allResult = [...result.children, ...result.files];
            setItems(allResult);
        } catch (error) {
            handleError(error);
        }
    };

    const handleBack = async () => {
        try {
            if (navigationHistory.length === 0) {
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
                getRootFiles();
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleSearch = (searchTerm) => {
        // Implement search functionality
    };

    const handleShowAll = () => {
        navigate('/user/files');
    }

    return (
        <div className="flex min-h-screen">
            <UserNavbar />

            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={handleSearch} />

                {/* Welcome message */}
                {user && (
                    <div className="m-6 text-3xl font-semibold text-gray-700">
                        Welcome, {user.fullName || user.email}!
                    </div>
                )}

                <div className="p-6">
                    <ActionButtons onActionComplete={getRootFiles} getFolderId={getFolderId} />

                    <div className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Button
                                onClick={handleBack}
                                disabled={currentPath === '/' && navigationHistory.length === 0}
                                variant="icon"
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                icon={<MdArrowBack size={20} />}
                            />
                            <span className="text-gray-600">Current Path: {currentPath}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {items.length > 0 ? (
                                <>
                                    {items.slice(0, displayLimit).map((item, index) => (
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
                                                            className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (item.type === 'folder') handleNavigate(item);
                                                                    // Add file open logic here if needed
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                                            >
                                                                Open
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Add copy logic here
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                Copy
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Add move logic here
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                Move
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Add delete logic here
                                                                    setActiveDropdown(null);
                                                                }}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p className="col-span-4 text-center text-gray-500">
                                    No files or folders. Create or upload something!
                                </p>
                            )}
                        </div>
                        {items.length > displayLimit && (
                            <div className="mt-6 text-center">
                                <Button
                                    onClick={handleShowAll}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    View All Files
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;