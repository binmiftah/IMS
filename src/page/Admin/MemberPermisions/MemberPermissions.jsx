import React, { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../../../component/Navbar.jsx";
import { toast } from "react-toastify";
import apiCall from "../../../pkg/api/internal.js";
import FolderTree from "../../../component/FolderTree.jsx";

// Define constants for permission groups
const FILE_PERMISSIONS = [
  "OPEN_FILE", "DELETE_FILE", "UPLOAD_FILE", "RENAME_FILE",
  "DOWNLOAD_FILE", "MOVE_FILE", "COPY_FILE", "SHARE_FILE"
];

const FOLDER_PERMISSIONS = [
  "CREATE_FOLDER", "OPEN_FOLDER", "RENAME_FOLDER", "MOVE_FOLDER",
  "COPY_FOLDER", "UPLOAD_FOLDER", "DELETE_FOLDER", "SHARE_FOLDER"
];

const MemberPermissions = () => {
  const safeArrayCheck = (arr) => Array.isArray(arr) ? arr : [];

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
    return user.role === 'SUPER_ADMIN';
  };

  const handlePermissionChange = (permission, isChecked, currentPermissions, setPermissions) => {
    let newPermissionsList;
    if (isChecked) {
      if (!currentPermissions.includes(permission)) {
        newPermissionsList = [...currentPermissions, permission];
      } else {
        newPermissionsList = [...currentPermissions]; // No change if already included
      }
    } else {
      newPermissionsList = currentPermissions.filter(p => p !== permission);
    }
    setPermissions([...new Set(newPermissionsList)]); // Ensure uniqueness
  };

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
  const [foldersLoading, setFoldersLoading] = useState(true);

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

  // Add new state for per-resource permissions
  const [resourcePermissions, setResourcePermissions] = useState({});
  const [folderPermissions, setFolderPermissions] = useState({});
  const [filePermissions, setFilePermissions] = useState({});
  const [expandedFolders, setExpandedFolders] = useState([]);

  const getResourcePermissions = (resourceId) => {
    return resourcePermissions[resourceId] || [];
  };

  const findResourceById = (resources, resourceId) => {
    for (const resource of resources) {
      if (resource.id === resourceId) {
        return resource;
      }
      if (resource.children && Array.isArray(resource.children)) {
        const found = findResourceById(resource.children, resourceId);
        if (found) return found;
      }
    }
    return null;
  };

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

      const filteredSelectedUsers = selectedUsers.filter(userId => {
        const user = users.find(u => u.id === userId);
        return user && !isSuperAdminByRole(user);
      });

      if (filteredSelectedUsers.length !== selectedUsers.length) {
        console.warn("Filtered out SUPER_ADMIN users from selection");
        setSelectedUsers(filteredSelectedUsers);
      }

      const currentUsers = (groupToManage.users || [])
        .map(user => user.id)
        .filter(userId => {
          const user = users.find(u => u.id === userId);
          return user && !isSuperAdminByRole(user);
        });

      const usersToAdd = filteredSelectedUsers.filter(id => !currentUsers.includes(id));
      const usersToRemove = currentUsers.filter(id => !filteredSelectedUsers.includes(id));

      if (usersToAdd.length > 0) {
        try {
          const addUserUrl = `security-group/${groupToManage.id}/add-user`;

          const addResponse = await apiCall.instance1.post(addUserUrl, {
            userIds: usersToAdd // Send as array of user IDs
          }, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          if (addResponse.data?.data?.user) {
            const { results, errors, success, failed } = addResponse.data.data.user;

            if (success > 0) {
              toast.success(`Successfully added ${success} user(s) to the group`);
            }

            if (failed > 0 && errors.length > 0) {
              // Show specific error messages
              errors.forEach(error => {
                console.log(`User error:`, error);
                if (error.statusCode === 409) {
                  console.log(`User ${error.name} already in group`);
                } else {
                  toast.warning(`${error.name}: ${error.message}`);
                }
              });
            }
          } else {
            toast.success(`API call completed for adding ${usersToAdd.length} user(s)`);
          }
        } catch (error) {
          toast.error("Failed to add some users to the group");
        }
      }

      if (usersToRemove.length > 0) {
        for (const userId of usersToRemove) {
          try {
            const removeUserUrl = `security-group/${groupToManage.id}/remove-user/${userId}`;

            await apiCall.instance1.delete(removeUserUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });
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

  const handleSaveUserPermissions = async () => {
    if (!selectedUser || !selectedUser.id) {
      toast.error("Please select a user first");
      return;
    }

    if (selectedFolders.length === 0) {
      toast.error("Please select at least one resource");
      return;
    }

    // Check that each selected resource has at least one permission
    const resourcesWithoutPermissions = selectedFolders.filter(resourceId => {
      const perms = getResourcePermissions(resourceId);
      return !perms || perms.length === 0;
    });

    if (resourcesWithoutPermissions.length > 0) {
      toast.error(`Please set permissions for all selected resources. ${resourcesWithoutPermissions.length} resource(s) have no permissions set.`);
      return;
    }

    setSaving(true);
    try {
      // Create a flattened array of all resources for easier lookup
      const flattenResources = (resources) => {
        const flattened = [];

        const flatten = (items) => {
          items.forEach(item => {
            flattened.push(item);
            if (item.children && Array.isArray(item.children)) {
              flatten(item.children);
            }
          });
        };

        flatten(resources);
        return flattened;
      };

      const allFlatResources = flattenResources(folders);

      // ✅ Create SEPARATE permission request for EACH resource with its INDIVIDUAL permissions
      const requests = [];

      selectedFolders.forEach(resourceId => {
        const resource = allFlatResources.find(f => f.id === resourceId);
        if (!resource) return;

        const resourceName = resource.name || resource.fileName || resourceId;
        const resourcePerms = getResourcePermissions(resourceId);

        if (resourcePerms.length === 0) return; // Skip resources without permissions

        const isFolder = resource.type === 'folder' ||
          resource.mimeType === 'application/vnd.google-apps.folder' ||
          (!resource.fileName && !resource.fileExtension);

        if (isFolder) {
          requests.push({
            resourceType: "FOLDER",
            permissions: resourcePerms,
            folderId: resourceId,
            accountId: selectedUser.id,
            inherited: false
          });
        } else {
          requests.push({
            resourceType: "FILE",
            permissions: resourcePerms,
            fileId: resourceId,
            accountId: selectedUser.id,
            inherited: false
          });
        }
      });


      // Send each permission request INDIVIDUALLY
      let successCount = 0;
      let errorCount = 0;

      for (const permissionData of requests) {
        try {

          const response = await apiCall.createMemberPermission(permissionData);

          successCount++;

          // Update local state for this specific resource
          if (permissionData.resourceType === "FOLDER") {
            setFolderPermissions(prev => ({
              ...prev,
              [permissionData.folderId]: permissionData.permissions
            }));
          } else if (permissionData.resourceType === "FILE") {
            setFilePermissions(prev => ({
              ...prev,
              [permissionData.fileId]: permissionData.permissions
            }));
          }

        } catch (error) {
          console.error("❌ Failed to create individual permission:", error);
          errorCount++;
        }
      }

      // Show detailed results
      if (successCount > 0) {
        toast.success(
          `Successfully created ${successCount} individual permission(s) with custom permissions for each resource!`
        );

        // Refresh user permissions to show updated state
        await fetchUserPermissions(selectedUser.id);
      }

      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} permission(s). Check console for details.`);
      }

    } catch (error) {
      console.error("❌ Failed to save user permissions:", error);
      toast.error("Failed to save user permissions. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fetchUserPermissions = async (userId) => {
    if (!userId) {
      return;
    }

    try {

      const response = await apiCall.instance1.get(`permissions/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });


      // Initialize both folder and file permissions objects
      const userFolderPermissions = {};
      const userFilePermissions = {};
      const userResourcePermissions = {}; // New: per-resource permissions
      const allUserResources = new Set();

      if (response.data?.data?.permissions && Array.isArray(response.data.data.permissions)) {
        const permissionEntries = response.data.data.permissions;

        permissionEntries.forEach(entry => {
          if (entry.resourceType === 'FOLDER' && entry.folderId) {
            const folderId = entry.folderId;

            if (!userFolderPermissions[folderId]) {
              userFolderPermissions[folderId] = [];
            }

            if (entry.permissions && Array.isArray(entry.permissions)) {
              entry.permissions.forEach(perm => {
                if (typeof perm === 'string') {
                  userFolderPermissions[folderId].push(perm);
                }
              });
            }

            // Store per-resource permissions
            userResourcePermissions[folderId] = userFolderPermissions[folderId];
            allUserResources.add(folderId);

          } else if (entry.resourceType === 'FILE' && entry.fileId) {
            const fileId = entry.fileId;

            if (!userFilePermissions[fileId]) {
              userFilePermissions[fileId] = [];
            }

            if (entry.permissions && Array.isArray(entry.permissions)) {
              entry.permissions.forEach(perm => {
                if (typeof perm === 'string') {
                  userFilePermissions[fileId].push(perm);
                }
              });
            }

            // Store per-resource permissions
            userResourcePermissions[fileId] = userFilePermissions[fileId];
            allUserResources.add(fileId);
          }
        });
      }

      // Update state
      setFolderPermissions(userFolderPermissions);
      setFilePermissions(userFilePermissions);
      setResourcePermissions(userResourcePermissions); // New: set per-resource permissions
      setPermissions([]); // Clear global permissions since we're using per-resource now
      setSelectedFolders(Array.from(allUserResources));

      const totalFolders = Object.keys(userFolderPermissions).length;
      const totalFiles = Object.keys(userFilePermissions).length;

      if (totalFolders > 0 || totalFiles > 0) {
        toast.success(`Loaded permissions for ${totalFolders} folders and ${totalFiles} files`);
      }

    } catch (error) {
      console.error("Error fetching user permissions:", error);

      if (error.response?.status === 404) {
        setFolderPermissions({});
        setFilePermissions({});
        setResourcePermissions({});
        setPermissions([]);
        setSelectedFolders([]);
      } else {
        setFolderPermissions({});
        setFilePermissions({});
        setResourcePermissions({});
        setPermissions([]);
        setSelectedFolders([]);
        toast.error("Failed to fetch user permissions");
      }
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
          if (!user || !user.id) {
            return false;
          }

          if (isSuperAdminByRole(user)) {
            return false;
          }

          return true;
        });

        setUsers(validUsers);

        if (validUsers.length === 0) {
          console.warn("No valid users found after filtering");
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
    const staticPermissionsFromAPI = apiCall.getStaticPermissions();
    // Filter out FULL_ACCESS if it's present in the API response
    const filteredPermissions = staticPermissionsFromAPI.filter(p => p !== "FULL_ACCESS");
    setAllPermissions(filteredPermissions);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    } else {
      setPermissions([]);
      setSelectedFolders([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const initializeResources = async () => {
      try {
        setFoldersLoading(true);
        await fetchResources();
      } catch (error) {
        console.error("Error initializing resources:", error);
      } finally {
        if (isMounted) {
          setFoldersLoading(false);
        }
      }
    };

    initializeResources();

    return () => {
      isMounted = false; // Cleanup
    };
  }, []); // Empty dependency array - run only once

  useEffect(() => {
    refreshSecurityGroups();
  }, []);

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

            } catch (userError) {
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
      let resourcesWithParents = [];

      const [folderData, fileData] = await Promise.all([
        apiCall.getFolder("files/folders"),
        apiCall.getFile("files?parentId=null")
      ]);
      const allFolders = Array.isArray(folderData) ? folderData : [];
      const rootFilesFromFileData = Array.isArray(fileData) ? fileData.filter(file => // Renamed to avoid confusion
        !file.parentId || file.parentId === null || file.parentId === "null"
      ) : [];
      resourcesWithParents = [...allFolders, ...rootFilesFromFileData];

      const fetchAllFolderChildren = async (folderId, parentId = null, processedFolders = new Set()) => {
        // Prevent infinite loops
        if (processedFolders.has(folderId)) {
          console.warn(`Circular reference detected for folder ${folderId}, skipping`);
          return { folders: [], files: [] };
        }

        processedFolders.add(folderId);

        try {
          // Use the same method as Files.jsx - get folder by ID to get its children
          const folderData = await apiCall.getFolderById(`files/folders/${folderId}`);

          if (!folderData) {
            return { folders: [], files: [] };
          }

          // Get children from the folder data (same as Files.jsx)
          const children = folderData.children || [];
          const folderFiles = folderData.files || [];

          const allChildFolders = [];
          const allChildFiles = [];

          // Process folder files (add parent relationship)
          folderFiles.forEach(file => {
            allChildFiles.push({
              ...file,
              type: "file",
              fileName: file.fileName || file.name,
              parentId: folderId // Set correct parent
            });
          });

          // Process immediate children folders
          for (const child of children) {
            if (child.type === 'folder') {
              const childFolder = {
                ...child,
                type: "folder",
                parentId: folderId, // Set correct parent
                mimeType: child.mimeType || 'application/vnd.google-apps.folder'
              };

              allChildFolders.push(childFolder);

              // 🔄 RECURSIVE CALL: Fetch ALL descendants of this child folder
              const grandChildren = await fetchAllFolderChildren(child.id, folderId, new Set(processedFolders));

              // Add all descendants to our collections
              allChildFolders.push(...grandChildren.folders);
              allChildFiles.push(...grandChildren.files);

            } else if (child.type === 'file') {
              allChildFiles.push({
                ...child,
                type: "file",
                fileName: child.fileName || child.name,
                parentId: folderId // Set correct parent
              });
            }
          }

          return { folders: allChildFolders, files: allChildFiles };

        } catch (error) {
          console.error(`Error fetching children for folder ${folderId}:`, error);
          return { folders: [], files: [] };
        }
      };

      const allFoldersFromAPI = [];
      const allFilesFromAPI = [];

      // First, get detailed information for each root folder
      for (const folder of folderData) {
        try {
          const detailedFolder = await apiCall.getFolderById(`files/folders/${folder.id}`);

          const rootFolder = {
            ...detailedFolder,
            type: "folder",
            mimeType: detailedFolder.mimeType || 'application/vnd.google-apps.folder',
            parentId: null, // Root folders have no parent
          };

          allFoldersFromAPI.push(rootFolder);

          // 🔄 RECURSIVELY fetch ALL descendants of this root folder
          const allDescendants = await fetchAllFolderChildren(rootFolder.id);

          // Add ALL descendant folders and files
          allFoldersFromAPI.push(...allDescendants.folders);
          allFilesFromAPI.push(...allDescendants.files);

        } catch (error) {
          console.error(`Error processing root folder ${folder.id}:`, error);
          // Add basic folder info even if detailed fetch fails
          allFoldersFromAPI.push({
            ...folder,
            type: "folder",
            mimeType: folder.mimeType || 'application/vnd.google-apps.folder',
            parentId: null,
          });
        }
      }

      for (const file of fileData) {
        try {
          const detailedFile = await apiCall.getFileById(`files/${file.id}`)
          const actualId = file.id;


          allFilesFromAPI.push({
            ...detailedFile,
            id: actualId,
            type: "file",
            fileName: detailedFile.fileName || detailedFile.name || file.fileName || file.name,
            parentId: null,
          });
        } catch (error) {
          console.error(`Error fetching file ${file.id}:`, error);
          allFilesFromAPI.push({
            ...file,
            id: file.id,
            type: "file",
            fileName: file.fileName || file.name,
            parentId: null,
          });
        }
      }

      const allResourcesMap = new Map();
      allFoldersFromAPI.forEach(folder => {
        if (folder && folder.id) {
          allResourcesMap.set(folder.id, folder);
        }
      });
      allFilesFromAPI.forEach(file => {
        // ADD THIS LOG to see each file being processed and its top-level id
        console.log(
          `DEBUG_MAP_PROCESS_FILE: Processing file for allResourcesMap. ID: ${file?.id}, Name: ${file?.fileName || file?.name}, Type: ${file?.type}, ParentID: ${file?.parentId}, HasTopLevelIDProperty: ${file && Object.prototype.hasOwnProperty.call(file, 'id') && file.id !== undefined && file.id !== null}`
        );

        if (file && file.id) { // Check if the file object itself and its id property are valid
          if (!allResourcesMap.has(file.id)) {
            allResourcesMap.set(file.id, file);
            // Simplified log for when a root file is added
            if (!file.parentId && file.type === 'file') {
              console.log(`DEBUG_MAP_ADDED_ROOT: Root file ID '${file.id}' (Name: ${file.fileName || file.name}) added to allResourcesMap.`);
            }
          } else {
            // Existing DEBUG_SKIP logs (if a root file collides with an existing folder ID)
            if (!file.parentId && file.type === 'file') {
              const existingItem = allResourcesMap.get(file.id);
            }
          }
        } else {
          // ADD THIS LOG if a file is skipped due to missing or invalid ID
          console.log(
            `DEBUG_MAP_INVALID_FILE_SKIPPED: File skipped due to missing/invalid top-level ID. Name: ${file?.fileName || file?.name}, Type: ${file?.type}, ParentID: ${file?.parentId}. Inspected File Object:`, JSON.parse(JSON.stringify(file))
          );
        }
      });

      const allResources = Array.from(allResourcesMap.values());

      const logCompleteHierarchy = (resources) => {
        const buildTree = (parentId = null, indent = '') => {
          const children = resources.filter(r =>
            (parentId === null && (!r.parentId || r.parentId === null || r.parentId === "null")) ||
            (parentId !== null && r.parentId === parentId)
          );

          children
            .sort((a, b) => {
              // Folders first, then files
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              // Then alphabetically
              const aName = a.name || a.fileName || '';
              const bName = b.name || b.fileName || '';
              return aName.localeCompare(bName);
            })
            .forEach(resource => {
              const icon = resource.type === 'folder' ? '📁' : '📄';
              const name = resource.name || resource.fileName || 'Unnamed';

              if (resource.type === 'folder') {
                buildTree(resource.id, indent + '  ');
              }
            });
        };

        buildTree();
      };

      logCompleteHierarchy(allResources);

      // Build hierarchical structure for the UI
      if (allResources.length > 0) {

        // Create a map for quick lookup
        const resourceMap = new Map();
        allResources.forEach(resource => {
          resourceMap.set(resource.id, {
            ...resource,
            children: []
          });
        });

        // Build the hierarchy
        const hierarchicalStructure = [];

        allResources.forEach(resource => {
          const resourceWithChildren = resourceMap.get(resource.id);

          if (!resource.parentId || resource.parentId === null || resource.parentId === "null") {
            // This is a root item
            hierarchicalStructure.push(resourceWithChildren);
          } else {
            // This is a child item
            const parent = resourceMap.get(resource.parentId);
            if (parent) {
              parent.children.push(resourceWithChildren);
            } else {
              // Parent not found, treat as root
              console.warn(`⚠️ Parent ${resource.parentId} not found for resource ${resource.id}, treating as root`);
              hierarchicalStructure.push(resourceWithChildren);
            }
          }
        });

        const sortHierarchy = (nodes) => {
          return nodes
            .sort((a, b) => {
              // Folders first
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              // Then alphabetically
              const aName = a.name || a.fileName || '';
              const bName = b.name || b.fileName || '';
              return aName.localeCompare(bName);
            })
            .map(node => ({
              ...node,
              children: node.children ? sortHierarchy(node.children) : []
            }));
        };

        const sortedHierarchy = sortHierarchy(hierarchicalStructure);

        setFolders(sortedHierarchy);
        return;
      }

      console.log("⚠️ No parent-child relationships found or allResources is empty, using flat structure");
      setFolders(allResources);

    } catch (error) {
      console.error("❌ Error in fetchResources:", error);
      toast.error("Failed to load resources.");
      setFolders([]);
      // Removed throw error; to prevent unhandled promise rejection if initializeResources doesn't catch it
    }
  };

  const getAllSelectedResourcesWithChildren = (selectedResourceIds, allResources) => {
    const allSelectedIds = new Set();

    // ✅ Create a comprehensive resource map with BOTH lookup methods
    const resourceMap = new Map();
    const parentChildMap = new Map(); // parentId -> [children]

    // First pass: Build the complete resource map
    const buildResourceMap = (resources, parentId = null) => {
      resources.forEach(resource => {
        if (resource && resource.id) {
          // Add to main resource map
          resourceMap.set(resource.id, {
            ...resource,
            computedParentId: parentId || resource.parentId || null
          });

          // Build parent-child relationships
          const actualParentId = parentId || resource.parentId;
          if (actualParentId) {
            if (!parentChildMap.has(actualParentId)) {
              parentChildMap.set(actualParentId, []);
            }
            parentChildMap.get(actualParentId).push(resource.id);
          }

          // Recursively process children if they exist
          if (resource.children && Array.isArray(resource.children)) {
            buildResourceMap(resource.children, resource.id);
          }
        }
      });
    };

    buildResourceMap(allResources);

    // ✅ FIXED: Enhanced recursive function with proper visited tracking
    const collectAllDescendants = (resourceId, level = 0, globalVisited = new Set()) => {
      const indent = '  '.repeat(level);

      // Prevent infinite loops
      if (globalVisited.has(resourceId)) {
        console.warn(`${indent}⚠️ Already visited ${resourceId}, skipping`);
        return;
      }
      globalVisited.add(resourceId);

      // Add the current resource
      allSelectedIds.add(resourceId);

      const resource = resourceMap.get(resourceId);
      if (!resource) {
        console.warn(`${indent}⚠️ Resource ${resourceId} not found in map`);
        return;
      }

      const resourceName = resource.name || resource.fileName || 'Unnamed';
      const resourceType = resource.type === 'folder' ? '📁' : '📄';

      // ✅ Get all children using multiple methods
      const childrenFromMap = parentChildMap.get(resourceId) || [];

      const childrenFromArray = [];
      if (resource.children && Array.isArray(resource.children)) {
        resource.children.forEach(child => {
          if (child && child.id) {
            childrenFromArray.push(child.id);
          }
        });
      }

      const childrenFromParentId = [];
      for (const [id, res] of resourceMap.entries()) {
        if (res.parentId === resourceId || res.computedParentId === resourceId) {
          childrenFromParentId.push(id);
        }
      }

      // Combine all three methods and deduplicate
      const allChildren = [...new Set([
        ...childrenFromMap,
        ...childrenFromArray,
        ...childrenFromParentId
      ])];

      if (allChildren.length > 0) {
        // ✅ FIXED: Pass the SAME globalVisited Set to maintain state across all calls
        allChildren.forEach(childId => {
          collectAllDescendants(childId, level + 1, globalVisited); // ✅ CORRECT
        });
      } else {
        console.log(`${indent}  → No children found`);
      }
    };

    // ✅ FIXED: Use a single global visited set for all recursive calls
    const globalVisited = new Set();

    // Process each originally selected resource
    selectedResourceIds.forEach((resourceId, index) => {
      collectAllDescendants(resourceId, 0, globalVisited);
    });

    const totalCollected = Array.from(allSelectedIds);

    // ✅ Show detailed breakdown by type
    const folders = totalCollected.filter(id => {
      const resource = resourceMap.get(id);
      return resource?.type === 'folder' || resource?.mimeType === 'application/vnd.google-apps.folder';
    });

    const files = totalCollected.filter(id => {
      const resource = resourceMap.get(id);
      return resource?.type === 'file' || (resource?.type !== 'folder' && resource?.mimeType !== 'application/vnd.google-apps.folder');
    });

    return totalCollected;
  };

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

  // Replace your handleManageUsers function with this corrected version:
  const handleManageUsers = async (group) => {
    try {
      // Try to fetch fresh user data using the correct security-group endpoint
      let freshGroupUsers = [];

      try {
        const groupUsersResponse = await apiCall.instance1.get(`security-group/${group.id}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

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

      const mappedPermissions = editingGroup.permissions.map(perm => {
        return perm.toUpperCase();
      });

      if (mappedPermissions.length === 0) {
        toast.warning("No permissions selected for this group");
        setShowEditGroupForm(false);
        setSaving(false);
        return;
      }

      // ✅ NEW: Get all selected resources including their children for groups too
      const allSelectedResourceIds = getAllSelectedResourcesWithChildren(editingGroup.resources, folders);

      // ✅ Create a flattened array of all resources for easier lookup
      const flattenResources = (resources) => {
        const flattened = [];

        const flatten = (items) => {
          items.forEach(item => {
            flattened.push(item);
            if (item.children && Array.isArray(item.children)) {
              flatten(item.children);
            }
          });
        };

        flatten(resources);
        return flattened;
      };

      const allFlatResources = flattenResources(folders);

      // Separate folders and files from the expanded selected resources
      const folderIds = [];
      const fileIds = [];

      allSelectedResourceIds.forEach(resourceId => {
        const resource = allFlatResources.find(item => item.id === resourceId);
        if (resource) {
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

      // CREATE folder permissions using POST (including all children)
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
          toast.success(`Posted folder permissions for ${folderIds.length} folders (including children)`);
        } catch (error) {
          console.error("❌ Group folder permissions error:", error);
          if (error.response?.data?.message) {
            toast.error(`Folder permissions error: ${error.response.data.message}`);
          } else {
            toast.error("Failed to post folder permissions");
          }
        }
      }

      // CREATE file permissions using POST (including all children files)
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
          toast.success(`Posted file permissions for ${fileIds.length} files (including children)`);
        } catch (error) {
          console.error("❌ Group file permissions error:", error);
          if (error.response?.data?.message) {
            toast.error(`File permissions error: ${error.response.data.message}`);
          } else {
            toast.error("Failed to post file permissions");
          }
        }
      }

      // Show overall success message and refresh group data
      if (folderSuccess || fileSuccess) {
        const totalResources = folderIds.length + fileIds.length;
        toast.success(
          `Permissions posted successfully for ${totalResources} resources! ` +
          `(${folderIds.length} folders, ${fileIds.length} files)`
        );

        await refreshSecurityGroups();
        setShowEditGroupForm(false);
      } else if (folderIds.length === 0 && fileIds.length === 0) {
        toast.info("No resources selected to create permissions for");
      } else {
        toast.error("Failed to post any permissions");
      }

    } catch (error) {
      console.error("❌ Failed to post group permissions:", error);
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

  // Add this debugging function:

  const debugFolderStructureDetailed = () => {
    const analyzeStructure = (resources, level = 0, parentId = null) => {
      const indent = '  '.repeat(level);

      resources.forEach(resource => {
        if (!resource || !resource.id) return;

        const icon = resource.type === 'folder' ? '📁' : '📄';
        const name = resource.name || resource.fileName || 'Unnamed';
        const childCount = resource.children ? resource.children.length : 0;
        const parentInfo = resource.parentId ? ` (parentId: ${resource.parentId})` :
          parentId ? ` (computed parent: ${parentId})` : ' (root)';

        // Show detailed children info
        if (resource.children && Array.isArray(resource.children) && resource.children.length > 0) {
          analyzeStructure(resource.children, level + 1, resource.id);
        }
      });
    };

    analyzeStructure(folders);

    // Count totals
    const flattenAll = (resources) => {
      const flat = [];
      const process = (items, parent = null) => {
        items.forEach(item => {
          flat.push({ ...item, computedParent: parent });
          if (item.children && Array.isArray(item.children)) {
            process(item.children, item.id);
          }
        });
      };
      process(resources);
      return flat;
    };

    const allFlat = flattenAll(folders);
    const folderCount = allFlat.filter(r => r.type === 'folder').length;
    const fileCount = allFlat.filter(r => r.type === 'file').length;

    // Check for potential issues
    const orphanedItems = allFlat.filter(item =>
      item.parentId && !allFlat.find(p => p.id === item.parentId)
    );

    if (orphanedItems.length > 0) {
      console.warn(`⚠️ Found ${orphanedItems.length} orphaned items (parent not found):`, orphanedItems);
    }

    return allFlat;
  };


  const handleResourceSelectionChange = (newSelectedIds) => {
    // Only keep the IDs the user explicitly checked - no cascading to children
    setSelectedFolders(newSelectedIds);
  };

  const handleToggleExpand = (folderId) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <span className="text-gray-500 text-lg">Loading permissions data...</span>
              </div>
            </div>
          ) : (
            <div>
              {/* Individual User Permissions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Set Individual User Permissions
                </h2>
                {/* User Selection Dropdown */}
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
                  {users.map(user => !isSuperAdminByRole(user) && (
                    <option key={user.id} value={user.id}>
                      {user.fullName || user.email || user.username || user.id}
                      {user.role && user.role !== 'USER' && ` (${user.role})`}
                    </option>
                  ))}
                </select>

                {/* Step 2: Resource Selection */}
                {selectedUser && (
                  <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-blue-700">Step 1: Select Resources</h3>
                    <div className="max-h-64 overflow-y-auto">
                      <FolderTree
                        items={folders}
                        selectedItems={selectedFolders}
                        onSelectionChange={handleResourceSelectionChange}
                        disableCascadeSelection={true}
                        expandedFolders={expandedFolders}
                        onToggleExpand={handleToggleExpand}
                      />
                    </div>
                    {selectedFolders.length === 0 && (
                      <div className="text-sm text-gray-500 mt-2">Select at least one resource to set permissions.</div>
                    )}
                  </div>
                )}

                {/* Step 3: Permissions for Selected Resources */}
                {selectedUser && selectedFolders.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2 text-blue-700">Step 2: Set Permissions for Selected Resources</h3>
                    {selectedFolders.map(resourceId => {
                      const resource = findResourceById(folders, resourceId); // Use the recursive findResourceById
                      const resourceName = resource?.name || resource?.fileName || resourceId;
                      const currentResourcePermissions = folderPermissions[resourceId] || [];

                      return (
                        <div key={resourceId} className="mb-4 p-3 bg-white border rounded">
                          <div className="font-semibold mb-2 text-blue-800">
                            {resourceName}
                          </div>

                          {/* File Permissions Section */}
                          <h5 className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-2 mb-1">File Permissions</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {FILE_PERMISSIONS.map(perm => (
                              <label key={perm} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={currentResourcePermissions.includes(perm)}
                                  onChange={e => {
                                    const isChecked = e.target.checked;
                                    let newPerms = [...currentResourcePermissions];
                                    if (isChecked) {
                                      if (!newPerms.includes(perm)) newPerms.push(perm);
                                    } else {
                                      newPerms = newPerms.filter(p => p !== perm);
                                    }
                                    setFolderPermissions(prev => ({
                                      ...prev,
                                      [resourceId]: newPerms
                                    }));
                                  }}
                                  className="form-checkbox h-4 w-4 text-green-600 mr-2"
                                />
                                {perm.replace(/_/g, " ")}
                              </label>
                            ))}
                          </div>

                          {/* Folder Permissions Section */}
                          <h5 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mt-3 mb-1">Folder Permissions</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {FOLDER_PERMISSIONS.map(perm => (
                              <label key={perm} className="flex items-center text-sm">
                                <input
                                  type="checkbox"
                                  checked={currentResourcePermissions.includes(perm)}
                                  onChange={e => {
                                    const isChecked = e.target.checked;
                                    let newPerms = [...currentResourcePermissions];
                                    if (isChecked) {
                                      if (!newPerms.includes(perm)) newPerms.push(perm);
                                    } else {
                                      newPerms = newPerms.filter(p => p !== perm);
                                    }
                                    setFolderPermissions(prev => ({
                                      ...prev,
                                      [resourceId]: newPerms
                                    }));
                                  }}
                                  className="form-checkbox h-4 w-4 text-purple-600 mr-2"
                                />
                                {perm.replace(/_/g, " ")}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      onClick={async () => {
                        setSaving(true);
                        try {
                          let successCount = 0;
                          let errorCount = 0;
                          for (const folderId of selectedFolders) {
                            const perms = folderPermissions[folderId] || [];
                            if (perms.length === 0) continue;
                            try {
                              await apiCall.createMemberPermission({
                                resourceType: "FOLDER",
                                permissions: perms,
                                folderId,
                                accountId: selectedUser.id,
                                inherited: false
                              });
                              successCount++;
                            } catch (err) {
                              errorCount++;
                            }
                          }
                          if (successCount > 0) toast.success(`Saved permissions for ${successCount} folder(s)!`);
                          if (errorCount > 0) toast.error(`Failed to save permissions for ${errorCount} folder(s).`);
                          await fetchUserPermissions(selectedUser.id);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save All Permissions"}
                    </button>
                  </div>
                )}
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
                        className="flex-1 bg-blue600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relatiade@gmail.comve">
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
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={editingGroup.name}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editingGroup.department}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Permissions and Resources - Editable */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Permissions
                      </h4>

                      {/* File-specific Permissions */}
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">File-specific</h5>
                        <div className="grid grid-cols-2 gap-1">
                          {FILE_PERMISSIONS.map(perm => (
                            <label key={perm} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                onChange={(e) => {
                                  const currentGroupPermissions = safeArrayCheck(editingGroup?.permissions);
                                  let newGroupPermissions;
                                  if (e.target.checked) {
                                    if (!currentGroupPermissions.includes(perm)) {
                                      newGroupPermissions = [...currentGroupPermissions, perm];
                                    } else {
                                      newGroupPermissions = [...currentGroupPermissions];
                                    }
                                  } else {
                                    newGroupPermissions = currentGroupPermissions.filter(p => p !== perm);
                                  }
                                  setEditingGroup(prev => prev ? {
                                    ...prev,
                                    permissions: [...new Set(newGroupPermissions)]
                                  } : null);
                                }}
                                className="form-checkbox h-4 w-4 text-green-600 mr-2"
                              />
                              <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Folder-specific Permissions */}
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Folder-specific</h5>
                        <div className="grid grid-cols-2 gap-1">
                          {FOLDER_PERMISSIONS.map(perm => (
                            <label key={perm} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={safeArrayCheck(editingGroup?.permissions).includes(perm)}
                                onChange={(e) => {
                                  const currentGroupPermissions = safeArrayCheck(editingGroup?.permissions);
                                  let newGroupPermissions;
                                  if (e.target.checked) {
                                    if (!currentGroupPermissions.includes(perm)) {
                                      newGroupPermissions = [...currentGroupPermissions, perm];
                                    } else {
                                      newGroupPermissions = [...currentGroupPermissions];
                                    }
                                  } else {
                                    newGroupPermissions = currentGroupPermissions.filter(p => p !== perm);
                                  }
                                  setEditingGroup(prev => prev ? {
                                    ...prev,
                                    permissions: [...new Set(newGroupPermissions)]
                                  } : null);
                                }}
                                className="form-checkbox h-4 w-4 text-purple-600 mr-2"
                              />
                              <span className="ml-2 text-sm">{perm.replace(/_/g, " ")}</span>
                            </label>
                          ))}
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