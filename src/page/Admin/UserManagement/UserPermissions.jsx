import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../component/Navbar.jsx';
import apiCall from "../../../pkg/api/internal.js";
import { handleError } from "../../../pkg/error/error.js";
import { MdFolder, MdInsertDriveFile, MdExpandMore, MdChevronRight } from 'react-icons/md';

// Helper to build a tree from a flat list of files/folders
function buildTree(resources) {
    const map = {};
    const roots = [];
    resources.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });
    resources.forEach(item => {
        if (item.parentId && map[item.parentId]) {
            map[item.parentId].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });
    return roots;
}

// Helper to get all descendant IDs of a node
function getAllDescendantIds(node) {
    let ids = [node.id];
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            ids = ids.concat(getAllDescendantIds(child));
        });
    }
    return ids;
}

// Helper to find a node by id in the tree
function findNodeById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

// Collapsible ResourceTree
function ResourceTree({ nodes, selectedResources, onToggle, expanded, onExpandToggle }) {
    return (
        <ul className="ml-4">
            {nodes.map(node => {
                const isFolder = node.type === 'folder';
                const isExpanded = expanded[node.id] || false;
                return (
                    <li key={node.id}>
                        <div className="flex items-center cursor-pointer">
                            {isFolder && (
                                <button
                                    type="button"
                                    onClick={() => onExpandToggle(node.id)}
                                    className="mr-1 focus:outline-none"
                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? (
                                        <MdExpandMore className="inline-block w-5 h-5" />
                                    ) : (
                                        <MdChevronRight className="inline-block w-5 h-5" />
                                    )}
                                </button>
                            )}
                            <input
                                type="checkbox"
                                checked={selectedResources.includes(node.id)}
                                onChange={() => onToggle(node.id)}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 flex items-center">
                                {isFolder ? (
                                    <MdFolder className="text-yellow-600 mr-1" />
                                ) : (
                                    <MdInsertDriveFile className="text-gray-500 mr-1" />
                                )}
                                {node.name || node.fileName}
                            </span>
                        </div>
                        {isFolder && isExpanded && node.children && node.children.length > 0 && (
                            <ResourceTree
                                nodes={node.children}
                                selectedResources={selectedResources}
                                onToggle={onToggle}
                                expanded={expanded}
                                onExpandToggle={onExpandToggle}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

const ALL_PERMISSIONS = [
    "full_access", "read", "write", "execute", "create_folder", "upload", "download", "rename", "move", "copy",
    "view", "edit", "comment", "approve_download", "approve_upload", "reject", "publish", "unpublish", "archive",
    "restore", "share_folder", "share_file", "view_history", "manage_permissions", "manage_settings", "manage_roles",
    "update", "open_folder", "open_file", "delete_folder", "delete_file", "delete", "share", "manage_users",
    "change_permissions", "execute_permissions", "view_permissions"
];

const DUMMY_USER = {
    fullName: "Demo User",
    email: "demo@example.com",
    role: "MEMBER"
};

const UserPermissions = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [resourceSearch, setResourceSearch] = useState("");
    const [allResources, setAllResources] = useState([]);
    const [selectedResources, setSelectedResources] = useState([]);
    const [expanded, setExpanded] = useState({}); // For collapsible folders

    // Fetch user and permissions (real or dummy)
    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                const userData = await apiCall.getUserById(userId);
                setUser(userData);

                const perms = await apiCall.getUserPermissions(userId);
                setPermissions(perms);

                setLoading(false);
            } catch (error) {
                setUser(DUMMY_USER);
                setPermissions([]);
                setLoading(false);
                handleError(error);
            }
        };
        fetchUserDetails();
    }, [userId]);

    // Fetch all files and folders
    // useEffect(() => {
    //     const fetchResources = async () => {
    //         try {
    //             const [folders, files] = await Promise.all([
    //                 apiCall.getFolder("files/folders"),
    //                 apiCall.getFile("/files")
    //             ]);
    //             setAllResources([...folders, ...files]);
    //         } catch (error) {
    //             handleError(error);
    //         }
    //     };
    //     fetchResources();
    // }, []);
    useEffect(() => {
        setAllResources([
            { id: 1, name: "Root Folder", type: "folder", parentId: null },
            { id: 2, name: "Sub Folder", type: "folder", parentId: 1 },
            { id: 3, name: "File A", type: "file", parentId: 2 },
            { id: 4, name: "File B", type: "file", parentId: 1 }
        ]);
    }, []);

    const handlePermissionChange = (perm) => {
        if (perm === "full_access") {
            setPermissions(prev => {
                if (prev.includes("full_access")) {
                    // Uncheck all if full_access is unchecked
                    return [];
                } else {
                    // Check all permissions if full_access is checked
                    return [...ALL_PERMISSIONS];
                }
            });
        } else {
            setPermissions(prev => {
                // If full_access is checked, remove it if any other permission is toggled
                let updated;
                if (prev.includes(perm)) {
                    updated = prev.filter((p) => p !== perm && p !== "full_access");
                } else {
                    updated = [...prev.filter(p => p !== "full_access"), perm];
                }
                // If all permissions except full_access are checked, add full_access
                if (
                    updated.length === ALL_PERMISSIONS.length - 1 &&
                    !updated.includes("full_access")
                ) {
                    return [...ALL_PERMISSIONS];
                }
                return updated;
            });
        }
    };

    const filteredPermissions = ALL_PERMISSIONS.filter(perm =>
        perm.replace(/_/g, ' ').toLowerCase().includes(search.toLowerCase())
    );

    const filteredResources = allResources.filter(res =>
        (res.name || res.fileName || "").toLowerCase().includes(resourceSearch.toLowerCase())
    );

    const resourceTree = buildTree(filteredResources);

    const handleResourceToggle = (id) => {
        // Find the node in the tree
        const node = findNodeById(resourceTree, id);
        if (!node) return;

        const descendantIds = getAllDescendantIds(node);

        setSelectedResources(prev => {
            const isChecked = prev.includes(id);
            if (isChecked) {
                // Uncheck this node and all descendants
                return prev.filter(rid => !descendantIds.includes(rid));
            } else {
                // Check this node and all descendants
                return [...new Set([...prev, ...descendantIds])];
            }
        });
    };

    const handleExpandToggle = (id) => {
        setExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiCall.updateUserPermissions(userId, {
                permissions,
                resources: selectedResources
            });
            // toast.success("Permissions updated!");
        } catch (error) {
            handleError(error);
        }
        setSaving(false);
    };

    

    

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Navbar />
            <div className="w-4/5 mx-auto p-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                            User Permissions
                        </span>
                    </h1>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="text-gray-500 text-lg">Loading...</span>
                        </div>
                    ) : user ? (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-3 text-gray-700">User Details</h2>
                                <div className="bg-blue-50 p-6 rounded-lg shadow flex flex-col sm:flex-row gap-8">
                                    <div>
                                        <p className="mb-2"><span className="font-medium text-gray-600">Full Name:</span> {user.fullName}</p>
                                        <p className="mb-2"><span className="font-medium text-gray-600">Email:</span> {user.email}</p>
                                        <p><span className="font-medium text-gray-600">Role:</span> {user.role}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search permissions..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <h2 className="text-xl font-semibold mb-3 text-gray-700">Permissions</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                    {filteredPermissions.length > 0 ? filteredPermissions.map((perm) => (
                                        <label
                                            key={perm}
                                            className="flex items-center bg-gray-50 rounded-lg px-3 py-2 shadow-sm hover:bg-blue-50 transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={permissions.includes(perm)}
                                                onChange={() => handlePermissionChange(perm)}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                            <span className="ml-3 capitalize text-gray-700">{perm.replace(/_/g, ' ')}</span>
                                        </label>
                                    )) : (
                                        <span className="text-gray-400 col-span-full">No permissions found.</span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-10">
                                <h2 className="text-xl font-semibold mb-3 text-gray-700">Accessible Files & Folders</h2>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search files and folders..."
                                        value={resourceSearch}
                                        onChange={e => setResourceSearch(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                                    {filteredResources.length > 0 ? (
                                        <ResourceTree
                                            nodes={buildTree(filteredResources)}
                                            selectedResources={selectedResources}
                                            onToggle={handleResourceToggle}
                                            expanded={expanded}
                                            onExpandToggle={handleExpandToggle}
                                        />
                                    ) : (
                                        <span className="text-gray-400">No files or folders found.</span>
                                    )}
                                </div>
                            </div>
                            {/* Save button at the end of the page */}
                            <div className="flex justify-end mt-10">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Permissions"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40">
                            <span className="text-red-500 text-lg">User not found.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPermissions;