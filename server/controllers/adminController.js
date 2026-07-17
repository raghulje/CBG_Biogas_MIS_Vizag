const {
    User, Role, Permission, RolePermission,
    SMTPConfig, EmailScheduler, AuditLog, EmailTemplate, NotificationSchedule,
    UserActivityLog, MISEmailConfig, FinalMISReportConfig, EmailLog,
    sequelize
} = require('../models');
const emailService = require('../services/emailService');
const finalMISReportEmailService = require('../services/finalMISReportEmailService');
const { AppConfig } = require('../models');
const auditService = require('../services/auditService');
const schedulerService = require('../services/schedulerService');
const reminderScheduler = require('../services/reminderScheduler');
const permissionMiddleware = require('../middleware/permissionMiddleware');

// --- User Management ---

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [
                { model: Role, as: 'role', attributes: ['id', 'name'] },
                { model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['id', 'name', 'resource', 'action'] }
            ],
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// createUser is handled in authController for now, but admins usually create users too.

// --- Role Management ---

exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({ include: [{ model: Permission, as: 'permissions' }] });
        res.json(roles);
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.createRole = async (req, res) => {
    try {
        const role = await Role.create(req.body);
        res.status(201).json(role);
    } catch (err) { res.status(500).json(err); }
};

// Normalize and dedupe permission IDs for role save
function normalizePermissionIds(permissionIds) {
    if (!Array.isArray(permissionIds)) return [];
    return [...new Set(permissionIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0))];
}

exports.assignPermissions = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const roleId = req.body.roleId != null ? Number(req.body.roleId) : null;
        const permissionIds = normalizePermissionIds(req.body.permissionIds || []);

        if (!roleId || roleId <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Valid roleId is required' });
        }

        const role = await Role.findByPk(roleId, { transaction: t });
        if (!role) {
            await t.rollback();
            return res.status(404).json({ message: 'Role not found' });
        }

        await RolePermission.destroy({ where: { role_id: roleId }, transaction: t });
        if (permissionIds.length > 0) {
            await RolePermission.bulkCreate(
                permissionIds.map(permission_id => ({ role_id: roleId, permission_id })),
                { transaction: t }
            );
        }
        await t.commit();
        permissionMiddleware.invalidateAllPermissions();
        await auditService.log(req.user?.id, 'UPDATE_ROLE_PERMISSIONS', 'Role', roleId, null, { permissionIds }, req);
        res.json({ message: 'Permissions updated', permissionIds });
    } catch (error) {
        await t.rollback();
        console.error('Assign permissions error:', error);
        res.status(500).json({ message: 'Error updating permissions', error: error.message });
    }
};

exports.updateRolePermissions = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const role_id = Number(req.params.id);
        const permissionIds = normalizePermissionIds(req.body.permissionIds || []);

        if (!role_id || role_id <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Valid role id is required' });
        }

        const role = await Role.findByPk(role_id, { transaction: t });
        if (!role) {
            await t.rollback();
            return res.status(404).json({ message: 'Role not found' });
        }

        await RolePermission.destroy({ where: { role_id }, transaction: t });
        if (permissionIds.length > 0) {
            await RolePermission.bulkCreate(
                permissionIds.map(permission_id => ({ role_id, permission_id })),
                { transaction: t }
            );
        }
        await t.commit();
        permissionMiddleware.invalidateAllPermissions();
        await auditService.log(req.user?.id, 'UPDATE_ROLE_PERMISSIONS', 'Role', role_id, null, { permissionIds }, req);
        res.json({ message: 'Permissions updated', permissionIds });
    } catch (error) {
        await t.rollback();
        console.error('Update role permissions error:', error);
        res.status(500).json({ message: 'Error updating permissions', error: error.message });
    }
};

// --- Configuration ---

const SMTP_REQUIRED = ['host', 'port', 'auth_user', 'auth_pass', 'from_email'];

function sanitizeSMTPForResponse(config) {
    try {
        if (!config) return null;
        const o = config.toJSON ? config.toJSON() : (typeof config === 'object' ? { ...config } : null);
        if (!o) return null;
        delete o.auth_pass;
        o.has_password = !!(config.auth_pass);
        return o;
    } catch (e) {
        console.warn('sanitizeSMTPForResponse:', e.message);
        return null;
    }
}

// Columns in smtp_configs table (model no longer has from_name so SELECT matches table)
const SMTP_ATTRS_SAFE = ['id', 'host', 'port', 'secure', 'auth_user', 'auth_pass', 'from_email', 'is_active'];

async function getActiveOrLatestSMTPConfig() {
    let config = await SMTPConfig.findOne({
        where: { is_active: true },
        attributes: SMTP_ATTRS_SAFE
    });
    if (!config) {
        config = await SMTPConfig.findOne({
            order: [['id', 'DESC']],
            attributes: SMTP_ATTRS_SAFE
        });
    }
    return config;
}

exports.getSMTPConfig = async (req, res) => {
    try {
        const config = await getActiveOrLatestSMTPConfig();
        return res.status(200).json(sanitizeSMTPForResponse(config));
    } catch (err) {
        console.error('getSMTPConfig', err);
        return res.status(200).json(null);
    }
};

exports.createSMTPConfig = async (req, res) => {
    try {
        const body = req.body || {};
        for (const key of SMTP_REQUIRED) {
            if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '') {
                return res.status(400).json({ message: `SMTP config missing required field: ${key}` });
            }
        }
        const port = Number(body.port);
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({ message: 'Invalid SMTP port (1–65535)' });
        }

        await SMTPConfig.update({ is_active: false }, { where: {} });
        const config = await SMTPConfig.create({
            host: String(body.host).trim(),
            port: port,
            secure: Boolean(body.secure),
            auth_user: String(body.auth_user).trim(),
            auth_pass: String(body.auth_pass),
            from_email: String(body.from_email).trim(),
            is_active: true
        });

        await auditService.log(req.user.id, 'UPDATE_SMTP_CONFIG', 'SMTPConfig', config.id, null, { host: config.host, port: config.port }, req);
        res.status(201).json(sanitizeSMTPForResponse(config));
    } catch (err) {
        console.error('createSMTPConfig', err);
        res.status(500).json({ message: 'Failed to save SMTP config', error: err.message });
    }
};

exports.updateSMTPConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const config = await SMTPConfig.findByPk(id);
        if (!config) return res.status(404).json({ message: 'SMTP config not found' });

        const port = body.port != null ? Number(body.port) : config.port;
        if (isNaN(port) || port < 1 || port > 65535) {
            return res.status(400).json({ message: 'Invalid SMTP port (1–65535)' });
        }

        const updates = {
            host: body.host != null ? String(body.host).trim() : config.host,
            port,
            secure: body.secure != null ? Boolean(body.secure) : config.secure,
            auth_user: body.auth_user != null ? String(body.auth_user).trim() : config.auth_user,
            from_email: body.from_email != null ? String(body.from_email).trim() : config.from_email
        };
        if (body.auth_pass != null && String(body.auth_pass).trim() !== '') {
            updates.auth_pass = String(body.auth_pass);
        }

        await config.update(updates);
        res.json({ message: 'Updated', config: sanitizeSMTPForResponse(config) });
    } catch (err) {
        console.error('updateSMTPConfig', err);
        res.status(500).json({ message: 'Failed to update SMTP config', error: err.message });
    }
};

exports.testSMTPConfig = async (req, res) => {
    try {
        const emailService = require('../services/emailService');
        const body = req.body || {};
        const to = (body.to && String(body.to).trim()) || null;
        if (!to) {
            return res.status(400).json({ message: 'Test recipient email (to) is required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return res.status(400).json({ message: 'Invalid test recipient email' });
        }

        const configFromBody = body.host && body.auth_user && body.auth_pass && body.from_email;
        if (configFromBody) {
            const config = {
                host: String(body.host).trim(),
                port: Number(body.port) || 587,
                secure: Boolean(body.secure),
                auth_user: String(body.auth_user).trim(),
                auth_pass: String(body.auth_pass),
                from_email: String(body.from_email).trim()
            };
            const result = await emailService.sendTestEmail(config, to);
            if (result.success) {
                return res.json({ message: 'Test email sent successfully', messageId: result.messageId });
            }
            return res.status(400).json({ message: result.error || 'Failed to send test email' });
        }

        const saved = await getActiveOrLatestSMTPConfig();
        if (!saved) {
            return res.status(400).json({ message: 'No SMTP config saved. Save config first or provide full config in the request to test.' });
        }
        const result = await emailService.sendTestEmail(saved, to);
        if (result.success) {
            return res.json({ message: 'Test email sent successfully', messageId: result.messageId });
        }
        return res.status(400).json({ message: result.error || 'Failed to send test email' });
    } catch (err) {
        console.error('testSMTPConfig', err);
        res.status(500).json({ message: 'Failed to send test email', error: err.message });
    }
};

// --- Scheduler ---

exports.createScheduler = async (req, res) => {
    try {
        const scheduler = await EmailScheduler.create(req.body);
        // Refresh service
        await schedulerService.refresh();
        res.status(201).json(scheduler);
    } catch (err) { res.status(500).json(err); }
};

exports.getSchedulers = async (req, res) => {
    try {
        const list = await EmailScheduler.findAll();
        res.json(list);
    } catch (err) { res.status(500).json(err); }
};

exports.updateScheduler = async (req, res) => {
    try {
        const { id } = req.params;
        const scheduler = await EmailScheduler.findByPk(id);
        if (!scheduler) return res.status(404).json({ message: 'Scheduler not found' });

        await scheduler.update(req.body);
        // Refresh service
        await schedulerService.refresh();
        res.json(scheduler);
    } catch (err) { res.status(500).json(err); }
};

// NotificationSchedule CRUD (multiple schedules)
exports.getNotificationSchedulesList = async (req, res) => {
    try {
        const list = await NotificationSchedule.findAll({ order: [['id', 'ASC']] });
        return res.json(list);
    } catch (e) {
        console.error('getNotificationSchedulesList:', e);
        res.status(500).json({ message: 'Failed to load notification schedules' });
    }
};

exports.createNotificationSchedule = async (req, res) => {
    try {
        const body = req.body || {};
        const misStart = body.mis_start_time;
        const misEnd = body.mis_end_time;
        const interval = Number(body.reminder_interval_minutes);
        const count = Number(body.reminder_count);
        const name = String(body.name || 'Reminder').substring(0, 100);
        const target_role = body.target_role || null;
        if (!misStart || !misEnd) return res.status(400).json({ message: 'mis_start_time and mis_end_time are required' });
        const toMinutes = (t) => {
            const parts = String(t).split(':').map(s => Number(s));
            return parts[0] * 60 + (parts[1] || 0);
        };
        if (toMinutes(misStart) >= toMinutes(misEnd)) return res.status(400).json({ message: 'mis_start_time must be before mis_end_time' });
        if (!Number.isInteger(interval) || interval <= 0) return res.status(400).json({ message: 'reminder_interval_minutes must be > 0' });
        if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: 'reminder_count must be > 0' });

        const row = await NotificationSchedule.create({
            name, mis_start_time: misStart, mis_end_time: misEnd,
            reminder_start_time: body.reminder_start_time || misEnd,
            reminder_interval_minutes: interval, reminder_count: count,
            is_active: body.is_active !== false, target_role
        });
        // Refresh only this schedule
        try { await reminderScheduler.refreshSchedule(row.id); } catch (e) { console.error('refreshSchedule error:', e); }
        return res.status(201).json(row);
    } catch (e) {
        console.error('createNotificationSchedule:', e);
        res.status(500).json({ message: 'Failed to create schedule' });
    }
};

exports.updateNotificationScheduleById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const body = req.body || {};
        const row = await NotificationSchedule.findByPk(id);
        if (!row) return res.status(404).json({ message: 'Schedule not found' });
        const updates = {
            name: body.name != null ? String(body.name).substring(0, 100) : row.name,
            mis_start_time: body.mis_start_time != null ? body.mis_start_time : row.mis_start_time,
            mis_end_time: body.mis_end_time != null ? body.mis_end_time : row.mis_end_time,
            reminder_start_time: body.reminder_start_time != null ? body.reminder_start_time : row.reminder_start_time,
            reminder_interval_minutes: body.reminder_interval_minutes != null ? Number(body.reminder_interval_minutes) : row.reminder_interval_minutes,
            reminder_count: body.reminder_count != null ? Number(body.reminder_count) : row.reminder_count,
            is_active: body.is_active != null ? Boolean(body.is_active) : row.is_active,
            target_role: body.target_role != null ? body.target_role : row.target_role
        };
        await row.update(updates);
        // Refresh only this schedule
        try { await reminderScheduler.refreshSchedule(row.id); } catch (e) { console.error('refreshSchedule error:', e); }
        return res.json(row);
    } catch (e) {
        console.error('updateNotificationScheduleById:', e);
        res.status(500).json({ message: 'Failed to update schedule' });
    }
};

exports.deleteNotificationScheduleById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const row = await NotificationSchedule.findByPk(id);
        if (!row) return res.status(404).json({ message: 'Schedule not found' });
        await row.destroy();
        // Clear jobs for schedule
        try { await reminderScheduler.refreshSchedule(id); } catch (e) { console.error('refreshSchedule error:', e); }
        return res.json({ message: 'Deleted' });
    } catch (e) {
        console.error('deleteNotificationScheduleById:', e);
        res.status(500).json({ message: 'Failed to delete schedule' });
    }
};

// --- Form config (single endpoint: roles, permissions, smtp, schedulers) ---

exports.getFormConfig = async (req, res) => {
    const safePayload = () => ({
        roles: [],
        permissions: [],
        smtp_config: null,
        scheduler_config: [],
        mis_email_config: { submit_notify_emails: [], entry_not_created_emails: [] }
    });
    let roles = [];
    let permissions = [];
    let smtp_config = null;
    let scheduler_config = [];

    try {
        // Load independent config sources in parallel (same payload shape)
        const [rolesResult, permissionsResult, smtpResult, schedulerResult, misEmailResult] = await Promise.allSettled([
            Role.findAll({
                order: [['id', 'ASC']],
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'resource', 'action']
                }]
            }),
            Permission.findAll({ order: [['id', 'ASC']] }),
            getActiveOrLatestSMTPConfig(),
            EmailScheduler.findAll({ order: [['id', 'ASC']] }),
            (async () => {
                const row = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
                return row;
            })()
        ]);

        if (rolesResult.status === 'fulfilled') {
            roles = rolesResult.value;
        } else {
            console.error('Form config: roles load failed', rolesResult.reason?.message);
        }
        if (permissionsResult.status === 'fulfilled') {
            permissions = permissionsResult.value;
        } else {
            console.error('Form config: permissions load failed', permissionsResult.reason?.message);
        }
        if (smtpResult.status === 'fulfilled') {
            smtp_config = smtpResult.value;
        } else {
            console.error('Form config: smtp_config load failed', smtpResult.reason?.message);
        }
        if (schedulerResult.status === 'fulfilled') {
            scheduler_config = schedulerResult.value || [];
        } else {
            console.error('Form config: scheduler_config load failed', schedulerResult.reason?.message);
        }

        let mis_email_config = { submit_notify_emails: [], entry_not_created_emails: [], not_submitted_notify_emails: [], escalation_notify_emails: [] };
        try {
            const row = misEmailResult.status === 'fulfilled' ? misEmailResult.value : null;
            if (misEmailResult.status === 'rejected') {
                console.error('Form config: mis_email_config load failed', misEmailResult.reason?.message);
            }
            if (row) {
                const parse = (s) => {
                    if (!s) return [];
                    try {
                        const a = JSON.parse(s);
                        return Array.isArray(a) ? a : [s];
                    } catch {
                        return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
                    }
                };
                mis_email_config = {
                    submit_notify_emails: parse(row.submit_notify_emails),
                    entry_not_created_emails: parse(row.entry_not_created_emails),
                    not_submitted_notify_emails: parse(row.not_submitted_notify_emails),
                    escalation_notify_emails: parse(row.escalation_notify_emails)
                };
            }
        } catch (e) {
            console.error('Form config: mis_email_config load failed', e.message);
        }
        const payload = {
            roles: Array.isArray(roles) ? roles : [],
            permissions: Array.isArray(permissions) ? permissions : [],
            smtp_config: sanitizeSMTPForResponse(smtp_config) || null,
            scheduler_config: Array.isArray(scheduler_config) ? scheduler_config : [],
            mis_email_config
        };
        return res.status(200).json(payload);
    } catch (error) {
        console.error('Form config error:', error);
        return res.status(200).json(safePayload());
    }
};

// --- MIS Email Config (who receives submit + no-entry reminders) ---
exports.getMISEmailConfig = async (req, res) => {
    try {
        const row = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
        const parse = (s) => {
            if (!s) return [];
            try {
                const a = JSON.parse(s);
                return Array.isArray(a) ? a : [s];
            } catch {
                return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
            }
        };
        const mis_email_config = row ? {
            submit_notify_emails: parse(row.submit_notify_emails),
            entry_not_created_emails: parse(row.entry_not_created_emails),
            not_submitted_notify_emails: parse(row.not_submitted_notify_emails),
            escalation_notify_emails: parse(row.escalation_notify_emails),
            approved_editor_emails: parse(row.approved_editor_emails)
        } : {
            submit_notify_emails: [],
            entry_not_created_emails: [],
            not_submitted_notify_emails: [],
            escalation_notify_emails: []
        };
        return res.json(mis_email_config);
    } catch (e) {
        console.error('getMISEmailConfig:', e);
        res.status(500).json({ message: 'Failed to load MIS email config' });
    }
};

exports.saveMISEmailConfig = async (req, res) => {
    try {
        const { submit_notify_emails, entry_not_created_emails, not_submitted_notify_emails, escalation_notify_emails, approved_editor_emails } = req.body;
        const toJson = (arr) => (Array.isArray(arr) ? JSON.stringify(arr) : '[]');
        const data = {
            submit_notify_emails: toJson(submit_notify_emails),
            entry_not_created_emails: toJson(entry_not_created_emails),
            not_submitted_notify_emails: toJson(not_submitted_notify_emails),
            escalation_notify_emails: toJson(escalation_notify_emails),
            approved_editor_emails: toJson(approved_editor_emails)
        };

        // Find existing or create ID 1
        let row = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
        if (row) {
            await row.update(data);
        } else {
            row = await MISEmailConfig.create({ id: 1, ...data });
        }

        const parse = (s) => {
            if (!s) return [];
            try {
                const a = JSON.parse(s);
                return Array.isArray(a) ? a : [s];
            } catch {
                return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
            }
        };
        return res.json({
            submit_notify_emails: parse(row.submit_notify_emails),
            entry_not_created_emails: parse(row.entry_not_created_emails),
            not_submitted_notify_emails: parse(row.not_submitted_notify_emails),
            escalation_notify_emails: parse(row.escalation_notify_emails)
        });
    } catch (e) {
        console.error('saveMISEmailConfig:', e);
        res.status(500).json({ message: 'Failed to save MIS email config' });
    }
};

// --- Notification Schedule (MIS filling window + reminders) ---
exports.getNotificationSchedule = async (req, res) => {
    try {
        const row = await NotificationSchedule.findOne({ order: [['id', 'ASC']] });
        if (!row) {
            return res.json(null);
        }
        return res.json({
            id: row.id,
            mis_start_time: row.mis_start_time,
            mis_end_time: row.mis_end_time,
            reminder_start_time: row.reminder_start_time,
            reminder_interval_minutes: row.reminder_interval_minutes,
            reminder_count: row.reminder_count,
            is_active: row.is_active
        });
    } catch (e) {
        console.error('getNotificationSchedule:', e);
        res.status(500).json({ message: 'Failed to load notification schedule' });
    }
};

exports.saveNotificationSchedule = async (req, res) => {
    try {
        const body = req.body || {};
        const misStart = body.mis_start_time;
        const misEnd = body.mis_end_time;
        const reminderStart = body.reminder_start_time || misEnd;
        const interval = Number(body.reminder_interval_minutes);
        const count = Number(body.reminder_count);

        // Validation
        if (!misStart || !misEnd) return res.status(400).json({ message: 'mis_start_time and mis_end_time are required' });
        const toMinutes = (t) => {
            const parts = String(t).split(':').map(s => Number(s));
            return parts[0] * 60 + (parts[1] || 0);
        };
        if (toMinutes(misStart) >= toMinutes(misEnd)) return res.status(400).json({ message: 'mis_start_time must be before mis_end_time' });
        if (!Number.isInteger(interval) || interval <= 0) return res.status(400).json({ message: 'reminder_interval_minutes must be > 0' });
        if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: 'reminder_count must be > 0' });

        const [row] = await NotificationSchedule.findOrCreate({
            where: { id: 1 }, defaults: {
                mis_start_time: misStart,
                mis_end_time: misEnd,
                reminder_start_time: reminderStart,
                reminder_interval_minutes: interval,
                reminder_count: count,
                is_active: body.is_active !== false
            }
        });
        await row.update({
            mis_start_time: misStart,
            mis_end_time: misEnd,
            reminder_start_time: reminderStart,
            reminder_interval_minutes: interval,
            reminder_count: count,
            is_active: body.is_active !== false
        });

        // Refresh schedulers
        try { await schedulerService.refresh(); } catch (e) { console.error('Failed to refresh schedulers after notification schedule update', e); }

        return res.json({
            id: row.id,
            mis_start_time: row.mis_start_time,
            mis_end_time: row.mis_end_time,
            reminder_start_time: row.reminder_start_time,
            reminder_interval_minutes: row.reminder_interval_minutes,
            reminder_count: row.reminder_count,
            is_active: row.is_active
        });
    } catch (e) {
        console.error('saveNotificationSchedule:', e);
        res.status(500).json({ message: 'Failed to save notification schedule' });
    }
};

