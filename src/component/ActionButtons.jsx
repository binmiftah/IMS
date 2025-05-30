import React, { useState, useRef } from 'react';
import { MdUpload, MdCreateNewFolder, MdInsertDriveFile } from 'react-icons/md';
import Button from './Button.jsx';
import { ToastContainer, toast } from "react-toastify";
import apiCall from "../pkg/api/internal.js";
import { handleError } from "../pkg/error/error.js";

const ActionButtons = ({ onActionComplete, getFolderId, getFileId }) => {
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

            const formData = new FormData();
            formData.append("file", selectedFile);

            // const originalFileName = selectedFile.name;
            // let fileNameToUse = originalFileName;

            // const timestamp = new Date().getTime();
            // const lastDot = originalFileName.lastIndexOf('.');
            // const extension = lastDot > 0 ? originalFileName.substring(lastDot) : '';
            // const baseName = lastDot > 0 ? originalFileName.substring(0, lastDot) : originalFileName;

            // const lastDot = originalFileName.lastIndexOf('.');
            // const extension = lastDot > 0 ? originalFileName.substring(lastDot) : '';
            // const baseName = lastDot > 0 ? originalFileNa
            // Create a modified file with a guaranteed unique name
            // const uniqueFileName = `${baseName}_${timestamp}${extension}`;
            // const uniqueFile = new File([selectedFile], uniqueFileName, {
            //     type: selectedFile.type,
            //     lastModified: selectedFile.lastModified
            // });

            // Add the file with the unique name to prevent conflicts
            // formData.append("file", uniqueFile);

            // Add metadata to explicitly specify the folder path
            if (folderId) {
                formData.append("folderId", folderId);
                formData.append("parentId", folderId);
                console.log("Uploading to folder:", folderId);
                // formData.append("restrictToFolder", "true");
            } else {
                formData.append("isRootFile", "true");
                formData.append("parentId", "null");
                console.log("Uploading to root folder");
            }

            // Upload the file
            const uploadEndpoint = folderId
                ? `files/upload/file/${folderId}`
                : `files/upload/file`;
            console.log("Upload endpoint:", uploadEndpoint);

            // try {
            const res = await apiCall.uploadFile(uploadEndpoint, formData);
            console.log("Upload response:", res);

            // Show success message
            toast.success(`File "${selectedFile.name}" uploaded successfully!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: "bg-green-50 border-l-4 border-green-500 text-green-700 p-4",
            });

            // Refresh the current folder view
            if (onActionComplete) {
                onActionComplete();
            }
            // } catch (error) {
            //     // } catch (uploadError) {
            //     //     console.error("Error uploading file:", uploadError);

            //     // If it's a 409 Conflict error, try again with a different name
            //     if (uploadError.response && uploadError.response.status === 409) {
            //         // Show warning about renaming
            //         toast.info(`File was uploaded as "${uniqueFileName}" to avoid name conflict.`, {
            //             position: "top-right",
            //             autoClose: 4000,
            //             hideProgressBar: false,
            //             closeOnClick: true,
            //             pauseOnHover: true,
            //             draggable: true,
            //             progress: undefined,
            //             className: "bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4",
            //         });

            //         // Refresh the current folder view
            //         onActionComplete?.();
            //     } else {
            //         // For other errors, throw to be caught by the outer catch
            //         throw uploadError;
            //     }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(`Upload failed: ${error.response?.data?.message || error.message}`, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                className: "bg-red-50 border-l-4 border-red-500 text-red-700 p-4",
            });
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