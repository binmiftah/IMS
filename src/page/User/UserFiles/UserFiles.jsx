import React, { useState, useEffect, useRef, use } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert, MdDelete, MdOpenInNew, MdContentCopy, MdDriveFileMove, MdCloseFullscreen, MdRefresh, MdEdit } from 'react-icons/md';
import UserNavbar from '../../../component/UserNavbar';
import ProfileBar from '../../../component/ProfileBar';
import ActionButtons from '../../../component/ActionButtons';
import Button from '../../../component/Button';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import apiCall from '../../../pkg/api/internal';
import { handleError } from "../../../pkg/error/error.js";
import { useAuth } from "../../../context/AuthContext.jsx";

const UserFiles = () => {
    const { user } = useAuth();
    const [currentPath, setCurrentPath] = useState('/');
    const [folders, setFolders] = useState(null);
    const [items, setItems] = useState([]);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [moveModal, setMoveModal] = useState({ open: false, file: null });
    const [selectedMovePath, setSelectedMovePath] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [clickedItem, setClickedItem] = useState(null);
    const [isOpenFile, setIsOpenFile] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);


    const dropdownRef = useRef(null);


    const [sortBy, setSortBy] = useState({
        modified: "newest",
        uploadedBy: "all",
        type: "all",
    });


    const getRootFiles = async () => {
        try {
            console.log("Fetching accessible files and folders for user");
            const accessibleData = await apiCall.getAccessibleFiles();
            console.log("Accessible data response:", accessibleData);

            const allItems = Array.isArray(accessibleData?.data) ? accessibleData.data : [];
            console.log("All accessible items:", allItems);

            if (allItems.length === 0) {
                setItems([]);
                setCurrentFolderId(null);
                setCurrentPath('/');
                console.log("No accessible items found for the user.");
                return;
            }

            const accessibleItemIds = new Set(allItems.map(item => item.id));

            const rootItemsToDisplay = allItems.filter(item => {
                const parentId = item.parentId;

                if (!parentId || parentId === null || parentId === "null" || parentId === "") {
                    return true;
                }

                if (parentId && !accessibleItemIds.has(parentId)) {
                    console.log(`Item "${item.name || item.fileName}" (ID: ${item.id}) is an orphan (parent ${parentId} not accessible), displaying at root.`);
                    return true;
                }

                // Otherwise, it's a child of an accessible folder and will be shown on navigation.
                return false;
            });

            console.log("Root accessible items (including orphans):", rootItemsToDisplay);

            setItems(rootItemsToDisplay);
            setCurrentFolderId(null);
            setCurrentPath('/');

        } catch (error) {
            console.error("Failed to load accessible files:", error);
            toast.error("Failed to load files");
        }
    };

    const handleNavigate = async (item) => {
        try {
            console.log("Navigating to folder with ID:", item.id);

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
            setCurrentFolderId(item.id);

            // Force refresh folder contents
            await refreshFolderContents(item.id);
        } catch (error) {
            console.error("Error navigating to folder:", error);
            handleError(error);
        }
    };

    const flattenFolderTree = (folderNode) => {
        // Recursively flatten the folder tree into a flat array of files and folders
        let result = [];
        if (!folderNode) return result;

        // Add subfolders and their descendants
        if (Array.isArray(folderNode.children)) {
            for (const childFolder of folderNode.children) {
                result.push({ ...childFolder, type: 'folder' });
                result = result.concat(flattenFolderTree(childFolder));
            }
        }

        // Add files in this folder
        if (Array.isArray(folderNode.files)) {
            result = result.concat(folderNode.files.map(f => ({ ...f, type: 'file' })));
        }

        return result;
    };

    const refreshFolderContents = async (folderId) => {
        try {
            console.log("Refreshing folder contents for ID:", folderId);

            // Fetch the folder data (with all descendants)
            const folderData = await apiCall.getFolderById(`files/folders/${folderId}`);

            // Flatten the entire tree (all descendants, recursively)
            const allDescendants = flattenFolderTree(folderData);

            setItems(allDescendants);
            setCurrentFolderId(folderId);

            const folderPath = folderData.fullPath || `/folder-${folderId}`;
            setCurrentPath(folderPath);

        } catch (error) {
            console.error("Error refreshing folder:", error);
            toast.error("You do not have OPEN_FOLDER access to this folder");
        }
    };

    const handleRefresh = async () => {
        try {
            if (currentFolderId) {
                await refreshFolderContents(currentFolderId);
            } else {
                await getRootFiles();
            }
            toast.success("Refreshed successfully", {
                position: "top-right",
                autoClose: 2000,
            });
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
                console.log("Refreshing accessible folder contents for:", lastNav.id);
                await refreshFolderContents(lastNav.id);
            } else {
                console.log("Going back to accessible root folder");
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
        setClipboard({ ...item, from: currentPath });
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
    };

    const handleMove = (item) => {
        setMoveModal({ open: true, file: item });
    };

    // ✅ Add rename handlers
    const handleRename = (item) => {
        const currentName = item.name || item.fileName;
        const newName = prompt(`Rename ${item.type === 'folder' ? 'folder' : 'file'}:`, currentName);
        
        if (newName && newName.trim() && newName.trim() !== currentName) {
            handleRenameSubmit(item, newName.trim());
        }
    };

    const handleRenameSubmit = async (item, newName) => {
        try {
            console.log("=== RENAMING ITEM ===");
            console.log("Item:", item);
            console.log("New name:", newName);
            
            const isFolder = item.type === 'folder';
            const endpoint = isFolder 
                ? `files/folders/${item.id}/rename` 
                : `files/${item.id}/rename`;
            
            const payload = {
                newName: newName
            };

            await apiCall.put(endpoint, payload);
            
            toast.success(`${isFolder ? 'Folder' : 'File'} renamed successfully!`);
            
            // Refresh the current view
            await handleRefresh();
            
        } catch (error) {
            console.error("❌ Error renaming item:", error);
            
            if (error.response?.status === 403) {
                toast.error("You don't have permission to rename this item.");
            } else if (error.response?.status === 404) {
                toast.error("Item not found.");
            } else if (error.response?.status === 409) {
                toast.error("An item with this name already exists.");
            } else {
                toast.error("Failed to rename item. Please try again.");
            }
        }
    };

    // Replace the checkFilePermission function with this enhanced version that uses existing data:

    const checkFilePermission = (item, requiredPermission = 'OPEN_FILE') => {
        try {
            console.log("=== Checking File Permission (from existing data) ===");
            console.log("Item:", item);
            console.log("Required Permission:", requiredPermission);
            console.log("Current User:", user);

            // For folders, check AclEntry
            if (item.type === 'folder' && item.AclEntry) {
                console.log("Checking folder permissions in AclEntry:", item.AclEntry);

                // Find the user's ACL entry
                const userAcl = item.AclEntry.find(entry => entry.accountId === user?.id);

                if (userAcl && userAcl.permissions) {
                    console.log("User's folder permissions:", userAcl.permissions);

                    const hasRequiredPermission = userAcl.permissions.includes(requiredPermission);
                    console.log(`Has ${requiredPermission} permission:`, hasRequiredPermission);

                    return {
                        hasPermission: hasRequiredPermission,
                        permissions: userAcl.permissions,
                        reason: 'acl_folder',
                        itemData: item
                    };
                }
            }

            // For files, check acls array
            if (item.type !== 'folder' && item.acls) {
                console.log("Checking file permissions in acls:", item.acls);

                // Find the user's ACL entry
                const userAcl = item.acls.find(entry => entry.accountId === user?.id);

                if (userAcl && userAcl.permissions) {
                    console.log("User's file permissions:", userAcl.permissions);

                    const hasRequiredPermission = userAcl.permissions.includes(requiredPermission);
                    console.log(`Has ${requiredPermission} permission:`, hasRequiredPermission);

                    return {
                        hasPermission: hasRequiredPermission,
                        permissions: userAcl.permissions,
                        reason: 'acl_file',
                        itemData: item
                    };
                }
            }

            // Check if user owns the item (owners have all permissions)
            if (item.accountId === user?.id) {
                console.log("✅ User owns the item - all permissions granted");
                return {
                    hasPermission: true,
                    permissions: ['FULL_ACCESS'],
                    reason: 'owner',
                    itemData: item
                };
            }

            console.log("❌ No permissions found for user");
            return {
                hasPermission: false,
                permissions: [],
                reason: 'no_permission',
                error: {
                    response: {
                        data: {
                            message: `You don't have ${requiredPermission} permission for this item`
                        }
                    }
                }
            };

        } catch (error) {
            console.error("Error checking file permission:", error);
            return {
                hasPermission: false,
                permissions: [],
                reason: 'error',
                error: error
            };
        }
    };

    // Add helper function to check if user has a specific permission for an item
    const hasItemPermission = (item, permission) => {
        if (!user || !user.id) return false;

        // Check if user owns the item
        if (item.accountId === user.id) return true;

        // For folders, check AclEntry
        if (item.type === 'folder' && item.AclEntry) {
            const userAcl = item.AclEntry.find(entry => entry.accountId === user.id);
            if (userAcl && userAcl.permissions) {
                return userAcl.permissions.includes(permission);
            }
        }

        // For files, check acls array
        if (item.type !== 'folder' && item.acls) {
            const userAcl = item.acls.find(entry => entry.accountId === user.id);
            if (userAcl && userAcl.permissions) {
                return userAcl.permissions.includes(permission);
            }
        }

        return false;
    };

    const handleFileOpen = async (item) => {
        try {
            console.log("=== Opening File ===");
            console.log("Item:", item);

            // Check OPEN_FILE permission using existing data
            const permissionCheck = checkFilePermission(item, 'OPEN_FILE');

            if (permissionCheck.hasPermission) {
                console.log("✅ OPEN_FILE permission granted");
                console.log("User permissions:", permissionCheck.permissions);
                console.log("Permission reason:", permissionCheck.reason);

                // Try to open the file using available links
                if (item.webViewLink) {
                    console.log("Opening with webViewLink:", item.webViewLink);
                    window.open(item.webViewLink, '_blank');
                } else if (item.webContentLink) {
                    console.log("Opening with webContentLink:", item.webContentLink);
                    window.open(item.webContentLink, '_blank');
                } else if (item.downloadUrl) {
                    console.log("Opening with downloadUrl:", item.downloadUrl);
                    window.open(item.downloadUrl, '_blank');
                } else {
                    console.log("Using fallback download URL");
                    const downloadUrl = `${apiCall.baseURL}/files/download/${item.id}`;
                    window.open(downloadUrl, '_blank');
                }

                toast.success("File opened successfully", {
                    position: "top-right",
                    autoClose: 1500,
                });
            } else {
                console.log("❌ OPEN_FILE permission denied");
                const errorMessage = permissionCheck.error?.response?.data?.message ||
                    "You don't have permission to open this file";

                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        } catch (error) {
            console.error("Error opening file:", error);
            toast.error("Failed to open file", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleDelete = async (item) => {
        try {
            console.log("=== Deleting Item ===");
            console.log("Item:", item);

            // Check DELETE permission using existing data
            const deletePermission = item.type === 'folder' ? 'DELETE_FOLDER' : 'DELETE_FILE';
            const permissionCheck = checkFilePermission(item, deletePermission);

            if (!permissionCheck.hasPermission) {
                console.log(`❌ ${deletePermission} permission denied`);
                const errorMessage = permissionCheck.error?.response?.data?.message ||
                    `You don't have permission to delete this ${item.type === 'folder' ? 'folder' : 'file'}`;

                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            console.log(`✅ ${deletePermission} permission granted`);
            console.log("User permissions:", permissionCheck.permissions);

            // Show confirmation dialog
            const confirmDelete = window.confirm(
                `Are you sure you want to delete "${item.name || item.fileName}"? This action cannot be undone.`
            );

            if (!confirmDelete) {
                console.log("User cancelled deletion");
                return;
            }

            // Show deleting state
            const itemType = item.type === 'folder' ? 'folder' : 'file';
            toast.info(`Deleting ${itemType}...`, {
                position: "top-right",
                autoClose: 2000,
            });

            if (item.type === 'folder') {
                await apiCall.deleteFolder(`files/folders/${item.id}?resourceType=FOLDER`);
            } else {
                await apiCall.deleteFile(`files/file/${item.id}?resourceType=FILE`);
            }

            await handleRefresh();

            const itemTypeCap = item.type === 'folder' ? 'Folder' : 'File';
            const itemName = item.name || item.fileName;
            toast.success(`${itemTypeCap} "${itemName}" deleted successfully and moved to trash`, {
                position: "top-right",
                autoClose: 3000,
            });

        } catch (error) {
            console.error("Error deleting item:", error);
            const itemType = item.type === 'folder' ? 'folder' : 'file';
            const itemName = item.name || item.fileName;

            if (error.response?.status === 403) {
                toast.error(`You don't have permission to delete this ${itemType}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else if (error.response?.status === 404) {
                toast.error(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found or already deleted`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else if (error.response?.data?.message) {
                toast.error(`Failed to delete ${itemType}: ${error.response.data.message}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            } else {
                toast.error(`Failed to delete ${itemType} "${itemName}"`, {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        }
    };

    const handleSort = (type, value) => {
        setSortBy(prev => ({ ...prev, [type]: value }));
    };

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

    // Add this function that follows the same pattern as checkFilePermission
    const checkUploadPermission = async (folderId) => {
        try {
            console.log("=== Checking Upload Permission ===");
            console.log("Checking upload permission for folder ID:", folderId);

            if (!folderId) {
                console.log("❌ No folder ID provided");
                return {
                    hasPermission: false,
                    error: {
                        response: {
                            data: {
                                message: "Cannot upload to root folder"
                            }
                        }
                    }
                };
            }

            // Get all accessible files/folders
            const response = await apiCall.getAccessibleFiles();
            console.log("✅ Accessible files response:", response);

            // ✅ FIXED: Find the specific folder we're checking upload permission for
            const targetFolder = response.data.find(item => item.id === folderId);

            if (!targetFolder) {
                console.log("❌ Folder not found in accessible files");
                return {
                    hasPermission: false,
                    error: {
                        response: {
                            data: {
                                message: "You don't have access to this folder"
                            }
                        }
                    }
                };
            }

            console.log("✅ Found target folder:", targetFolder);

            // ✅ CHECK IF USER OWNS THE FOLDER (owners can upload)
            if (targetFolder.accountId === user?.id) {
                console.log("✅ User owns the folder - upload allowed");
                return { hasPermission: true, folderData: targetFolder };
            }

            // ✅ NOW CHECK FOR ACTUAL UPLOAD PERMISSIONS IN THE SPECIFIC FOLDER
            if (user && user.id && targetFolder.AclEntry) {
                const userAcl = targetFolder.AclEntry.find(entry => entry.accountId === user.id);

                if (userAcl && userAcl.permissions) {
                    const hasUploadPermission = userAcl.permissions.includes('UPLOAD_FILE') ||
                        userAcl.permissions.includes('WRITE') ||
                        userAcl.permissions.includes('FULL_ACCESS');

                    console.log("User ACL permissions for this folder:", userAcl.permissions);
                    console.log("Has upload permission:", hasUploadPermission);

                    if (hasUploadPermission) {
                        return { hasPermission: true, folderData: targetFolder, permissions: userAcl.permissions };
                    }
                } else {
                    console.log("❌ No user ACL found for this folder");
                }
            }

            // ✅ CHECK FOR GROUP PERMISSIONS IN THIS SPECIFIC FOLDER
            if (user && user.id && targetFolder.AclEntry) {
                for (const entry of targetFolder.AclEntry) {
                    if (entry.groupId && entry.permissions) {
                        // Check if user belongs to this group (you might need additional logic here)
                        const hasGroupUploadPermission = entry.permissions.includes('UPLOAD_FILE') ||
                            entry.permissions.includes('WRITE') ||
                            entry.permissions.includes('FULL_ACCESS');

                        if (hasGroupUploadPermission) {
                            console.log("✅ User has upload permission through group:", entry.groupId);
                            return { hasPermission: true, folderData: targetFolder, permissions: entry.permissions };
                        }
                    }
                }
            }

            console.log("❌ No upload permissions found for this specific folder");
            console.log("Folder AclEntry:", targetFolder.AclEntry);
            console.log("User ID:", user?.id);

            return {
                hasPermission: false,
                error: {
                    response: {
                        data: {
                            message: "You don't have UPLOAD_FILE permission for this folder"
                        }
                    }
                }
            };

        } catch (error) {
            console.log("❌ Permission check failed:", error);
            console.log("Error status:", error.response?.status);
            console.log("Error message:", error.response?.data?.message || error.message);

            return { hasPermission: false, error: error };
        }
    };

    const handleUploadPermissionCheck = async () => {
        console.log("=== Upload Permission Check ===");
        console.log("Current folder ID:", currentFolderId);
        console.log("Current path:", currentPath);

        // Show loading state
        toast.info("Checking upload permissions...", {
            position: "top-right",
            autoClose: 2000,
        });

        try {
            if (!currentFolderId) {
                console.log("❌ Cannot upload to root folder");
                toast.error("Upload to root folder is not allowed", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                return false;
            }

            // Check permission by trying to fetch the folder (same pattern as file permission)
            const permissionCheck = await checkUploadPermission(currentFolderId);

            if (permissionCheck.hasPermission) {
                console.log("✅ Upload permission granted");
                toast.success("Upload permission verified", {
                    position: "top-right",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                return true;
            } else {
                console.log("❌ Upload permission denied");
                const errorMessage = permissionCheck.error?.response?.data?.message ||
                    "You don't have permission to upload files to this folder";

                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                return false;
            }
        } catch (error) {
            console.error("Unexpected error during upload permission check:", error);
            toast.error("An error occurred while checking upload permissions", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            return false;
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
    }, [activeDropdown]);

    useEffect(() => {
        getRootFiles();
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    useEffect(() => {
        console.log("Folder state changed:");
        console.log("- Current Path:", currentPath);
        console.log("- Current Folder ID:", currentFolderId);
        console.log("- Navigation History:", navigationHistory);
    }, [currentPath, currentFolderId, navigationHistory]);

    return (
        <div className="flex min-h-screen">
            <UserNavbar />
            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={(value) => console.log(value)} />

                <div className="p-6">
                    <ActionButtons
                        onActionComplete={() => {
                            console.log("ActionButtons callback - refreshing folder:", currentFolderId);
                            handleRefresh();
                        }}
                        getFolderId={() => {
                            return currentFolderId;
                        }}
                        checkUploadPermission={handleUploadPermissionCheck} // ✅ Pass the permission check function
                    />
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
                                <Button
                                    onClick={handleRefresh}
                                    variant="icon"
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    icon={<MdRefresh size={20} />}
                                    title="Refresh current folder"
                                />
                                <span
                                    className="text-gray-600 hover:text-blue-600 cursor-pointer"
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
                        {items.length > 0 ? items.map((item, index) => {
                            const isPasteMode = !!clipboard;
                            const isFolder = item.type === 'folder';
                            const isDisabled = isPasteMode && !isFolder;

                            return (
                                <div
                                    key={item.id || index}
                                    onClick={() => {
                                        console.log("=== File Click Debug ===");
                                        console.log("Item clicked:", item);
                                        console.log("Is disabled:", isDisabled);
                                        console.log("Is folder:", isFolder);

                                        if (isDisabled) return;
                                        if (isFolder) {
                                            console.log("Navigating to folder:", item.name);
                                            handleNavigate(item);
                                        } else {
                                            handleFileOpen(item);
                                        }
                                        console.log("=== End File Click Debug ===");
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
                                            <div className="flex flex-col">
                                                <span
                                                    className="text-gray-700 truncate max-w-[150px] block font-medium"
                                                    title={item.name || item.fileName}
                                                >
                                                    {item.name || item.fileName}
                                                </span>
                                                {/* ✅ Add file size and date for better UX */}
                                                {!isFolder && (
                                                    <div className="flex text-xs text-gray-500 space-x-2">
                                                        {item.size && <span>{formatFileSize(item.size)}</span>}
                                                        {item.createdAt && (
                                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* ✅ Show folder item count specific to the current user */}
                                                {isFolder && (
                                                    <span className="text-xs text-gray-500">
                                                        Folder • {
                                                            (() => {
                                                                if (user && user.id && Array.isArray(item.AclEntry)) {
                                                                    const userAcl = item.AclEntry.find(entry => entry.accountId === user.id);
                                                                    return userAcl?.permissions?.length || 0;
                                                                }
                                                                return 0;
                                                            })()
                                                        } permissions for you
                                                    </span>
                                                )}
                                            </div>
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
                                                                // Use the same permission checking approach
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
                                                            handleRename(item);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        disabled={isDisabled}
                                                    >
                                                        <MdEdit className="mr-2" size={18} />
                                                        Rename
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
                        }) : (
                            <div className="col-span-4 text-center py-12">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        <MdFolder size={48} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-lg">No accessible files or folders found</p>
                                    <p className="text-gray-400 text-sm">
                                        {currentPath === '/'
                                            ? 'You may not have access to any files yet.'
                                            : 'This folder appears to be empty or you don\'t have access to its contents.'
                                        }
                                    </p>
                                    <Button
                                        onClick={handleRefresh}
                                        variant="outline"
                                        className="mt-4 px-4 py-2"
                                        icon={<MdRefresh size={16} />}
                                    >
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Move Modal */}
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
                                        Object.values(folders || {})
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

            {/* Enhanced File Modal */}
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
                                                    handleRename(clickedItem);
                                                    setIsOpenFile(false);
                                                }}
                                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <MdEdit size={16} />
                                                <span>Rename</span>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserFiles;