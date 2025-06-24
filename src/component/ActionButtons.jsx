import React, { useState, useRef } from 'react';
import { MdUpload, MdCreateNewFolder, MdInsertDriveFile, MdFolder, MdArrowDropDown } from 'react-icons/md'; // ✅ Add MdArrowDropDown
import Button from './Button.jsx';
import { ToastContainer, toast } from "react-toastify";
import apiCall from "../pkg/api/internal.js";
import { handleError } from "../pkg/error/error.js";

const ActionButtons = ({ onActionComplete, getFolderId, getFileId, checkUploadPermission }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isUploadFolderModalOpen, setIsUploadFolderModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderName, setFolderName] = useState('');
    const [showUploadDropdown, setShowUploadDropdown] = useState(false);

    // ✅ ADD THESE NEW PROGRESS STATE VARIABLES
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [folderUploadProgress, setFolderUploadProgress] = useState(0);
    const [isFolderUploading, setIsFolderUploading] = useState(false);
    const [currentUploadingFile, setCurrentUploadingFile] = useState('');

    const uploadModalRef = useRef(null);
    const folderModalRef = useRef(null);
    const uploadDropdownRef = useRef(null);

    const currentFolderId = getFolderId ? getFolderId() : null;

    // ✅ Handle upload dropdown toggle
    const handleUploadDropdownToggle = () => {
        setShowUploadDropdown(!showUploadDropdown);
    };

    // ✅ Handle clicking outside dropdown to close it
    const handleClickOutside = (event) => {
        if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target)) {
            setShowUploadDropdown(false);
        }
    };

    // ✅ Add event listener for clicking outside
    React.useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ✅ Handle file upload option from dropdown
    const handleFileUploadOption = async () => {
        setShowUploadDropdown(false); // Close dropdown
        await handleUploadClick(); // Use existing logic
    };

    // ✅ Handle folder upload option from dropdown
    const handleFolderUploadOption = async () => {
        setShowUploadDropdown(false); // Close dropdown
        await handleUploadFolderClick(); // Use existing logic
    };

    // Keep all existing functions exactly the same
    const handleUploadFolderClick = async () => {
        console.log("Upload folder button clicked");

        if (checkUploadPermission) {
            const hasPermission = await checkUploadPermission();
            if (!hasPermission) {
                console.log("Folder upload cancelled - no permission");
                return;
            }
        }

        setIsUploadFolderModalOpen(true);
    };

    const handleUploadFolderSubmit = async () => {
        if (!selectedFolder) return;

        setIsFolderUploading(true);
        setFolderUploadProgress(0);
        setCurrentUploadingFile(selectedFolder.name);

        try {
            let folderId = currentFolderId;

            if (!folderId && getFolderId) {
                folderId = getFolderId();
            }

            console.log("=== FOLDER UPLOAD STARTING ===");
            console.log("Selected folder:", selectedFolder.name);
            console.log("Number of files:", selectedFolder.files.length);
            console.log("Parent folder ID:", folderId);

            const formData = new FormData();

            formData.append("folderName", selectedFolder.name);

            if (folderId) {
                formData.append("folderId", folderId);
                formData.append("parentId", folderId);
            } else {
                formData.append("parentId", "null");
            }
            console.log(formData)

            // Create the exact structure format expected by the API
            const structure = {};

            // Add each file to the FormData
            for (let i = 0; i < selectedFolder.files.length; i++) {
                const file = selectedFolder.files[i];
                formData.append("files", file);

                // Get relative path or construct it
                const relativePath = file.webkitRelativePath || `${selectedFolder.name}/${file.name}`;

                // Add file path to FormData for reference
                formData.append(`filePaths[${i}]`, file.name);

                // Create the structure entry as expected by the API
                // Use the correct key format: "folderName/fileName"
                structure[relativePath] = {
                    path: `/${selectedFolder.name}`,
                    name: file.name
                };
            }

            // ✅ Try these different approaches to send the structure

            // 1. Append as 'structure' - stringified
            formData.append('structure', JSON.stringify(structure));

            // 2. Also try with another param name in case the API expects it differently
            formData.delete('folderStructure'); // Remove if exists
            formData.append('folderStructure', JSON.stringify(structure));

            // 3. Add as 'files_structure' which some APIs use
            formData.append('files_structure', JSON.stringify(structure));

            console.log("FormData contents:");
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }
            console.log("Structure object being sent:", structure);

            // Log the exact structure being sent
            console.log("Folder structure being sent (stringified):", JSON.stringify(structure));

            const uploadEndpoint = folderId
                ? `files/upload/folder/${folderId}`
                : "files/upload/folder";

            const res = await apiCall.uploadFolderWithProgress(uploadEndpoint, formData, (progress) => {
                setFolderUploadProgress(progress);

                // Update current uploading file based on progress
                if (progress < 50) {
                    setCurrentUploadingFile(selectedFolder.files[0]?.name || selectedFolder.name);
                } else {
                    setCurrentUploadingFile(selectedFolder.files[1]?.name || selectedFolder.name);
                }
            });

            console.log("✅ Folder upload response:", res);
            toast.success(`Folder "${selectedFolder.name}" uploaded successfully!`);

            if (onActionComplete) {
                onActionComplete();
            }

        } catch (error) {
            console.error("❌ Error uploading folder:", error);
            console.log("Response status:", error.response?.status);
            console.log("Response data:", error.response?.data);
            console.log("Response headers:", error.response?.headers);

            // Log the expected structure from the error response
            if (error.response?.data?.example) {
                console.log("API expects this structure:", error.response.data.example);
            }

            if (error.response?.status === 403) {
                toast.error("You don't have permission to upload folders to this location.");
            } else if (error.response?.status === 401) {
                toast.error("You are not authorized to upload folders. Please log in again.");
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.error || "Invalid folder structure";
                console.error("400 Error details:", error.response?.data);
                toast.error(`Folder upload failed: ${errorMessage}`);
            } else {
                toast.error(`Folder upload failed: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setIsFolderUploading(false);
            setFolderUploadProgress(0);
            setCurrentUploadingFile('');
            setIsUploadFolderModalOpen(false);
            setSelectedFolder(null);
        }
    };

    const handleUploadClick = async () => {
        console.log("Upload button clicked");

        if (checkUploadPermission) {
            const hasPermission = await checkUploadPermission();
            if (!hasPermission) {
                console.log("Upload cancelled - no permission");
                return;
            }
        }

        setIsUploadModalOpen(true);
    };

    // Keep all other existing functions exactly the same...
    const handleUploadSubmit = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            let folderId = currentFolderId;

            if (!folderId && getFolderId) {
                folderId = getFolderId();
            }

            console.log("=== FILE UPLOAD STARTING ===");
            console.log("Selected file:", selectedFile.name);
            console.log("File size:", (selectedFile.size / 1024 / 1024).toFixed(2), "MB");

            const formData = new FormData();
            formData.append("file", selectedFile);

            if (folderId) {
                formData.append("folderId", folderId);
                formData.append("parentId", folderId);
            } else {
                formData.append("parentId", "null");
            }

            const uploadEndpoint = folderId ? `files/upload/file/${folderId}` : "files/upload/file";

            // ✅ Use the new progress-enabled API method
            const res = await apiCall.uploadFileWithProgress(uploadEndpoint, formData, (progress) => {
                setUploadProgress(progress);
            });

            console.log("✅ File upload response:", res);
            toast.success(`File "${selectedFile.name}" uploaded successfully!`);

            if (onActionComplete) {
                onActionComplete();
            }

        } catch (error) {
            console.error("❌ Error uploading file:", error);

            if (error.response?.status === 403) {
                toast.error("You don't have permission to upload files to this location.");
            } else if (error.response?.status === 401) {
                toast.error("You are not authorized to upload files. Please log in again.");
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.error || "Invalid file format";
                console.error("400 Error details:", error.response?.data);
                toast.error(`File upload failed: ${errorMessage}`);
            } else {
                toast.error(`Upload failed: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
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
            onActionComplete?.();
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
                        {/* ✅ Single Upload Button with Dropdown */}
                        <div className="relative" ref={uploadDropdownRef}>
                            <Button
                                onClick={handleUploadDropdownToggle}
                                className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                icon={<MdUpload className='mr-2' size={20} />}
                            >
                                Upload
                                <MdArrowDropDown className='ml-1' size={20} />
                            </Button>

                            {/* ✅ Dropdown Menu */}
                            {showUploadDropdown && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <button
                                        onClick={handleFileUploadOption}
                                        className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
                                    >
                                        <MdInsertDriveFile className='mr-3' size={18} />
                                        Upload File
                                    </button>
                                    <button
                                        onClick={handleFolderUploadOption}
                                        className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg"
                                    >
                                        <MdFolder className='mr-3' size={18} />
                                        Upload Folder
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Create Folder Button - unchanged */}
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

            {/* All existing modals stay exactly the same */}
            {/* File Upload Modal - unchanged */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            onClick={() => {
                                if (!isUploading) {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }
                            }}
                            disabled={isUploading}
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-semibold mb-5 text-gray-800">Upload File</h3>

                        {/* ✅ Progress bar when uploading */}
                        {isUploading && (
                            <div className="mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-blue-700">
                                        Uploading {selectedFile?.name}...
                                    </span>
                                    <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
                                        style={{ width: `${uploadProgress}%` }}
                                    >
                                        {uploadProgress > 10 && (
                                            <span className="text-xs text-white font-medium">{uploadProgress}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 transition-all hover:bg-gray-100">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    disabled={isUploading}
                                />

                                {!selectedFile ? (
                                    <>
                                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        <label
                                            htmlFor="file-upload"
                                            className={`cursor-pointer text-blue-600 hover:text-blue-800 font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            {!isUploading && (
                                                <button
                                                    onClick={() => setSelectedFile(null)}
                                                    className="text-gray-500 hover:text-red-500 ml-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            )}
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
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white font-medium transition-colors ${selectedFile && !isUploading
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-blue-300 cursor-not-allowed'
                                    }`}
                                disabled={!selectedFile || isUploading}
                                onClick={handleUploadSubmit}
                            >
                                {isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Upload Modal - unchanged */}
            {isUploadFolderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            onClick={() => {
                                if (!isFolderUploading) {
                                    setIsUploadFolderModalOpen(false);
                                    setSelectedFolder(null);
                                }
                            }}
                            disabled={isFolderUploading}
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-semibold mb-5 text-gray-800">Upload Folder</h3>

                        {/* ✅ Progress bar when uploading folder */}
                        {isFolderUploading && (
                            <div className="mb-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-green-700">
                                        Uploading {currentUploadingFile}...
                                    </span>
                                    <span className="text-sm font-medium text-green-700">{folderUploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-green-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
                                        style={{ width: `${folderUploadProgress}%` }}
                                    >
                                        {folderUploadProgress > 10 && (
                                            <span className="text-xs text-white font-medium">{folderUploadProgress}%</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {selectedFolder ? `${selectedFolder.files.length} files` : ''} • Please keep this window open
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 transition-all hover:bg-gray-100">
                                <input
                                    type="file"
                                    id="folder-upload"
                                    className="hidden"
                                    webkitdirectory=""
                                    directory=""
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files.length > 0) {
                                            const firstFile = e.target.files[0];
                                            const folderName = firstFile.webkitRelativePath.split('/')[0];
                                            setSelectedFolder({
                                                name: folderName,
                                                files: Array.from(e.target.files)
                                            });
                                        }
                                    }}
                                    disabled={isFolderUploading}
                                />

                                {!selectedFolder ? (
                                    <>
                                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        <label
                                            htmlFor="folder-upload"
                                            className={`cursor-pointer text-blue-600 hover:text-blue-800 font-medium ${isFolderUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Select a folder
                                        </label>
                                        <p className="text-sm text-gray-500 mt-1">Choose folder to upload</p>
                                    </>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                                            <MdFolder size={24} className="text-blue-500 mr-3" />
                                            <div className="flex-1 truncate">
                                                <p className="font-medium text-gray-800 truncate">{selectedFolder.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {selectedFolder.files.length} files • {(selectedFolder.files.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            {!isFolderUploading && (
                                                <button
                                                    onClick={() => setSelectedFolder(null)}
                                                    className="text-gray-500 hover:text-red-500 ml-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Folder will be uploaded to: <span className="font-medium">{currentFolderId ? "Current folder" : "Root folder"}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    setIsUploadFolderModalOpen(false);
                                    setSelectedFolder(null);
                                }}
                                disabled={isFolderUploading}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white font-medium transition-colors ${selectedFolder && !isFolderUploading
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-blue-300 cursor-not-allowed'
                                    }`}
                                disabled={!selectedFolder || isFolderUploading}
                                onClick={handleUploadFolderSubmit}
                            >
                                {isFolderUploading ? `Uploading ${folderUploadProgress}%` : 'Upload Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Folder Modal - unchanged */}
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