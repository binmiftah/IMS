import React, { useState, useEffect } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert } from 'react-icons/md';
import UserNavbar from '../../../components/UserNavbar';
import ProfileBar from '../../../components/ProfileBar';
import ActionButtons from '../../../components/ActionButtons';
import Button from '../../../components/Button';
import { ToastContainer } from "react-toastify";
import apiCall from '../../../pkg/api/internal';
import { handleAxiosError } from '../../../pkg/error/error';

const UserDashboard = () => {
    const [currentPath, setCurrentPath] = useState('/');
    const [items, setItems] = useState([]);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(8);
    const [showAll, setShowAll] = useState(false);


    useEffect(() => {
        getRootFiles();
    }, []);

    const getRootFiles = async () => {
        try {
            const result = await Promise.all([
                apiCall.getFolder("files/folders"),
                apiCall.getFile("/files")
            ]);
            let allResult = [...result[0], ...result[1]];
            setItems(allResult);
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleNavigate = async (item) => {
        try {
            setNavigationHistory(prev => [...prev, {
                path: currentPath,
                id: currentFolderId
            }]);

            setCurrentPath(item.fullPath);
            setCurrentFolderId(item.id);

            const result = await apiCall.getFolderById(`files/folders/${item.id}`);
            const allResult = [...result.children, ...result.files];
            setItems(allResult);
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleBack = async () => {
        try {
            if (navigationHistory.length === 0) {
                setCurrentPath('/');
                setCurrentFolderId(null);
                getRootFiles();
                return;
            }

            const lastNav = navigationHistory[navigationHistory.length - 1];
            setCurrentPath(lastNav.path);
            setCurrentFolderId(lastNav.id);
            setNavigationHistory(prev => prev.slice(0, -1));

            if (lastNav.id) {
                const result = await apiCall.getFolderById(`files/folders/${lastNav.id}`);
                const allResult = [...result.children, ...result.files];
                setItems(allResult);
            } else {
                getRootFiles();
            }
        } catch (error) {
            handleAxiosError(error);
        }
    };

    const handleSearch = (searchTerm) => {
        // Implement search functionality
    };

    const handleShowAll = () => {
        setShowAll(!showAll);
        // setDisplayLimit(showAll ? 8 : items.length);
    }

    return (
        <div className="flex min-h-screen">
            <UserNavbar />

            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={handleSearch} />

                <div className="p-6">
                    <ActionButtons onActionComplete={getRootFiles} />
                    <div className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Button
                                onClick={handleBack}
                                disabled={currentPath === '/' && navigationHistory.length === 0}
                                variant="icon"
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                icon={<MdArrowBack size={20} />}
                            />
                            <span className="text-gray-600">Current Path: {currentPath}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {items.length > 0 ? (
                                <>
                                    {(showAll ? items : items.slice(0, displayLimit)).map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => item.type === 'folder' && handleNavigate(item)}
                                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                            {/* ...existing item content... */}
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p className="col-span-4 text-center text-gray-500">
                                    No files or folders. Create or upload something!
                                </p>
                            )}
                        </div>

                        {!showAll && items.length > displayLimit && (
                            <div className="mt-6 text-center">
                                <Button
                                    onClick={handleShowMore}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Show More
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;