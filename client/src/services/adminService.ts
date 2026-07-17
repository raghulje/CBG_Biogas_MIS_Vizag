import axios from 'axios';

const apiBase = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')).replace(/\/?$/, '');
const api = axios.create({
    baseURL: apiBase + '/admin',
});

// Used for GET /mis/form-config (single form-config endpoint)
const baseApi = axios.create({ baseURL: apiBase });
baseApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
baseApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

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

export const adminService = {
    // Single form-config API (roles, permissions, smtp_config, scheduler_config)
    getFormConfig: async () => {
        const response = await baseApi.get('/mis/form-config');
        return response.data;
    },

    // Users
    getUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    createUser: async (user: any) => {
        const response = await api.post('/users', user);
        return response.data;
    },
    updateUser: async (id: number, user: any) => {
        const response = await api.put(`/users/${id}`, user);
        return response.data;
    },
    deleteUser: async (id: number) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    // Roles
    getRoles: async () => {
        const response = await api.get('/roles');
        return response.data;
    },
    assignPermissions: async (data: any) => {
        const response = await api.post('/roles/assign-permissions', data);
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (params?: any) => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    },
    // Login sessions (login time, logout time, session duration)
    getSessions: async (params?: { limit?: number }) => {
        const response = await api.get('/sessions', { params });
        return response.data;
    },

    /** Outbound SMTP attempts (Final MIS, MIS reminders, etc.) */
    getEmailLogs: async (params?: { limit?: number; offset?: number; entity_type?: string }) => {
        const response = await api.get('/email-logs', { params });
        return response.data;
    },

    // Email Templates
    getTemplates: async () => {
        const response = await api.get('/email-templates');
        return response.data;
    },
    createTemplate: async (template: any) => {
        const response = await api.post('/email-templates', template);
        return response.data;
    },
    updateTemplate: async (id: number, template: any) => {
        const response = await api.put(`/email-templates/${id}`, template);
        return response.data;
    },
    deleteTemplate: async (id: number) => {
        const response = await api.delete(`/email-templates/${id}`);
        return response.data;
    },

    // Schedulers
    getSchedulers: async () => {
        const response = await api.get('/schedulers');
        return response.data;
    },
    createScheduler: async (scheduler: any) => {
        const response = await api.post('/schedulers', scheduler);
        return response.data;
    },
    updateScheduler: async (id: number, scheduler: any) => {
        const response = await api.put(`/schedulers/${id}`, scheduler);
        return response.data;
    },

    // SMTP Configuration
    getSMTPConfig: async () => {
        const response = await api.get('/smtp-config');
        return response.data;
    },
    createSMTPConfig: async (config: any) => {
        const response = await api.post('/smtp-config', config);
        return response.data;
    },
    updateSMTPConfig: async (id: number, config: any) => {
        const response = await api.put(`/smtp-config/${id}`, config);
        return response.data;
    },
    testSMTPConfig: async (payload: { to: string; host?: string; port?: number; secure?: boolean; auth_user?: string; auth_pass?: string; from_email?: string; from_name?: string }) => {
        const response = await api.post('/smtp-config/test', payload);
        return response.data;
    },

    // MIS Entry email recipients (submit notification + no-entry reminder)
    getMISEmailConfig: async () => {
        const response = await api.get('/mis-email-config');
        return response.data;
    },
    saveMISEmailConfig: async (data: {
        submit_notify_emails: string[];
        entry_not_created_emails: string[];
        not_submitted_notify_emails: string[];
        escalation_notify_emails: string[];
    }) => {
        const response = await api.put('/mis-email-config', data);
        return response.data;
    },

    // Final MIS Report email (recipients, subject, body, schedule)
    getFinalMISReportConfig: async () => {
        const response = await api.get('/final-mis-report-config');
        return response.data;
    },
    saveFinalMISReportConfig: async (data: {
        to_emails: string[];
        subject: string;
        body: string;
        schedule_type: string;
        schedule_time: string;
        cron_expression?: string;
        is_active: boolean;
    }) => {
        const response = await api.put('/final-mis-report-config', data);
        return response.data;
    },
    sendTestFinalMISReport: async (startDate: string, endDate: string) => {
        const response = await api.post('/final-mis-report-config/send-test', { startDate, endDate });
        return { ...response.data, _httpStatus: response.status };
    },
    saveAppTheme: async (theme: string) => {
        const response = await api.put('/app-config/theme', { theme });
        return response.data;
    },
    // Notification Schedule
    getNotificationSchedule: async () => {
        const response = await api.get('/notification-schedule');
        return response.data;
    },
    saveNotificationSchedule: async (data: {
        mis_start_time: string;
        mis_end_time: string;
        reminder_start_time?: string;
        reminder_interval_minutes: number;
        reminder_count: number;
        is_active?: boolean;
    }) => {
        const response = await api.put('/notification-schedule', data);
        return response.data;
    },
    // Multi schedule CRUD
    getNotificationSchedules: async () => {
        const response = await api.get('/notification-schedules');
        return response.data;
    },
    createNotificationSchedule: async (data: any) => {
        const response = await api.post('/notification-schedules', data);
        return response.data;
    },
    updateNotificationSchedule: async (id: number, data: any) => {
        const response = await api.put(`/notification-schedules/${id}`, data);
        return response.data;
    },
    deleteNotificationSchedule: async (id: number) => {
        const response = await api.delete(`/notification-schedules/${id}`);
        return response.data;
    },
};