// --- Final MIS Report Email Config ---

/** Normalize to_emails from DB or request into a clean array of email strings (no empty, trimmed). */
function parseEmails(val) {
    if (Array.isArray(val)) return val.filter(Boolean).map(String).map(s => s.trim()).filter(Boolean);
    if (typeof val === 'string') {
        const s = val.trim();
        if (!s) return [];
        try {
            const a = JSON.parse(s);
            return Array.isArray(a) ? a.map(String).map(e => e.trim()).filter(Boolean) : s.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
        } catch {
            return s.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
        }
    }
    return [];
}

/** Always store to_emails as a JSON array string so all recipients are persisted. */
function toEmailsJson(val) {
    const arr = parseEmails(val);
    return JSON.stringify(arr);
}

exports.getFinalMISReportConfig = async (req, res) => {
    try {
        const row = await FinalMISReportConfig.findByPk(1);
        if (!row) {
            return res.json({
                to_emails: [],
                subject: 'Final MIS Report',
                body: '',
                schedule_type: 'monthly',
                schedule_time: '09:00',
                cron_expression: '',
                is_active: false,
                last_successful_period_end: null,
                schedule_failure_period_end: null,
                schedule_failure_summary: null,
                schedule_failure_last_attempt_at: null,
                delivery_alert_sent_for_period: null,
            });
        }
        const to_emails = parseEmails(row.to_emails);
        res.json({
            id: row.id,
            to_emails,
            subject: row.subject || 'Final MIS Report',
            body: row.body || '',
            schedule_type: row.schedule_type || 'monthly',
            schedule_time: row.schedule_time || '09:00',
            cron_expression: row.cron_expression || '',
            is_active: row.is_active !== false,
            last_sent_at: row.last_sent_at,
            last_successful_period_end: row.last_successful_period_end || null,
            schedule_failure_period_end: row.schedule_failure_period_end || null,
            schedule_failure_summary: row.schedule_failure_summary || null,
            schedule_failure_last_attempt_at: row.schedule_failure_last_attempt_at || null,
            delivery_alert_sent_for_period: row.delivery_alert_sent_for_period || null,
        });
    } catch (e) {
        console.error('getFinalMISReportConfig:', e);
        res.status(500).json({ message: 'Failed to load Final MIS Report email config' });
    }
};

exports.saveFinalMISReportConfig = async (req, res) => {
    try {
        const { to_emails, subject, body, schedule_type, schedule_time, cron_expression, is_active } = req.body;
        if (schedule_type === 'custom') {
            return res.status(400).json({
                message: 'Custom cron schedule is currently disabled for Final MIS. Use Daily/Weekly/Monthly/Quarterly.'
            });
        }
        const [row] = await FinalMISReportConfig.findOrCreate({
            where: { id: 1 },
            defaults: {
                to_emails: toEmailsJson(to_emails != null ? to_emails : []),
                subject: subject || 'Final MIS Report',
                body: body || '',
                schedule_type: schedule_type || 'monthly',
                schedule_time: schedule_time || '09:00',
                cron_expression: cron_expression || null,
                is_active: is_active !== false,
            }
        });
        if (row && !row.isNewRecord) {
            const updateFields = {
                subject: subject != null ? subject : row.subject,
                body: body != null ? body : row.body,
                schedule_type: schedule_type != null ? schedule_type : row.schedule_type,
                schedule_time: schedule_time != null ? schedule_time : row.schedule_time,
                cron_expression: cron_expression != null ? cron_expression : row.cron_expression,
                is_active: is_active !== undefined ? is_active !== false : row.is_active,
            };
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'to_emails')) {
                updateFields.to_emails = toEmailsJson(to_emails);
            }
            await row.update(updateFields);
        }
        const updated = await FinalMISReportConfig.findByPk(1);
        const to_emails_out = parseEmails(updated?.to_emails);
        return res.json({
            id: updated?.id,
            to_emails: to_emails_out,
            subject: updated?.subject,
            body: updated?.body,
            schedule_type: updated?.schedule_type,
            schedule_time: updated?.schedule_time,
            cron_expression: updated?.cron_expression || '',
            is_active: updated?.is_active !== false,
            last_sent_at: updated?.last_sent_at,
            last_successful_period_end: updated?.last_successful_period_end || null,
            schedule_failure_period_end: updated?.schedule_failure_period_end || null,
            schedule_failure_summary: updated?.schedule_failure_summary || null,
            schedule_failure_last_attempt_at: updated?.schedule_failure_last_attempt_at || null,
            delivery_alert_sent_for_period: updated?.delivery_alert_sent_for_period || null,
        });
    } catch (e) {
        console.error('saveFinalMISReportConfig:', e);
        res.status(500).json({ message: 'Failed to save Final MIS Report email config' });
    }
};

