import React, { useState, useRef } from 'react';
import { MdUpload, MdCreateNewFolder, MdInsertDriveFile } from 'react-icons/md';
import Button from './Button.jsx';
import { ToastContainer, toast } from "react-toastify";
import apiCall from "../pkg/api/internal.js";
import { handleError } from "../pkg/error/error.js";

const ActionButtons = ({ onActionComplete, getFolderId, getFileId, canUpload = true }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [folderName, setFolderName] = useState('');
    const uploadModalRef = useRef(null);
    const folderModalRef = useRef(null);

    const currentFolderId = getFolderId ? getFolderId() : null;

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;

        try {
            let folderId = currentFolderId;

            if (!folderId && getFolderId) {
                folderId = getFolderId();
            }

            console.log("=== UPLOAD STARTING ===");
            console.log("Selected file:", selectedFile.name);
            console.log("Current folder ID from props:", currentFolderId);
            console.log("Final folder ID to use:", folderId);

            const formData = new FormData();
            formData.append("file", selectedFile);

            if (folderId) {
                formData.append("folderId", folderId);
                formData.append("parentId", folderId);
                console.log("Uploading to folder:", folderId);
            } else {
                formData.append("parentId", "null");
                console.log("Uploading to root folder");
            }

            const uploadEndpoint = folderId ? `files/upload/file/${folderId}` : "files/upload/file";
            const res = await apiCall.uploadFile(uploadEndpoint, formData);
            console.log("Upload response:", res);

            // Show success message
            toast.success(`File "${selectedFile.name}" uploaded successfully!`);

            // Call the completion callback immediately without delay
            if (onActionComplete) {
                console.log("Calling onActionComplete callback immediately");
                onActionComplete();
            }

        } catch (error) {
            console.error("Error uploading file:", error);

            // Handle specific permission errors
            if (error.response?.status === 403) {
                toast.error("You don't have permission to upload files to this location. Please contact your administrator.");
            } else if (error.response?.status === 401) {
                toast.error("You are not authorized to upload files. Please log in again.");
            } else {
                toast.error(`Upload failed: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setIsUploadModalOpen(false);
            setSelectedFile(null);
        }
    };

    const handleFolderSubmit = async () => {
        if (!folderName.trim()) {
            toast.error("Folder name cannot be empty.");
            return;
        }

        let folderId = null;
        if (getFolderId) folderId = getFolderId();

        try {
            const payload = { folderName };

            const res = folderId
                ? await apiCall.createFolder(`files/create/folder/${folderId}`, payload)
                : await apiCall.createFolder("files/create/folder", payload);

            toast.success(res.message);

            // Trigger the refresh callback
            onActionComplete?.(); // Refresh the files page
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error("Failed to create folder.");
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
                        {canUpload && (
                            <Button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                icon={<MdUpload className='mr-2' size={20} />}
                            >
                                Upload
                            </Button>
                        )}
                        {canUpload && (
                            <Button
                                onClick={() => setIsFolderModalOpen(true)}
                                className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                icon={<MdCreateNewFolder className='mr-2' size={20} />}
                            >
                                Create Folder
                            </Button>
                        )}
                        {!canUpload && (
                            <div className="text-gray-500 text-sm p-2">
                                You don't have upload permissions for this location
                            </div>
                        )}
                    </span>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => {
                                setIsUploadModalOpen(false);
                                setSelectedFile(null);
                            }}
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-semibold mb-5 text-gray-800">Upload File</h3>

                        <div className="mb-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 transition-all hover:bg-gray-100">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />

                                {!selectedFile ? (
                                    <>
                                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        <label
                                            htmlFor="file-upload"
                                            className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Select a file
                                        </label>
                                        <p className="text-sm text-gray-500 mt-1">or drag and drop here</p>
                                    </>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                                            <MdInsertDriveFile size={24} className="text-blue-500 mr-3" />
                                            <div className="flex-1 truncate">
                                                <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className="text-gray-500 hover:text-red-500 ml-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            File will be uploaded to: <span className="font-medium">{currentFolderId ? "Current folder" : "Root folder"}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 italic">
                                            Note: If a file with this name already exists, it will be automatically renamed.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium transition-colors"
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white font-medium transition-colors ${selectedFile
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-blue-300 cursor-not-allowed'
                                    }`}
                                disabled={!selectedFile}
                                onClick={handleUploadSubmit}
                            >
                                Upload
                            </button>
                        </div>
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