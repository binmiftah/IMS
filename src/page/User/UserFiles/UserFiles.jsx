import React, { useState, useEffect } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdCloseFullscreen, MdOpenInNew } from 'react-icons/md';
import UserNavbar from '../../../component/UserNavbar';
import ProfileBar from '../../../component/ProfileBar';
import ActionButtons from '../../../component/ActionButtons';
import Button from '../../../component/Button';
import { ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import { handleError } from "../../../pkg/error/error.js";
// import handleFileClick  from '../../../utils/fileOpenHandlers';
import FileItem from '../../../component/FileItem';

const UserFiles = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([]);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [sortBy, setSortBy] = useState({
        modified: "newest",
        type: "all",
    });
    const [clickedItem, setClickedItem] = useState(null);
    const [isOpenFile, setIsOpenFile] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        getRootFiles();
    }, []);


    const getFolderId = () => {
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
            console.log("Root Files:", result);

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

    const handleRefresh = async () => {
        if (currentFolderId) {
            const result = await apiCall.getFolderById(`files/folders/${currentFolderId}`);
            const allResult = [...result.children, ...result.files];
            setItems(allResult);
        } else {
            await getRootFiles();
        }
    };


    const handleSort = (type, value) => {
        setSortBy(prev => ({ ...prev, [type]: value }));
        // Implement sorting logic here
    };

    const handleFileOpen = (item) => {
        setClickedItem(item);
        setIsOpenFile(true);
    };

    return (
        <div className="flex min-h-screen">
            <UserNavbar />

            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={(value) => console.log(value)} />

                <div className="p-6">
                    <ActionButtons onActionComplete={handleRefresh} getFolderId={getFolderId} />

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

                        <div className="grid grid-cols-4 gap-4">
                            {items.length > 0 ? items.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => item.type === 'folder' ? handleNavigate(item) : handleFileOpen(item)}
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
                                    </div>
                                </div>
                            )) : (
                                <p className="col-span-4 text-center text-gray-500">
                                    No files or folders found in this location.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {isOpenFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className={`bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative transition-all duration-300
                            ${isMaximized ? 'max-w-full max-h-full w-full h-full rounded-none' : 'max-w-3xl'}
                        `}>
                            <button
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                                onClick={() => setIsOpenFile(false)}
                            >
                                ✕
                            </button>
                            <button
                                className="absolute top-3 right-12 text-gray-500 hover:text-gray-700"
                                onClick={() => setIsMaximized(m => !m)}
                                title={isMaximized ? "Minimize" : "Maximize"}
                            >
                                {isMaximized ? <MdCloseFullscreen size={22} /> : <MdOpenInNew size={22} />}
                            </button>
                            <div className={`${isMaximized ? 'h-[90vh] overflow-auto' : ''}`}>
                                <FileItem file={clickedItem} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserFiles;