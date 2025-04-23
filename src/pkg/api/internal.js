import axios, {AxiosError} from "axios";

const BaseUrl =  "http://18.208.155.254/api/v1/";
// const BaseUrlTesting = "http://localhost:3002/api/v1/";

class ApiCall {
    constructor(url) {
        this.instance = axios.create({
            baseURL: url,
            timeout: 1000,
        });
    }


    async login(urlPath, data) {
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

        console.log(response)
        return response.data;
    }


    async allAuditLogs(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }


    //NOTES: FILES API CALL
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


    async getFolderById(urlPath) {
        const response = await this.instance.get(urlPath, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data.data
    }

}


const apiCall = new ApiCall(BaseUrl)
export default apiCall;