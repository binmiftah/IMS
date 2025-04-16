import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../../components/Navbar.jsx';
import { MdSearch, MdNotifications, MdUpload, MdCreateNewFolder, MdChevronLeft, MdChevronRight } from 'react-icons/md';



const Dashboard = () => {
    const uploadModalRef = useRef(null);
    const folderModalRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);


    // State for modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderName, setFolderName] = useState('');

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;
        // Handle file upload logic here
        console.log('Uploading file:', selectedFile);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
    };

    const handleFolderSubmit = async () => {
        if (!folderName.trim()) return;
        // Handle folder creation logic here
        console.log('Creating folder:', folderName);
        setIsFolderModalOpen(false);
        setFolderName('');
    };

    const handleOutsideClick = (e, modalRef, closeModal) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            closeModal();
        }
    };

    // Sample data for the table (replace with actual data)
    const tableData = [
        {
            email: "admin11@gmail.com",
            action: "Read",
            path: "/documents/report.pdf",
            time: "2024-04-15 10:30 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Read",
            path: "/media/image.jpg",
            time: "2024-04-15 09:45 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
        {
            email: "admin11@gmail.com",
            action: "Write",
            path: "/media/image.jpg",
            time: "2024-04-15 08:27 AM"
        },
    ];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };


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
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-end items-right">
                            <span className="flex space-x-4">
                                <button
                                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    onClick={() => setIsUploadModalOpen(true)}
                                >
                                    <MdUpload className="mr-2" size={20} />
                                    Upload
                                </button>
                                <button
                                    className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    onClick={() => setIsFolderModalOpen(true)}
                                >
                                    <MdCreateNewFolder className="mr-2" size={20} />
                                    Create Folder
                                </button>
                            </span>
                        </div>
                    </div>

                    {/* Activity Table */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Path
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-100 mb-2 hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.action}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.path}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(indexOfLastItem, tableData.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{tableData.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                                            >
                                                <MdChevronLeft className="h-5 w-5" />
                                            </button>
                                            {[...Array(totalPages)].map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === index + 1
                                                            ? 'bg-black text-white focus-visible:outline-offset-0'
                                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                                        }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100"
                                            >
                                                <MdChevronRight className="h-5 w-5" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isUploadModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => handleOutsideClick(e, uploadModalRef, () => setIsUploadModalOpen(false))}
                >
                    <div
                        ref={uploadModalRef}
                        className="bg-white rounded-lg p-6 w-96"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Upload File</h2>
                            {/* <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <MdClose size={24} />
                            </button> */}
                        </div>

                        <div className="mb-4">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>

                        <button
                            onClick={handleUploadSubmit}
                            disabled={!selectedFile}
                            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}
            {isFolderModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => handleOutsideClick(e, folderModalRef, () => setIsFolderModalOpen(false))}
                >
                    <div
                        ref={folderModalRef}
                        className="bg-white rounded-lg p-6 w-96"
                    >

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Create Folder</h2>
                            {/* <button
                                onClick={() => setIsFolderModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <MdClose size={24} />
                            </button> */}
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

                        <button
                            onClick={handleFolderSubmit}
                            disabled={!folderName.trim()}
                            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;