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

  // Add this helper function at the top of your component (after safeArrayCheck):
  const safeStringArray = (arr) => {https://www.youtube.com/watch?v=LO651UdyrcE&list=PLAV8AqZgfhJv5JMxEzh_bpou2_Ogzaaac&index=3
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => typeof item === 'string');
  };

  // Add this helper function after the safeArrayCheck function
  const isSuperAdminByRole = (user) => {
    if (!user || !user.role) return false;

    // Check specifically for SUPER_ADMIN role
    return user.role === 'SUPER_ADMIN';
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

        // Filter out super admins by role and ensure each user has an id
        const validUsers = usersData.filter(user => {
          // Basic validation - user must exist and have an ID
          if (!user || !user.id) {
            return false;
          }

          // Filter out SUPER_ADMIN users
          if (isSuperAdminByRole(user)) {
            console.log("Filtering out SUPER_ADMIN user:", user.fullName || user.email || user.username, "- Role:", user.role);
            return false;
          }

          return true;
        });

        console.log("Processed users (excluding SUPER_ADMIN):", validUsers);
        console.log(`Filtered out ${usersData.length - validUsers.length} SUPER_ADMIN users`);
        setUsers(validUsers);

        if (validUsers.length === 0) {
          console.warn("No valid non-admin users found");
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        toast.error("Failed to load users.");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Add this useEffect after the user fetching useEffect to log filtering results
  useEffect(() => {
    if (users.length > 0) {
      const totalLoaded = users.length;
      const superAdminUsersFiltered = users.filter(user => isSuperAdminByRole(user)).length;

      console.log(`SUPER_ADMIN filtering results:
      - Total users available: ${totalLoaded}
      - SUPER_ADMIN users (filtered from UI): ${superAdminUsersFiltered}
      - Regular users shown: ${totalLoaded - superAdminUsersFiltered}`);

      // Log SUPER_ADMIN users that are in the filtered list (should be 0 if filtering works)
      const superAdminUsersInList = users.filter(user => isSuperAdminByRole(user));
      if (superAdminUsersInList.length > 0) {
        console.warn("SUPER_ADMIN users found in filtered list (this should not happen):",
          superAdminUsersInList.map(user => ({
            id: user.id,
            name: user.fullName || user.email || user.username,
            role: user.role
          }))
        );
      }
    }
  }, [users]);

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

  // Update the handleCreateGroup function to only create the basic group
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error("Please provide a valid group name.");
      return;
    }

    if (!newGroup.department.trim()) {
      toast.error("Please provide a department.");
      return;
    }

    setSaving(true);
    try {
      // Only create the security group with name and department
      const createGroupResponse = await apiCall.instance1.post("security-group", {
        name: newGroup.name.trim(),
        description: newGroup.department.trim()
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      console.log("Group created:", createGroupResponse.data);

      toast.success(`Security group "${newGroup.name}" created successfully!`);

      // Reset the form to initial state
      setNewGroup({
        name: "",
        department: "",
      });

      setShowNewGroupForm(false);

      // Refresh the groups list to include the new group
      await refreshSecurityGroups();

    } catch (error) {
      console.error("Error creating group:", error);

      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Failed to create group. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Fetch security groups
  useEffect(() => {
    refreshSecurityGroups();
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

      // Filter out any SUPER_ADMIN users that might have been selected
      const filteredSelectedUsers = selectedUsers.filter(userId => {
        const user = users.find(u => u.id === userId);
        return user && !isSuperAdminByRole(user);
      });

      if (filteredSelectedUsers.length !== selectedUsers.length) {
        console.warn("Filtered out SUPER_ADMIN users from selection");
        setSelectedUsers(filteredSelectedUsers);
      }

      // Get the current users in the group (also filter out SUPER_ADMIN)
      const currentUsers = (groupToManage.users || [])
        .map(user => user.id)
        .filter(userId => {
          const user = users.find(u => u.id === userId);
          return user && !isSuperAdminByRole(user);
        });

      // Figure out which users to add and which to remove
      const usersToAdd = filteredSelectedUsers.filter(id => !currentUsers.includes(id));
      const usersToRemove = currentUsers.filter(id => !filteredSelectedUsers.includes(id));

      console.log(`Adding ${usersToAdd.length} users and removing ${usersToRemove.length} users (SUPER_ADMIN excluded)`);

      // Add new users to the group - one by one
      for (const userId of usersToAdd) {
        try {
          const user = users.find(u => u.id === userId);
          if (!isSuperAdminByRole(user)) { // Double-check by role
            await apiCall.instance1.post(`security-group/${groupToManage.id}/add-user`, {
              userId: userId
            }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });
            console.log(`Added user ${userId} to group ${groupToManage.id}`);
          } else {
            console.warn(`Skipped adding SUPER_ADMIN user ${userId} (role: ${user.role})`);
          }
        } catch (error) {
          console.error(`Error adding user ${userId} to group:`, error);
        }
      }

      // Remove users from the group if needed
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

      toast.success("Group members updated successfully! (SUPER_ADMIN users excluded)");

      // Update the local state to reflect changes
      setSecurityGroups(prev =>
        prev.map(group =>
          group.id === groupToManage.id
            ? { ...group, users: filteredSelectedUsers, userCount: filteredSelectedUsers.length }
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

  // Replace your handleEditGroup function with this updated version:
  const handleEditGroup = async (group) => {
    if (!group) {
      console.error("Cannot edit undefined group");
      return;
    }

    try {
      console.log("Fetching current permissions for group:", group.id);
      
      // Fetch current permissions from backend
      const permissionsResponse = await apiCall.instance1.get(`permissions/group/${group.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      console.log("Current group permissions from backend:", permissionsResponse.data);

      // Extract permissions and resources with better error handling
      let currentPermissions = [];
      let currentResources = [];

      if (permissionsResponse.data?.data?.permissions) {
        const permissionEntries = permissionsResponse.data.data.permissions;
        
        // Extract unique permissions from all permission entries
        const allPermissionsSet = new Set();
        const allResourcesSet = new Set();
        
        permissionEntries.forEach(entry => {
          // Extract permissions array from each entry
          if (entry.permissions && Array.isArray(entry.permissions)) {
            entry.permissions.forEach(perm => {
              if (typeof perm === 'string') {
                allPermissionsSet.add(perm);
              }
            });
          }
          
          // Extract resource IDs
          if (entry.resourceType === 'FOLDER' && entry.folderId) {
            allResourcesSet.add(entry.folderId);
          } else if (entry.resourceType === 'FILE' && entry.fileId) {
            allResourcesSet.add(entry.fileId);
          }
        });
        
        currentPermissions = Array.from(allPermissionsSet);
        currentResources = Array.from(allResourcesSet);
        
        console.log("Extracted permissions for editing:", currentPermissions);
        console.log("Extracted resources for editing:", currentResources);
      }

      // Create a copy of the group with current permissions from backend
      setEditingGroup({
        id: group.id || "",
        name: group.name || "",
        department: group.department || "",
        // Use extracted permissions from backend
        permissions: currentPermissions,
        // Use extracted resources from backend
        resources: currentResources,
        users: Array.isArray(group.users)
          ? group.users.filter(user => user && user.id).map(user => user.id)
          : []
      });

      setShowEditGroupForm(true);

    } catch (error) {
      console.error("Error fetching group permissions:", error);
      
      // Handle 404 specifically - group has no permissions yet
      if (error.response?.status === 404) {
        console.log(`Group ${group.id} has no permissions yet - starting with empty permissions`);
        
        setEditingGroup({
          id: group.id || "",
          name: group.name || "",
          department: group.department || "",
          permissions: [], // Start with empty permissions for new groups
          resources: [],  // Start with empty resources for new groups
          users: Array.isArray(group.users)
            ? group.users.filter(user => user && user.id).map(user => user.id)
            : []
        });
        
        setShowEditGroupForm(true);
      } else {
        // For other errors, fallback to local state
        setEditingGroup({
          id: group.id || "",
          name: group.name || "",
          department: group.department || "",
          permissions: Array.isArray(group.permissions) ? 
            group.permissions.filter(perm => typeof perm === 'string') : [],
          resources: Array.isArray(group.resources) ? group.resources : [],
          users: Array.isArray(group.users)
            ? group.users.filter(user => user && user.id).map(user => user.id)
            : []
        });

        setShowEditGroupForm(true);
        toast.warning("Could not fetch current permissions from server. Showing local data.");
      }
    }
  };

  // Function to save group edits using POST endpoints only
  const handleSaveGroupEdit = async () => {
    if (!editingGroup) return;

    try {
      setSaving(true);

      console.log("Creating/updating permissions for group:", editingGroup.id);
      console.log("Selected permissions:", editingGroup.permissions);
      console.log("Selected resources:", editingGroup.resources);

      // Convert permissions to uppercase format that backend expects
      const mappedPermissions = editingGroup.permissions.map(perm => {
        // Ensure permissions are in correct format
        return perm.toUpperCase();
      });

      // Only proceed with permissions if there are any selected
      if (mappedPermissions.length === 0) {
        toast.warning("No permissions selected for this group");
        setShowEditGroupForm(false);
        setSaving(false);
        return;
      }

      // Separate folders and files from the selected resources
      const folderIds = [];
      const fileIds = [];

      editingGroup.resources.forEach(resourceId => {
        const resource = folders.find(item => item.id === resourceId);
        if (resource) {
          // Better detection logic
          const isFolder = resource.type === 'folder' ||
            resource.mimeType === 'application/vnd.google-apps.folder' ||
            (!resource.fileName && !resource.fileExtension);

          if (isFolder) {
            folderIds.push(resourceId);
          } else {
            fileIds.push(resourceId);
          }
        }
      });

      console.log("Creating permissions for:", { folderIds, fileIds, mappedPermissions });

      let folderSuccess = false;
      let fileSuccess = false;

      // CREATE folder permissions using POST
      if (folderIds.length > 0) {
        console.log("Creating folder permissions for group:", editingGroup.id);
        try {
          const folderPermissionData = {
            resourceType: "FOLDER",
            permissions: mappedPermissions,
            folderIds: folderIds,
            groupId: editingGroup.id,
            inherited: false
          };

          console.log("Posting folder permissions with data:", folderPermissionData);

          const response = await apiCall.instance1.post("permissions/group/folder", folderPermissionData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          console.log("Folder permissions posted successfully:", response.data);
          folderSuccess = true;
          toast.success(`Posted folder permissions for ${folderIds.length} folders`);
        } catch (error) {
          console.error("Error posting folder permissions:", error);
          console.error("Error response:", error.response?.data);

          if (error.response?.data?.message) {
            toast.error(`Folder permissions error: ${error.response.data.message}`);
          } else {
            toast.error("Failed to post folder permissions");
          }
        }
      }

      // CREATE file permissions using POST
      if (fileIds.length > 0) {
        console.log("Creating file permissions for group:", editingGroup.id);
        try {
          const filePermissionData = {
            resourceType: "FILE",
            permissions: mappedPermissions,
            fileIds: fileIds,
            groupId: editingGroup.id,
            inherited: false
          };

          console.log("Posting file permissions with data:", filePermissionData);

          const response = await apiCall.instance1.post("permissions/group/file", filePermissionData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          console.log("File permissions posted successfully:", response.data);
          fileSuccess = true;
          toast.success(`Posted file permissions for ${fileIds.length} files`);
        } catch (error) {
          console.error("Error posting file permissions:", error);
          console.error("Error response:", error.response?.data);

          if (error.response?.data?.message) {
            toast.error(`File permissions error: ${error.response.data.message}`);
          } else {
            toast.error("Failed to post file permissions");
          }
        }
      }

      // Show overall success message and refresh group data
      if (folderSuccess || fileSuccess) {
        toast.success("Permissions posted successfully!");
        
        // Refresh the security groups to get updated permissions from backend
        await refreshSecurityGroups();
        
        setShowEditGroupForm(false);
      } else if (folderIds.length === 0 && fileIds.length === 0) {
        toast.info("No resources selected to create permissions for");
      } else {
        toast.error("Failed to post any permissions");
      }

    } catch (error) {
      console.error("Error in handleSaveGroupEdit:", error);
      toast.error("Failed to post permissions. Please try again.");
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

  // Add this function to fetch groups with their permissions
  const refreshSecurityGroups = async () => {
    setSecurityGroupsLoading(true);
    try {
      const response = await apiCall.getSecurityGroups();
      console.log("Security groups response:", response);

      let groupsData = [];
      
      // Handle the nested data structure correctly
      if (response?.data?.securityGroups) {
        groupsData = response.data.securityGroups;
      } else if (response?.data && Array.isArray(response.data)) {
        groupsData = response.data;
      } else if (Array.isArray(response)) {
        groupsData = response;
      }

      // For each group, fetch its permissions
      const groupsWithPermissions = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // Fetch group permissions from backend
            const permissionsResponse = await apiCall.instance1.get(`permissions/group/${group.id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });

            console.log(`Permissions for group ${group.id}:`, permissionsResponse.data);

            // Extract permissions and resources from response with better error handling
            let groupPermissions = [];
            let groupResources = [];

            if (permissionsResponse.data?.data?.permissions) {
              const permissionEntries = permissionsResponse.data.data.permissions;
              
              // Extract unique permissions from all permission entries
              const allPermissionsSet = new Set();
              const allResourcesSet = new Set();
              
              permissionEntries.forEach(entry => {
                // Extract permissions array from each entry
                if (entry.permissions && Array.isArray(entry.permissions)) {
                  entry.permissions.forEach(perm => {
                    if (typeof perm === 'string') {
                      allPermissionsSet.add(perm);
                    }
                  });
                }
                
                // Extract resource IDs
                if (entry.resourceType === 'FOLDER' && entry.folderId) {
                  allResourcesSet.add(entry.folderId);
                } else if (entry.resourceType === 'FILE' && entry.fileId) {
                  allResourcesSet.add(entry.fileId);
                }
              });
              
              groupPermissions = Array.from(allPermissionsSet);
              groupResources = Array.from(allResourcesSet);
              
              console.log(`Extracted permissions for group ${group.id}:`, groupPermissions);
              console.log(`Extracted resources for group ${group.id}:`, groupResources);
            }

            return {
              ...group,
              permissions: groupPermissions,
              resources: groupResources,
              userCount: group.users ? group.users.length : 0
            };
          } catch (error) {
            // Handle 404 and other errors gracefully - group simply has no permissions yet
            if (error.response?.status === 404) {
              console.log(`Group ${group.id} has no permissions yet (404 - this is normal for new groups)`);
            } else {
              console.error(`Error fetching permissions for group ${group.id}:`, error);
            }
            
            // Return group without permissions if fetch fails
            return {
              ...group,
              permissions: [],
              resources: [],
              userCount: group.users ? group.users.length : 0
            };
          }
        })
      );

      console.log("Groups with permissions:", groupsWithPermissions);
      setSecurityGroups(groupsWithPermissions);

    } catch (error) {
      console.error("Error fetching security groups:", error);
      setSecurityGroups([]);
      toast.error("Failed to refresh security groups");
    } finally {
      setSecurityGroupsLoading(false);
    }
  };

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
                {/* User Selection Dropdown with SUPER_ADMIN filtering */}
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

                    // Additional safety check to ensure selected user is not SUPER_ADMIN
                    if (user && user.id && !isSuperAdminByRole(user)) {
                      setSelectedUser(user);
                      fetchUserPermissions(user.id);
                    } else {
                      console.error("Attempted to select SUPER_ADMIN user or invalid user:", user);
                      toast.error("Cannot select super admin users for permission management.");
                      setSelectedUser(null);
                    }
                  }}
                  disabled={users.length === 0}
                >
                  <option value="">Select a user</option>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((user) => {
                      // Additional safety check in the dropdown
                      if (isSuperAdminByRole(user)) return null;

                      return (
                        <option key={user.id} value={user.id}>
                          {user.fullName || user.email || user.username || user.id}
                          {user.role && user.role !== 'USER' && ` (${user.role})`}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      No users available
                    </option>
                  )}
                </select>

                {/* Permissions Section for Selected User - KEEP ONLY THIS ONE */}
                {selectedUser && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                    <div className="max-h-64 overflow-y-auto border rounded-lg p-3 mb-4">
                      {/* Master Permission */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Master Permission</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {["FULL_ACCESS"].map((perm) => (
                            <label key={perm} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={safeArrayCheck(permissions).includes(perm)}
                                onChange={() => {
                                  if (permissions.includes(perm)) {
                                    // Remove FULL_ACCESS
                                    setPermissions(prev => prev.filter(p => p !== perm));
                                  } else {
                                    // Add all permissions
                                    setPermissions(allPermissions);
                                  }
                                }}
                                className="form-checkbox h-5 w-5 text-red-600"
                              />
                              <span className="ml-2 font-medium text-red-600">
                                {perm.replace(/_/g, " ")} <span className="text-xs text-gray-500">(All permissions)</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Basic Resource Permissions */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Basic Resource</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["read", "WRITE", "EXECUTE", "UPLOAD", "DOWNLOAD", "RENAME", "MOVE", "COPY"].map((perm) => (
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
                      </div>

                      {/* File-specific Permissions */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">File-specific</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["OPEN_FILE", "DELETE_FILE", "SHARE_FILE"].map((perm) => (
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
                                className="form-checkbox h-5 w-5 text-green-600"
                              />
                              <span className="ml-2">{perm.replace(/_/g, " ")}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Folder-specific Permissions */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Folder-specific</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {["CREATE_FOLDER", "OPEN_FOLDER", "DELETE_FOLDER", "SHARE_FOLDER", "ARCHIVE", "RESTORE"].map((perm) => (
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
                                className="form-checkbox h-5 w-5 text-purple-600"
                              />
                              <span className="ml-2">{perm.replace(/_/g, " ")}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Administrative Permissions */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Administrative</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {["MANAGE_PERMISSIONS", "MANAGE_USERS", "MANAGE_ROLES"].map((perm) => (
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
                                className="form-checkbox h-5 w-5 text-orange-600"
                              />
                              <span className="ml-2">{perm.replace(/_/g, " ")}</span>
                            </label>
                          ))}
                        </div>
                      </div>
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
                    {/* Updated refresh button */}
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded font-medium"
                      onClick={refreshSecurityGroups}
                      title="Refresh security groups and their permissions"
                      disabled={securityGroupsLoading}
                    >
                      {securityGroupsLoading ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
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
                                      {group.permissions.map((perm, index) => {
                                        // Ensure perm is a string before calling replace
                                        const permissionText = typeof perm === 'string' ? 
                                          perm.replace(/_/g, " ") : 
                                          String(perm).replace(/_/g, " ");
                                        
                                        return (
                                          <span key={`${perm}-${index}`} className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                            {permissionText}
                                          </span>
                                        );
                                      })}
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
                                className="px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded border border-green-200"
                                title="Create new permissions and assign resources to this group"
                              >
                                Add Permissions
                              </button>
                              <button
                                onClick={() => handleManageUsers(group)}
                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200"
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
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowNewGroupForm(false);
                        setNewGroup({
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

                    <h3 className="text-xl font-bold mb-6 text-blue-700">
                      Create Security Group
                    </h3>

                    <div className="space-y-4">
                      {/* Group Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter group name"
                          value={newGroup.name}
                          onChange={(e) =>
                            setNewGroup((g) => ({ ...g, name: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          required
                        />
                      </div>

                      {/* Department Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter department"
                          value={newGroup.department}
                          onChange={(e) =>
                            setNewGroup((g) => ({ ...g, department: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          required
                        />
                      </div>

                      {/* Info Message */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex">
                          <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              You can assign permissions and add members to this group after it's created.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleCreateGroup}
                        disabled={saving || !newGroup.name.trim() || !newGroup.department.trim()}
                      >
                        {saving ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          "Create Group"
                        )}
                      </button>
                      <button
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => {
                          setShowNewGroupForm(false);
                          setNewGroup({
                            name: "",
                            department: "",
                            permissions: [],
                            resources: [],
                            users: []
                          });
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manage Users in Group Modal - Filter SUPER_ADMIN */}
              {showManageUsersModal && groupToManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowManageUsersModal(false);
                        setGroupToManage(null);
                        setSelectedUsers([]);
                      }}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      Manage Users for {groupToManage.name}
                    </h3>

                    {/* Info about filtering */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> SUPER_ADMIN users are automatically excluded from group management.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto border rounded p-2 bg-white">
                      {users.filter(user => !isSuperAdminByRole(user)).length === 0 ? (
                        <div className="text-gray-500 text-center p-2">No regular users available</div>
                      ) : (
                        <div className="space-y-2">
                          {users
                            .filter(user => !isSuperAdminByRole(user)) // Filter by SUPER_ADMIN role
                            .map(user => {
                              // First, ensure the user has an ID
                              if (!user || !user.id) return null;

                              // Safely check if the user ID is in selectedUsers
                              const isSelected = Array.isArray(selectedUsers) &&
                                selectedUsers.includes(user.id);

                              return (
                                <label
                                  key={user.id}
                                  className={`flex items-center p-2 rounded ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
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
                                    {user.role && user.role !== 'USER' && (
                                      <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                                        {user.role}
                                      </span>
                                    )}
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

              {/* Updated Edit Security Group Modal */}
              {showEditGroupForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                    <button
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        setShowEditGroupForm(false);
                        setEditingGroup(null);
                      }}
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-blue-700">
                      {(editingGroup?.permissions && editingGroup.permissions.length > 0) ?
                        "Update Group Permissions" :
                        "Create New Permissions for Group"
                      }
                    </h3>

                    {/* Updated info about creating/adding permissions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Add Permissions:</strong> Current permissions and resources are shown checked.
                            You can add new permissions or modify existing ones. Changes will be applied to create new access rules.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Show current group info (read-only) */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600"><strong>Group:</strong> {editingGroup?.name}</p>
                      <p className="text-sm text-gray-600"><strong>Department:</strong> {editingGroup?.department}</p>
                    </div>

                    <div className="mb-2">
                      <span className="font-medium text-gray-600">
                        {(editingGroup?.resources && editingGroup.resources.length > 0) ? 
                          "Current Resources (modify as needed):" : 
                          "Resources to Grant Access:"
                        }
                      </span>
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

                    <div className="mb-2">
                      <span className="font-medium text-gray-600">
                        {(editingGroup?.permissions && editingGroup.permissions.length > 0) ? 
                          "Current Permissions (modify as needed):" : 
                          "New Permissions to Create:"
                        }
                      </span>
                      <div className="mt-2 max-h-48 overflow-y-auto">
                        {/* Master Permission */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Master Permission</h4>
                          <div className="grid grid-cols-1 gap-1">
                            {["FULL_ACCESS"].map((perm) => (
                              <label key={perm} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // If FULL_ACCESS is selected, select all permissions
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: allPermissions
                                      } : null);
                                    } else {
                                      // If FULL_ACCESS is deselected, only remove FULL_ACCESS
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: (prev.permissions || []).filter(p => p !== perm)
                                      } : null);
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-red-600"
                                />
                                <span className="ml-2 text-sm font-medium text-red-600">
                                  {perm.replace(/_/g, " ")} <span className="text-xs text-gray-500">(All permissions)</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Basic Resource Permissions */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Basic Resource</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {["read", "WRITE", "EXECUTE", "UPLOAD", "DOWNLOAD", "RENAME", "MOVE", "COPY"].map((perm) => (
                              <label key={perm} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(editingGroup?.permissions, perm)}
                                  onChange={(e) => {
                                    console.log(`Toggling permission ${perm}, current state:`, hasPermission(editingGroup?.permissions, perm));
                                    
                                    if (e.target.checked) {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: [...(prev.permissions || []), perm]
                                      } : null);
                                    } else {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: (prev.permissions || []).filter(p => 
                                          p.toUpperCase() !== perm.toUpperCase()
                                        )
                                      } : null);
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600"
                                />
                                <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* File-specific Permissions */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">File-specific</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {["OPEN_FILE", "DELETE_FILE", "SHARE_FILE"].map((perm) => (
                              <label key={perm} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: [...(prev.permissions || []), perm]
                                      } : null);
                                    } else {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: (prev.permissions || []).filter(p => p !== perm)
                                      } : null);
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-green-600"
                                />
                                <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Folder-specific Permissions */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Folder-specific</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {["CREATE_FOLDER", "OPEN_FOLDER", "DELETE_FOLDER", "SHARE_FOLDER", "ARCHIVE", "RESTORE"].map((perm) => (
                              <label key={perm} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: [...(prev.permissions || []), perm]
                                      } : null);
                                    } else {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: (prev.permissions || []).filter(p => p !== perm)
                                      } : null);
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-purple-600"
                                />
                                <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Administrative Permissions */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">Administrative</h4>
                          <div className="grid grid-cols-1 gap-1">
                            {["MANAGE_PERMISSIONS", "MANAGE_USERS", "MANAGE_ROLES"].map((perm) => (
                              <label key={perm} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: [...(prev.permissions || []), perm]
                                      } : null);
                                    } else {
                                      setEditingGroup(prev => prev ? {
                                        ...prev,
                                        permissions: (prev.permissions || []).filter(p => p !== perm)
                                      } : null);
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-orange-600"
                                />
                                <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                        onClick={handleSaveGroupEdit}
                        disabled={saving || !editingGroup}
                      >
                        {saving ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {(editingGroup?.permissions && editingGroup.permissions.length > 0) ? "Updating..." : "Creating..."}
                          </span>
                        ) : (
                          (editingGroup?.permissions && editingGroup.permissions.length > 0) ? "Update Permissions" : "Create Permissions"
                        )}
                      </button>
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
                        onClick={() => {
                          setShowEditGroupForm(false);
                          setEditingGroup(null);
                        }}
                        disabled={saving}
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

// Update the safeArrayCheck function to handle case-insensitive matching:
const safeArrayCheck = (arr) => {
  return Array.isArray(arr) ? arr : [];
};

// Add a new function for case-insensitive permission checking:
const hasPermission = (permissions, permission) => {
  if (!Array.isArray(permissions)) return false;
  
  // Check for exact match first
  if (permissions.includes(permission)) return true;
  
  // Check for case-insensitive match
  return permissions.some(perm => 
    typeof perm === 'string' && perm.toUpperCase() === permission.toUpperCase()
  );
};

// Add this temporarily in your security groups section for testing:
<button
  onClick={async () => {
    // Test permission extraction for the first group
    if (securityGroups.length > 0) {
      const testGroup = securityGroups[0];
      console.log("Testing permission extraction for group:", testGroup.name);
      
      try {
        const response = await apiCall.instance1.get(`permissions/group/${testGroup.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        console.log("Raw response:", response.data);
        
        if (response.data?.data?.permissions) {
          const entries = response.data.data.permissions;
          console.log("Permission entries:", entries);
          
          const allPerms = new Set();
          entries.forEach(entry => {
            if (entry.permissions) {
              entry.permissions.forEach(p => allPerms.add(p));
            }
          });
          
          console.log("Extracted unique permissions:", Array.from(allPerms));
        }
      } catch (error) {
        console.error("Test error:", error);
      }
    }
  }}
  className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
>
  Test Permission Extraction
</button>