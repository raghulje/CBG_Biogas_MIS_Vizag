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

export const misService = {
    createEntry: async (data: any) => {
        const response = await api.post('/mis-entries', data);
        return response.data;
    },
    getEntries: async (opts?: { includeDeleted?: boolean }) => {
        try {
            const params: Record<string, any> = {};
            if (opts?.includeDeleted) params.includeDeleted = 'true';
            const response = await api.get('/mis-entries', { params });
            return response.data;
        } catch (err) {
            console.error('misService.getEntries error:', err);
            return []; // graceful fallback for network errors
        }
    },
    getEntryById: async (id: number) => {
        const response = await api.get(`/mis-entries/${id}`);
        return response.data;
    },
    updateEntry: async (id: number, data: any) => {
        const response = await api.put(`/mis-entries/${id}`, data);
        return response.data;
    },
    deleteEntry: async (id: number) => {
        const response = await api.delete(`/mis-entries/${id}`);
        return response.data;
    },
    submitEntry: async (id: number) => {
        const response = await api.post(`/mis-entries/${id}/submit`);
        return response.data;
    },
    approveEntry: async (id: number) => {
        const response = await api.post(`/mis-entries/${id}/approve`);
        return response.data;
    },
    rejectEntry: async (id: number, comment: string) => {
        const response = await api.post(`/mis-entries/${id}/reject`, { review_comment: comment });
        return response.data;
    },
    exportEntries: async (params: any) => {
        const response = await api.get('/mis-entries/export', { params, responseType: 'blob' });
        return response.data;
    },
    /** Final MIS HTML report for one entry (same as email report), downloadable from list Print icon */
    downloadEntryFinalMisReport: async (id: number | string) => {
        const response = await api.get(`/mis-entries/${id}/final-report`, { responseType: 'blob' });
        return response.data;
    },
    hardDeleteEntry: async (id: number) => {
        const response = await api.delete(`/mis-entries/${id}/hard`);
        return response.data;
    },
    importEntries: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/mis-entries/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getDashboardData: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        year?: number | string;
        week?: number | string;
        month?: number | string;
    } = {}) => {
        const period = params.period ?? 'month';
        const query: Record<string, string> = { period };
        if (params.startDate) query.startDate = params.startDate;
        if (params.endDate) query.endDate = params.endDate;
        if (params.year != null) query.year = String(params.year);
        if (params.week != null) query.week = String(params.week);
        if (params.month != null) query.month = String(params.month);
        const response = await api.get('/dashboard/daily', { params: query });
        return response.data;
    },
    getConsolidatedData: async (params: {
        startDate?: string;
        endDate?: string;
        financialYear?: string;
        quarter?: string;
        year?: string;
    }) => {
        const response = await api.get('/mis-entries/consolidated', { params });
        return response.data;
    },
    /** Full MIS entries for Final MIS report (date range). */
    getEntriesForReport: async (params: { startDate: string; endDate: string }) => {
        try {
            const response = await api.get('/mis-entries/for-report', { params });
            return response.data;
        } catch (err) {
            console.error('misService.getEntriesForReport error:', err);
            return []; // graceful fallback
        }
    },
    getImportTemplate: async (): Promise<Blob> => {
        const response = await api.get('/mis-entries/import-template', { responseType: 'blob' });
        return response.data;
    },
    getCBGSalesBreakdown: async (params: {
        period?: string;
        startDate?: string;
        endDate?: string;
        year?: number | string;
        week?: number | string;
        month?: number | string;
    } = {}) => {
        const period = params.period ?? 'month';
        const query: Record<string, string> = { period };
        if (params.startDate) query.startDate = params.startDate;
        if (params.endDate) query.endDate = params.endDate;
        if (params.year != null) query.year = String(params.year);
        if (params.week != null) query.week = String(params.week);
        if (params.month != null) query.month = String(params.month);
        const response = await api.get('/dashboard/cbg-sales', { params: query });
        return response.data;
    }
};
