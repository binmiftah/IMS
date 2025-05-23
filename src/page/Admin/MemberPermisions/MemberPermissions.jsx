import React, { useEffect, useState } from "react";
import Navbar from "../../../component/Navbar.jsx";
import { toast } from "react-toastify";
import apiCall from "../../../pkg/api/internal.js";

const MemberPermissions = () => {
  // State
  const [users, setUsers] = useState([]); // List of all users
  const [selectedUser, setSelectedUser] = useState(null); // Selected user for individual permissions
  const [permissions, setPermissions] = useState([]); // Permissions for the selected user
  const [allPermissions, setAllPermissions] = useState([]); // All available permissions
  const [folders, setFolders] = useState([]); // List of all folders
  const [selectedFolders, setSelectedFolders] = useState([]); // Folders the user can access
  const [securityGroups, setSecurityGroups] = useState([]); // List of security groups
  const [selectedGroup, setSelectedGroup] = useState(null); // Selected group for editing
  const [showNewGroupForm, setShowNewGroupForm] = useState(false); // Show "Create Group" modal
  const [newGroup, setNewGroup] = useState({
    name: "",
    department: "",
    permissions: [],
    resources: [],
  }); // New group details
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    setLoading(true);
    apiCall
      .getAllUsers("users") // Fetch all users
      .then((res) => {
        console.log("Fetched Users:", res); // Debugging log
        const usersData = res.data?.users || []; // Access users from res.data.users
        setUsers(Array.isArray(usersData) ? usersData : []); // Ensure usersData is an array
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users.");
        setUsers([]); // Fallback to an empty array
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch static permissions
    const staticPermissions = apiCall.getStaticPermissions();
    setAllPermissions(staticPermissions);
  }, []);

  // Log all permissions for debugging
  useEffect(() => {
    console.log("All Permissions:", allPermissions); // Debugging log
  }, [allPermissions]);

  // Fetch user permissions when a user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    } else {
      setPermissions([]);
      setSelectedFolders([]);
    }
  }, [selectedUser]);

  // Fetch permissions for a specific user
  const fetchUserPermissions = async (userId) => {
    try {
      const res = await apiCall.getUserPermissions(`permissions/user/${userId}`);
      console.log("Fetched User Permissions:", res); // Debugging log

      const userPermissions = res.data?.data?.permissions || [];
      const userFolders = res.data?.data?.folderIds || [];

      setPermissions(userPermissions); // Set the user's permissions
      setSelectedFolders(userFolders); // Set the user's accessible folders

      console.log("User Permissions:", userPermissions); // Debugging log
      console.log("User Folders:", userFolders); // Debugging log
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      toast.error("Failed to load user permissions.");
      setPermissions([]); // Reset permissions on error
      setSelectedFolders([]); // Reset folders on error
    }
  };

  // Save individual user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) {
      toast.error("Please select a user.");
      return;
    }

    if (selectedFolders.length === 0) {
      toast.error("Please select at least one folder.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        resourceType: "FOLDER",
        permissions, // Selected permissions
        folderIds: selectedFolders, // Selected folders
        accountId: selectedUser.id, // User ID
        inherited: false,
      };

      console.log("Saving permissions for user:", payload); // Debugging log

      const response = await apiCall.createMemberPermission("permissions", payload);
      console.log("Save response from backend:", response); // Debugging log
      console.log("Backend response:", res);

      toast.success("Permissions saved successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Save group permissions
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.department.trim()) {
      toast.error("Please provide a valid group name and department.");
      return;
    }
    setSaving(true);
    try {
      await apiCall.createGroupPermission("permissions/group", {
        resourceType: "FOLDER",
        permissions: newGroup.permissions,
        folderIds: newGroup.resources,
        groupName: newGroup.name,
        department: newGroup.department,
        inherited: false,
      });
      toast.success("Group created successfully!");
      setSecurityGroups((prev) => [
        ...prev,
        { ...newGroup, id: Date.now() }, // Add the new group to the list
      ]);
      setNewGroup({ name: "", department: "", permissions: [], resources: [] }); // Reset the form
      setShowNewGroupForm(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navbar />
      <div className="w-4/5 mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Member Permissions
            </span>
          </h1>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-gray-500 text-lg">Loading...</span>
            </div>
          ) : (
            <div>
              {/* Individual User Permissions */}
              <div className="mb-8">
                {/* User Selection Dropdown */}
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Set Individual User Permissions
                </h2>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  value={selectedUser?.id || ""}
                  onChange={(e) => {
                    const user = users.find((user) => user.id === e.target.value);
                    setSelectedUser(user);
                    if (user) {
                      fetchUserPermissions(user.id); // Fetch permissions for the selected user
                    }
                  }}
                  disabled={users.length === 0} // Disable if no users are available
                >
                  <option value="">Select a user</option>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No users available
                    </option>
                  )}
                </select>

                {/* Permissions Section for Selected User */}
                {selectedUser && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {allPermissions.map((perm) => (
                        <label key={perm} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm)}
                            onChange={() =>
                              setPermissions((prev) =>
                                prev.includes(perm)
                                  ? prev.filter((p) => p !== perm)
                                  : [...prev, perm]
                              )
                            }
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2">{perm.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {/* Accessible Folders Section */}
                {selectedUser && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Accessible Folders</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {folders.map((folder) => (
                        <label key={folder.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFolders.includes(folder.id)}
                            onChange={() =>
                              setSelectedFolders((prev) =>
                                prev.includes(folder.id)
                                  ? prev.filter((f) => f !== folder.id)
                                  : [...prev, folder.id]
                              )
                            }
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                          <span className="ml-2">{folder.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                <button
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  onClick={handleSaveUserPermissions}
                >
                  Save User Permissions
                </button>
              </div>

              {/* Security Groups Section */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Security Groups
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
                              const res = folders.find((r) => r.id === rid);
                              return (
                                <span
                                  key={rid}
                                  className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs"
                                >
                                  {res ? res.name : rid}
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
                        {folders.map((res) => (
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
                            <span className="ml-2">{res.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                        onClick={handleCreateGroup}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberPermissions;