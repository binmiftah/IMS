import React, { useEffect, useState } from "react";
import Navbar from "../../../component/Navbar.jsx";
import { toast } from "react-toastify";
import apiCall from "../../../pkg/api/internal.js";
import FolderTree from "../../../component/FolderTree.jsx";

const MemberPermissions = () => {
  // Safe array check utility function - defined first so it can be used in initial state
  const safeArrayCheck = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  // Initialize ALL states with safe default values
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [securityGroups, setSecurityGroups] = useState([]);
  const [securityGroupsLoading, setSecurityGroupsLoading] = useState(false);
  
  // Initialize form states with safe defaults
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    department: "",
    permissions: [],
    resources: [],
    users: []
  });
  
  // Group management states
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [groupToManage, setGroupToManage] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Edit group states
  const [showEditGroupForm, setShowEditGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState({
    id: "",
    name: "",
    department: "",
    permissions: [],
    resources: [],
    users: []
  });

  useEffect(() => {
    setLoading(true);
    // Ensure initial state arrays are valid
    setPermissions([]);
    setSelectedFolders([]);
    setSecurityGroups([]);
    setSelectedUsers([]);

    apiCall
      .getAllUsers("users")
      .then((res) => {
        console.log("Raw API response for users:", res);

        // Try to handle different response structures
        let usersData = [];

        if (res.data?.users) {
          usersData = res.data.users;
        } else if (res.data?.data) {
          usersData = res.data.data;
        } else if (Array.isArray(res.data)) {
          usersData = res.data;
        } else if (Array.isArray(res)) {
          usersData = res;
        }

        // Ensure each user has an id
        const validUsers = usersData.filter(user => user && user.id);

        console.log("Processed users with IDs:", validUsers);
        setUsers(validUsers);

        if (validUsers.length === 0) {
          console.warn("No valid users found with IDs");
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users.");
        setUsers([]);
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

  // Fetch resources (folders and files)
  const fetchResources = async () => {
    try {
      // Fetch folders and files concurrently
      const [foldersRes, filesRes] = await Promise.all([
        apiCall.getFolder("files/folders"), // Fetch folders
        apiCall.getFile("files"), // Fetch files
      ]);

      console.log("Fetched Folders:", foldersRes); // Debugging log
      console.log("Fetched Files:", filesRes); // Debugging log

      const folderData = Array.isArray(foldersRes) ? foldersRes : [];
      const fileData = Array.isArray(filesRes) ? filesRes : [];

      // Combine folders and files into a single list
      const resources = [
        ...folderData.map((folder) => ({ ...folder, type: "folder" })),
        ...fileData.map((file) => ({ ...file, type: "file" })),
      ];

      setFolders(resources); // Update the folders state with combined resources
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources.");
      setFolders([]); // Reset folders on error
    }
  };

  // Save individual user permissions
  const handleSaveUserPermissions = async () => {
    console.log("Saving permissions for user:", selectedUser);
    if (!selectedUser) {
      toast.warning("Please select a user to update permissions");
      return;
    }

    if (!selectedUser.id) {
      console.error("Selected user has no ID property:", selectedUser);
      toast.error("Invalid user selection. Please try selecting the user again.");
      return;
    }

    if (permissions.length === 0 || selectedFolders.length === 0) {
      toast.warning("Please select at least one permission and resource");
      return;
    }

    try {
      setSaving(true);

      // Ensure we have a valid account ID
      if (!selectedUser.id) {
        throw new Error("Selected user has no ID");
      }

      // Format the data correctly for the API
      const permissionData = {
        accountId: selectedUser.id,
        resourceType: "FOLDER",
        permissions: permissions.length > 0 ? permissions : ["READ_FILES"],
        folderIds: selectedFolders,
        inherited: false,
      };

      console.log("Saving permissions for user:", permissionData);

      // Call API to save permissions
      const response = await apiCall.createMemberPermission("permissions", permissionData);

      if (response && response.status === "success") {
        toast.success("Permissions updated successfully");

        // Refresh user permissions to show the updated state
        fetchUserPermissions(selectedUser.id);
      } else {
        toast.error("Failed to update permissions");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);

      // More detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to update permissions. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Update the handleCreateGroup function to use the correct endpoint

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error("Please provide a valid group name.");
      return;
    }
    setSaving(true);
    try {
      // First create the security group using the correct endpoint
      const createGroupResponse = await apiCall.instance1.post("security-group", {
        name: newGroup.name,
        description: newGroup.department // Use department as the description
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      console.log("Group created:", createGroupResponse.data.data.securityGroup.id);
      
      // Get the newly created group ID
      const groupId = createGroupResponse.data.data.securityGroup.id;

          
      
      if (!groupId) {
        throw new Error("Failed to get group ID from response");
      }
      
      // Now assign permissions to the group if resources are selected
      if (newGroup.permissions.length > 0 && newGroup.resources.length > 0) {
        // Map permissions to expected format (READ, WRITE, DELETE)
        const mappedPermissions = newGroup.permissions.map(perm => {
          if (perm === "READ_FILES") return "READ";
          if (perm === "WRITE_FILES") return "WRITE";
          if (perm === "DELETE_FILES") return "DELETE";
          return perm;
        });
        
        // Separate folders and files from the selected resources
        const folderIds = [];
        const fileIds = [];
        
        newGroup.resources.forEach(resourceId => {
          const resource = folders.find(item => item.id === resourceId);
          if (resource) {
            // Use name-based detection as fallback
            const isFolder = resource.type === 'folder' || 
                            (resource.mimeType && resource.mimeType.includes('folder')) ||
                            (!resource.fileExtension);
            
            if (isFolder) {
              folderIds.push(resourceId);
            } else {
              fileIds.push(resourceId);
            }
          }
        });
        
        // Process folders if any are selected
        if (folderIds.length > 0) {
          console.log(`Assigning ${mappedPermissions.length} permissions to ${folderIds.length} folders`);
          await apiCall.createGroupFolderPermission(groupId, {
            permissions: mappedPermissions,
            folderIds: folderIds,
            inherited: false
          });
        }
        
        // Process files if any are selected
        if (fileIds.length > 0) {
          console.log(`Assigning ${mappedPermissions.length} permissions to ${fileIds.length} files`);
          await apiCall.createGroupFilePermission(groupId, {
            permissions: mappedPermissions,
            fileIds: fileIds,
            inherited: false
          });
        }
      }

      // If users were selected, add them to the group - one by one using the correct endpoint
      if (newGroup.users.length > 0) {
        for (const userId of newGroup.users) {
          try {
            await apiCall.instance1.post(`security-group/${groupId}/add-user`, {
              userId: userId
            }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });
            console.log(`Added user ${userId} to group ${groupId}`);
          } catch (userError) {
            console.error(`Error adding user ${userId} to group:`, userError);
          }
        }
      }

      toast.success("Group created successfully with assigned users!");
      
      // Add the new group to the list with its users
      setSecurityGroups((prev) => [
        ...prev,
        {
          ...newGroup,
          id: groupId,
          userCount: newGroup.users.length
        }
      ]);
      
      // Reset the form
      setNewGroup({
        name: "",
        department: "",
        permissions: [],
        resources: [],
        users: []
      });
      
      setShowNewGroupForm(false);
    } catch (error) {
      console.error(error);
      
      // More detailed error message
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to create group. Please check the console for details.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Fetch security groups
  useEffect(() => {
    const fetchSecurityGroups = async () => {
      setSecurityGroupsLoading(true);
      try {
        const response = await apiCall.getSecurityGroups();
        
        console.log("Security groups response:", response);
        
        // Handle the nested data structure correctly
        if (response?.data?.securityGroups) {
          // This is the correct path based on your console logs
          setSecurityGroups(response.data.securityGroups);
        } else if (response?.data && Array.isArray(response.data)) {
          // Handle the case where data is directly an array
          setSecurityGroups(response.data);
        } else if (Array.isArray(response)) {
          // Handle the case where the response itself is an array
          setSecurityGroups(response);
        } else {
          console.warn("Unexpected security groups response format:", response);
          // Initialize with an empty array to prevent mapping errors
          setSecurityGroups([]);
        }
      } catch (error) {
        console.error("Error fetching security groups:", error);
        // Initialize with an empty array to prevent mapping errors
        setSecurityGroups([]);
      } finally {
        setSecurityGroupsLoading(false);
      }
    };

    fetchSecurityGroups();
  }, []);

  useEffect(() => {
    fetchResources(); // Fetch folders and files on component mount
  }, []);

  // Add this function to handle opening the manage users modal
  const handleManageUsers = (group) => {
    setGroupToManage(group);
    
    // Safely initialize selectedUsers
    let initialUsers = [];
    
    // Check if group.users exists and is an array
    if (group.users && Array.isArray(group.users)) {
      // Map user IDs with safety check
      initialUsers = group.users
        .filter(user => user && user.id) // Only include users with valid IDs
        .map(user => user.id);
    }
    
    setSelectedUsers(initialUsers);
    setShowManageUsersModal(true);
  };

  // Update the handleSaveGroupUsers function to use the correct endpoint

  const handleSaveGroupUsers = async () => {
    if (!groupToManage) return;
    
    try {
      setSaving(true);
      
      // Get the current users in the group
      const currentUsers = groupToManage.users?.map(user => user.id) || [];
      
      // Figure out which users to add and which to remove
      const usersToAdd = selectedUsers.filter(id => !currentUsers.includes(id));
      const usersToRemove = currentUsers.filter(id => !selectedUsers.includes(id));
      
      console.log(`Adding ${usersToAdd.length} users and removing ${usersToRemove.length} users`);
      
      // Add new users to the group - one by one
      for (const userId of usersToAdd) {
        try {
          await apiCall.instance1.post(`security-group/${groupToManage.id}/add-user`, {
            userId: userId
          }, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });
          console.log(`Added user ${userId} to group ${groupToManage.id}`);
        } catch (error) {
          console.error(`Error adding user ${userId} to group:`, error);
        }
      }
      
      // Remove users from the group if needed - assuming there's an endpoint for this
      // If there's no endpoint for removing users, this code should be modified
      for (const userId of usersToRemove) {
        try {
          await apiCall.instance1.delete(`security-group/${groupToManage.id}/remove-user/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });
          console.log(`Removed user ${userId} from group ${groupToManage.id}`);
        } catch (error) {
          console.error(`Error removing user ${userId} from group:`, error);
        }
      }
      
      toast.success("Group members updated successfully!");
      
      // Update the local state to reflect changes
      setSecurityGroups(prev => 
        prev.map(group => 
          group.id === groupToManage.id 
            ? { ...group, users: selectedUsers, userCount: selectedUsers.length } 
            : group
        )
      );
      
      setShowManageUsersModal(false);
    } catch (error) {
      console.error("Error updating group members:", error);
      toast.error("Failed to update group members");
    } finally {
      setSaving(false);
    }
  };

  // Replace your handleEditGroup function with this safer version

  const handleEditGroup = (group) => {
    if (!group) {
      console.error("Cannot edit undefined group");
      return;
    }
    
    // Create a copy of the group for editing with guaranteed safe defaults
    setEditingGroup({
      id: group.id || "",
      name: group.name || "",
      department: group.department || "",
      permissions: Array.isArray(group.permissions) ? [...group.permissions] : [],
      resources: Array.isArray(group.resources) ? [...group.resources] : [],
      users: Array.isArray(group.users) 
        ? group.users.filter(user => user && user.id).map(user => user.id)
        : []
    });
    
    setShowEditGroupForm(true);
  };

  // Function to save group edits
  const handleSaveGroupEdit = async () => {
    if (!editingGroup) return;
    
    try {
      setSaving(true);
      
      // Update the group details
      await apiCall.instance1.put(`security-group/${editingGroup.id}`, {
        name: editingGroup.name,
        description: editingGroup.department
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      // Update permissions if they changed
      // Map permissions to expected format (READ, WRITE, DELETE)
      const mappedPermissions = editingGroup.permissions.map(perm => {
        if (perm === "READ_FILES") return "READ";
        if (perm === "WRITE_FILES") return "WRITE";
        if (perm === "DELETE_FILES") return "DELETE";
        return perm;
      });
      
      // Separate folders and files from the selected resources
      const folderIds = [];
      const fileIds = [];
      
      editingGroup.resources.forEach(resourceId => {
        const resource = folders.find(item => item.id === resourceId);
        if (resource) {
          const isFolder = resource.type === 'folder' || 
                          (resource.mimeType && resource.mimeType.includes('folder')) ||
                          (!resource.fileExtension);
          
          if (isFolder) {
            folderIds.push(resourceId);
          } else {
            fileIds.push(resourceId);
          }
        }
      });
      
      // Update folder permissions
      if (folderIds.length > 0) {
        await apiCall.createGroupFolderPermission(editingGroup.id, {
          permissions: mappedPermissions,
          folderIds: folderIds,
          inherited: false
        });
      }
      
      // Update file permissions
      if (fileIds.length > 0) {
        await apiCall.createGroupFilePermission(editingGroup.id, {
          permissions: mappedPermissions,
          fileIds: fileIds,
          inherited: false
        });
      }
      
      // Update users if needed (optional - we could also use the handleManageUsers function)
      
      toast.success("Group updated successfully!");
      
      // Update the UI to reflect changes
      setSecurityGroups(prev => 
        prev.map(group => 
          group.id === editingGroup.id 
            ? {
                ...group,
                name: editingGroup.name,
                department: editingGroup.department,
                permissions: editingGroup.permissions,
                resources: editingGroup.resources
              } 
            : group
        )
      );
      
      setShowEditGroupForm(false);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Function to delete a group
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this security group? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiCall.instance1.delete(`security-group/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      toast.success("Security group deleted successfully");
      
      // Update the UI to remove the deleted group
      setSecurityGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete security group");
    }
  };

  useEffect(() => {
    // Ensure editingGroup always has the required properties with valid types
    if (showEditGroupForm && editingGroup) {
      // Make sure permissions is always an array
      if (!Array.isArray(editingGroup.permissions)) {
        setEditingGroup(prev => ({
          ...prev,
          permissions: []
        }));
      }
      
      // Make sure resources is always an array
      if (!Array.isArray(editingGroup.resources)) {
        setEditingGroup(prev => ({
          ...prev,
          resources: []
        }));
      }
    }
  }, [showEditGroupForm, editingGroup]);

  // Add this useEffect to validate newGroup data

  useEffect(() => {
    // Ensure newGroup always has the required properties with valid types
    if (showNewGroupForm) {
      // Make sure permissions is always an array
      if (!Array.isArray(newGroup.permissions)) {
        setNewGroup(prev => ({
          ...prev,
          permissions: []
        }));
      }
      
      // Make sure resources is always an array
      if (!Array.isArray(newGroup.resources)) {
        setNewGroup(prev => ({
          ...prev,
          resources: []
        }));
      }
      
      // Make sure users is always an array
      if (!Array.isArray(newGroup.users)) {
        setNewGroup(prev => ({
          ...prev,
          users: []
        }));
      }
    }
  }, [showNewGroupForm, newGroup]);

  // Inside your component return statement
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
          
          {/* Load initial data first */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-gray-500 text-lg">Loading permissions data...</span>
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
                    const userId = e.target.value;
                    console.log("Selected user ID from dropdown:", userId);

                    if (!userId) {
                      setSelectedUser(null);
                      return;
                    }

                    const user = users.find(user => user.id === userId);
                    console.log("Found user object:", user);

                    if (user && user.id) {
                      setSelectedUser(user);
                      fetchUserPermissions(user.id);
                    } else {
                      console.error("Invalid user selected:", user);
                      toast.error("Error selecting user. Please try again.");
                    }
                  }}
                  disabled={users.length === 0}
                >
                  <option value="">Select a user</option>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => {
                      // console.log("User in dropdown:", user);
                      return (
                        <option key={user.id} value={user.id}>
                          {user.fullName || user.email || user.username || user.id}
                        </option>
                      );
                    })
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
                            checked={safeArrayCheck(permissions).includes(perm)}
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
                    <h3 className="text-lg font-semibold mb-2">Accessible Resources</h3>
                    <div className="border rounded-lg p-3 max-h-96 overflow-auto">
                      <FolderTree
                        items={folders}
                        selectedItems={safeArrayCheck(selectedFolders)}
                        onSelectionChange={setSelectedFolders}
                      />
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
                  <div className="flex gap-2">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded font-medium"
                      onClick={() => {
                        setSecurityGroupsLoading(true);
                        const fetchGroups = async () => {
                          try {
                            const response = await apiCall.getSecurityGroups();
                            if (response?.data?.securityGroups) {
                              setSecurityGroups(response.data.securityGroups);
                            }
                          } catch (error) {
                            console.error("Error refreshing groups:", error);
                          } finally {
                            setSecurityGroupsLoading(false);
                          }
                        };
                        fetchGroups();
                      }}
                      title="Refresh security groups"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                      onClick={() => setShowNewGroupForm(true)}
                    >
                      + Add Security Group
                    </button>
                  </div>
                </div>
                {securityGroupsLoading ? (
                  <div className="text-center p-4">
                    <span className="text-gray-500">Loading security groups...</span>
                  </div>
                ) : (
                  <>
                    {/* Add a guard clause to ensure securityGroups is an array */}
                    {Array.isArray(securityGroups) && securityGroups.length > 0 ? (
                      securityGroups.map(group => (
                        <div key={group.id} className="mb-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                              {group.department && (
                                <p className="text-sm text-gray-600 mt-1">Department: {group.department}</p>
                              )}
                              
                              {/* Group stats */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {group.userCount || 0} Users
                                </span>
                                
                                {group.permissions && group.permissions.length > 0 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {group.permissions.length} Permissions
                                  </span>
                                )}
                                
                                {group.resources && group.resources.length > 0 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {group.resources.length} Resources
                                  </span>
                                )}
                              </div>
                              
                              {/* Collapsible sections for details */}
                              <div className="mt-3 space-y-2">
                                {/* Permissions section */}
                                {group.permissions && group.permissions.length > 0 && (
                                  <details className="text-sm">
                                    <summary className="font-medium text-gray-700 cursor-pointer">
                                      Permissions
                                    </summary>
                                    <div className="pl-4 pt-2 flex flex-wrap gap-1">
                                      {group.permissions.map(perm => (
                                        <span key={perm} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                          {perm.replace(/_/g, " ")}
                                        </span>
                                      ))}
                                    </div>
                                  </details>
                                )}
                                
                                {/* Users section */}
                                {group.users && group.users.length > 0 && (
                                  <details className="text-sm">
                                    <summary className="font-medium text-gray-700 cursor-pointer">
                                      Members
                                    </summary>
                                    <div className="pl-4 pt-2">
                                      <ul className="list-disc list-inside">
                                        {group.users.map(user => (
                                          <li key={user.id} className="text-gray-600">
                                            {user.fullName || user.email || user.username}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </details>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200"
                                title="Edit group properties and permissions"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleManageUsers(group)}
                                className="px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded border border-green-200"
                                title="Manage group members"
                              >
                                Members
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
                                title="Delete this group"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 border rounded bg-gray-50">
                        <p className="text-gray-500">No security groups found. Create your first group.</p>
                      </div>
                    )}
                  </>
                )}
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
                              // Add a safety check here
                              checked={safeArrayCheck(newGroup.permissions).includes(perm)}
                              onChange={() =>
                                setNewGroup((g) => ({
                                  ...g,
                                  permissions: Array.isArray(g.permissions) 
                                    ? (g.permissions.includes(perm)
                                        ? g.permissions.filter((p) => p !== perm)
                                        : [...g.permissions, perm])
                                    : [perm]
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
                      <div className="max-h-64 overflow-y-auto border rounded p-2 bg-white mt-2">
                        <FolderTree
                          items={folders}
                          selectedItems={safeArrayCheck(newGroup.resources)}
                          onSelectionChange={(resources) => setNewGroup(prev => ({ ...prev, resources }))}
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Group Members:</span>
                      <div className="max-h-48 overflow-y-auto border rounded p-2 bg-white mt-2">
                        {users.length === 0 ? (
                          <div className="text-gray-500 text-center p-2">No users available</div>
                        ) : (
                          <div className="space-y-2">
                            {users.map(user => (
                              <label key={user.id} className={`flex items-center p-2 rounded ${
                                newGroup.users.includes(user.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={safeArrayCheck(newGroup.users).includes(user.id)}
                                  onChange={() =>
                                    setNewGroup(g => ({
                                      ...g,
                                      users: g.users.includes(user.id)
                                        ? g.users.filter(id => id !== user.id)
                                        : [...g.users, user.id]
                                    }))
                                  }
                                  className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-gray-700 font-medium">
                                  {user.fullName || user.email || user.username}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
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

              {/* Manage Users in Group Modal */}
              {showManageUsersModal && groupToManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowManageUsersModal(false);
                        setGroupToManage(null);
                        setSelectedUsers([]); // Reset to empty array
                      }}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      Manage Users for {groupToManage.name}
                    </h3>
                    
                    <div className="max-h-64 overflow-y-auto border rounded p-2 bg-white">
                      {users.length === 0 ? (
                        <div className="text-gray-500 text-center p-2">No users available</div>
                      ) : (
                        <div className="space-y-2">
                          {users.map(user => {
                            // First, ensure the user has an ID
                            if (!user || !user.id) return null;
                            
                            // Safely check if the user ID is in selectedUsers
                            const isSelected = Array.isArray(selectedUsers) && 
                                                selectedUsers.includes(user.id);
                                                
                            return (
                              <label 
                                key={user.id} 
                                className={`flex items-center p-2 rounded ${
                                  isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    // Extra safety to ensure selectedUsers is always an array
                                    if (!Array.isArray(selectedUsers)) {
                                      setSelectedUsers([user.id]);
                                      return;
                                    }
                                    
                                    setSelectedUsers(prev =>
                                      prev.includes(user.id)
                                        ? prev.filter(id => id !== user.id)
                                        : [...prev, user.id]
                                    );
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-gray-700 font-medium">
                                  {user.fullName || user.email || user.username || user.id}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                        onClick={handleSaveGroupUsers}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
                        onClick={() => setShowManageUsersModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Security Group Modal */}
              {showEditGroupForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowEditGroupForm(false);
                        // Reset to a safe default state
                        setEditingGroup({
                          id: "",
                          name: "",
                          department: "",
                          permissions: [],
                          resources: [],
                          users: []
                        });
                      }}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      Edit Security Group
                    </h3>
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Group Name"
                        value={editingGroup?.name || ""}
                        onChange={(e) =>
                          setEditingGroup((g) => ({ ...g, name: e.target.value }))
                        }
                        className="border px-3 py-2 rounded w-full mb-2"
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        value={editingGroup?.department || ""}
                        onChange={(e) =>
                          setEditingGroup((g) => ({ ...g, department: e.target.value }))
                        }
                        className="border px-3 py-2 rounded w-full"
                      />
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Permissions:</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                        {/* Key defensive check: conditionally render this section only if allPermissions exists */}
                        {Array.isArray(allPermissions) && allPermissions.map((perm) => {
                          // Extra defensive check for each permission
                          if (!perm) return null;
                          
                          // Check with ultra-safe approach
                          const permissionsArray = safeArrayCheck(editingGroup?.permissions);
                          const isChecked = permissionsArray.includes(perm);
                          
                          return (
                            <label key={perm} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (!editingGroup) return;
                                  
                                  setEditingGroup((g) => {
                                    if (!g) return {
                                      id: "",
                                      name: "",
                                      department: "",
                                      permissions: [perm],
                                      resources: [],
                                      users: []
                                    };
                                    
                                    const currentPermissions = safeArrayCheck(g.permissions);
                                    const newPermissions = isChecked
                                      ? currentPermissions.filter(p => p !== perm)
                                      : [...currentPermissions, perm];
                                      
                                    return {
                                      ...g,
                                      permissions: newPermissions
                                    };
                                  });
                                }}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-gray-700">
                                {perm.replace(/_/g, " ")}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Resources:</span>
                      <div className="max-h-64 overflow-y-auto border rounded p-2 bg-white mt-2">
                        {editingGroup && (
                          <FolderTree
                            items={folders}
                            selectedItems={safeArrayCheck(editingGroup.resources)}
                            onSelectionChange={(resources) => 
                              setEditingGroup(prev => prev ? { ...prev, resources } : null)
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                        onClick={handleSaveGroupEdit}
                        disabled={saving || !editingGroup}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
                        onClick={() => {
                          setShowEditGroupForm(false);
                          setEditingGroup({
                            id: "",
                            name: "",
                            department: "",
                            permissions: [],
                            resources: [],
                            users: []
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