import axios from 'axios';
import {API_URL} from '../config';

const api=axios.create({
    baseURL: API_URL,
    headers:{
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config)=>{
    const token=localStorage.getItem('token');
    if(token){
        config.headers.Authorization=`Bearer ${token}`;
    }
    return config;
})

api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        const isAuthEndpoint = error.config?.url?.includes('/login')
            || error.config?.url?.includes('/register')
            || error.config?.url?.includes('/profile');

        if(error.response?.status===401 && !isAuthEndpoint){
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href='/login';
        }
        return Promise.reject(error);
    }
)
export default api;