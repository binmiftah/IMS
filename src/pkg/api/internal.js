import axios, { AxiosError } from "axios";

// const BaseUrl = "https://api.yareyare.software/api/v1/";
// const BaseUrl = "http://localhost:3004/api/v1/";
const BaseUrl = "http://20.80.82.90:3000/api/v1";
// const BaseUrl = "http://dev.yareyare.software/api/v1/"


class ApiCall {
    constructor(url) {
        this.instance1 = axios.create({
            baseURL: url,
            timeout: 0,
        });

        this.instance2 = axios.create({
            // baseURL: 'http://localhost:3004/api/v2/',
            baseURL: 'http://20.80.82.90:3000/api/v2',
            // baseURL: 'https://api.yareyare.software/api/v2/',
            timeout: 0,

        });
    }


    /**
     *  AUTHENTICATION API CALL
     * */

    async adminLogin(urlPath, data) {
        // Validate inputs
        if (!data.email || !data.password) {
            throw new Error("email and password must be provided");
        }
        const response = await this.instance1.post(urlPath, {
            email: data.email,
            password: data.password
        })
        return response.data;
    }

    async memberLogin(urlPath, data) {
        // Validate inputs
        if (!data.email || !data.password) {
            throw new Error("email and password must be provided");
        }
        const response = await this.instance1.post(urlPath, {
            email: data.email,
            password: data.password
        })
        return response.data;
    }


    async register(urlPath, data) {
        const response = await this.instance1.post(urlPath, {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: data.password
        })
        return response.data;
    }


