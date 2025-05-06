import React, { useState, useEffect } from 'react';
import { MdFolder, MdInsertDriveFile, MdArrowBack, MdMoreVert } from 'react-icons/md';
import UserNavbar from '../../../components/UserNavbar';
import ProfileBar from '../../../components/ProfileBar';
import ActionButtons from '../../../components/ActionButtons';
import Button from '../../../components/Button';
import { ToastContainer } from "react-toastify";
import { handleFileClick } from '../../../utils/fileOpenHandlers';

const UserFiles = () => {
    // Folder structure: mapping of path to files
    const initialFolders = {
        '/': [
            {
                id: 1,
                name: "Project Plan.pdf",
                url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                type: "application/pdf",
            },
            {
                id: 2,
                name: "Vacation.jpg",
                url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
                type: "image/jpeg",
            },
            {
                id: 3,
                name: "Notes.txt",
                url: "https://www.w3.org/TR/PNG/iso_8859-1.txt",
                type: "text/plain",
            },
            {
                id: 4,
                name: "Work Folder",
                type: "folder",
                fullPath: "/Work Folder",
            },
            {
                id: 7,
                name: "Test Folder",
                type: "folder",
                fullPath: "/Test Folder",
            },
        ],
        '/Work Folder': [
            {
                id: 5,
                name: "Subfile.txt",
                url: "https://www.w3.org/TR/PNG/iso_8859-1.txt",
                type: "text/plain",
            },
            {
                id: 6,
                name: "Another Image.png",
                url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
                type: "image/png",
            },
        ],
        '/admin-trash': [],
    };

    const [currentPath, setCurrentPath] = useState('/');
    const [folders, setFolders] = useState(initialFolders);
    const [items, setItems] = useState(initialFolders['/']);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const [moveModal, setMoveModal] = useState({ open: false, file: null });
    const [selectedMovePath, setSelectedMovePath] = useState(null);

    const isAdmin = false;

    useEffect(() => {
        setItems(folders[currentPath] || []);
    }, [folders, currentPath]);

    const handleNavigate = (item) => {
        setNavigationHistory(prev => [...prev, {
            path: currentPath,
            id: currentFolderId
        }]);
        setCurrentPath(item.fullPath || `/${item.name}`);
        setCurrentFolderId(item.id);
    };

    const handleBack = () => {
        if (navigationHistory.length === 0) {
            setCurrentPath('/');
            setCurrentFolderId(null);
            return;
        }
        const lastNav = navigationHistory[navigationHistory.length - 1];
        setCurrentPath(lastNav.path);
        setCurrentFolderId(lastNav.id);
        setNavigationHistory(prev => prev.slice(0, -1));
    };

    const handleCopy = (item) => {
        setClipboard(item);
    };

    const handlePaste = () => {
        if (!clipboard) return;
        // Create a new file object with a new id and "_copy" in the name
        const newFile = {
            ...clipboard,
            id: Date.now(),
            name: clipboard.name.replace(/(\.\w+)?$/, '_copy$1'),
        };
        setFolders(prev => {
            const updated = { ...prev };
            // Add to current folder
            updated[currentPath] = [...(updated[currentPath] || []), newFile];
            return updated;
        });
        setClipboard(null);

        //     try {
        //         const res = await fetch(`/api/folders${currentPath}/copy`, {
        //             method: 'POST',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //             },
        //             body: JSON.stringify(newFile),
        //         });
        //         if (!res.ok) {
        //             throw new Error('Failed to copy file');
        //         }
        //         setClipboard(null);
        //     } catch (error) {
        //         console.error('Error copying file:', error);
        //     }
    };

    // const handleMove = async (item) => {
    //     // For demo: 
    //     const destPath = window.prompt('Move to folder path (e.g., / or /Work Folder):', '/');
    //     if (!destPath || destPath === currentPath) return;

    //     // Dummy data logic (active)
    //     setFolders(prev => {
    //         const updated = { ...prev };
    //         // Remove from current folder
    //         updated[currentPath] = (updated[currentPath] || []).filter(f => f.id !== item.id);
    //         // Add to destination folder
    //         updated[destPath] = [...(updated[destPath] || []), { ...item }];
    //         return updated;
    //     });

    //     // --- Uncomment and adapt this block for real API integration ---
    //     /*
    //     try {
    //         const response = await fetch(`/api/folders${currentPath}/move`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ fileId: item.id, destination: destPath }),
    //         });
    //         if (!response.ok) throw new Error('Failed to move file');
    //         // Optionally, refresh folder contents after move
    //         // await fetchFilesForCurrentPath();
    //     } catch (err) {
    //         // Handle error (show toast, etc.)
    //         console.error(err);
    //     }
    //     */
    // };

    const handleDelete = (item) => {
        setFolders(prev => {
            const updated = { ...prev };
            // Remove from current folder
            updated[currentPath] = (updated[currentPath] || []).filter(f => f.id !== item.id);
            // Add to admin trash
            updated['/admin-trash'] = [...(updated['/admin-trash'] || []), { ...item, deletedBy: 'user', deletedAt: Date.now() }];
            return updated;
        });
    };
    useEffect(() => {
        if (!isAdmin && currentPath === '/admin-trash') {
            setCurrentPath('/');
        } else {
            setItems(folders[currentPath] || []);
        }
    }, [folders, currentPath, isAdmin]);

    return (
        <div className="flex min-h-screen">
            <UserNavbar />
            <div className="w-4/5 bg-white">
                <ToastContainer />
                <ProfileBar onSearch={(value) => console.log(value)} />
                <div className="p-6">
                    <ActionButtons onActionComplete={() => setFolders(initialFolders)} />
                    {clipboard && (
                        <button
                            onClick={handlePaste}
                            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Paste "{clipboard.name}"
                        </button>
                    )}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={handleBack}
                                    disabled={currentPath === '/' && navigationHistory.length === 0}
                                    variant="icon"
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    icon={<MdArrowBack size={20} />}
                                />
                                <span className="text-gray-600">Current Path: {currentPath}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {items.length > 0 ? items.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        if (item.type === 'folder') {
                                            handleNavigate(item);
                                        } else {
                                            handleFileClick({
                                                name: item.name,
                                                url: item.url,
                                                type: item.type
                                            }, { restrictDownload: true });
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {item.type === 'folder' ? (
                                                <MdFolder size={24} className="text-yellow-500" />
                                            ) : (
                                                <MdInsertDriveFile size={24} className="text-blue-500" />
                                            )}
                                            <span
                                                className="text-gray-700 truncate max-w-[150px] block"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </span>
                                        </div>
                                        {/* Show dropdown for both files and folders */}
                                        <div className="relative">
                                            <Button
                                                variant="icon"
                                                className="p-2 hover:bg-gray-200 rounded-full"
                                                icon={<MdMoreVert size={20} />}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === index ? null : index);
                                                }}
                                            />
                                            {activeDropdown === index && (
                                                <div
                                                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            if (item.type === 'folder') {
                                                                handleNavigate(item);
                                                            } else {
                                                                handleFileClick({
                                                                    name: item.name,
                                                                    url: item.url,
                                                                    type: item.type
                                                                }, { restrictDownload: true });
                                                            }
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                                                    >
                                                        Open
                                                    </button>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleCopy(item);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setMoveModal({ open: true, file: item });
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Move
                                                    </button>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleDelete(item);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="col-span-4 text-center text-gray-500">
                                    No files or folders found in this location.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {moveModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
                        <h2 className="text-lg font-semibold mb-4">Move "{moveModal.file.name}" to:</h2>
                        <select
                            className="w-full px-3 py-2 border rounded mb-4"
                            value={selectedMovePath || ''}
                            onChange={e => setSelectedMovePath(e.target.value)}
                        >
                            <option value="" disabled>Select a folder</option>
                            {[
                                '/', // Always include root
                                ...Array.from(
                                    new Set(
                                        Object.values(folders)
                                            .flat()
                                            .filter(f => f.type === 'folder' && f.fullPath)
                                            .map(f => f.fullPath)
                                    )
                                )
                            ]
                                .filter(path => path !== currentPath && (isAdmin || path !== '/admin-trash'))
                                .map(path => (
                                    <option key={path} value={path}>
                                        {path === '/' ? 'Root' : path.replace(/^\//, '')}
                                    </option>
                                ))}
                        </select>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => {
                                    setMoveModal({ open: false, file: null });
                                    setSelectedMovePath(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white ${selectedMovePath ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}
                                disabled={!selectedMovePath}
                                onClick={() => {
                                    if (!selectedMovePath) return;
                                    setFolders(prev => {
                                        const updated = { ...prev };
                                        // Remove from current folder
                                        updated[currentPath] = (updated[currentPath] || []).filter(f => f.id !== moveModal.file.id);
                                        // Add to destination folder
                                        updated[selectedMovePath] = [...(updated[selectedMovePath] || []), { ...moveModal.file }];
                                        return updated;
                                    });
                                    setMoveModal({ open: false, file: null });
                                    setSelectedMovePath(null);
                                }}
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
    ;

export default UserFiles;