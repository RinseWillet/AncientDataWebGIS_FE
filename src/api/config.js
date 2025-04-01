//axios
import axios from 'axios';

let baseURL ='/api';
if(process.env.NODE_ENV === 'development') {
    baseURL = 'http://localhost:8080/api'
}

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        //types of responses accepted and expected
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser?.token) {
            config.headers.Authorization = `Bearer ${storedUser.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;