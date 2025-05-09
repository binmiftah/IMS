import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import ProfileBar from '../../../components/ProfileBar';
import Button from '../../../components/Button';
import { MdRestore, MdDeleteForever, MdFolder } from 'react-icons/md';
import apiCall from '../../../pkg/api/internal';
import { handleError } from '../../../pkg/error/error';
import {toast, ToastContainer} from "react-toastify";

const Trash = () => {
    const [trashedGroups, setTrashedGroups] = useState([]);
    const [trashModalOpen, setTrashModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect( () => {
        fetchTrashedItems();
    }, []);

    const fetchTrashedItems = async () => {
        try {
            const result = await apiCall.getTrashed('trash'); // assuming result is grouped like: [{ user: {...}, items: [...] }]
            console.log("Fetched Trash:", result);
            setTrashedGroups(result);
        } catch (error) {
            handleError(error);
        }
    };

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
        setTrashModalOpen(true);
    };

    const handleRestore = async (item) => {
        try {
            console.log(item)
            const res = await apiCall.restoreItem(`trash/restore/${item.id}`, item);
            await fetchTrashedItems();
            console.log(res)
            toast.success(res.message,{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
            setTrashModalOpen(false);

        } catch (error) {
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
                <ToastContainer/>
                <ProfileBar />
                <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold mb-6">Trash</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {trashedGroups.length > 0 ? (
                            trashedGroups.map((group, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleGroupClick(group)}
                                    className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center cursor-pointer hover:bg-gray-100"
                                >
                                    <MdFolder size={32} className="text-yellow-500 mb-2" />
                                    <span className="font-medium text-center">
										{group?.user}
									</span>
                                    <span className="text-sm text-gray-500">{group.items.length} item(s)</span>
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
                    <div className="bg-white rounded shadow p-6  max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            Trashed by {selectedGroup.user}
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            {selectedGroup.items.map((item) => (
                                <div key={item.id} className="border p-4 rounded-lg flex flex-col">
                                    {item.itemType === 'FOLDER' && (
                                        <MdFolder size={32} className="text-yellow-500 mb-2" />
                                    )}

                                    {item.itemType === 'FILE' && (<div></div>)}
                                    <span className="font-medium">
										{item.file?.name || item.folder?.name || 'Unnamed'}
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
                            ))}
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
