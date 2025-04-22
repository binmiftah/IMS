import axios, {AxiosError} from "axios";

// const BaseUrl =  "http://18.208.155.254/api/v1/";
const BaseUrlTesting = "http://localhost:3002/api/v1/";

class ApiCall {
    constructor(url) {
        this.instance = axios.create({
            baseURL: url,
            timeout: 1000,
        });
    }


    async login(path, data) {
        // Validate inputs
        if (!data.email || !data.password) {
            throw new Error("email and password must be provided");
        }
        const response = await this.instance.post(path, {
            email: data.email,
            password: data.password
        })
        return response.data;
    }


    async register(path, data) {
        const response = await this.instance.post(path, {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: data.password
        })
        return response.data;
    }


    async logout(path) {
        const response = await this.instance.post(path, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        return response.data;
    }


    async createFolder(path, data) {
        const response = await this.instance.post(path, {
            folderName: data.folderName,
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

    async uploadFile(path, data) {
        console.log(data)
        const response = await this.instance.post(path, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }


    async allAuditLogs(path) {
        const response = await this.instance.get(path, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        return response.data;
    }

}


const apiCall = new ApiCall(BaseUrlTesting)
export default apiCall;