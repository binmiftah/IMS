import React, { useState, useEffect } from 'react';
import UserNavbar from '../../../component/UserNavbar';
import { MdEdit, MdSave, MdCancel, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { toast, ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import { handleError } from '../../../pkg/error/error';

const UserSettings = () => {
    const [user, setUser] = useState(null);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Get user info from localStorage or API
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handlePasswordChange = (e) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value
        });
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const validatePassword = () => {
        if (!passwordForm.currentPassword) {
            toast.error("Current password is required");
            return false;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return false;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords don't match");
            return false;
        }
        return true;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            return;
        }

        setLoading(true);
        try {
            await apiCall.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            toast.success("Password changed successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            setIsEditingPassword(false);
            resetPasswordForm();

        } catch (error) {
            console.error("Error changing password:", error);
            const errorMessage = error.response?.data?.message || "Failed to change password";
            toast.error(errorMessage);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };    const handleProfilePictureSubmit = async () => {
        if (!profilePicture) {
            toast.error("Please select a profile picture");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', profilePicture);

            const response = await apiCall.updateProfilePicture(formData);

            // Update user data in localStorage
            const updatedUser = { ...user, profilePicture: response.data?.profilePictureUrl || response.profilePictureUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            toast.success("Profile picture updated successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            setIsEditingProfile(false);
            setProfilePicture(null);
            setPreviewUrl(null);

        } catch (error) {
            console.error("Error updating profile picture:", error);
            toast.error("Failed to update profile picture");
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const cancelPasswordEdit = () => {
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsEditingPassword(false);
    };

    const cancelProfileEdit = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        setIsEditingProfile(false);
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    if (!user) {
        return (
            <div className="flex min-h-screen">
                <UserNavbar />
                <div className="w-4/5 bg-white flex items-center justify-center">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <UserNavbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ToastContainer />
                <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                    
                    <div className="max-w-2xl mx-auto space-y-8">
                        {/* Profile Picture Section */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <img
                                        src={previewUrl || user.profilePicture || '/default-avatar.png'}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                                    />
                                </div>
                                {!isEditingProfile ? (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        <MdEdit size={16} />
                                        <span>Change Picture</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleProfilePictureSubmit}
                                                disabled={loading}
                                                className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                                            >
                                                <MdSave size={16} />
                                                <span>Save</span>
                                            </button>
                                            <button
                                                onClick={cancelProfileEdit}
                                                className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                            >
                                                <MdCancel size={16} />
                                                <span>Cancel</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Personal Information Section (Read-only) */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={user.fullName || ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={user.email || ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={user.phoneNumber || ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <input
                                        type="text"
                                        value={user.role || ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                Contact your administrator to update this information.
                            </p>
                        </div>

                        {/* Password Section */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Password</h3>
                            {!isEditingPassword ? (
                                <div>
                                    <p className="text-gray-600 mb-4">Keep your account secure with a strong password.</p>
                                    <button
                                        onClick={() => setIsEditingPassword(true)}
                                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        <MdEdit size={16} />
                                        <span>Change Password</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="currentPassword"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full p-3 border border-gray-300 rounded pr-10"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.current ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                name="newPassword"
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full p-3 border border-gray-300 rounded pr-10"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full p-3 border border-gray-300 rounded pr-10"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPasswords.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handlePasswordSubmit}
                                            disabled={loading}
                                            className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                                        >
                                            <MdSave size={16} />
                                            <span>Save Password</span>
                                        </button>
                                        <button
                                            onClick={cancelPasswordEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Account Information */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                                    <input
                                        type="text"
                                        value={user.id || ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                                    <input
                                        type="text"
                                        value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                                        readOnly
                                        className="w-full p-3 border border-gray-300 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
