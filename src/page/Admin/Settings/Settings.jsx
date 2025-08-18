import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../../component/Navbar';
import ProfileBar from '../../../component/ProfileBar';
import Button from '../../../component/Button';
import { MdEdit, MdSave, MdCancel, MdVisibility, MdVisibilityOff, MdSettings, MdSecurity, MdAccountCircle } from 'react-icons/md';
import { toast, ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import { handleError } from '../../../pkg/error/error';

const Settings = () => {
    const [admin, setAdmin] = useState(null);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingPicture, setIsEditingPicture] = useState(false);
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

    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: ''
    });
    
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Get admin info from localStorage or API
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setAdmin(user);
            setProfileForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, []);

    const handlePasswordChange = (e) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileChange = (e) => {
        setProfileForm({
            ...profileForm,
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

    const validateProfile = () => {
        if (!profileForm.fullName.trim()) {
            toast.error("Full name is required");
            return false;
        }
        if (!profileForm.email.trim()) {
            toast.error("Email is required");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileForm.email)) {
            toast.error("Please enter a valid email address");
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

            toast.success("Admin password changed successfully", {
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
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateProfile()) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiCall.updateProfile(profileForm);

            // Update admin data in localStorage
            const updatedAdmin = { ...admin, ...profileForm };
            localStorage.setItem('user', JSON.stringify(updatedAdmin));
            setAdmin(updatedAdmin);

            toast.success("Admin profile updated successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            setIsEditingProfile(false);

        } catch (error) {
            console.error("Error updating profile:", error);
            const errorMessage = error.response?.data?.message || "Failed to update profile";
            toast.error(errorMessage);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureSubmit = async () => {
        if (!profilePicture) {
            toast.error("Please select a profile picture");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('profilePicture', profilePicture);

            const response = await apiCall.updateProfilePicture(formData);

            // Update admin data in localStorage
            const updatedAdmin = { ...admin, profilePicture: response.data?.profilePictureUrl || response.profilePictureUrl };
            localStorage.setItem('user', JSON.stringify(updatedAdmin));
            setAdmin(updatedAdmin);

            toast.success("Admin profile picture updated successfully", {
                position: "top-right",
                autoClose: 3000,
            });

            setIsEditingPicture(false);
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
        setProfileForm({
            fullName: admin?.fullName || '',
            email: admin?.email || '',
            phoneNumber: admin?.phoneNumber || ''
        });
        setIsEditingProfile(false);
    };

    const cancelPictureEdit = () => {
        setProfilePicture(null);
        setPreviewUrl(null);
        setIsEditingPicture(false);
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    if (!admin) {
        return (
            <div className="flex min-h-screen">
                <Navbar />
                <div className="w-4/5 bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading admin settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Navbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ProfileBar />
                <ToastContainer />
                <div className="flex-1 p-8">
                    <div className="flex items-center mb-8">
                        <MdSettings className="text-3xl text-gray-800 mr-3" />
                        <h2 className="text-3xl font-bold text-gray-800">Administrator Settings</h2>
                    </div>
                    
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Profile Picture Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <div className="flex items-center mb-4">
                                <MdAccountCircle className="text-2xl text-blue-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Profile Picture</h3>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="relative">
                                    <img
                                        src={previewUrl || admin.profilePicture || '/default-avatar.png'}
                                        alt="Admin Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                                        <MdSettings className="text-white text-sm" />
                                    </div>
                                </div>
                                {!isEditingPicture ? (
                                    <button
                                        onClick={() => setIsEditingPicture(true)}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                                    >
                                        <MdEdit size={16} />
                                        <span>Change Picture</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleProfilePictureChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleProfilePictureSubmit}
                                                disabled={loading}
                                                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200"
                                            >
                                                <MdSave size={16} />
                                                <span>Save</span>
                                            </button>
                                            <button
                                                onClick={cancelPictureEdit}
                                                className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition duration-200"
                                            >
                                                <MdCancel size={16} />
                                                <span>Cancel</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Administrator Information Section */}
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <MdAccountCircle className="text-2xl text-gray-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Administrator Information</h3>
                            </div>
                            {!isEditingProfile ? (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800">
                                                {admin.fullName || 'Not set'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800">
                                                {admin.email || 'Not set'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800">
                                                {admin.phoneNumber || 'Not set'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 text-blue-800 font-semibold">
                                                {admin.role || 'Administrator'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                                    >
                                        <MdEdit size={16} />
                                        <span>Edit Information</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={profileForm.fullName}
                                                onChange={handleProfileChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileForm.email}
                                                onChange={handleProfileChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={profileForm.phoneNumber}
                                                onChange={handleProfileChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <input
                                                type="text"
                                                value={admin.role || 'Administrator'}
                                                readOnly
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 text-blue-800 cursor-not-allowed font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200"
                                        >
                                            <MdSave size={16} />
                                            <span>Save Changes</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelProfileEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Security Section */}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
                            <div className="flex items-center mb-4">
                                <MdSecurity className="text-2xl text-red-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Security Settings</h3>
                            </div>
                            {!isEditingPassword ? (
                                <div>
                                    <p className="text-gray-600 mb-4">Maintain the highest level of security for your administrator account.</p>
                                    <button
                                        onClick={() => setIsEditingPassword(true)}
                                        className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
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
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                                className="w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200"
                                        >
                                            <MdSave size={16} />
                                            <span>Save Password</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelPasswordEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Administrator Account Information */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                            <div className="flex items-center mb-4">
                                <MdAccountCircle className="text-2xl text-purple-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Account Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Administrator ID</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800 text-sm font-mono">
                                        {admin.id || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Administrator Since</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800">
                                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800">
                                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-purple-50 text-purple-800 font-semibold">
                                        Full Administrative Access
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

export default Settings;