import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../component/Navbar.jsx";
import {
  MdFolder,
  MdInsertDriveFile,
  MdExpandMore,
  MdChevronRight,
} from "react-icons/md";
import {
  getAllPermissions,
  getUserPermissions,
  getGroupPermissions,
  createGroupPermission,
  createMemberPermission,
} from "../../../pkg/api/permissions";

// Optionally keep these for grouping and descriptions
const PERMISSION_GROUPS = {
  General: [
    "full_access", "read", "write", "execute", "update", "upload", "download", "rename", "move", "copy"
  ],
  File: ["open_file", "delete_file", "share_file"],
  Folder: ["create_folder", "open_folder", "delete_folder", "share_folder", "archive", "restore"],
  Admin: [
    "manage_permissions", "manage_settings", "manage_roles", "manage_users", "change_permissions",
    "execute_permissions", "view_permissions", "publish", "unpublish", "reject", "approve_download", "approve_upload"
  ],
};
const PERMISSION_DESCRIPTIONS = {
  full_access: "Grants all permissions.",
  read: "Allows reading files and folders.",
  write: "Allows modifying files and folders.",
  upload: "Allows uploading files.",
  download: "Allows downloading files.",
  // ...add more as needed
};

// Helper functions (unchanged)
function buildTree(resources) {
  const map = {};
  const roots = [];
  resources.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });
  resources.forEach((item) => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
}
function getAllDescendantIds(node) {
  let ids = [node.id];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      ids = ids.concat(getAllDescendantIds(child));
    });
  }
  return ids;
}
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
function getSelectionState(node, selectedResources) {
  if (!node.children || node.children.length === 0) {
    return selectedResources.includes(node.id) ? "checked" : "none";
  }
  const childStates = node.children.map((child) =>
    getSelectionState(child, selectedResources)
  );
  if (childStates.every((state) => state === "checked")) return "checked";
  if (
    childStates.every((state) => state === "none") &&
    selectedResources.includes(node.id)
  )
    return "checked";
  return "indeterminate";
}
function ResourceTree({
  nodes,
  selectedResources,
  onToggle,
  expanded,
  onExpandToggle,
}) {
  return (
    <ul className="ml-4">
      {nodes.map((node) => {
        const isFolder = node.type === "folder";
        const isExpanded = expanded[node.id] || false;
        const selectionState = getSelectionState(node, selectedResources);
        const checkboxRef = React.useRef();

        React.useEffect(() => {
          if (checkboxRef.current) {
            checkboxRef.current.indeterminate = selectionState === "indeterminate";
          }
        }, [selectionState]);

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
                ref={checkboxRef}
                type="checkbox"
                checked={selectionState === "checked"}
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

const UserPermissions = () => {
  const { userId } = useParams();

  // State
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const [allResources, setAllResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [securityGroups, setSecurityGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    department: "",
    permissions: [],
    resources: [],
  });
  const [allPermissions, setAllPermissions] = useState([]);

  // Fetch permissions, user, groups, and resources from API
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllPermissions(),
      getUserPermissions(userId),
      // getGroupPermissions(userId), // Uncomment if you have group API
      // fetchResources(), // Implement if you have a resources API
    ])
      .then(([permissionsData, userData]) => {
        setAllPermissions(
          Array.isArray(permissionsData) && typeof permissionsData[0] === "object"
            ? permissionsData.map((p) => p.name)
            : permissionsData
        );
        setUser(userData.user || userData);
        setPermissions(userData.permissions || []);
        // setSecurityGroups(groupsData); // If you fetch groups
        // setAllResources(resourcesData); // If you fetch resources
      })
      .catch((err) => {
        // handle error
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Dummy resources fallback (remove if you fetch from API)
  useEffect(() => {
    setAllResources([
      { id: 1, name: "Root Folder", type: "folder", parentId: null },
      { id: 2, name: "Sub Folder", type: "folder", parentId: 1 },
      { id: 3, name: "File A", type: "file", parentId: 2 },
      { id: 4, name: "File B", type: "file", parentId: 1 },
    ]);
  }, []);

  const filteredPermissions = allPermissions.filter((perm) =>
    perm.replace(/_/g, " ").toLowerCase().includes(search.toLowerCase())
  );

  const filteredResources = allResources.filter((res) =>
    (res.name || res.fileName || "").toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const resourceTree = buildTree(filteredResources);

  const handleResourceToggle = (id) => {
    const node = findNodeById(resourceTree, id);
    if (!node) return;
    const descendantIds = getAllDescendantIds(node);
    setSelectedResources((prev) => {
      const isChecked = prev.includes(id);
      if (isChecked) {
        return prev.filter((rid) => !descendantIds.includes(rid));
      } else {
        return [...new Set([...prev, ...descendantIds])];
      }
    });
  };

  const handleExpandToggle = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Example: Save user permissions
    await createMemberPermission({
      resourceType: "FOLDER",
      permissions,
      folderId: "", // or relevant folderId
      accountId: userId,
      inherited: false,
    });
    setSaving(false);
  };

  const handlePermissionChange = (perm) => {
    if (perm === "full_access") {
      setPermissions((prev) => {
        if (prev.includes("full_access")) {
          return [];
        } else {
          return [...allPermissions];
        }
      });
    } else {
      setPermissions((prev) => {
        let updated;
        if (prev.includes(perm)) {
          updated = prev.filter((p) => p !== perm && p !== "full_access");
        } else {
          updated = [...prev.filter((p) => p !== "full_access"), perm];
        }
        if (
          updated.length === allPermissions.length - 1 &&
          !updated.includes("full_access")
        ) {
          return [...allPermissions];
        }
        return updated;
      });
    }
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
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  User Details
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg shadow flex flex-col sm:flex-row gap-8">
                  <div>
                    <p className="mb-2">
                      <span className="font-medium text-gray-600">Full Name:</span>{" "}
                      {user.fullName}
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-gray-600">Email:</span>{" "}
                      {user.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">Role:</span>{" "}
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Permissions
                </h2>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} className="mb-4">
                    <h3 className="font-semibold text-blue-600 mb-2">
                      {group}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {perms
                        .filter((perm) => filteredPermissions.includes(perm))
                        .map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center bg-gray-50 rounded-lg px-3 py-2 shadow-sm hover:bg-blue-50 transition"
                            title={PERMISSION_DESCRIPTIONS[perm] || ""}
                          >
                            <input
                              type="checkbox"
                              checked={permissions.includes(perm)}
                              onChange={() => handlePermissionChange(perm)}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-3 capitalize text-gray-700">
                              {perm.replace(/_/g, " ")}
                            </span>
                            {PERMISSION_DESCRIPTIONS[perm] && (
                              <span
                                className="ml-2 text-gray-400 text-xs"
                                title={PERMISSION_DESCRIPTIONS[perm]}
                              >
                                ⓘ
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Accessible Files & Folders
                </h2>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
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
              {/* Security Groups Section */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Security Groups by Department
                  </h2>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                    onClick={() => setShowNewGroupForm(true)}
                  >
                    + Add Security Group
                  </button>
                </div>
                <div className="space-y-6">
                  {securityGroups.length === 0 && (
                    <div className="text-gray-400 text-center">
                      No security groups yet.
                    </div>
                  )}
                  {securityGroups.map((group) => (
                    <div
                      key={group.id}
                      className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-blue-700">{group.name}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({group.department})
                          </span>
                        </div>
                        <button
                          className="text-blue-600 underline text-sm"
                          onClick={() => setSelectedGroup({ ...group })}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mb-1">
                        <span className="font-medium text-gray-600">
                          Permissions:
                        </span>
                        <span className="ml-2 flex flex-wrap gap-1">
                          {group.permissions.length === 0 ? (
                            <span className="text-gray-400">None</span>
                          ) : (
                            group.permissions.map((p) => (
                              <span
                                key={p}
                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                              >
                                {p.replace(/_/g, " ")}
                              </span>
                            ))
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Accessible Resources:
                        </span>
                        <span className="ml-2 flex flex-wrap gap-1">
                          {group.resources.length === 0 ? (
                            <span className="text-gray-400">None</span>
                          ) : (
                            group.resources.map((rid) => {
                              const res = allResources.find((r) => r.id === rid);
                              return (
                                <span
                                  key={rid}
                                  className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs"
                                >
                                  {res ? res.name || res.fileName : rid}
                                </span>
                              );
                            })
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Security Group Modal */}
              {showNewGroupForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowNewGroupForm(false);
                        setNewGroup({
                          name: "",
                          department: "",
                          permissions: [],
                          resources: [],
                        });
                      }}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      Create Security Group
                    </h3>
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Group Name"
                        value={newGroup.name}
                        onChange={(e) =>
                          setNewGroup((g) => ({ ...g, name: e.target.value }))
                        }
                        className="border px-3 py-2 rounded w-full mb-2"
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        value={newGroup.department}
                        onChange={(e) =>
                          setNewGroup((g) => ({ ...g, department: e.target.value }))
                        }
                        className="border px-3 py-2 rounded w-full"
                      />
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Permissions:</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                        {allPermissions.map((perm) => (
                          <label key={perm} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newGroup.permissions.includes(perm)}
                              onChange={() =>
                                setNewGroup((g) => ({
                                  ...g,
                                  permissions: g.permissions.includes(perm)
                                    ? g.permissions.filter((p) => p !== perm)
                                    : [...g.permissions, perm],
                                }))
                              }
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">
                              {perm.replace(/_/g, " ")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">
                        Accessible Resources:
                      </span>
                      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white mt-2">
                        {allResources.map((res) => (
                          <label key={res.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newGroup.resources.includes(res.id)}
                              onChange={() =>
                                setNewGroup((g) => ({
                                  ...g,
                                  resources: g.resources.includes(res.id)
                                    ? g.resources.filter((rid) => rid !== res.id)
                                    : [...g.resources, res.id],
                                }))
                              }
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">{res.name || res.fileName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                        onClick={() => {
                          if (!newGroup.name.trim() || !newGroup.department.trim())
                            return;
                          setSecurityGroups((groups) => [
                            ...groups,
                            {
                              ...newGroup,
                              id: Date.now(),
                            },
                          ]);
                          setPermissions((prev) =>
                            Array.from(new Set([...prev, ...newGroup.permissions]))
                          );
                          setSelectedResources((prev) =>
                            Array.from(new Set([...prev, ...newGroup.resources]))
                          );
                          setNewGroup({
                            name: "",
                            department: "",
                            permissions: [],
                            resources: [],
                          });
                          setShowNewGroupForm(false);
                        }}
                      >
                        Create
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
                        onClick={() => {
                          setShowNewGroupForm(false);
                          setNewGroup({
                            name: "",
                            department: "",
                            permissions: [],
                            resources: [],
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Security Group Modal */}
              {selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedGroup(null)}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      Edit Security Group: {selectedGroup.name}
                    </h3>
                    {/* Permissions */}
                    <div className="mb-4">
                      <span className="font-medium text-gray-600">Permissions:</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                        {allPermissions.map((perm) => (
                          <label key={perm} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedGroup.permissions.includes(perm)}
                              onChange={() => {
                                setSelectedGroup((prev) => ({
                                  ...prev,
                                  permissions: prev.permissions.includes(perm)
                                    ? prev.permissions.filter((p) => p !== perm)
                                    : [...prev.permissions, perm],
                                }));
                              }}
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">
                              {perm.replace(/_/g, " ")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Resources */}
                    <div className="mb-4">
                      <span className="font-medium text-gray-600">
                        Accessible Resources:
                      </span>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 mt-2">
                        {allResources.map((res) => (
                          <label key={res.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedGroup.resources.includes(res.id)}
                              onChange={() => {
                                setSelectedGroup((g) => ({
                                  ...g,
                                  resources: g.resources.includes(res.id)
                                    ? g.resources.filter((rid) => rid !== res.id)
                                    : [...g.resources, res.id],
                                }));
                              }}
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">{res.name || res.fileName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                        onClick={() => {
                          setSecurityGroups((groups) =>
                            groups.map((g) =>
                              g.id === selectedGroup.id ? { ...selectedGroup } : g
                            )
                          );
                          setSelectedGroup(null);
                        }}
                      >
                        Save Group
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
                        onClick={() => setSelectedGroup(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;