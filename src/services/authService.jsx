import apiClient from "../api/config";

const AuthService = {
    async login(credentials) {
        console.log("logging in");
        const response = await apiClient.post('/auth/login', credentials);        
        return response;
    },

    async register(userData) {
        console.log("registering");
        return await apiClient.post('/auth/register', userData);
    }
};

export default AuthService;