    async logout(urlPath) {
        const response = await this.instance1.post(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        return response.data;
    }

    /**
     * FOLDER AND FILES API CALL
     * */

    async createFolder(urlPath, data) {
        const response = await this.instance2.post(`${urlPath}?resourceType=FOLDER`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    }

    // async uploadFileToRoot(urlPath, data) {
    //     const response = await this.instance2.post(`${urlPath}?resourceType=FILE`, data, {
    //         headers: {
    //             'Content-Type': 'multipart/form-data',
    //             Authorization: `Bearer ${localStorage.getItem("token")}`
    //         }
    //     })

    //     return response.data;
    // }

    // In the ApiCall class, update the uploadFile method:
    async uploadFile(urlPath, data) {
        // Check if the URL already has query parameters
        // const hasParams = urlPath.includes('?');
        // const separator = hasParams ? '&' : '?';
        try {
            const response = await this.instance2.post(`${urlPath}?resourceType=FILE`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            console.log("Upload successful:", response.data);
            return response.data;
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
    }

    async uploadFolder(urlPath, data) {
        try {
            console.log("📁 Starting folder upload API call");
            console.log("URL path:", urlPath);
            console.log("FormData entries:");

            // Log FormData contents for debugging
            for (let [key, value] of data.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            const response = await this.instance2.post(`${urlPath}?resourceType=FOLDER`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            console.log("✅ Folder upload API successful:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Folder upload API error:", error);

            // More detailed error logging
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
            } else if (error.request) {
                console.error("Request made but no response:", error.request);
            } else {
                console.error("Error in setting up request:", error.message);
            }

            throw error;
        }
    }

    async uploadFileWithProgress(urlPath, data, onProgress) {
        try {
            console.log("📁 Starting file upload with progress tracking");
            const response = await this.instance2.post(`${urlPath}?resourceType=FILE`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload progress: ${percentCompleted}%`);
                    if (onProgress) {
                        onProgress(percentCompleted);
                    }
                }
            });

            console.log("✅ File upload with progress successful:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ File upload with progress error:", error);
            throw error;
        }
    }

    // ✅ ADD FOLDER UPLOAD WITH PROGRESS
    async uploadFolderWithProgress(urlPath, data, onProgress) {
        try {
            console.log("📁 Starting folder upload with progress tracking");
            console.log("URL path:", urlPath);
            console.log("FormData entries:");

            // Log FormData contents for debugging
            for (let [key, value] of data.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File - ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            // ✅ FIX: Add the resourceType parameter to match your API
            const response = await this.instance2.post(`${urlPath}?resourceType=FOLDER`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                timeout: 30000000,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Folder upload progress: ${percentCompleted}%`);
                    if (onProgress) {
                        onProgress(percentCompleted);
                    }
                }
            });

            console.log("✅ Folder upload with progress successful:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Folder upload with progress error:", error);
            throw error;
        }

    }

    async getFile(urlPath) {
        const hasParams = urlPath.includes('?');
        const separator = hasParams ? '&' : '?';
        const response = await this.instance2.get(`${urlPath}${separator}resourceType=FOLDER`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data.data || [];
    }

    async getFolder(urlPath) {
        const response = await this.instance2.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        return response.data.data || [];
    }

    async getFolderById(urlPath) {
        // Check if the URL already has query parameters
        const hasParams = urlPath.includes('?');
        const separator = hasParams ? '&' : '?';

        const response = await this.instance2.get(`${urlPath}${separator}resourceType=FOLDER`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        // Handle various response structures
        if (response.data && response.data.data === null) {
            // If data is null, return an empty object with essential properties
            return { files: [], children: [] };
        }

        // Return the whole data structure, not just files
        return response.data.data || { files: [], children: [] };
    }

    async getFileById(urlPath) {
        const response = await this.instance2.get(`${urlPath}?resourceType=FILE`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    }

    async deleteFolder(urlPath, data) {
        const response = await this.instance2.delete(urlPath, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            data: data // axios DELETE with body
        });
        return response.data;
    }

    async deleteFile(urlPath, data) {
        const response = await this.instance2.delete(urlPath, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            data: data // axios DELETE with body
        });
        return response.data;
    }


    /**
     * AUDITLOG API CALL
     * */
    async allAuditLogs(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }


    /**
     * MEMBERS API CALLS
     * */
    async createNewMember(urlPath, data) {
        const response = await this.instance1.post(urlPath, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getAllUsers(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getAllMembers(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getAllFolders(urlPath = "folders") {
        const response = await this.instance2.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response;
    }

    async getAccessibleFiles() {
        try {
            console.log("Fetching all accessible files and folders...");
            const response = await this.instance2.get(`files/accessible`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log("Accessible files API response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching accessible files:", error);
            throw error;
        }
    }

    /**
     * PERMISSIONS API CALLS
     */

    async getPermissionById(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getUserPermissions(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response;
    }

    // async getGroupPermissions(urlPath) {
    //     const response = await this.instance1.get(urlPath, {
    //         headers: {
    //             Authorization: `Bearer ${localStorage.getItem("token")}`
    //         }
    //     })
    //     return response.data;
    // }

    async createMemberPermission(data) {
        try {
            console.log("Creating member permission with data:", data);

            const response = await this.instance1.post("permissions/member", data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            console.log("Member permission API response:", response.data);
            return response.data;
        } catch (error) {
            console.log("Member permission API Error:", error.response?.data);
            throw error;
        }
    }

    /**
     * Create group folder permissions
     * Assigns permissions to folders for a specific security group
     */
    // async createGroupFolderPermission(groupId, data) {
    //     try {
    //         const formattedData = {
    //             resourceType: "FOLDER",
    //             permissions: data.permissions.map(perm => {
    //                 if (perm === "READ_FILES") return "READ";
    //                 if (perm === "WRITE_FILES") return "WRITE";
    //                 if (perm === "DELETE_FILES") return "DELETE";
    //                 return perm;
    //             }),
    //             folderIds: data.folderIds,
    //             groupId: groupId,
    //             inherited: data.inherited || false
    //         };

    //         console.log("Creating group folder permissions:", formattedData);

    //         const response = await this.instance1.post("permissions/group/folder", formattedData, {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 Authorization: `Bearer ${localStorage.getItem("token")}`
    //             }
    //         });

    //         return response.data;
    //     } catch (error) {
    //         // Log the specific error for debugging
    //         if (error.response && error.response.data) {
    //             console.error("API Error Details:", error.response.data);
    //         }
    //         throw error;
    //     }
    // }

    async createGroupFolderPermission(groupId, data) {
        try {
            const formattedData = {
                resourceType: "FOLDER",
                permissions: data.permissions, // Keep as-is since you're already mapping in the component
                folderIds: data.folderIds,
                groupId: groupId,
                inherited: data.inherited || false
            };

            console.log("Creating group folder permissions:", formattedData);

            const response = await this.instance1.post("permissions/group/folder", formattedData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Get folder permissions for a security group
     * Retrieves all folder permissions assigned to a specific group
     */

    async getGroupFolderPermissions(groupId) {
        try {
            if (!groupId) {
                throw new Error("Group ID is required");
            }

            const response = await this.instance1.get(`permissions/group/${groupId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            return response.data;
        } catch (error) {
            // Log the specific error for debugging
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    // async createGroupFilePermission(groupId, data) {
    //     try {
    //         const formattedData = {
    //             resourceType: "FILE",
    //             permissions: data.permissions.map(perm => {
    //                 if (perm === "READ_FILES") return "READ";
    //                 if (perm === "WRITE_FILES") return "WRITE";
    //                 if (perm === "DELETE_FILES") return "DELETE";
    //                 return perm;
    //             }),
    //             fileIds: data.fileIds,
    //             groupId: groupId,
    //             inherited: data.inherited || false
    //         };

    //         console.log("Creating group file permissions:", formattedData);

    //         const response = await this.instance1.post("permissions/group/file", formattedData, {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 Authorization: `Bearer ${localStorage.getItem("token")}`
    //             }
    //         });

    //         return response.data;
    //     } catch (error) {
    //         // Log the specific error for debugging
    //         if (error.response && error.response.data) {
    //             console.error("API Error Details:", error.response.data);
    //         }
    //         throw error;
    //     }
    // }

    async createGroupFilePermission(groupId, data) {
        try {
            const formattedData = {
                resourceType: "FILE",
                permissions: data.permissions, // Keep as-is since you're already mapping in the component
                fileIds: data.fileIds,
                groupId: groupId,
                inherited: data.inherited || false
            };

            console.log("Creating group file permissions:", formattedData);

            const response = await this.instance1.post("permissions/group/file", formattedData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Add users to a security group
     * @param {string} urlPath - API endpoint
     * @param {Object} data - Group and user data
     * @param {string} data.groupId - ID of the security group
     * @param {Array<string>} data.userIds - Array of user IDs to add to the group
     * ✕
*/
    async addUsersToGroup(urlPath, data) {
        try {
            const response = await this.instance1.post(urlPath, {
                groupId: data.groupId,
                userIds: data.userIds
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log("Add users to group response:", response.data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Static Permissions
     */
    getStaticPermissions() {
        return [
            // File-specific permissions
            "OPEN_FILE",
            "DELETE_FILE",
            "UPLOAD_FILE",
            "RENAME_FILE",
            "DOWNLOAD_FILE",
            "MOVE_FILE",
            "COPY_FILE",
            "SHARE_FILE",
            // Folder-specific permissions
            "CREATE_FOLDER",
            "OPEN_FOLDER",
            "RENAME_FOLDER",
            "MOVE_FOLDER",
            "COPY_FOLDER",
            "UPLOAD_FOLDER",
            "DELETE_FOLDER",
            "SHARE_FOLDER"
        ];
    }

    // TRASH ITEMS
    async getTrashed(url) {
        const response = await this.instance1.get(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data.trashedItems
    }

    async restoreItem(trashId, data) {
        try {
            console.log("Restoring item with trash ID:", trashId);
            console.log("Restore data:", data);

            // Use axios.request() method to properly send body with GET request
            const response = await axios({
                method: 'PUT',
                url: `${this.instance2.defaults.baseURL}/files/file/restore/${trashId}`,
                data: {
                    type: data.type, // "FILE" or "FOLDER"
                    itemId: data.itemId
                },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            console.log("Restore response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error restoring item:", error);
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Create a security group
     */
    async createSecurityGroup(data) {
        try {
            const response = await this.instance1.post("security-group", {
                name: data.name,
                description: data.description
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Add a user to a security group
     */
    async addUserToSecurityGroup(groupId, userId) {
        try {
            const response = await this.instance1.post(`security-group/${groupId}/add-user`, {
                userId: userId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Get all security groups
     */
    async getSecurityGroups() {
        try {
            const response = await this.instance1.get("security-group", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            // Process the response to ensure each group has the necessary properties
            let groups = [];

            if (response.data?.data?.securityGroups) {
                groups = response.data.data.securityGroups;
            } else if (Array.isArray(response.data?.data)) {
                groups = response.data.data;
            } else if (Array.isArray(response.data)) {
                groups = response.data;
            }

            // Map to ensure consistent structure for each group
            const processedGroups = groups.map(group => ({
                id: group.id,
                name: group.name || 'Unnamed Group',
                department: group.description || group.department || '',
                permissions: group.permissions || [],
                resources: group.resources || [],
                users: group.users || [],
                userCount: group.users?.length || group.userCount || 0
            }));

            return {
                status: 'success',
                data: {
                    securityGroups: processedGroups
                }
            };
        } catch (error) {
            console.error("Error fetching security groups:", error);
            // Return a valid empty response to prevent crashes
            return {
                status: 'success',
                data: {
                    securityGroups: []
                }
            };
        }
    }

    // ✅ Generic PUT method for updating resources
    async put(urlPath, data = {}) {
        try {
            const response = await this.instance2.put(urlPath, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            return response.data;
        } catch (error) {
            console.error("PUT request error:", error);
            if (error.response && error.response.data) {
                console.error("API Error Details:", error.response.data);
            }
            throw error;
        }
    }

}


const apiCall = new ApiCall(BaseUrl);
export default apiCall;