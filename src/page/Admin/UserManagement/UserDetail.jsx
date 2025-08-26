import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../component/Navbar';
import ProfileBar from '../../../component/ProfileBar';
import { 
    MdArrowBack, 
    MdEdit, 
    MdSave, 
    MdCancel, 
    MdPerson, 
    MdSecurity, 
    MdSettings, 
    MdDelete,
    MdBlock,
    MdCheckCircle,
    MdInfo,
    MdEmail,
    MdPhone,
    MdAccessTime,
    MdAccountCircle
} from 'react-icons/md';
import { toast, ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import { handleError } from '../../../pkg/error/error';

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: ''
    });
    
    const [roleForm, setRoleForm] = useState({
        role: '',
        permissions: []
    });

    const [statusForm, setStatusForm] = useState({
        status: '',
        reason: ''
    });

    const availableRoles = [
        { value: 'ADMIN', label: 'Administrator', description: 'Full system access' },
        { value: 'MEMBER', label: 'Member', description: 'Standard user access' },
        { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' }
    ];

    const availablePermissions = [
        { id: 'read_files', label: 'Read Files', description: 'Can view and download files' },
        { id: 'write_files', label: 'Write Files', description: 'Can upload and modify files' },
        { id: 'delete_files', label: 'Delete Files', description: 'Can delete files' },
        { id: 'manage_users', label: 'Manage Users', description: 'Can add/edit/remove users' },
        { id: 'view_analytics', label: 'View Analytics', description: 'Can access system analytics' },
        { id: 'system_settings', label: 'System Settings', description: 'Can modify system settings' }
    ];

    const statusOptions = [
        { value: 'ACTIVE', label: 'Active', color: 'green', description: 'User can access the system' },
        { value: 'SUSPENDED', label: 'Suspended', color: 'yellow', description: 'Temporarily blocked from system' },
        { value: 'INACTIVE', label: 'Inactive', color: 'red', description: 'Account is deactivated' }
    ];

    useEffect(() => {
        fetchUserDetail();
    }, [userId]);

    const fetchUserDetail = async () => {
        try {
            setLoading(true);
            const response = await apiCall.getUserById(userId);
            const userData = response.data || response;
            
            setUser(userData);
            setProfileForm({
                fullName: userData.fullName || '',
                email: userData.email || '',
                phoneNumber: userData.phoneNumber || ''
            });
            setRoleForm({
                role: userData.role || '',
                permissions: userData.permissions || []
            });
            setStatusForm({
                status: userData.status || 'ACTIVE',
                reason: ''
            });
        } catch (error) {
            console.error('Error fetching user details:', error);
            handleError(error);
            toast.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileForm({
            ...profileForm,
            [e.target.name]: e.target.value
        });
    };

    const handleRoleChange = (e) => {
        setRoleForm({
            ...roleForm,
            [e.target.name]: e.target.value
        });
    };

    const handlePermissionChange = (permissionId) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(p => p !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

    const handleStatusChange = (e) => {
        setStatusForm({
            ...statusForm,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await apiCall.updateUserProfile(userId, profileForm);
            
            setUser(prev => ({ ...prev, ...profileForm }));
            setIsEditingProfile(false);
            toast.success('User profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            handleError(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await apiCall.updateUserRole(userId, roleForm);
            
            setUser(prev => ({ ...prev, ...roleForm }));
            setIsEditingRole(false);
            toast.success('User role and permissions updated successfully');
        } catch (error) {
            console.error('Error updating role:', error);
            handleError(error);
            toast.error('Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await apiCall.updateUserStatus(userId, statusForm);
            
            setUser(prev => ({ ...prev, status: statusForm.status }));
            setIsEditingStatus(false);
            toast.success('User status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            handleError(error);
            toast.error('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                setLoading(true);
                await apiCall.deleteUser(userId);
                toast.success('User deleted successfully');
                navigate('/users');
            } catch (error) {
                console.error('Error deleting user:', error);
                handleError(error);
                toast.error('Failed to delete user');
                setLoading(false);
            }
        }
    };

    const cancelProfileEdit = () => {
        setProfileForm({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || ''
        });
        setIsEditingProfile(false);
    };

    const cancelRoleEdit = () => {
        setRoleForm({
            role: user?.role || '',
            permissions: user?.permissions || []
        });
        setIsEditingRole(false);
    };

    const cancelStatusEdit = () => {
        setStatusForm({
            status: user?.status || 'ACTIVE',
            reason: ''
        });
        setIsEditingStatus(false);
    };

    const getStatusColor = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption ? statusOption.color : 'gray';
    };

    const getRoleDescription = (role) => {
        const roleOption = availableRoles.find(opt => opt.value === role);
        return roleOption ? roleOption.description : 'No description available';
    };

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Navbar />
                <div className="w-4/5 bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading user details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen">
                <Navbar />
                <div className="w-4/5 bg-white flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">User not found</p>
                        <button
                            onClick={() => navigate('/users')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Back to Users
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Navbar />
            <div className="w-4/5 bg-white flex flex-col">
                <ProfileBar />
                <ToastContainer />
                <div className="flex-1 p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/users')}
                                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
                            >
                                <MdArrowBack className="text-xl mr-1" />
                                Back to Users
                            </button>
                            <div className="flex items-center">
                                <MdPerson className="text-3xl text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800">User Details</h1>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleDeleteUser}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
                        >
                            <MdDelete size={16} />
                            <span>Delete User</span>
                        </button>
                    </div>

                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* User Profile Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdAccountCircle className="text-2xl text-blue-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Profile Information</h3>
                            </div>
                            
                            {!isEditingProfile ? (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <MdPerson className="text-blue-600" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                <p className="text-gray-900 font-semibold">{user.fullName || 'Not set'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <MdEmail className="text-blue-600" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <p className="text-gray-900 font-semibold">{user.email || 'Not set'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <MdPhone className="text-blue-600" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <p className="text-gray-900 font-semibold">{user.phoneNumber || 'Not set'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                                    >
                                        <MdEdit size={16} />
                                        <span>Edit Profile</span>
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileForm.email}
                                                onChange={handleProfileChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter email"
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

                        {/* Role and Permissions */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdSecurity className="text-2xl text-purple-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Role & Permissions</h3>
                            </div>
                            
                            {!isEditingRole ? (
                                <div>
                                    <div className="mb-4">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                {user.role || 'No Role Assigned'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{getRoleDescription(user.role)}</p>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Current Permissions:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {user.permissions && user.permissions.length > 0 ? (
                                                user.permissions.map(permission => (
                                                    <span key={permission} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                        {availablePermissions.find(p => p.id === permission)?.label || permission}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-500 text-sm">No specific permissions assigned</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => setIsEditingRole(true)}
                                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
                                    >
                                        <MdEdit size={16} />
                                        <span>Edit Role & Permissions</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRoleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                        <select
                                            name="role"
                                            value={roleForm.role}
                                            onChange={handleRoleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            <option value="">Select a role</option>
                                            {availableRoles.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label} - {role.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                        <div className="space-y-2">
                                            {availablePermissions.map(permission => (
                                                <label key={permission.id} className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={roleForm.permissions.includes(permission.id)}
                                                        onChange={() => handlePermissionChange(permission.id)}
                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <div>
                                                        <span className="font-medium">{permission.label}</span>
                                                        <p className="text-sm text-gray-600">{permission.description}</p>
                                                    </div>
                                                </label>
                                            ))}
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
                                            onClick={cancelRoleEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Account Status */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdSettings className="text-2xl text-green-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Account Status</h3>
                            </div>
                            
                            {!isEditingStatus ? (
                                <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            getStatusColor(user.status) === 'green' ? 'bg-green-100 text-green-800' :
                                            getStatusColor(user.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {statusOptions.find(opt => opt.value === user.status)?.label || user.status || 'Active'}
                                        </span>
                                        {getStatusColor(user.status) === 'green' && <MdCheckCircle className="text-green-600" />}
                                        {getStatusColor(user.status) === 'yellow' && <MdBlock className="text-yellow-600" />}
                                        {getStatusColor(user.status) === 'red' && <MdBlock className="text-red-600" />}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {statusOptions.find(opt => opt.value === user.status)?.description || 'User account status'}
                                    </p>
                                    <button
                                        onClick={() => setIsEditingStatus(true)}
                                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                                    >
                                        <MdEdit size={16} />
                                        <span>Change Status</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleStatusSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={statusForm.status}
                                            onChange={handleStatusChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label} - {status.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change (Optional)</label>
                                        <textarea
                                            name="reason"
                                            value={statusForm.reason}
                                            onChange={handleStatusChange}
                                            rows={3}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Enter reason for status change..."
                                        />
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
                                            onClick={cancelStatusEdit}
                                            className="flex items-center space-x-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                                        >
                                            <MdCancel size={16} />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Account Information */}
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MdInfo className="text-2xl text-gray-600 mr-2" />
                                <h3 className="text-xl font-semibold text-gray-800">Account Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                                    <div className="bg-white p-3 border border-gray-300 rounded-lg text-sm font-mono">
                                        {user.id || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                                    <div className="bg-white p-3 border border-gray-300 rounded-lg text-sm">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                                    <div className="bg-white p-3 border border-gray-300 rounded-lg text-sm">
                                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
                                    <div className="bg-white p-3 border border-gray-300 rounded-lg text-sm">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
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

export default UserDetail;
