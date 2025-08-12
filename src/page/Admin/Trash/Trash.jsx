import React, { useEffect, useState } from 'react';
import Navbar from '../../../component/Navbar';
import ProfileBar from '../../../component/ProfileBar';
import Button from '../../../component/Button';
import { MdRestore, MdDeleteForever, MdFolder } from 'react-icons/md';
import apiCall from '../../../pkg/api/internal';
import { handleError } from '../../../pkg/error/error';
import { toast, ToastContainer } from "react-toastify";

const Trash = () => {
    const [trashedGroups, setTrashedGroups] = useState([]);
    const [trashModalOpen, setTrashModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        fetchTrashedItems();
    }, []);

    const getItemName = (item) => {
        // Use originalPath from trash endpoint - this contains the full path
        if (item.originalPath) {
            const pathParts = item.originalPath.split('/');
            // Get the last part of the path (the actual file/folder name)
            const fileName = pathParts[pathParts.length - 1];
            if (fileName && fileName !== '') {
                return fileName;
            }
        }
        
        // Fallback to item type if no originalPath
        return item.itemType === 'FILE' ? 'Unnamed File' : 'Unnamed Folder';
    };

    const fetchTrashedItems = async () => {
        try {
            const result = await apiCall.getTrashed('trash');
            console.log("Fetched Trash:", result);
            console.log("Type of result:", typeof result);
            console.log("Is array?", Array.isArray(result));
            
            // Ensure result is always an array, even if API returns something else
            if (Array.isArray(result)) {
                // Group items by the person who deleted them
                const groupedByUser = result.reduce((groups, item) => {
                    const userId = item.deletedBy?.id || 'unknown';
                    const userName = item.deletedBy?.fullName || 'Unknown User';
                    
                    if (!groups[userId]) {
                        groups[userId] = {
                            user: userName,
                            userInfo: item.deletedBy,
                            items: []
                        };
                    }
                    
                    groups[userId].items.push(item);
                    return groups;
                }, {});
                
                // Convert grouped object to array
                const groupedArray = Object.values(groupedByUser);
                setTrashedGroups(groupedArray);
                console.log("Set trashedGroups to:", groupedArray);
            } else {
                console.log("Result is not an array, setting empty array");
                setTrashedGroups([]);
            }
        } catch (error) {
            console.error("Error fetching trash:", error);
            setTrashedGroups([]); // Set empty array on error
            handleError(error);
        }
    };

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
        setTrashModalOpen(true);
    };

    const handleRestore = async (item) => {
        try {
            console.log("Restoring item:", item);

            // Create the restore data structure matching the API body format
            const restoreData = {
                type: item.itemType, // "FILE" or "FOLDER" - will be mapped to "type" in API call
                itemId: item.folderId || item.fileId // Use folderId or fileId from the trash item
            };

            const res = await apiCall.restoreItem(item.id, restoreData);
            await fetchTrashedItems();
            console.log("Restore result:", res);

            toast.success(res.message || "Item restored successfully", {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            setTrashModalOpen(false);

        } catch (error) {
            console.error("Restore error:", error);
            toast.error("Failed to restore item", {
                position: "top-right",
                autoClose: 3000,
            });
            handleError(error);
        }
    };

    const handlePermanentDelete = async (item) => {
        try {
            await apiCall.deleteItem(`files/delete/${item.id}`);
            await fetchTrashedItems();
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <div className="flex min-h-screen">
            <Navbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ToastContainer />
                <ProfileBar />
                <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold mb-6">Trash</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {trashedGroups && trashedGroups.length > 0 ? (
                            trashedGroups.map((group, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleGroupClick(group)}
                                    className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center cursor-pointer hover:bg-gray-100"
                                >
                                    <MdFolder size={32} className="text-yellow-500 mb-2" />
                                    <span className="font-medium text-center">
                                        {group.user}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {group.items.length} item(s)
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-4 text-center text-gray-400">Trash is empty.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Trash Modal */}
            {trashModalOpen && selectedGroup && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                    <div className="bg-white rounded shadow p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            Items deleted by {selectedGroup.user}
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            {selectedGroup.items && selectedGroup.items.length > 0 ? (
                                selectedGroup.items.map((item) => (
                                    <div key={item.id} className="border p-4 rounded-lg flex flex-col">
                                        {item.itemType === 'FOLDER' ? (
                                            <MdFolder size={32} className="text-yellow-500 mb-2" />
                                        ) : (
                                            <div className="mb-2">
                                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <span className="font-medium">
                                            {getItemName(item)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Deleted on: {new Date(item.deletedAt).toLocaleDateString()}
                                        </span>
                                        <div className="mt-2 flex space-x-2">
                                            <Button
                                                icon={<MdRestore size={20} />}
                                                onClick={() => handleRestore(item)}
                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            >
                                                Restore
                                            </Button>
                                            <Button
                                                icon={<MdDeleteForever size={20} />}
                                                onClick={() => handlePermanentDelete(item)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-4 text-center text-gray-400">No items found.</p>
                            )}
                        </div>
                        <div className="mt-6 text-right">
                            <Button
                                onClick={() => setTrashModalOpen(false)}
                                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Trash;
