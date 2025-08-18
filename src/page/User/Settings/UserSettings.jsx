import React, { useState, useEffect } from 'react';
import UserNavbar from '../../../component/UserNavbar';
import { MdEdit, MdSave, MdCancel, MdVisibility, MdVisibilityOff, MdSettings, MdSecurity, MdAccountCircle, MdPerson, MdInfo } from 'react-icons/md';
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
        
        if (!validatePassword()) {
            return;
        }

        setLoading(true);
        try {
            await apiCall.changePassword({
                oldPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            toast.success("Password changed successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            setIsEditingPassword(false);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

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
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <UserNavbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ToastContainer />
                <div className="flex-1 p-8">
                    <div className="flex items-center mb-8">
                        <MdSettings className="text-3xl text-blue-600 mr-3" />
                        <h2 className="text-3xl font-bold text-gray-800">Account Settings</h2>
                    </div>
                    
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Profile Picture Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdAccountCircle className="text-2xl text-blue-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Profile Picture</h3>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <img
                                        src={previewUrl || user.profilePicture || '/default-avatar.png'}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                                        <MdPerson className="text-white text-sm" />
                                    </div>
                                </div>
                                {!isEditingProfile ? (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-md"
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
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition file:duration-200"
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleProfilePictureSubmit}
                                                disabled={loading}
                                                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200 shadow-md"
                                            >
                                                <MdSave size={16} />
                                                <span>Save</span>
                                            </button>
                                            <button
                                                onClick={cancelProfileEdit}
                                                className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition duration-200 shadow-md"
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
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdPerson className="text-2xl text-gray-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm">
                                        {user.fullName || 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm">
                                        {user.email || 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm">
                                        {user.phoneNumber || 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 text-blue-800 font-semibold shadow-sm">
                                        {user.role || 'User'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <MdInfo className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-amber-700">
                                    Your personal information is managed by your administrator. Please contact them to update these details.
                                </p>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdSecurity className="text-2xl text-green-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Security Settings</h3>
                            </div>
                            {!isEditingPassword ? (
                                <div>
                                    <div className="flex items-start space-x-2 p-3 bg-green-100 border border-green-200 rounded-lg mb-4">
                                        <MdSecurity className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-green-700">
                                            Keep your account secure with a strong password. We recommend using at least 8 characters with a mix of letters, numbers, and symbols.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingPassword(true)}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 shadow-md"
                                    >
                                        <MdEdit size={16} />
                                        <span>Change Password</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.current ? "text" : "password"}
                                                name="currentPassword"
                                                value={passwordForm.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('current')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.new ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                            </button>
                                        </div>
                                        {passwordForm.newPassword && (
                                            <div className="mt-2">
                                                <div className="flex space-x-1 text-xs">
                                                    <span className={`px-2 py-1 rounded ${passwordForm.newPassword.length >= 6 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        6+ chars
                                                    </span>
                                                    <span className={`px-2 py-1 rounded ${/[A-Z]/.test(passwordForm.newPassword) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        Uppercase
                                                    </span>
                                                    <span className={`px-2 py-1 rounded ${/[0-9]/.test(passwordForm.newPassword) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        Number
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.confirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                            </button>
                                        </div>
                                        {passwordForm.confirmPassword && (
                                            <div className="mt-1">
                                                <span className={`text-xs px-2 py-1 rounded ${passwordForm.newPassword === passwordForm.confirmPassword ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200 shadow-md"
                                        >
                                            <MdSave size={16} />
                                            <span>Save Password</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelPasswordEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 shadow-md"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Account Information */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdInfo className="text-2xl text-purple-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Account Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800 text-sm font-mono shadow-sm">
                                        {user.id || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800 shadow-sm">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800 shadow-sm">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-green-50 text-green-800 font-semibold shadow-sm">
                                        {user.status || 'Active'}
                                    </div>
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
