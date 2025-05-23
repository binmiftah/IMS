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

    async uploadFile(urlPath, data) {
        // Check if the URL already has query parameters
        const hasParams = urlPath.includes('?');
        const separator = hasParams ? '&' : '?';

        const response = await this.instance2.post(`${urlPath}${separator}resourceType=FILE`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        return response.data;
    }

    async getFile(urlPath) {
        const hasParams = urlPath.includes('?');
        const separator = hasParams ? '&' : '?';
        const response = await this.instance2.get(`${urlPath}${separator}resourceType=FILE`, {
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
        const response = await this.instance2.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    }

    async deleteFolder(urlPath) {
        const response = await this.instance1.delete(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data
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

    async getGroupPermissions(urlPath) {
        const response = await this.instance1.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async createMemberPermission(urlPath, data) {
        try {
            // Ensure proper format - API might expect a specific structure
            const formattedData = {
                accountId: data.accountId,
                resourceType: data.resourceType,
                permissions: data.permissions,
                folderIds: data.folderIds,
                inherited: data.inherited
            };

            const response = await this.instance1.post(urlPath, formattedData, {
                headers: {
                    'Content-Type': 'application/json',
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

    /**
     * Static Permissions
     */
    getStaticPermissions() {
        return [
            "READ_FILES",
            "WRITE_FILES",
            "DELETE_FILES",
            "MANAGE_USERS",
            "VIEW_AUDIT_LOGS",
            "MANAGE_GROUPS",
            "ACCESS_SETTINGS",
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

    async restoreItem(url, item) {
        const response = await this.instance1.put(url, {
            type: item.itemType,
            folderId: item.folderId
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response
    }
}


const apiCall = new ApiCall(BaseUrl);
export default apiCall;
// import axios, {AxiosError} from "axios";

// const BaseUrl =  "https://api.yareyare.software/api/v1/";
// // const BaseUrl = "http://localhost:3004/api/v1/";
// // const BaseUrl = "http://dev.yareyare.software/api/v1/"

// class ApiCall {
//     constructor(url) {
//         this.instance1 = axios.create({
//             baseURL: url,
//             timeout: 0,
//         });

//         this.instance2 = axios.create({
//             // baseURL: 'http://localhost:3004/api/v2/',
//             baseURL: 'https://api.yareyare.software/api/v1/',
//             timeout: 0,

//         });
//     }


//     /**
//      *  AUTHENTICATION API CALL
//      * */

//     async adminLogin(urlPath, data) {
//         // Validate inputs
//         if (!data.email || !data.password) {
//             throw new Error("email and password must be provided");
//         }
//         const response = await this.instance1.post(urlPath, {
//             email: data.email,
//             password: data.password
//         })
//         return response.data;
//     }

//     async memberLogin(urlPath, data) {
//         // Validate inputs
//         if (!data.email || !data.password) {
//             throw new Error("email and password must be provided");
//         }
//         const response = await this.instance1.post(urlPath, {
//             email: data.email,
//             password: data.password
//         })
//         return response.data;
//     }


//     async register(urlPath, data) {
//         const response = await this.instance1.post(urlPath, {
//             fullName: data.fullName,
//             email: data.email,
//             phoneNumber: data.phoneNumber,
//             password: data.password
//         })
//         return response.data;
//     }


//     async logout(urlPath) {
//         const response = await this.instance1.post(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         localStorage.removeItem("token")
//         localStorage.removeItem("user")
//         return response.data;
//     }

//     /**
//      * FOLDER AND FILES API CALL
//      * */

//     async createFolder(urlPath, data) {

//         const response = await this.instance2.post(urlPath, {
//             folderName: data.folderName,
//         }, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     async uploadFile(urlPath, data) {
//         const response = await this.instance2.post(urlPath, data, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })

//         return response.data;
//     }

//     async getFile(urlPath){
//         // GET root file
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })

//         return response.data.data.files
//     }

//     async getFolder(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data.data.folders
//     }

//     async getRootLevelFiles(urlPath){
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })

//         return response.data.data.folders
//     }


//     async getFolderById(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         return response.data.data
//     }

//     async deleteFolder(urlPath) {
//         const response = await this.instance1.delete(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         console.log(response)
//         return response.data.data
//     }


//     /**
//      * AUDITLOG API CALL
//      * */
//     async allAuditLogs(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }


//     /**
//      * MEMBERS API CALLS
//      * */
//     async createNewMember(urlPath, data) {
//         const response = await this.instance1.post(urlPath,data, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     async getAllUsers(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     async getAllMembers(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     /**
//      * PERMISSIONS API CALLS
//       */
//     async getAllPermissions(urlPath) {
//         const response = await this.instance1.get(urlPath, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     async createPermission(urlPath, data) {
//         const response = await this.instance1.post(urlPath, data, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data;
//     }

//     // TRASH ITEMS
//     async getTrashed(url) {
//         const response = await this.instance1.get(url, {
//             headers: {
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response.data.data.trashedItems
//     }

//     async restoreItem(url, item){
//         const response = await this.instance1.put(url, {
//             type: item.itemType,
//             folderId: item.folderId
//         }, {
//             headers:{
//                 Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//         })
//         return response
//     }
// }


// const apiCall = new ApiCall(BaseUrl);
// export default apiCall;