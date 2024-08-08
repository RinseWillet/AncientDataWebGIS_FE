//axios
import axios from 'axios';

let baseURL ='/api';
if(process.env.NODE_ENV === 'development') {
    baseURL = 'http://localhost:8080/api'
}

let apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        //types of responses accepted and expected
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

export default apiClient;