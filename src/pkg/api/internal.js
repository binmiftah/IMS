import axios, {AxiosError} from "axios";

// const BaseUrl =  "http://18.208.155.254/api/v1/";
const BaseUrlTesting = "http://localhost:3002/api/v1/";

class ApiCall {
    constructor(url) {
        this.instance = axios.create({
            baseURL: url,
            timeout: 10000,
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
        const response = await this.instance.post(urlPath, {
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
        const response = await this.instance.post(urlPath, {
            email: data.email,
            password: data.password
        })
        return response.data;
    }


    async register(urlPath, data) {
        const response = await this.instance.post(urlPath, {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: data.password
        })
        return response.data;
    }


    async logout(urlPath) {
        const response = await this.instance.post(urlPath, {
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
        const response = await this.instance.post(urlPath, {
            folderName: data.folderName,
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async uploadFile(urlPath, data) {
        console.log(data)
        const response = await this.instance.post(urlPath, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })

        return response.data;
    }

    async getFile(urlPath){
        // GET root file
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })

        return response.data.data.files
    }

    async getFolder(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data.folders
    }

    async getRootLevelFiles(urlPath){
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })

        return response.data.data.folders
    }


    async getFolderById(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data
    }

    async deleteFolder(urlPath) {
        const response = await this.instance.delete(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        console.log(response)
        return response.data.data
    }


    /**
     * AUDITLOG API CALL
     * */
    async allAuditLogs(urlPath) {
        const response = await this.instance.get(urlPath, {
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
        const response = await this.instance.post(urlPath,data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getAllUsers(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async getAllMembers(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }


    /**
     * PERMISSIONS API CALLS
      */
    async getAllPermissions(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async createPermission(urlPath, data) {
        const response = await this.instance.post(urlPath, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    // TRASH ITEMS
    async getTrashed(url) {
        const response = await this.instance.get(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data.trashedItems
    }

    async restoreItem(url, item){
        const response = await this.instance.put(url, {
            type: item.itemType
        }, {
            headers:{
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })

        return response
    }
}


const apiCall = new ApiCall(BaseUrlTesting);
export default apiCall;