import axios from 'axios';

const isClient = typeof window !== 'undefined';
const HOST = isClient ? window.location.hostname : 'localhost';
const PORT = isClient ? window.location.port : '9000';
const API_URL = `http://${HOST}:${PORT}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — auto-redirect to login on 401 (expired/invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Don't redirect if already on login page or if this IS the login request
            const isLoginRequest = error.config?.url?.includes('/accounts/login') || error.config?.url?.includes('/accounts/pin-login');
            if (typeof window !== 'undefined' && !isLoginRequest) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
