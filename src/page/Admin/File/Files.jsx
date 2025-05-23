import React, { useState, useEffect, useRef } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove, MdCloseFullscreen } from 'react-icons/md';
import Navbar from '../../../component/Navbar';
import Button from '../../../component/Button';
import ActionButtons from '../../../component/ActionButtons.jsx';
import ProfileBar from '../../../component/ProfileBar';
import apiCall from '../../../pkg/api/internal.js';
import { ToastContainer, toast } from "react-toastify";
// import { handleFileClick } from '../../../utils/fileOpenHandlers';
import { handleError } from "../../../pkg/error/error.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import FileItem from "../../../component/FileItem.jsx"



const Files = () => {
    const { user } = useAuth()
    const [currentPath, setCurrentPath] = useState('/');
    const [folders, setFolders] = useState(null);
    const [items, setItems] = useState([]);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [moveModal, setMoveModal] = useState({ open: false, file: null });
    const [selectedMovePath, setSelectedMovePath] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [clickedItem, setClickedItem] = useState(null)
    const [isOpenFile, setIsOpenFile] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    const dropdownRef = useRef(null);


    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    })


    // get folder id
    const getFolderId = () => {
        if (!currentFolderId) {
            console.log("Current Folder ID: Root");
            return null; // Use null to represent the root folder
        }
        console.log("Current Folder ID:", currentFolderId);
        return currentFolderId;
    }

    const getRootFiles = async () => {
        try {
            const result = await Promise.all([
                apiCall.getFolder("files/folders"),
                apiCall.getFile("/files"),
            ]);
            console.log("Fetched Files:", result[0]);
            console.log("Fetched Files:", result[1]);

            const folders = Array.isArray(result[0]) ? result[0] : [];
            const files = Array.isArray(result[1]) ? result[1] : [];

            let allResult = [...folders, ...files];
            setItems(allResult);
        } catch (error) {
            handleError(error);
        }
    };

    const handleSort = (sortType, value) => {
        setSortBy((prev) => ({
            ...prev,
            [sortType]: value
        }));
    };


    const handleNavigate = async (item) => {
        try {
            console.log("Navigating to folder with ID:", item.id); // Debugging log
            setNavigationHistory((prev) => [...prev, { path: currentPath, id: currentFolderId }]);
            setCurrentPath(item.fullPath);
            setCurrentFolderId(item.id); // Updates currentFolderId with the selected folder's ID

            const result = await apiCall.getFolderById(`files/folders/${item.id}`);
            console.log("Fetched Folder Contents:", result); // Debugging log

            if (result.children || result.files) {
                const allResult = [...(result.children || []), ...(result.files || [])];
                setItems(allResult);
            } else {
                console.error("No children or files found in the response.");
                setItems([]);
            }
        } catch (error) {
            console.error("Error navigating to folder:", error);
            handleError(error);
        }
    };

    const handleRefresh = async () => {
        try {
            if (currentFolderId) {
                // Fetch files and folders for the current folder
                const result = await apiCall.getFolderById(`files/folders/${currentFolderId}`);
                const allResult = [...(result.children || []), ...(result.files || [])];
                setItems(allResult);
            } else {
                // Fetch root files and folders
                await getRootFiles();
            }
        } catch (error) {
            console.error("Error refreshing files:", error);
            handleError(error);
        }
    };

    const handleBack = async () => {
        try {
            if (navigationHistory.length === 0) {
                // If we're at root, get root files
                setCurrentPath('/');
                setCurrentFolderId(null);
                getRootFiles();
                return; folder
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
            handleError(error);
        }
    };

    const handleCopy = (item) => {
        setClipboard({ ...item, from: currentPath })
    };


    const handlePaste = () => {
        if (!clipboard) return;
        setFolders(prev => {
            const updated = { ...prev };
            const newItem = { ...clipboard, id: Date.now() };
            updated[currentPath] = [...(updated[currentPath] || []), newItem];
            return updated;
        });
        setClipboard(null);
    }


    const handleMove = (item) => {
        setMoveModal({ open: true, file: item });
    };

    const handleDelete = async (item) => {
        if (item.type === 'folder') {
            await apiCall.deleteFolder(`files/folders/${item.id}`);
        }

        // refresh folder
        await getRootFiles();

    };

    const handleFileOpen = async (item) => {
        setClickedItem(item);
        setIsOpenFile((s) => !s);
    };

    const handleCreateFolder = async (folderName) => {
        try {
            const data = { folderName };
            const result = await apiCall.createFolder("files/create/folder", data);
            console.log("Folder created:", result);

            // Refresh the folder list
            await handleRefresh();

            // Show success message
            toast.success("Folder created successfully!");
        } catch (error) {
            console.error("Error creating folder:", error);
            handleError(error);
        }
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        if (activeDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        const preventRightClick = (e) => {
            e.preventDefault();
        };

        document.addEventListener('contextmenu', preventRightClick);



        // Cleanup when component unmounts
        return () => {

            document.removeEventListener('contextmenu', preventRightClick);
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [activeDropdown])



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
                    <ActionButtons onActionComplete={handleRefresh} getFolderId={getFolderId} />
                    {clipboard && (
                        <button
                            onClick={handlePaste}
                            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Paste "{clipboard.name}"
                        </button>
                    )}


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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
                        {items.length > 0 ? items.map((item, index) => {
                            // Determine if this card should be disabled in paste mode
                            const isPasteMode = !!clipboard;
                            const isFolder = item.type === 'folder';
                            const isDisabled = isPasteMode && !isFolder;

                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        if (isDisabled) return; // Prevent click if disabled
                                        if (isFolder) handleNavigate(item);
                                        else handleFileOpen(item);
                                    }}
                                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer
                    ${isDisabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {isFolder ? (
                                                <MdFolder size={24} className="text-yellow-500" />
                                            ) : (
                                                <MdInsertDriveFile size={24} className="text-blue-500" />
                                            )}
                                            <span
                                                className="text-gray-700 truncate max-w-[150px] block"
                                                title={item.name}
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
                                                    if (isDisabled) return;
                                                    setActiveDropdown(activeDropdown === index ? null : index);
                                                }}
                                                disabled={isDisabled}
                                            />
                                            {activeDropdown === index && (
                                                <div
                                                    ref={dropdownRef}
                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-y-auto"
                                                    style={{
                                                        maxHeight: '200px',
                                                        maxWidth: 'calc(100vw - 20px)', // Prevent overflow
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isFolder) {
                                                                handleNavigate(item);
                                                            } else {
                                                                handleFileOpen(item);
                                                            }
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                                        disabled={isDisabled}
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
                                                        disabled={isDisabled}
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
                                                        disabled={isDisabled}
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
                                                        disabled={isDisabled}
                                                    >
                                                        <MdDelete className="mr-2" size={18} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <p className="items-center">No Items, Create A File or Folder</p>}
                    </div>
                </div>
            </div>
            {moveModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
                        <h2 className="text-lg font-semibold mb-4">Move "{moveModal.file.name}" to:</h2>
                        <select
                            className="w-full px-3 py-2 border rounded mb-4"
                            value={selectedMovePath || ''}
                            onChange={e => setSelectedMovePath(e.target.value)}
                        >
                            <option value="" disabled>Select a folder</option>
                            {[
                                '/',
                                ...Array.from(
                                    new Set(
                                        Object.values(folders)
                                            .flat()
                                            .filter(f => f.type === 'folder' && f.fullPath)
                                            .map(f => f.fullPath)
                                    )
                                )
                                    .filter(path => path !== currentPath)
                                    .map(path => (
                                        <option key={path} value={path}>
                                            {path === '/' ? 'Root' : path.replace(/^\//, '')}
                                        </option>
                                    ))
                            ]}
                        </select>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => {
                                    setMoveModal({ open: false, file: null });
                                    setSelectedMovePath(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white ${selectedMovePath ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}
                                disabled={!selectedMovePath}
                                onClick={() => {
                                    if (!selectedMovePath) return;
                                    setFolders(prev => {
                                        const updated = { ...prev };
                                        updated[currentPath] = (updated[currentPath] || []).filter(f => f.id !== moveModal.file.id);
                                        updated[selectedMovePath] = [...(updated[selectedMovePath] || []), { ...moveModal.file }];
                                        return updated;
                                    });
                                    setMoveModal({ open: false, file: null });
                                    setSelectedMovePath(null);
                                }}
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/*Open file*/}
            {isOpenFile && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40`}>
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
    );
};

export default Files;