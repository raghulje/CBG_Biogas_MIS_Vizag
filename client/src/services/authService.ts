import axios from 'axios';

// In dev, use relative /api so Vite proxies to backend (no CORS, no port mismatch)
const apiBase = import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3015/api'));
const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token: string, password: string) => {
        const response = await api.post('/auth/reset-password', { token, password });
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('token');
        return response.data;
    }
};

export const userService = {
    getAllUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },
    createUser: async (data: any) => {
        const response = await api.post('/admin/users', data);
        return response.data;
    },
    updateUser: async (id: string, data: any) => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },
    deleteUser: async (id: string) => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
    }
};
