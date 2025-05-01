import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import ProfileBar from '../../../components/ProfileBar';
import Button from '../../../components/Button';

const Settings = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePic, setProfilePic] = useState("https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
    const [selectedPic, setSelectedPic] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Example: Fetch from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setFullName(user.fullName || '');
            setEmail(user.email || '');
        }
        // If you fetch from API, do it here instead
    }, []);

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        // TODO: Add API call to update profile
        alert('Profile updated!');
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        // TODO: Add API call to change password
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        alert('Password changed!');
    };

    const handleProfilePicClick = () => {
        fileInputRef.current.click();
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedPic(file);
            setProfilePic(URL.createObjectURL(file));
        }
    };

    const handleProfilePicSave = async () => {
        if (!selectedPic) return;
        // TODO: Upload to backend
        alert('Profile picture updated!');
        setSelectedPic(null);
    };

    return (
        <div className="flex min-h-screen">
            <Navbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ProfileBar />
                <div className="flex-1 p-8">
                    <h2 className="text-2xl font-bold mb-8">Settings</h2>
                    
                    {/* Profile Picture Section */}
                    <div className="mb-10">
                        <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                        <div className="flex items-center space-x-6 mb-4">
                            <img
                                src={profilePic}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border"
                                onClick={handleProfilePicClick}
                                style={{ cursor: 'pointer' }}
                                title="Click to change profile picture"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleProfilePicChange}
                            />
                            {selectedPic && (
                                <Button
                                    onClick={handleProfilePicSave}
                                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                                >
                                    Save New Picture
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Profile Info Section */}
                    <div className="mb-10">
                        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
                            <div>
                                <label className="block mb-1 text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <Button type="submit" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                                Update Profile
                            </Button>
                        </form>
                    </div>

                    {/* Password Change Section */}
                    <div className="mb-10">
                        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block mb-1 text-gray-700">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <Button type="submit" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
                                Change Password
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;