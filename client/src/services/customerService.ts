import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')),
    headers: {
        'Content-Type': 'application/json',
    },
});

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

export const customerService = {
    getCustomers: async (params?: { search?: string; status?: string; type?: string }, signal?: AbortSignal) => {
        const response = await api.get('/customers', { params, signal });
        return response.data;
    },
    getCustomerById: async (id: number) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },
    createCustomer: async (data: any) => {
        const response = await api.post('/customers', data);
        return response.data;
    },
    updateCustomer: async (id: number, data: any) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },
    deleteCustomer: async (id: number) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    }
};
