import axios from 'axios';

const defaultDevBaseUrl = 'http://localhost:8080/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = configuredBaseUrl || (import.meta.env.DEV ? defaultDevBaseUrl : '/api');

const getStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const storedUser = getStoredUser();
        if (storedUser?.token) {
            config.headers.Authorization = `Bearer ${storedUser.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
