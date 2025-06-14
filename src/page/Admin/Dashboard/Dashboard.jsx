import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../../component/Navbar.jsx';
import ProfileBar from '../../../component/ProfileBar.jsx';
import ActionButtons from '../../../component/ActionButtons.jsx';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import Button from '../../../component/Button.jsx';
import apiCall from "../../../pkg/api/internal.js";
import {toast, ToastContainer} from "react-toastify";
import {handleError} from "../../../pkg/error/error.js";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../../context/AuthContext.jsx";



const Dashboard = () => {
    const { user } = useAuth();
    const [auditLogs, setAuditLogs] = useState([]);
    const uploadModalRef = useRef(null);
    const folderModalRef = useRef(null);
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);


    // State for modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [folderName, setFolderName] = useState('');

    // Fetch Audit Logs
    const fetchAuditLog = async () => {
      try{
          const result = await apiCall.allAuditLogs("/auditlog")
          console.log(result.data.logs)
          setAuditLogs(result.data.logs);
      }catch (error) {
          handleError(error);
      }
    }

    useEffect(()=>{
        fetchAuditLog();
    }, [])


    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;
        // Handle file upload logic here
        try{
            const formData = new FormData();
            formData.append('file', selectedFile);
            const res = await apiCall.uploadFile("files/upload/file", formData)
            toast.success(res.message);

        }catch (error){
           handleError(error)
        }finally {
            await fetchAuditLog()
            setIsUploadModalOpen(false);
            setSelectedFile(null);
        }


    };

    const handleFolderSubmit = async () => {
        if (!folderName.trim()) return;
        // Handle folder creation logic here
        try{
            const res = await apiCall.createFolder("files/create/folder", {folderName})
            toast.success(res.message);
        }catch(error){
           handleError(error)
        }finally {
            await fetchAuditLog()
            setIsFolderModalOpen(false);
            setFolderName('');
        }

    };

    const handleOutsideClick = (e, modalRef, closeModal) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            closeModal();
        }
    };



    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = auditLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(auditLogs.length / itemsPerPage);
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = (searchTerm) => {
        if (searchTerm) {
            const filteredLogs = auditLogs.filter((log) =>
                log.actor.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setAuditLogs(filteredLogs);
        } else {
            fetchAuditLog();
        }
    }


    return (
        <div className="flex min-h-screen">
            <Navbar />

            {/* Main Content */}
            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={handleSearch} />

                {user && (
                    <div className="m-6 text-3xl font-semibold text-gray-700">
                        Welcome, {user.fullName || user.email}!
                    </div>
                )}

                {/* Content Section */}
                <div className="p-6">
                    <ActionButtons onActionComplete={fetchAuditLog} />
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
                                            Date/Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">

                                    {currentItems.length > 0 ? currentItems.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-100 mb-2 hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.actor.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.action}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.file ? item.file.filePath : item.folder ? item.folder.fullPath : ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(item.createdAt).toLocaleDateString()}   {new Date(item.createdAt).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    )) : <tr>
                                        <td colSpan={4} className="text-center w-full p-5" >No Data Found</td>
                                    </tr>}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <Button
                                        variant="secondary"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        Next
                                    </Button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(indexOfLastItem, auditLogs.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{auditLogs.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">

                                            <Button
                                                variant="secondary"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex rounded-l-md px-2 py-2"
                                                icon={<MdChevronLeft className="h-5 w-5" />}
                                            />
                                            {[...Array(totalPages)].map((_, index) => (
                                                <Button
                                                    key={index}
                                                    variant={currentPage === index + 1 ? 'primary' : 'secondary'}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    className="px-4 py-2"
                                                >
                                                    {index + 1}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="secondary"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex rounded-r-md px-2 py-2"
                                                icon={<MdChevronRight className="mr-0 h-5 w-5" />}
                                            />
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Modals */}
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

                        <Button
                            onClick={handleUploadSubmit}
                            disabled={!selectedFile}
                            className="w-full px-4 py-2 rounded-lg"
                        >
                            Create
                        </Button>
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
        </div>
    );
};

export default Dashboard;