import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../../components/Navbar.jsx';
import ProfileBar from '../../../components/ProfileBar.jsx';
import { MdAdd, MdClose } from 'react-icons/md';
import Button from '../../../components/Button.jsx';
import apiCall from "../../../pkg/api/internal.js";
import { handleError } from "../../../pkg/error/error.js";
import { toast, ToastContainer } from "react-toastify";
import { SiSetapp } from 'react-icons/si';

const Users = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPermissionModal, setIsPermissionModal] = useState(false);
    const [permissionForm, setPermissionForm] = useState({
        type: '',
        folderPath: '',
        targetType: 'FOLDER',
    })
    const [newUser, setNewUser] = useState({
        fullName: '',
        email: '',
        password: '',
        role: '',
    });

    const [selectedUser, setSelectedUser] = useState(null)
    const [sortBy, setSortBy] = useState({
        field: 'email',
        order: 'asc',
    })



    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const modalRef = useRef(null);



    const handleOutsideClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            setIsAddModalOpen(false);
        }
    };

    const handlePermissionModel = (user) => {
        setSelectedUser(user);
        setIsPermissionModal(true);

    }

    const handlePermissionSubmit = async () => {

        console.log('Submitting permission:', permissionForm);
        console.log('Selected User:', selectedUser);
        try {
            await apiCall.createPermission("/permissions", {
                ...permissionForm,
                accountId: selectedUser.id,
            });
            setIsPermissionModal(false);
            setPermissionForm({ type: '', folderPath: '', targetType: 'FOLDER' });
            toast.success('Permission successfully created!');
        } catch (err) {
            handleError(err)
        }
    }


    const fetchUsers = async () => {
        try {
            const res = await apiCall.getAllUsers("users");

            const allUsers = res.data.users;

            // You should sort by email or id for deterministic ordering
            // allUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            allUsers.reverse()
            setUsers(allUsers);
        } catch (error) {
            handleError(error);
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSort = (field) => {
        setSortBy(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting new user:', newUser);

        // TODO: Implement API call to save user

        const user = await apiCall.createNewMember("users/add-user", newUser)
        console.log(user)

        setIsAddModalOpen(false);
        setNewUser({
            email: '',
            password: '',
            role: '',
            rootDir: '/',
            dirPath: '',
            permission: ''
        });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const sortedUsers = [...users].sort((a, b) => {
        let aValue = a[sortBy.field] || '';
        let bValue = b[sortBy.field] || '';
        if (sortBy.field === 'email' || sortBy.field === 'role') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
            if (aValue < bValue) return sortBy.order === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortBy.order === 'asc' ? 1 : -1;
            return 0;
        }
        // For date fields
        if (sortBy.field === 'updatedAt' || sortBy.field === 'lastActive') {
            return sortBy.order === 'asc'
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
        }
        return 0;
    });
    const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="flex min-h-screen">
            <Navbar />

            <div className="w-4/5 bg-white">
                <ProfileBar onSearch={(value) => console.log('Search:', value)} />

                <div className="p-6">
                    <ToastContainer />
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">View and Manage Users</h1>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <MdAdd size={20} className="mr-2" />
                            Add User
                        </Button>
                    </div>
                </div>

                {/* Add Modal */}
                {isAddModalOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        onClick={handleOutsideClick}
                    >
                        <div ref={modalRef} className="bg-white rounded-lg p-6  relative">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Add User</h2>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <MdClose size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Full Name */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">FullName</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={newUser.fullName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                {/* Email */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newUser.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    />
                                </div>

                                {/* Role */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        name="role"
                                        value={newUser.role}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select Role</option>
                                        <option value="MEMBER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                {isPermissionModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div ref={modalRef} className="bg-white rounded-lg p-6 relative">
                            <h2 className="text-xl font-semibold mb-4">Assign Permission</h2>

                            <div className="mb-4">
                                <label className="block mb-1">Permission Type</label>
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={permissionForm.type}
                                    onChange={(e) =>
                                        setPermissionForm({ ...permissionForm, type: e.target.value })
                                    }
                                >
                                    <option value="">Select</option>
                                    <option value="ReadOnly">Read</option>
                                    <option value="ReadAndWrite">Read & Write</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1">Target Folder Path</label>
                                <input
                                    className="w-full border px-3 py-2 rounded"
                                    value={permissionForm.folderPath}
                                    onChange={(e) =>
                                        setPermissionForm({ ...permissionForm, folderPath: e.target.value })
                                    }
                                />
                            </div>

                            {/*<div className="mb-4">*/}
                            {/*    /!*<label className="block mb-1">Target ID (Folder/File ID)</label>*!/*/}
                            {/*    <select*/}
                            {/*        className="w-full border px-3 py-2 rounded"*/}
                            {/*        // value={permissionForm.targetId}*/}
                            {/*        // onChange={(e) =>*/}
                            {/*        //     setPermissionForm({ ...permissionForm, targetId: e.target.value })*/}
                            {/*        // }*/}
                            {/*    >*/}
                            {/*        <option></option>*/}
                            {/*        <select/>*/}

                            {/*</div>*/}

                            <div className="mb-4">
                                <label className="block mb-1">Target Type</label>
                                <select
                                    className="w-full border px-3 py-2 rounded"
                                    value={permissionForm.targetType}
                                    onChange={(e) =>
                                        setPermissionForm({ ...permissionForm, targetType: e.target.value })
                                    }
                                >
                                    <option value="FOLDER">Folder</option>
                                    {/*<option value="FILE">File</option>*/}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    className="bg-gray-200 px-4 py-2 rounded"
                                    onClick={() => setIsPermissionModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bg-black text-white px-4 py-2 rounded"
                                    onClick={handlePermissionSubmit}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                    onClick={() => handleSort('email')}
                                >
                                    Email {sortBy.field === 'email' && (sortBy.order === 'asc' ? '▲' : '▼')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                    onClick={() => handleSort('role')}
                                >
                                    Role {sortBy.field === 'role' && (sortBy.order === 'asc' ? '▲' : '▼')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                    onClick={() => handleSort('updatedAt')}
                                >
                                    Recently Active {sortBy.field === 'updatedAt' && (sortBy.order === 'asc' ? '▲' : '▼')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user, idx) => (
                                    <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handlePermissionModel(user)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm ">{user.role || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700">
                            Page {currentPage} of {Math.ceil(users.length / itemsPerPage)}
                        </span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(users.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(users.length / itemsPerPage)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Users;
