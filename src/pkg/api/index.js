import axios from "axios";

const BaseUrl =  "http://18.208.155.254/api/v1/";

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
}


const apiCall = new ApiCall(BaseUrl);
export default apiCall;