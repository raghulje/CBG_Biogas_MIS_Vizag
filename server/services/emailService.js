const nodemailer = require('nodemailer');
const { SMTPConfig, EmailLog, sequelize } = require('../models');

function buildFrom(config) {
    const name = config.from_name && config.from_name.trim();
    if (name) return `"${name.replace(/"/g, '')}" <${config.from_email}>`;
    return config.from_email;
}

// Port 465 = implicit SSL (secure: true). Port 587/25 = STARTTLS (secure: false); wrong version error if secure: true on 587.
function getTransportOptions(config) {
    const port = Number(config.port) || 587;
    const useSecure = port === 465 || (Boolean(config.secure) && port === 465);
    return {
        host: config.host,
        port,
        secure: useSecure,
        auth: {
            user: config.auth_user,
            pass: config.auth_pass
        }
    };
}

class EmailService {
    constructor() {
        this.transporter = null;
        this.lastConfigId = null;
        this._emailLogColumns = null;
    }

    async getEmailLogColumns() {
        if (this._emailLogColumns) return this._emailLogColumns;
        try {
            const qi = sequelize.getQueryInterface();
            const table = await qi.describeTable('email_logs');
            this._emailLogColumns = new Set(Object.keys(table || {}));
        } catch (_e) {
            // Fallback: assume legacy schema without audit/entity columns
            this._emailLogColumns = new Set(['recipient', 'subject', 'status', 'error_message', 'sent_at']);
        }
        return this._emailLogColumns;
    }

    async safeCreateEmailLog(fields) {
        try {
            const cols = await this.getEmailLogColumns();
            const payload = {};
            for (const [k, v] of Object.entries(fields || {})) {
                if (cols.has(k)) payload[k] = v;
            }
            // If even base columns are missing, skip silently
            if (!payload.recipient && !payload.subject && !payload.status) return;
            await EmailLog.create(payload);
        } catch (e) {
            // Never block email sending because logging failed
            console.warn('EmailLog insert skipped:', e.message || e);
        }
    }

    async getTransporter() {
        const config = await SMTPConfig.findOne({ where: { is_active: true } });
        if (!config) {
            throw new Error('No active SMTP configuration found');
        }

        // Reuse transporter if config hasn't changed
        if (this.transporter && this.lastConfigId === config.id) {
            return this.transporter;
        }

        this.transporter = nodemailer.createTransport(getTransportOptions(config));
        this.lastConfigId = config.id;
        return this.transporter;
    }

    /** Create transporter from a config object (for test email without saving). */
    createTransporterFromConfig(config) {
        return nodemailer.createTransport(getTransportOptions(config));
    }

    /**
     * @param {string} to - Recipient email
     * @param {string} subject - Email subject
     * @param {string} html - Email HTML body
     * @param {Object} [meta] - Optional: { audit_log_id, entity_type, entity_id } to link email to audit/entity
     */
    async sendEmail(to, subject, html, meta = {}) {
        const logFields = (base) => ({
            ...base,
            audit_log_id: meta.audit_log_id ?? null,
            entity_type: meta.entity_type ?? null,
            entity_id: meta.entity_id ?? null
        });
        let transporter;
        try {
            transporter = await this.getTransporter();
        } catch (error) {
            console.error('Email Service Error: Could not get transporter', error);
            await this.safeCreateEmailLog(logFields({
                recipient: to,
                subject: subject,
                status: 'failed',
                error_message: error.message
            }));
            return false;
        }

        try {
            const config = await SMTPConfig.findOne({ where: { is_active: true } });
            const from = buildFrom(config);
            const info = await transporter.sendMail({
                from,
                to,
                subject,
                html
            });

            console.log('Message sent: %s', info.messageId);

            await this.safeCreateEmailLog(logFields({
                recipient: to,
                subject: subject,
                status: 'sent'
            }));

            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            await this.safeCreateEmailLog(logFields({
                recipient: to,
                subject: subject,
                status: 'failed',
                error_message: error.message
            }));
            return false;
        }
    }

    /**
     * Send one email to multiple recipients (all get the same message; more reliable than multiple sendEmail calls).
     * @param {string[]} recipients - Array of email addresses
     * @param {string} subject - Email subject
     * @param {string} html - Email HTML body
     * @param {Object} [meta] - Optional: { entity_type, entity_id } for audit
     * @returns {Promise<{ ok: boolean, error?: string }>}
     */
    async sendEmailToMany(recipients, subject, html, meta = {}) {
        const list = Array.isArray(recipients) ? recipients.filter(Boolean).map(s => String(s).trim()).filter(Boolean) : [];
        if (list.length === 0) return { ok: false, error: 'No recipients' };
        let logSubject = meta.report_period
            ? `${subject} [Report period: ${meta.report_period}]`
            : subject;
        if (logSubject.length > 255) logSubject = logSubject.slice(0, 252) + '...';
        const logFields = (base) => ({
            ...base,
            audit_log_id: meta.audit_log_id ?? null,
            entity_type: meta.entity_type ?? null,
            entity_id: meta.entity_id ?? null
        });
        let transporter;
        try {
            transporter = await this.getTransporter();
        } catch (error) {
            console.error('Email Service Error: Could not get transporter', error);
            await this.safeCreateEmailLog(logFields({
                recipient: list.join(', '),
                subject: logSubject,
                status: 'failed',
                error_message: error.message
            }));
            return { ok: false, error: error.message || 'Could not get SMTP transporter' };
        }
        try {
            const config = await SMTPConfig.findOne({ where: { is_active: true } });
            const from = buildFrom(config);
            const info = await transporter.sendMail({
                from,
                to: list,
                subject,
                html
            });
            console.log('Message sent to %d recipients: %s', list.length, info.messageId);
            await this.safeCreateEmailLog(logFields({
                recipient: list.join(', '),
                subject: logSubject,
                status: 'sent'
            }));
            return { ok: true };
        } catch (error) {
            console.error('Error sending email to multiple recipients:', error);
            await this.safeCreateEmailLog(logFields({
                recipient: list.join(', '),
                subject: logSubject,
                status: 'failed',
                error_message: error.message
            }));
            return { ok: false, error: error.message || 'SMTP send failed' };
        }
    }

    /**
     * Send a test email using provided config (e.g. from SMTP test form).
     * Does not use stored config; config must have host, port, auth_user, auth_pass, from_email.
     * @param {Object} config - { host, port, secure, auth_user, auth_pass, from_email, from_name? }
     * @param {string} to - Recipient email
     * @returns {{ success: boolean, messageId?: string, error?: string }}
     */
    async sendTestEmail(config, to) {
        if (!config || !config.host || !config.auth_user || !config.auth_pass || !config.from_email || !to) {
            return { success: false, error: 'Missing required config or recipient' };
        }
        try {
            const transporter = this.createTransporterFromConfig(config);
            const from = buildFrom(config);
            const info = await transporter.sendMail({
                from,
                to: to.trim(),
                subject: 'Test Email – Biogas MIS SMTP Configuration',
                html: '<p>This is a test email from <strong>Biogas MIS</strong>.</p><p>If you received this, your SMTP configuration is working correctly.</p>',
                text: 'This is a test email from Biogas MIS. If you received this, your SMTP configuration is working correctly.'
            });
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Send test email error:', error);
            return { success: false, error: error.message || 'Failed to send' };
        }
    }

    async replaceTemplateVariables(templateBody, variables) {
        let body = templateBody;
        for (const key in variables) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, variables[key]);
        }
        return body;
    }
}

module.exports = new EmailService();
