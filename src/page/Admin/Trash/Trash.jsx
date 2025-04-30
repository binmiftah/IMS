import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import ProfileBar from '../../../components/ProfileBar';
import Button from '../../../components/Button';
import { MdRestore, MdDeleteForever, MdFolder } from 'react-icons/md';
import apiCall from '../../../pkg/api/internal';
import { handleAxiosError } from '../../../pkg/error/error';

const Trash = () => {
    const [trashedItems, setTrashedItems] = useState([]);

    useEffect(() => {
        fetchTrashedItems();
    }, []);

    const fetchTrashedItems = async () => {
        try {
            const result = await apiCall.getTrashed('files/trashed');
            setTrashedItems(result);
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleRestore = async (item) => {
        try {
            await apiCall.restoreItem(`files/restore/${item.id}`);
            fetchTrashedItems();
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handlePermanentDelete = async (item) => {
        try {
            await apiCall.deleteItem(`files/delete/${item.id}`);
            fetchTrashedItems();
        } catch (error) {
            handleAxiosError(error);
        }
    };

    // Demo folder (will always show for demo purposes)
    const demoFolder = {
        id: 'demo-folder',
        name: 'Demo Folder',
        type: 'folder',
        deletedAt: new Date().toISOString(),
    };

    // Combine demo folder with actual trashed items for display
    const displayItems = [demoFolder, ...trashedItems];

    return (
        <div className="flex min-h-screen">
            <Navbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ProfileBar />
                <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold mb-6">Trash</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {displayItems.length > 0 ? displayItems.map((item) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center">
                                {item.type === 'folder' && (
                                    <MdFolder size={32} className="text-yellow-500 mb-2" />
                                )}
                                <span className="font-medium mb-2">{item.name || item.fileName}</span>
                                <div className="flex space-x-2">
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
                        )) : (
                            <p className="col-span-4 text-center text-gray-400">Trash is empty.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Trash;