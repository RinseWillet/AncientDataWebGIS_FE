import apiClient from "../api/config";

const AuthService = {
    async login(credentials) {
        return await apiClient.post('/auth/login', credentials);
    },

    async register(userData) {
        return await apiClient.post('/auth/register', userData);
    }
};

export default AuthService;