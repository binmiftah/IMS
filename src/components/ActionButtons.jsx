import React, { useState, useRef } from 'react';
import { MdUpload, MdCreateNewFolder } from 'react-icons/md';
import Button from './Button.jsx';
import { ToastContainer, toast } from "react-toastify";
import apiCall from "../pkg/api/internal.js";
import { handleError } from "../pkg/error/error.js";

const ActionButtons = ({ onActionComplete, getFolderId }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [folderName, setFolderName] = useState('');
    const uploadModalRef = useRef(null);
    const folderModalRef = useRef(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;
        let folderId = null;
        if (getFolderId)
            folderId = getFolderId();
        try {
            let res;
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (!folderId){
                res = await apiCall.uploadFile("files/upload/file", formData);
            }else{
                res = await  apiCall.uploadFile("files/upload/file/" + folderId, formData)
            }
            toast.success(res.message,{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            onActionComplete?.(); // Callback to refresh parent data
        } catch (error) {
            handleError(error);
        } finally {
            setIsUploadModalOpen(false);
            setSelectedFile(null);
        }
    };

    const handleFolderSubmit = async () => {
        if (!folderName.trim()) return;

        let folderId = null;
        if (getFolderId)
            folderId = getFolderId();

        let res;
        try {
            if (!folderId){
                res = await apiCall.createFolder("files/create/folder", { folderName });
            }else{
                res = await apiCall.createFolder("files/create/folder/" + folderId, {folderName});
            }
            toast.success(res.message);
            onActionComplete?.(); // Callback to refresh parent data
        } catch (error) {
            handleError(error);
        } finally {
            setIsFolderModalOpen(false);
            setFolderName('');
        }
    };

    const handleOutsideClick = (e, modalRef, closeModal) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            closeModal();
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-end items-right">
                    <ToastContainer />
                    <span className="flex space-x-4">
                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            icon={<MdUpload className='mr-2' size={20} />}
                        >
                            Upload
                        </Button>
                        <Button
                            onClick={() => setIsFolderModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            icon={<MdCreateNewFolder className='mr-2' size={20} />}
                        >
                            Create Folder
                        </Button>
                    </span>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => handleOutsideClick(e, uploadModalRef, () => setIsUploadModalOpen(false))}
                >
                    <div ref={uploadModalRef} className="bg-white rounded-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Upload File</h2>
                        </div>
                        <div className="mb-4">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>
                        <Button
                            onClick={handleUploadSubmit}
                            disabled={!selectedFile}
                            className="w-full px-4 py-2 rounded-lg"
                        >
                            Upload
                        </Button>
                    </div>
                </div>
            )}

            {/* Folder Modal */}
            {isFolderModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => handleOutsideClick(e, folderModalRef, () => setIsFolderModalOpen(false))}
                >
                    <div ref={folderModalRef} className="bg-white rounded-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Create Folder</h2>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Enter folder name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>
                        <Button
                            onClick={handleFolderSubmit}
                            disabled={!folderName.trim()}
                            className="w-full px-4 py-2 rounded-lg"
                        >
                            Create
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ActionButtons;