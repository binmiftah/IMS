import React from 'react'
import Navbar from '../../../components/Navbar.jsx'
import { MdSearch, MdNotifications, MdAdd } from 'react-icons/md'
import Button from '../../../components/Button.jsx'

const Users = () => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [newUser, setNewUser] = React.useState({
        email: '',
        password: '',
        rootDir: '',
        dirPath: '',
        permission: ''
    });

    const modalRef = React.useRef(null);
    const handleOutsideClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            setIsAddModalOpen(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser((prevUser) => ({
            ...prevUser,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('New User:', newUser);
        setIsAddModalOpen(false);
        setNewUser({
            email: '',
            password: '',
            rootDir: ''
        });
    }


    return (
        <div className="flex min-h-screen">
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-white">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-96 px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                <MdSearch size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-gray-500 hover:text-gray-700">
                            <MdNotifications size={24} />
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                3
                            </span>
                        </button>
                        <img
                            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">View and Manage Users</h1>
                        {/* <button className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                            <MdAdd size={20} className="mr-2" />
                            Add
                        </button> */}
                        <Button
                            // text="Add User"
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
                        <div
                            ref={modalRef}
                            className="bg-white rounded-lg p-6 w-96"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Add User</h2>
                                {/* <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <MdClose size={24} />
                                </button> */}
                            </div>

                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <div className="mb-4">
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={newUser.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Root Directory Section */}
                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <label
                                    htmlFor="rootDir"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Root Directory
                                </label>
                                <input
                                    type="text"
                                    id="rootDir"
                                    name="rootDir"
                                    value={newUser.rootDir}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                                    required
                                    placeholder='Absolute directory path'
                                />
                                <p className='mt-3 text-gray-600'>Leave blank for default directory.</p>
                            </div>

                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">File Access Control Level</h3>
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label
                                            htmlFor="dirPath"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Directory Path
                                        </label>
                                        <input
                                            type="text"
                                            id="dirPath"
                                            name="dirPath"
                                            placeholder="/path/to/directory"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            htmlFor="permission"
                                            className="block text-sm font-medium text-gray-700 mb-1"
                                        >
                                            Permission
                                        </label>
                                        <select
                                            id="permission"
                                            name="permission"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                                        >
                                            <option value="">Select permission</option>
                                            <option value="read">Read</option>
                                            <option value="write">Write</option>
                                            <option value="readwrite">Read & Write</option>
                                        </select>
                                    </div>
                                </div>
                                <Button
                                    text="Add"
                                    className="mt-4 bg-black text-white px-4 py-2 rounded-lg flex items-center"
                                >
                                    <MdAdd size={20} className="mr-2" />
                                    Add
                                </Button>   
                            </div>
                            <Button
                                text="Save"
                                onClick={handleSubmit}
                                className="bg-black text-white px-4 py-2 rounded-lg flex items-center float-right"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">

                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">John Doe</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    2024-04-14 10:30 AM
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Users;