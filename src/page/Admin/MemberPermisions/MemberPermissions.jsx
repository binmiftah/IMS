import React, { useEffect, useState } from "react";
import Navbar from "../../../component/Navbar.jsx";
import { toast } from "react-toastify";
import apiCall from "../../../pkg/api/internal.js";
import FolderTree from "../../../component/FolderTree.jsx";

const MemberPermissions = () => {
  const safeArrayCheck = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  const safeStringArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => typeof item === 'string');
  };

  const hasPermission = (permissions, permission) => {
    if (!Array.isArray(permissions)) return false;

    if (permissions.includes(permission)) return true;

    return permissions.some(perm =>
      typeof perm === 'string' && perm.toUpperCase() === permission.toUpperCase()
    );
  };

  const isSuperAdminByRole = (user) => {
    if (!user || !user.role) return false;

    // Check specifically for SUPER_ADMIN role
    return user.role === 'SUPER_ADMIN';
  };

  // Initialize ALL states with safe default values - MAKE SURE THESE ARE INSIDE THE COMPONENT
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

  // Add the handleSaveGroupUsers function here (missing from your code):
  const handleSaveGroupUsers = async () => {
    if (!groupToManage) {
      console.error("No group to manage");
      return;
    }

    if (!groupToManage.id) {
      console.error("Group has no ID:", groupToManage);
      toast.error("Invalid group selected. Please try again.");
      return;
    }

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

      console.log(`Group ID: ${groupToManage.id}`);
      console.log(`Users to add: ${usersToAdd.length}`, usersToAdd);
      console.log(`Users to remove: ${usersToRemove.length}`, usersToRemove);

      // Add new users to the group - send all at once as the API expects
      if (usersToAdd.length > 0) {
        try {
          // FIX: Make sure the URL is properly constructed with the group ID
          const addUserUrl = `security-group/${groupToManage.id}/add-user`;

          console.log(`Making API call to add users:`, {
            groupId: groupToManage.id,
            userIds: usersToAdd,
            url: addUserUrl,
            fullUrl: `${apiCall.instance1.defaults.baseURL}/${addUserUrl}`
          });

          const addResponse = await apiCall.instance1.post(addUserUrl, {
            userIds: usersToAdd // Send as array of user IDs
          }, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          console.log(`Add users API response:`, addResponse.data);

          // Handle the response format
          if (addResponse.data?.data?.user) {
            const { results, errors, success, failed } = addResponse.data.data.user;

            console.log(`API results:`, { results, errors, success, failed });

            if (success > 0) {
              toast.success(`Successfully added ${success} user(s) to the group`);
            }

            if (failed > 0 && errors.length > 0) {
              // Show specific error messages
              errors.forEach(error => {
                console.log(`User error:`, error);
                if (error.statusCode === 409) {
                  console.log(`User ${error.name} already in group`);
                  // Don't show error toast for "already in group" since it's not really an error
                } else {
                  toast.warning(`${error.name}: ${error.message}`);
                }
              });
            }
          } else {
            toast.success(`API call completed for adding ${usersToAdd.length} user(s)`);
          }
        } catch (error) {
          console.error(`Error adding users to group:`, error);
          if (error.response) {
            console.error(`Error response:`, error.response.data);
            console.error(`Error status:`, error.response.status);
            console.error(`Error headers:`, error.response.headers);
          }
          if (error.request) {
            console.error(`Error request:`, error.request);
          }
          toast.error("Failed to add some users to the group");
        }
      }

      if (usersToRemove.length > 0) {
        for (const userId of usersToRemove) {
          try {
            const removeUserUrl = `security-group/${groupToManage.id}/remove-user/${userId}`;
            console.log(`Removing user ${userId} from group via: ${removeUserUrl}`);

            await apiCall.instance1.delete(removeUserUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });
            console.log(`Successfully removed user ${userId} from group ${groupToManage.id}`);
          } catch (error) {
            console.error(`Error removing user ${userId} from group:`, error);
            if (error.response) {
              console.error(`Remove user error response:`, error.response.data);
            }
          }
        }

        if (usersToRemove.length > 0) {
          toast.success(`Removed ${usersToRemove.length} user(s) from the group`);
        }
      }

      if (usersToAdd.length > 0 || usersToRemove.length > 0) {
        toast.success("Group members updated successfully!");
      } else {
        toast.info("No changes were made to group membership");
      }

      await refreshSecurityGroups();

      setShowManageUsersModal(false);
    } catch (error) {
      console.error("Error updating group members:", error);
      toast.error("Failed to update group members");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPermissions([]);
    setSelectedFolders([]);
    setSecurityGroups([]);
    setSelectedUsers([]);

    apiCall
      .getAllUsers("users")
      .then((res) => {
        console.log("Raw users response:", res);

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

        console.log("Extracted users data:", usersData);

        const validUsers = usersData.filter(user => {
          if (!user || !user.id) {
            console.log("Filtering out user without ID:", user);
            return false;
          }

          if (isSuperAdminByRole(user)) {
            console.log("Filtering out SUPER_ADMIN user:", user);
            return false;
          }

          return true;
        });

        console.log("Valid users after filtering:", validUsers);
        setUsers(validUsers);

        if (validUsers.length === 0) {
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
    const staticPermissions = apiCall.getStaticPermissions();
    setAllPermissions(staticPermissions);
  }, []);

  useEffect(() => {
    console.log("All Permissions:", allPermissions);
  }, [allPermissions]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    } else {
      setPermissions([]);
      setSelectedFolders([]);
    }
  }, [selectedUser]);
  
  useEffect(() => {
    setLoading(true);
    setPermissions([]);
    setSelectedFolders([]);
    setSecurityGroups([]);
    setSelectedUsers([]);

    apiCall
      .getAllUsers("users")
      .then((res) => {
        console.log("Raw users response:", res);

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

        const validUsers = usersData.filter(user => {
          if (!user || !user.id) return false;
          if (isSuperAdminByRole(user)) return false;
          return true;
        });

        setUsers(validUsers);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const staticPermissions = apiCall.getStaticPermissions();
    setAllPermissions(staticPermissions);
  }, []);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    refreshSecurityGroups();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    } else {
      setPermissions([]);
      setSelectedFolders([]);
    }
  }, [selectedUser]);

  const refreshSecurityGroups = async () => {
    setSecurityGroupsLoading(true);
    try {
      const response = await apiCall.getSecurityGroups();

      let groupsData = [];

      // Handle the nested data structure correctly
      if (response?.data?.securityGroups) {
        groupsData = response.data.securityGroups;
      } else if (response?.data && Array.isArray(response.data)) {
        groupsData = response.data;
      } else if (Array.isArray(response)) {
        groupsData = response;
      }

      // For each group, fetch its permissions AND users
      const groupsWithPermissions = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // Fetch group permissions from backend
            const permissionsResponse = await apiCall.instance1.get(`permissions/group/${group.id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });

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
            }

            // Now fetch the updated group users from the backend using the correct endpoint
            let groupUsers = [];
            try {
              // FIX: Use group.id instead of permissions.id
              const groupUsersResponse = await apiCall.instance1.get(`security-group/${group.id}/users`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`
                }
              });

              console.log(`Raw users response for group ${group.id}:`, groupUsersResponse.data);

              // Handle different possible response structures
              if (groupUsersResponse.data?.data?.users && Array.isArray(groupUsersResponse.data.data.users)) {
                groupUsers = groupUsersResponse.data.data.users;
              } else if (groupUsersResponse.data?.data && Array.isArray(groupUsersResponse.data.data)) {
                groupUsers = groupUsersResponse.data.data;
              } else if (groupUsersResponse.data?.users && Array.isArray(groupUsersResponse.data.users)) {
                groupUsers = groupUsersResponse.data.users;
              } else if (Array.isArray(groupUsersResponse.data)) {
                groupUsers = groupUsersResponse.data;
              }

              // Ensure each user has proper structure and filter out invalid entries
              groupUsers = groupUsers
                .filter(user => user && user.id) // Must have valid user object with ID
                .map(user => ({
                  id: user.id,
                  fullName: user.fullName || user.name || '',
                  email: user.email || '',
                  username: user.username || '',
                  role: user.role || 'USER'
                }));

              console.log(`Processed users for group ${group.id}:`, groupUsers);
            } catch (userError) {
              console.log(`Error fetching users for group ${group.id}:`, userError.message);
              groupUsers = Array.isArray(group.users) ? group.users : [];
            }

            return {
              ...group,
              permissions: groupPermissions,
              resources: groupResources,
              users: groupUsers, // Use freshly fetched users
              userCount: groupUsers.length // Update count based on actual users
            };
          } catch (error) {
            // Handle 404 and other errors gracefully - group simply has no permissions yet
            if (error.response?.status === 404) {
              console.log(`Group "${group.name}" (${group.id}) has no permissions configured yet`);
            } else {
              // Only log actual errors
              console.error(`Error fetching permissions for group ${group.id}:`, error);
            }

            // Still try to get users even if permissions fail
            let groupUsers = [];
            try {
              // FIX: Use group.id instead of permissions.id here too
              const groupUsersResponse = await apiCall.instance1.get(`security-group/${group.id}/users`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`
                }
              });

              if (groupUsersResponse.data?.data?.users) {
                groupUsers = groupUsersResponse.data.data.users;
              } else if (Array.isArray(groupUsersResponse.data?.data)) {
                groupUsers = groupUsersResponse.data.data;
              } else if (Array.isArray(groupUsersResponse.data)) {
                groupUsers = groupUsersResponse.data;
              }

              groupUsers = groupUsers.filter(user => user && user.id);
            } catch (userError) {
              console.log(`Error fetching users for group ${group.id}:`, userError.message);
              groupUsers = Array.isArray(group.users) ? group.users : [];
            }

            // Return group without permissions if fetch fails but with updated users
            return {
              ...group,
              permissions: [],
              resources: [],
              users: groupUsers,
              userCount: groupUsers.length
            };
          }
        })
      );

      setSecurityGroups(groupsWithPermissions);

    } catch (error) {
      setSecurityGroups([]);
      toast.error("Failed to refresh security groups");
    } finally {
      setSecurityGroupsLoading(false);
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


      const folderData = Array.isArray(foldersRes) ? foldersRes : [];
      const fileData = Array.isArray(filesRes) ? filesRes : [];

      // Combine folders and files into a single list
      const resources = [
        ...folderData.map((folder) => ({ ...folder, type: "folder" })),
        ...fileData.map((file) => ({ ...file, type: "file" })),
      ];

      setFolders(resources); // Update the folders state with combined resources
    } catch (error) {
      toast.error("Failed to load resources.");
      setFolders([]); // Reset folders on error
    }
  };

  // Save individual user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) {
      toast.warning("Please select a user to update permissions");
      return;
    }

    if (!selectedUser.id) {
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

  // Replace your handleManageUsers function with this corrected version:
  const handleManageUsers = async (group) => {
    try {
      console.log(`Opening manage users modal for group: ${group.name} (${group.id})`);
      
      // Try to fetch fresh user data using the correct security-group endpoint
      let freshGroupUsers = [];
      
      try {
        const groupUsersResponse = await apiCall.instance1.get(`security-group/${group.id}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        console.log("Fresh group users response:", groupUsersResponse.data);

        // Handle different possible response structures
        if (groupUsersResponse.data?.data?.users && Array.isArray(groupUsersResponse.data.data.users)) {
          freshGroupUsers = groupUsersResponse.data.data.users;
        } else if (groupUsersResponse.data?.data && Array.isArray(groupUsersResponse.data.data)) {
          freshGroupUsers = groupUsersResponse.data.data;
        } else if (groupUsersResponse.data?.users && Array.isArray(groupUsersResponse.data.users)) {
          freshGroupUsers = groupUsersResponse.data.users;
        } else if (Array.isArray(groupUsersResponse.data)) {
          freshGroupUsers = groupUsersResponse.data;
        }
      } catch (userFetchError) {
        if (userFetchError.response?.status === 404) {
          console.log(`Group ${group.id} has no users (404 - starting with empty user list)`);
          freshGroupUsers = []; // Start with empty array
        } else {
          console.error("Error fetching group users:", userFetchError);
          // Use existing group users as fallback
          freshGroupUsers = Array.isArray(group.users) ? group.users : [];
        }
      }

      // Process and normalize user data
      const processedUsers = freshGroupUsers
        .filter(user => user && user.id)
        .map(user => ({
          id: user.id,
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          username: user.username || '',
          role: user.role || 'USER'
        }));

      // Get user IDs for selection state
      const freshUserIds = processedUsers.map(user => user.id);

      console.log("Fresh user IDs for group:", freshUserIds);
      console.log("Processed users:", processedUsers);

      // Update the group object with fresh user data
      const updatedGroup = {
        ...group,
        users: processedUsers,
        userCount: processedUsers.length
      };

      setGroupToManage(updatedGroup);
      setSelectedUsers(freshUserIds);
      setShowManageUsersModal(true);

    } catch (error) {
      console.error("Error in handleManageUsers:", error);
      
      // Fallback to existing group data
      setGroupToManage(group);
      
      let initialUsers = [];
      if (group.users && Array.isArray(group.users)) {
        initialUsers = group.users
          .filter(user => user && user.id)
          .map(user => user.id);
      }

      setSelectedUsers(initialUsers);
      setShowManageUsersModal(true);
      
      console.log("Using fallback group data for manage users modal");
    }
  };

  // Replace your handleEditGroup function with this updated version:
  const handleEditGroup = async (group) => {
    if (!group) {
      return;
    }

    try {

      // Fetch current permissions from backend
      const permissionsResponse = await apiCall.instance1.get(`permissions/group/${group.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });


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

      // Handle 404 specifically - group has no permissions yet
      if (error.response?.status === 404) {

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

      let folderSuccess = false;
      let fileSuccess = false;

      // CREATE folder permissions using POST
      if (folderIds.length > 0) {
        try {
          const folderPermissionData = {
            resourceType: "FOLDER",
            permissions: mappedPermissions,
            folderIds: folderIds,
            groupId: editingGroup.id,
            inherited: false
          };


          const response = await apiCall.instance1.post("permissions/group/folder", folderPermissionData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          folderSuccess = true;
          toast.success(`Posted folder permissions for ${folderIds.length} folders`);
        } catch (error) {
          if (error.response?.data?.message) {
            toast.error(`Folder permissions error: ${error.response.data.message}`);
          } else {
            toast.error("Failed to post folder permissions");
          }
        }
      }

      // CREATE file permissions using POST
      if (fileIds.length > 0) {
        try {
          const filePermissionData = {
            resourceType: "FILE",
            permissions: mappedPermissions,
            fileIds: fileIds,
            groupId: editingGroup.id,
            inherited: false
          };

          const response = await apiCall.instance1.post("permissions/group/file", filePermissionData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          fileSuccess = true;
          toast.success(`Posted file permissions for ${fileIds.length} files`);
        } catch (error) {

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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <span className="text-gray-500 text-lg">Loading permissions data...</span>
              </div>
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

                    if (!userId) {
                      setSelectedUser(null);
                      return;
                    }

                    const user = users.find(user => user.id === userId);

                    // Additional safety check to ensure selected user is not SUPER_ADMIN
                    if (user && user.id && !isSuperAdminByRole(user)) {
                      setSelectedUser(user);
                      fetchUserPermissions(user.id);
                    } else {
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
                          {["READ", "WRITE", "EXECUTE", "UPLOAD", "DOWNLOAD", "RENAME", "MOVE", "COPY"].map((perm) => (
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
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 5a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 5a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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

