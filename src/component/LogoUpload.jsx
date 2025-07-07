import React, { useState, useRef, useEffect } from 'react';
import { MdCloudUpload, MdEdit, MdDelete, MdCheck, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
// import apiCall from '../pkg/api/internal';

const LogoUpload = ({ isAdmin = false, className = "" }) => {
    const [logo, setLogo] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);
    const nameInputRef = useRef(null);

    useEffect(() => {
        // Load existing logo and company name on component mount
        loadExistingData();
    }, []);

    useEffect(() => {
        // Focus on input when editing starts
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    const loadExistingData = async () => {
        try {
            const savedLogo = localStorage.getItem('companyLogo');
            const savedName = localStorage.getItem('companyName');
            
            if (savedLogo) {
                setLogo(savedLogo);
            }
            
            if (savedName) {
                setCompanyName(savedName);
            } else {
                // Default company name
                setCompanyName('Your Company');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setCompanyName('Your Company');
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            validateAndUploadFile(file);
        }
    };

    const validateAndUploadFile = async (file) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            toast.error('File size must be less than 5MB', {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        await uploadLogo(file);
    };

    const uploadLogo = async (file) => {
        setIsUploading(true);
        
        try {
            toast.info('Uploading logo...', {
                position: "top-right",
                autoClose: 2000,
            });

            // Convert file to base64 for preview and storage
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Logo = e.target.result;
                setLogo(base64Logo);
                
                // Save to localStorage
                localStorage.setItem('companyLogo', base64Logo);
                
                toast.success('Logo uploaded successfully!', {
                    position: "top-right",
                    autoClose: 2000,
                });
            };
            
            reader.readAsDataURL(file);

            // Optional: Upload to backend
            // const formData = new FormData();
            // formData.append('logo', file);
            // const response = await apiCall.uploadFile('files/logo', formData);

        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo. Please try again.', {
                position: "top-right",
                autoClose: 3000,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogoClick = () => {
        if (isAdmin) {
            fileInputRef.current?.click();
        }
    };

    const handleDeleteLogo = async () => {
        try {
            const confirmDelete = window.confirm('Are you sure you want to remove the company logo?');
            if (!confirmDelete) return;

            setLogo(null);
            localStorage.removeItem('companyLogo');
            
            toast.success('Logo removed successfully', {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error removing logo:', error);
            toast.error('Failed to remove logo', {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleNameEdit = () => {
        if (isAdmin) {
            setTempName(companyName);
            setIsEditingName(true);
        }
    };

    const handleNameSave = () => {
        if (tempName.trim() === '') {
            toast.error('Company name cannot be empty', {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        setCompanyName(tempName.trim());
        localStorage.setItem('companyName', tempName.trim());
        setIsEditingName(false);
        
        toast.success('Company name updated successfully!', {
            position: "top-right",
            autoClose: 2000,
        });
    };

    const handleNameCancel = () => {
        setTempName('');
        setIsEditingName(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleNameSave();
        } else if (e.key === 'Escape') {
            handleNameCancel();
        }
    };

    return (
        <div className={`flex flex-col items-center ${className}`}>
            {/* Circular Logo Section */}
            <div 
                className={`relative group ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleLogoClick}
            >
                {logo ? (
                    <div className="relative">
                        <img 
                            src={logo} 
                            alt="Company Logo" 
                            className="w-16 h-16 object-cover rounded-full bg-white p-1 shadow-md border-2 border-gray-300"
                        />
                        
                        {isAdmin && isHovered && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                        title="Change Logo"
                                    >
                                        <MdEdit size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteLogo();
                                        }}
                                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        title="Remove Logo"
                                    >
                                        <MdDelete size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className={`w-16 h-16 border-2 border-dashed border-gray-400 rounded-full flex flex-col items-center justify-center
                            ${isAdmin ? 'hover:border-blue-400 hover:bg-gray-800' : ''}
                            ${isUploading ? 'animate-pulse' : ''}
                        `}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="text-xs text-gray-400 mt-1">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <MdCloudUpload size={20} className="text-gray-400" />
                                {isAdmin && (
                                    <span className="text-xs text-gray-400 mt-1 text-center">
                                        Logo
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Company Name Section */}
            <div className="mt-3 text-center w-full max-w-40">
                {isEditingName ? (
                    <div className="flex items-center justify-center space-x-1">
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-center min-w-0 flex-1"
                            placeholder="Company name"
                            maxLength={25}
                        />
                        <button
                            onClick={handleNameSave}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex-shrink-0"
                            title="Save"
                        >
                            <MdCheck size={14} />
                        </button>
                        <button
                            onClick={handleNameCancel}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex-shrink-0"
                            title="Cancel"
                        >
                            <MdClose size={14} />
                        </button>
                    </div>
                ) : (
                    <div 
                        className={`group ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={handleNameEdit}
                    >
                        <p className="text-sm font-semibold text-white truncate px-2">
                            {companyName}
                        </p>
                        {isAdmin && (
                            <div className="flex items-center justify-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MdEdit size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-400 ml-1">Edit</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Instructions for Admin */}
            {isAdmin && !logo && (
                <p className="text-xs text-gray-400 mt-2 text-center max-w-32">
                    Click to upload logo (Max: 5MB)
                </p>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={!isAdmin}
            />
        </div>
    );
};

export default LogoUpload;