// Helper to replace placeholders
function replacePlaceholders(text, map) {
    if (!text) return '';
    let result = text;
    for (const [key, value] of Object.entries(map)) {
        result = result.replace(new RegExp(key, 'g'), value); // Simple string replace
        // Also handle {{ key }} with spaces
        result = result.replace(new RegExp(`{{\\s*${key.replace(/{|}/g, '')}\\s*}}`, 'g'), value);
    }
    // Handle specific {{key}} format if not covered above (simple regex for double braces)
    return result.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
        return map[`{{${key}}}`] || map[key] || match;
    });
}

/**
 * Build Final MIS HTML and send test email (can take minutes for large date ranges — run outside HTTP request to avoid proxy 504).
 */
async function runSendTestFinalMISReportJob(startDate, endDate) {
    const row = await FinalMISReportConfig.findByPk(1);
    const toList = row ? parseEmails(row.to_emails) : [];
    if (toList.length === 0) {
        console.warn('runSendTestFinalMISReportJob: no recipients, skipping');
        return;
    }

    const replacements = {
        '{{report_period}}': `${startDate} to ${endDate}`,
        '{{from_date}}': startDate,
        '{{to_date}}': endDate,
        '{{generated_datetime}}': new Date().toLocaleString()
    };

    const subjectRaw = row?.subject || 'Final MIS Report for {{report_period}}';
    const subject = `[TEST] ${replacePlaceholders(subjectRaw, replacements)}`;
    const bodyRaw = row?.body || '';
    const customBody = replacePlaceholders(bodyRaw, replacements);

    const html = await finalMISReportEmailService.buildReportHtmlForRange(startDate, endDate, customBody);

    const meta = {
        entity_type: 'FinalMISReportConfig',
        entity_id: row?.id ? String(row.id) : null,
        report_period: `${startDate} to ${endDate}`,
    };
    const r = await emailService.sendEmailToMany(toList, subject, html, meta);

    if (r.ok && row) {
        await row.update({ last_sent_at: new Date() });
        console.log(`sendTestFinalMISReport (background): sent to ${toList.length} recipient(s), ${startDate}–${endDate}`);
    } else {
        console.error('sendTestFinalMISReport (background): SMTP send failed — see email_logs', r.error || '');
    }
}

exports.sendTestFinalMISReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required (YYYY-MM-DD)' });
        }
        const row = await FinalMISReportConfig.findByPk(1);
        const toList = row ? parseEmails(row.to_emails) : [];
        if (toList.length === 0) {
            return res.status(400).json({ message: 'Add at least one recipient in Final MIS Report Email config before sending.' });
        }

        // Respond immediately so reverse proxies (nginx, etc.) do not return 504 while HTML is built and mail is sent.
        res.status(202).json({
            queued: true,
            message:
                'Test report queued. It is being generated and emailed in the background (large date ranges can take several minutes). Check your inbox and Admin → Email delivery logs for Sent/Failed status.',
            startDate,
            endDate,
            recipients: toList.length,
        });

        setImmediate(() => {
            runSendTestFinalMISReportJob(startDate, endDate).catch((e) => {
                console.error('sendTestFinalMISReport (background):', e);
            });
        });
    } catch (e) {
        console.error('sendTestFinalMISReport:', e);
        if (!res.headersSent) {
            res.status(500).json({ message: e.message || 'Failed to send test report' });
        }
    }
};

exports.saveAppTheme = async (req, res) => {
    try {
        const { theme } = req.body;
        if (!theme) return res.status(400).json({ message: 'theme is required' });
        const [row] = await AppConfig.findOrCreate({ where: { key: 'theme' }, defaults: { value: theme } });
        if (!row.isNewRecord) await row.update({ value: theme });
        res.json({ theme });
    } catch (e) {
        console.error('saveAppTheme:', e);
        res.status(500).json({ message: 'Failed to save theme' });
    }
};

// --- Logs ---

/** Outbound email attempts (SMTP send), including Final MIS and MIS reminders. */
exports.getEmailLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
        const entity_type = typeof req.query.entity_type === 'string' && req.query.entity_type.trim()
            ? req.query.entity_type.trim()
            : null;
        const where = entity_type ? { entity_type } : {};
        const { count, rows } = await EmailLog.findAndCountAll({
            where,
            order: [['sent_at', 'DESC']],
            limit,
            offset,
            raw: true,
        });
        res.json({
            total: count,
            limit,
            offset,
            logs: rows.map((r) => ({
                id: r.id,
                recipient: r.recipient,
                subject: r.subject,
                status: r.status,
                error_message: r.error_message || null,
                sent_at: r.sent_at,
                entity_type: r.entity_type || null,
                entity_id: r.entity_id || null,
            })),
        });
    } catch (e) {
        console.error('getEmailLogs:', e);
        res.status(500).json({ message: 'Failed to load email logs' });
    }
};

/** Build sessions (login + logout pairs) and last-login per user from UserActivityLog */
exports.getSessions = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
        // Fetch most recent LOGIN/LOGOUT events across all users (not by user_id first), so all users' sessions appear
        const logs = await UserActivityLog.findAll({
            where: { activity_type: ['LOGIN', 'LOGOUT'] },
            order: [['created_at', 'DESC']],
            limit: Math.min(limit * 4, 2000)
        });
        const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
        const users = userIds.length ? await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'email'] }) : [];
        const userMap = Object.fromEntries(users.map(u => [u.id, u.name || u.email || `User ${u.id}`]));

        const byUser = {};
        for (const row of logs) {
            const uid = row.user_id;
            if (!byUser[uid]) byUser[uid] = [];
            byUser[uid].push({
                type: row.activity_type,
                at: row.created_at || row.createdAt,
                metadata: row.metadata || null,
                ip: row.ip_address || null
            });
        }
        // Sort each user's events by time ascending so LOGIN then LOGOUT pair correctly
        for (const uid of Object.keys(byUser)) {
            byUser[uid].sort((a, b) => new Date(a.at) - new Date(b.at));
        }
        const sessions = [];
        const lastLogins = {};
        for (const [userId, events] of Object.entries(byUser)) {
            let loginTime = null;
            let loginMeta = null;
            let loginIp = null;
            for (const ev of events) {
                if (ev.type === 'LOGIN') {
                    loginTime = ev.at;
                    loginMeta = ev.metadata || null;
                    loginIp = ev.ip || null;
                    lastLogins[userId] = ev.at;
                } else if (ev.type === 'LOGOUT' && loginTime) {
                    const logoutTime = ev.at;
                    const loginMs = new Date(loginTime).getTime();
                    const logoutMs = new Date(logoutTime).getTime();
                    const durationMinutes = Math.round((logoutMs - loginMs) / 60000);
                    sessions.push({
                        userId: parseInt(userId, 10),
                        userName: userMap[userId] || `User ${userId}`,
                        lastLogin: loginTime,
                        loginTime,
                        logoutTime,
                        sessionDurationMinutes: durationMinutes >= 0 ? durationMinutes : 0,
                        device: loginMeta && (loginMeta.deviceType || loginMeta.browser || loginMeta.os) ? `${loginMeta.deviceType || ''}${loginMeta.browser ? ' - ' + loginMeta.browser : ''}${loginMeta.os ? ' (' + loginMeta.os + ')' : ''}` : null,
                        userAgent: loginMeta ? loginMeta.userAgent || null : null,
                        ipAddress: loginIp || null
                    });
                    loginTime = null;
                    loginMeta = null;
                    loginIp = null;
                }
            }
        }
        sessions.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
        res.json({ sessions: sessions.slice(0, limit), lastLogins });
    } catch (error) {
        console.error('getSessions error:', error);
        res.status(500).json({ message: 'Error fetching sessions', error: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const { formatLog } = require('../services/activityLogFormatter');
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
        const offset = parseInt(req.query.offset, 10) || 0;
        const logs = await AuditLog.findAll({
            include: [{ model: User, as: 'actor', attributes: ['name', 'email'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        const formattedLogs = logs.map(log => formatLog(log));
        res.json(formattedLogs);
    } catch (error) {
        console.error('Audit logs error:', error);
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
};
