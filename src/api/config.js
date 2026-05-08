import axios from 'axios';
import { getAuthToken } from '../features/authentication/authStorage';

const defaultDevBaseUrl = 'http://localhost:8080/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = configuredBaseUrl || (import.meta.env.DEV ? defaultDevBaseUrl : '/api');

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
