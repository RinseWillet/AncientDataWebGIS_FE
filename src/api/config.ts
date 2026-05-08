import axios, { AxiosHeaders } from 'axios';
import { getAuthToken } from '../features/authentication/authStorage';

const defaultDevBaseUrl = 'http://localhost:8080/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = configuredBaseUrl || (import.meta.env.DEV ? defaultDevBaseUrl : '/api');

const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      const headers = config.headers
        ? AxiosHeaders.from(config.headers)
        : new AxiosHeaders();

      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;


