import React, { useState, useEffect, useRef } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove, MdCloseFullscreen, MdRefresh } from 'react-icons/md';
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const dropdownRef = useRef(null);


    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    })

    const getFolderId = () => {
        if (!currentFolderId) {
            console.log("Current Folder ID: Root");
            return null;
        }
        return currentFolderId;
    }

    const getRootFiles = async () => {
        try {
            console.log("Fetching root files and folders");

            const [folders, files] = await Promise.all([
                apiCall.getFolder("files/folders"),
                apiCall.getFile("files?parentId=null")
            ]);

            const folderItems = Array.isArray(folders) ? folders : [];
            const fileItems = Array.isArray(files) ? files : [];

            // Ensure we only include root files (files with no parent)
            const rootFiles = fileItems.filter(file =>
                !file.parentId ||
                file.parentId === null ||
                file.parentId === "null" ||
                file.isRootFile === true
            );

            const allItems = [...folderItems, ...rootFiles];
            setItems(allItems);
            setCurrentFolderId(null);
            setCurrentPath('/');

        } catch (error) {
            toast.error("Failed to load files");
        }
    };


    const handleNavigate = async (item) => {
        try {
            console.log("=== NAVIGATING TO FOLDER ===");
            console.log("Folder item:", item);
            console.log("Previous folder ID:", currentFolderId);
            console.log("New folder ID:", item.id);

            // Save current state for back navigation with more details
            const historyEntry = {
                path: currentPath,
                id: currentFolderId,
                name: currentPath === '/' ? 'Root' : currentPath.split('/').pop(),
                timestamp: Date.now()
            };
            console.log("Adding to history:", historyEntry);

            // Update current folder info
            setNavigationHistory(prev => [...prev, historyEntry]);
            setCurrentPath(item.fullPath || `/folder-${item.id}`);
            setCurrentFolderId(item.id); // This should set the folder ID

            console.log("=== FOLDER ID UPDATED ===");
            console.log("New currentFolderId should be:", item.id);

            // Force refresh folder contents
            await refreshFolderContents(item.id);
        } catch (error) {
            console.error("Error navigating to folder:", error);
            handleError(error);
        }
    };

    // Replace the refreshFolderContents function:
    const refreshFolderContents = async (folderId) => {
        try {
            console.log("Refreshing folder contents for ID:", folderId);

            // Get folder data
            const folderData = await apiCall.getFolderById(`files/folders/${folderId}`);
            console.log("Folder data:", folderData);

            // Get files from the folder data itself
            const folderFiles = folderData.files || [];
            console.log("Files from folderData.files:", folderFiles);

            // Get folder children (subfolders)
            const children = folderData.children || [];
            console.log("Children folders:", children);

            // Combine all items - files and subfolders
            const allItems = [...children, ...folderFiles];
            console.log("Combined items:", {
                children: children.length,
                folderFiles: folderFiles.length,
                total: allItems.length,
                items: allItems
            });

            // Force update items state
            setItems([...allItems]); // Use spread to force re-render

            console.log("Items state updated with:", allItems.length, "items");

        } catch (error) {
            console.error("Error refreshing folder:", error);
            toast.error("Failed to load folder contents");
        }
    };

    const handleRefresh = async () => {
        try {
            console.log("Refreshing - current folder ID:", currentFolderId);
            console.log("Refreshing - current path:", currentPath);

            if (currentFolderId) {
                // We're in a specific folder - refresh its contents
                console.log("Refreshing folder contents for:", currentFolderId);
                await refreshFolderContents(currentFolderId);
            } else {
                // We're at the root level
                console.log("Refreshing root files");
                await getRootFiles();
            }
        } catch (error) {
            console.error("Error refreshing:", error);
            handleError(error);
        }
    };

    const handleBack = async () => {
        try {
            console.log("Navigating back in history:", navigationHistory);

            if (navigationHistory.length === 0) {
                setCurrentPath('/');
                setCurrentFolderId(null);
                await getRootFiles();
                return;
            }

            const newHistory = [...navigationHistory];
            const lastNav = newHistory.pop();

            setCurrentPath(lastNav.path);
            setCurrentFolderId(lastNav.id);
            setNavigationHistory(prev => prev.slice(0, -1));

            if (lastNav.id) {
                console.log("Refreshing folder contents for:", lastNav.id);
                try {
                    // Use a direct API call here to ensure fresh data
                    const folderData = await apiCall.getFolderById(`files/folders/${lastNav.id}`);
                    const filesData = await apiCall.getFile(`files?parentId=${lastNav.id}`);

                    // Ensure we have arrays to work with
                    const children = Array.isArray(folderData.children) ? folderData.children : [];
                    const files = Array.isArray(filesData) ? filesData : [];

                    // Filter files to ensure they belong to this folder
                    const folderFiles = files.filter(file =>
                        file.parentId === lastNav.id ||
                        file.folderId === lastNav.id
                    );

                    console.log("Back navigation - combining items:", {
                        folderChildren: children.length,
                        folderFiles: folderFiles.length
                    });

                    setItems([...children, ...folderFiles]);

                } catch (folderError) {
                    console.error("Error fetching back folder:", folderError);
                    toast.error("Failed to navigate back to folder");
                    await getRootFiles();
                }
            } else {
                console.log("Going back to root folder");
                await getRootFiles();
            }
        } catch (error) {
            console.error("Error in handleBack:", error);
            handleError(error);

            setCurrentPath('/');
            setCurrentFolderId(null);
            setNavigationHistory([]);
            await getRootFiles();
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
        try {
            if (item.type === 'folder') {
                // Delete folder using the new API endpoint
                await apiCall.deleteFolder(`files/folders/${item.id}?resourceType=Folder`);
            } else {
                // Delete file using the new API endpoint  
                await apiCall.deleteFile(`files/file/${item.id}?resourceType=File`);
            }

            // Refresh current folder instead of always going to root
            await handleRefresh();

            const itemType = item.type === 'folder' ? 'Folder' : 'File';
            const itemName = item.name || item.fileName;
            toast.success(`${itemType} "${itemName}" deleted successfully and moved to trash`);

        } catch (error) {
            console.error("Error deleting item:", error);
            const itemType = item.type === 'folder' ? 'folder' : 'file';
            const itemName = item.name || item.fileName;

            if (error.response?.data?.message) {
                toast.error(`Failed to delete ${itemType}: ${error.response.data.message}`);
            } else {
                toast.error(`Failed to delete ${itemType} "${itemName}"`);
            }
        }
    };

    const handleFileOpen = async (item) => {
        try {
            // Check if the file has a web view link or download link
            if (item.webViewLink) {
                // Open Google Drive or other service view link
                window.open(item.webViewLink, '_blank');
            } else if (item.webContentLink) {
                // Open direct download/view link
                window.open(item.webContentLink, '_blank');
            } else if (item.downloadUrl) {
                // Open download URL
                window.open(item.downloadUrl, '_blank');
            } else {
                // Fallback: try to construct a download link using the API
                const downloadUrl = `${apiCall.baseURL}/files/download/${item.id}`;
                window.open(downloadUrl, '_blank');
            }
        } catch (error) {
            console.error('Error opening file:', error);
            toast.error('Failed to open file');
        }
    };

    // Update handleCreateFolder to ensure it works with current folder context:
    const handleCreateFolder = async (folderName) => {
        try {
            console.log("=== CREATING FOLDER ===");
            console.log("Folder name:", folderName);
            console.log("Current folder ID:", currentFolderId);
            console.log("Current path:", currentPath);

            const data = {
                folderName,
                parentId: currentFolderId // Add parent folder context
            };

            const result = await apiCall.createFolder("files/create/folder", data);
            console.log("Folder created:", result);

            // Refresh the current folder to show the new folder
            await handleRefresh();

            // Show success message
            toast.success("Folder created successfully!");
        } catch (error) {
            console.error("Error creating folder:", error);
            handleError(error);
        }
    };


    // Add this function to handle clicking on current folder path
    const handleCurrentPathClick = async () => {
        try {
            // Force refresh current folder contents
            if (currentFolderId) {
                console.log("Refreshing current folder:", currentFolderId);
                await refreshFolderContents(currentFolderId);

                // Show user feedback
                toast.info("Folder refreshed", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            } else {
                await getRootFiles();
                toast.info("Root folder refreshed", {
                    position: "top-right",
                    autoClose: 2000,
                });
            }
        } catch (error) {
            console.error("Error refreshing current folder:", error);
            handleError(error);
        }
    };

    const handleSort = (type, value) => {
        setSortBy(prev => ({ ...prev, [type]: value }));
        console.log(`Sorting by ${type}: ${value}`);
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


    // Add this useEffect to debug folder state changes
    useEffect(() => {
        console.log("Folder state changed:");
        console.log("- Current Path:", currentPath);
        console.log("- Current Folder ID:", currentFolderId);
        console.log("- Navigation History:", navigationHistory);
    }, [currentPath, currentFolderId, navigationHistory]);

    // Add this useEffect to track currentFolderId changes:
    useEffect(() => {
        console.log("=== FOLDER ID CHANGED ===");
        console.log("Current Folder ID:", currentFolderId);
        console.log("Current Path:", currentPath);
        console.log("Is in folder:", currentFolderId !== null);
    }, [currentFolderId]);

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleDownloadFile = async (file) => {
        try {
            // Implement file download logic
            const response = await apiCall.downloadFile(`files/download/${file.id}`);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name || file.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('File downloaded successfully!');
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        }
    };

    return (
        <div className="flex min-h-screen">
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={(value) => console.log(value)} />

                <div className="p-6">
                    <ActionButtons
                        onActionComplete={() => {
                            console.log("=== UPLOAD COMPLETE CALLBACK ===");
                            console.log("Current folder ID:", currentFolderId);
                            console.log("Current path:", currentPath);

                            // Force immediate refresh without any navigation changes
                            if (currentFolderId) {
                                console.log("Refreshing current folder immediately");
                                refreshFolderContents(currentFolderId).then(() => {
                                    console.log("Folder refresh completed");
                                });
                            } else {
                                console.log("Refreshing root folder immediately");
                                getRootFiles().then(() => {
                                    console.log("Root refresh completed");
                                });
                            }
                        }}
                        getFolderId={() => {
                            console.log("getFolderId called, returning:", currentFolderId);
                            return currentFolderId;
                        }}
                        currentFolderId={currentFolderId}
                        currentPath={currentPath}
                    />
                    {clipboard && (
                        <button
                            onClick={handlePaste}
                            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Paste "{clipboard.name}"
                        </button>
                    )


                    }
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
                                <Button
                                    onClick={handleRefresh}
                                    variant="icon"
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    icon={<MdRefresh size={20} />}
                                    title="Refresh current folder"
                                />
                                <span
                                    className="text-gray-600 hover:text-blue-600 cursor-pointer"
                                    onClick={handleCurrentPathClick}
                                    title="Click to refresh folder"
                                >
                                    Current Path: {currentPath}
                                </span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(() => {
                            console.log("=== RENDERING ITEMS ===");
                            console.log("Items to render:", items.length);
                            console.log("Current folder ID:", currentFolderId);
                            console.log("Items:", items);

                            if (items.length === 0) {
                                return (
                                    <div className="col-span-4 flex flex-col items-center justify-center py-12 text-gray-500">
                                        <MdFolder size={64} className="mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No items found</p>
                                        <p className="text-sm">
                                            {currentFolderId
                                                ? "This folder is empty. Upload a file or create a new folder to get started."
                                                : "No files or folders found. Upload a file or create a new folder to get started."
                                            }
                                        </p>
                                    </div>
                                );
                            }

                            return items.map((item, index) => {
                                const isFolder = item.type === 'folder';
                                const isPasteMode = !!clipboard;
                                const isDisabled = isPasteMode && !isFolder;

                                console.log("Rendering item:", item.name || item.fileName, "Type:", item.type);

                                return (
                                    <div
                                        key={`${item.id}-${index}`} // Unique key
                                        onClick={() => {
                                            if (isDisabled) return;
                                            if (isFolder) handleNavigate(item);
                                            else handleFileOpen(item);
                                        }}
                                        className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors
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
                                                        if (isDisabled) return;
                                                        setActiveDropdown(activeDropdown === index ? null : index);
                                                    }}
                                                    disabled={isDisabled}
                                                />
                                                {activeDropdown === index && (
                                                    <div
                                                        ref={dropdownRef}
                                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
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
                                );
                            });
                        })()}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className={`bg-white rounded-xl shadow-2xl transition-all duration-300 overflow-hidden
            ${isMaximized
                            ? 'w-full h-full max-w-full max-h-full rounded-none'
                            : 'w-full max-w-5xl h-[85vh] mx-4'
                        }
        `}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <MdInsertDriveFile size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 truncate max-w-md">
                                        {clickedItem?.name || clickedItem?.fileName || 'Unknown File'}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {clickedItem?.fileExtension && `.${clickedItem.fileExtension.toUpperCase()}`}
                                        {clickedItem?.size && ` • ${formatFileSize(clickedItem.size)}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* Download Button */}
                                <button
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    onClick={() => handleDownloadFile(clickedItem)}
                                    title="Download file"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>

                                {/* Maximize/Minimize Button */}
                                <button
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setIsMaximized(m => !m)}
                                    title={isMaximized ? "Minimize" : "Maximize"}
                                >
                                    {isMaximized ? <MdCloseFullscreen size={20} /> : <MdOpenInNew size={20} />}
                                </button>

                                {/* Close Button */}
                                <button
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    onClick={() => setIsOpenFile(false)}
                                    title="Close"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className={`flex h-full ${isMaximized ? 'h-[calc(100vh-80px)]' : 'h-[calc(85vh-80px)]'}`}>
                            {/* File Info Sidebar */}
                            <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                                <div className="space-y-4">
                                    {/* File Details */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h3 className="font-semibold text-gray-800 mb-3">File Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Name:</span>
                                                <span className="font-medium text-gray-800 truncate ml-2">
                                                    {clickedItem?.name || clickedItem?.fileName}
                                                </span>
                                            </div>
                                            {clickedItem?.fileExtension && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Type:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {clickedItem.fileExtension.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {clickedItem?.size && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Size:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {formatFileSize(clickedItem.size)}
                                                    </span>
                                                </div>
                                            )}
                                            {clickedItem?.createdAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Created:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {new Date(clickedItem.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {clickedItem?.updatedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Modified:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {new Date(clickedItem.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {clickedItem?.account?.fullName && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Owner:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {clickedItem.account.fullName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* File Actions */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h3 className="font-semibold text-gray-800 mb-3">Actions</h3>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleDownloadFile(clickedItem)}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>Download</span>
                                            </button>
                                            <button
                                                onClick={() => handleCopy(clickedItem)}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <MdContentCopy size={16} />
                                                <span>Copy</span>
                                            </button>
                                            <button
                                                onClick={() => handleMove(clickedItem)}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <MdDriveFileMove size={16} />
                                                <span>Move</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDelete(clickedItem);
                                                    setIsOpenFile(false);
                                                }}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <MdDelete size={16} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Path */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h3 className="font-semibold text-gray-800 mb-3">Location</h3>
                                        <div className="text-sm text-gray-600 break-all">
                                            {currentPath === '/' ? 'Root' : currentPath}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* File Preview Area */}
                            <div className="flex-1 p-4 overflow-auto bg-white">
                                <div className="h-full flex items-center justify-center">
                                    <FileItem
                                        file={clickedItem}
                                        isModal={true}
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Files;