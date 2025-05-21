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
  const [groups, setGroups] = useState([]); // List of groups
  const [newGroup, setNewGroup] = useState({
    name: "",
    permissions: [],
    folders: [],
    users: [],
  }); // New group details
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiCall.getAllUsers("users"), // Fetch all users
      apiCall.getAllPermissions("permissions"), // Fetch all available permissions
      apiCall.getAllFolders("folders"), // Fetch all folders
    ])
      .then(([usersData, permissionsData, foldersData]) => {
        setUsers(usersData);
        setAllPermissions(
          Array.isArray(permissionsData) && typeof permissionsData[0] === "object"
            ? permissionsData.map((p) => p.name)
            : permissionsData
        );
        setFolders(foldersData);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Save individual user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) {
      toast.error("Please select a user.");
      return;
    }
    setSaving(true);
    try {
      await apiCall.createMemberPermission("permissions/member", {
        resourceType: "FOLDER",
        permissions,
        folderIds: selectedFolders,
        accountId: selectedUser.id,
        inherited: false,
      });
      toast.success("Permissions saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Save group permissions
  const handleSaveGroup = async () => {
    if (!newGroup.name) {
      toast.error("Please provide a group name.");
      return;
    }
    setSaving(true);
    try {
      await apiCall.createGroupPermission("permissions/group", {
        resourceType: "FOLDER",
        permissions: newGroup.permissions,
        folderIds: newGroup.folders,
        userIds: newGroup.users,
        groupName: newGroup.name,
        inherited: false,
      });
      toast.success("Group created successfully!");
      setNewGroup({ name: "", permissions: [], folders: [], users: [] }); // Reset group form
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
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Set Individual User Permissions
                </h2>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  value={selectedUser?.id || ""}
                  onChange={(e) =>
                    setSelectedUser(users.find((user) => user.id === e.target.value))
                  }
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
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
                    <button
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      onClick={handleSaveUserPermissions}
                    >
                      Save User Permissions
                    </button>
                  </>
                )}
              </div>

              {/* Group Permissions */}
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Create Group and Set Permissions
                </h2>
                <input
                  type="text"
                  placeholder="Group Name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newGroup.permissions.includes(perm)}
                        onChange={() =>
                          setNewGroup((prev) => ({
                            ...prev,
                            permissions: prev.permissions.includes(perm)
                              ? prev.permissions.filter((p) => p !== perm)
                              : [...prev.permissions, perm],
                          }))
                        }
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">{perm.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
                <h3 className="text-lg font-semibold mb-2">Accessible Folders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {folders.map((folder) => (
                    <label key={folder.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newGroup.folders.includes(folder.id)}
                        onChange={() =>
                          setNewGroup((prev) => ({
                            ...prev,
                            folders: prev.folders.includes(folder.id)
                              ? prev.folders.filter((f) => f !== folder.id)
                              : [...prev.folders, folder.id],
                          }))
                        }
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">{folder.name}</span>
                    </label>
                  ))}
                </div>
                <h3 className="text-lg font-semibold mb-2">Add Users to Group</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newGroup.users.includes(user.id)}
                        onChange={() =>
                          setNewGroup((prev) => ({
                            ...prev,
                            users: prev.users.includes(user.id)
                              ? prev.users.filter((u) => u !== user.id)
                              : [...prev.users, user.id],
                          }))
                        }
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">{user.fullName}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  onClick={handleSaveGroup}
                >
                  Save Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberPermissions;