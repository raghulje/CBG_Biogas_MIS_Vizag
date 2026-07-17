const cron = require('node-cron');
const { EmailScheduler, MISDailyEntry, User, Role, MISEmailConfig, FinalMISReportConfig } = require('../models');
const emailService = require('./emailService');
const finalMISReportEmailService = require('./finalMISReportEmailService');
const { Op } = require('sequelize');
const reminderScheduler = require('./reminderScheduler');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Transient SMTP failures (rate limits, TLS blips) — retries within one scheduler tick. */
const FINAL_MIS_SMTP_ATTEMPTS = 4;
const FINAL_MIS_SMTP_RETRY_DELAY_MS = 15000;
const SCHEDULED_EMAIL_ATTEMPTS = 3;
const SCHEDULED_EMAIL_RETRY_DELAY_MS = 7000;

/** Parse to_emails (JSON array string or comma/semicolon list) into array of email strings. Must match adminController parseEmails. */
function parseReportEmails(val) {
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

function parseJsonEmailField(val) {
    if (val == null) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String).map(s => s.trim()).filter(Boolean);
    try {
        const a = JSON.parse(val);
        return Array.isArray(a) ? a.map(String).map(e => e.trim()).filter(Boolean) : [];
    } catch {
        return String(val).split(/[,;]/).map(e => e.trim()).filter(Boolean);
    }
}

/** One email per failed period so ops are notified if SMTP is flaky (uses same SMTP — if SMTP is dead, see DB banner + logs). */
async function sendScheduledFinalMISFailureAlert(periodEnd, errorSummary) {
    const mainRow = await FinalMISReportConfig.findByPk(1);
    if (!mainRow || mainRow.delivery_alert_sent_for_period === periodEnd) return;

    let escalation = [];
    try {
        const cfgRow = await MISEmailConfig.findByPk(1);
        if (cfgRow) escalation = parseJsonEmailField(cfgRow.escalation_notify_emails);
    } catch (_e) {
        /* ignore */
    }
    const reportRecipients = parseReportEmails(mainRow.to_emails);
    const merged = [...new Set([...escalation, ...reportRecipients].filter(Boolean))];
    if (!merged.length) return;

    const esc = String(errorSummary || 'Unknown error')
        .slice(0, 450)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const alertHtml = `<p><strong>Scheduled Final MIS report was not delivered.</strong></p>
<p>Report period end: <strong>${periodEnd}</strong><br/>
Last error: ${esc}</p>
<p>Open <strong>Admin → Email delivery logs</strong> and verify <strong>SMTP</strong>. The scheduler will keep retrying until this period&apos;s report sends successfully.</p>
<p><em>This alert does not include the MIS report attachment/body.</em></p>`;

    const subj = `[ALERT] Final MIS scheduled email failed — period ${periodEnd}`;
    const meta = { entity_type: 'FinalMISReportDeliveryAlert', entity_id: '1' };
    const r = await emailService.sendEmailToMany(merged, subj, alertHtml, meta);
    if (r.ok) {
        await mainRow.update({ delivery_alert_sent_for_period: periodEnd });
        console.log(`Final MIS failure alert sent for period ${periodEnd} (${merged.length} recipient(s)).`);
    }
}

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.finalMISReportHourlyJob = null;
        /** Avoid overlapping Final MIS runs (15-min cron + slow HTML build + SMTP retries). */
        this._finalMISReportRunLock = false;
    }

    async init() {
        console.log('Initializing Scheduler Service...');
        const schedulers = await EmailScheduler.findAll({ where: { is_active: true } });
        schedulers.forEach(scheduler => {
            this.scheduleJob(scheduler);
        });
        // Initialize reminder scheduler (dynamic MIS reminders)
        try {
            await reminderScheduler.init();
            console.log('Reminder Scheduler initialized.');
        } catch (e) {
            console.error('Reminder Scheduler init failed:', e);
        }
        // Final MIS Report: every 15 minutes (after scheduled time, retries until success same period)
        if (this.finalMISReportHourlyJob) {
            this.finalMISReportHourlyJob.stop();
            this.finalMISReportHourlyJob = null;
        }
        this.finalMISReportHourlyJob = cron.schedule('*/15 * * * *', async () => {
            try {
                await this.runFinalMISReportCheck();
            } catch (e) {
                console.error('Final MIS Report scheduled job failed:', e);
            }
        });
        console.log('Final MIS Report check scheduled (every 15 minutes).');
    }

    scheduleJob(scheduler) {
        if (this.jobs.has(scheduler.id)) {
            this.jobs.get(scheduler.id).stop();
        }

        console.log(`Scheduling job: ${scheduler.name} with cron: ${scheduler.cron_expression}`);

        // Validate cron expression
        if (!cron.validate(scheduler.cron_expression)) {
            console.error(`Invalid cron expression for scheduler ${scheduler.name}`);
            return;
        }

        const job = cron.schedule(scheduler.cron_expression, async () => {
            console.log(`Running scheduled job: ${scheduler.name}`);
            try {
                await this.executeJob(scheduler);
            } catch (err) {
                console.error(`Scheduled job '${scheduler.name}' failed:`, err);
            }
        });

        this.jobs.set(scheduler.id, job);
    }

    /**
     * Entry date for reminder/check: plant shift day = 8:00 AM to 8:00 AM next day.
     * - Before 8:00 AM today: last completed shift ended yesterday 8 AM → entry date = (today - 2).
     * - At or after 8:00 AM today: last completed shift ended today 8 AM → entry date = (today - 1).
     * So checks on 21/02 (after 8 AM) are for entry date 20/02.
     */
    getEntryDateForCheck() {
        const now = new Date();
        const hour = now.getHours();
        const d = new Date(now);
        if (hour < 8) {
            d.setDate(d.getDate() - 2);
        } else {
            d.setDate(d.getDate() - 1);
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    async sendScheduledEmailWithRetry(to, subject, body, meta, tag = 'scheduler') {
        let ok = false;
        for (let attempt = 1; attempt <= SCHEDULED_EMAIL_ATTEMPTS; attempt++) {
            ok = await emailService.sendEmail(to, subject, body, meta);
            if (ok) return true;
            if (attempt < SCHEDULED_EMAIL_ATTEMPTS) {
                console.warn(
                    `[${tag}] SMTP attempt ${attempt}/${SCHEDULED_EMAIL_ATTEMPTS} failed for ${to}; retrying in ${SCHEDULED_EMAIL_RETRY_DELAY_MS / 1000}s...`
                );
                await sleep(SCHEDULED_EMAIL_RETRY_DELAY_MS);
            }
        }
        return false;
    }

    async executeJob(scheduler) {
        const entryDate = this.getEntryDateForCheck();
        console.log(`Executing scheduler job_type='${scheduler.job_type}' for entry_date=${entryDate} (previous day)`);
        const { EmailTemplate } = require('../models');

        try {
            if (scheduler.job_type === 'daily_reminder') {
                // Check if entries exist for entry date (previous day - data available next day)
                const entries = await MISDailyEntry.findAll({
                    where: { date: entryDate }
                });

                const entryCreated = entries.length > 0;
                const entrySubmitted = entries.some(e => e.status === 'submitted' || e.status === 'approved' || e.status === 'under_review');

                // No entry for entry date (previous day): send to Admin-configured list only. Fallback to Operators only when config field not set.
                if (!entryCreated) {
                    let noEntryEmails = null;
                    try {
                        const configRow = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
                        const parse = (s) => {
                            if (s === null || s === undefined) return null;
                            try {
                                const a = JSON.parse(s);
                                return Array.isArray(a) ? a : [s];
                            } catch {
                                return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
                            }
                        };
                        if (configRow && configRow.entry_not_created_emails != null) {
                            noEntryEmails = parse(configRow.entry_not_created_emails) || [];
                        }
                    } catch (_) { /* ignore */ }
                    if (noEntryEmails === null) {
                        const operatorRole = await Role.findOne({ where: { name: 'Operator' } });
                        const operators = operatorRole ? await User.findAll({ where: { role_id: operatorRole.id, is_active: true } }) : [];
                        noEntryEmails = operators.map(o => o.email).filter(Boolean);
                    }
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_no_entry_reminder' } });
                    const subject = template?.subject || 'MIS Entry Reminder: No Entry Created for ' + entryDate;
                    const body = template ? await emailService.replaceTemplateVariables(template.body, { name: 'Recipient', date: entryDate })
                        : `<p>Hello,</p><p>No MIS entry has been created for ${entryDate}. Please ensure an entry is created (data for this date is available from the next day).</p>`;
                    const meta = { entity_type: 'MISDailyEntry', entity_id: null };
                    for (const email of noEntryEmails) {
                        const addr = String(email).trim();
                        if (addr) {
                            try {
                                const ok = await this.sendScheduledEmailWithRetry(addr, subject, body, meta, 'daily_reminder_no_entry');
                                if (!ok) console.error('No-entry reminder email failed after retries for', addr);
                            } catch (err) { console.error('No-entry reminder email failed for', addr, err.message); }
                        }
                    }
                }

                const operatorRole = await Role.findOne({ where: { name: 'Operator' } });
                const operators = operatorRole ? await User.findAll({ where: { role_id: operatorRole.id, is_active: true } }) : [];
                const managerRole = await Role.findOne({ where: { name: 'Manager' } });
                const managers = managerRole ? await User.findAll({ where: { role_id: managerRole.id, is_active: true } }) : [];

                if (entryCreated && !entrySubmitted) {
                    const entryId = entries[0]?.id;
                    const meta = { entity_type: 'MISDailyEntry', entity_id: entryId ? String(entryId) : null };
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_pending_submission' } });
                    for (const op of operators) {
                        const subject = template?.subject || 'MIS Entry Reminder: Please Submit Entry';
                        const body = template ? await emailService.replaceTemplateVariables(template.body, { name: op.name, date: entryDate })
                            : `<p>Hello ${op.name},</p><p>The MIS entry for ${entryDate} is in Draft status. Please submit it.</p>`;
                        const ok = await this.sendScheduledEmailWithRetry(op.email, subject, body, meta, 'daily_reminder_pending_submission');
                        if (!ok) console.error('Operator reminder failed after retries for', op.email);
                    }
                }

                if (entryCreated && entrySubmitted) {
                    const entryId = entries[0]?.id;
                    const meta = { entity_type: 'MISDailyEntry', entity_id: entryId ? String(entryId) : null };
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_entry_submitted_notify' } });
                    for (const mgr of managers) {
                        const subject = template?.subject || 'MIS Entry Submitted';
                        const body = template ? await emailService.replaceTemplateVariables(template.body, { name: mgr.name, date: entryDate })
                            : `<p>Hello ${mgr.name},</p><p>An MIS entry for ${entryDate} has been submitted for review.</p>`;
                        const ok = await this.sendScheduledEmailWithRetry(mgr.email, subject, body, meta, 'daily_reminder_submitted_notify');
                        if (!ok) console.error('Manager submit notify failed after retries for', mgr.email);
                    }
                }
            } else if (scheduler.job_type === 'mis_creation_check') {
                // Check: Entry for previous day created? Submitted? Use only config emails when set; no role merge.
                const entries = await MISDailyEntry.findAll({ where: { date: entryDate } });
                const entryCreated = entries.length > 0;
                const entrySubmitted = entries.some(e => ['submitted', 'approved', 'under_review'].includes(e.status));

                let siteUserEmails = null;
                try {
                    const configRow = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
                    const parse = (s) => {
                        if (s === null || s === undefined) return null;
                        try {
                            const a = JSON.parse(s);
                            return Array.isArray(a) ? a : [s];
                        } catch {
                            return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
                        }
                    };
                    if (configRow) {
                        if (!entryCreated && configRow.entry_not_created_emails != null) {
                            siteUserEmails = parse(configRow.entry_not_created_emails) || [];
                        } else if (entryCreated && !entrySubmitted && configRow.not_submitted_notify_emails != null) {
                            siteUserEmails = parse(configRow.not_submitted_notify_emails) || [];
                        }
                    }
                } catch (_) { }

                if (siteUserEmails === null) {
                    const roles = await Role.findAll({ where: { name: { [Op.in]: ['Site User', 'Operator'] } } });
                    siteUserEmails = [];
                    for (const role of roles) {
                        const users = await User.findAll({ where: { role_id: role.id, is_active: true } });
                        siteUserEmails = [...siteUserEmails, ...users.map(u => u.email)];
                    }
                }
                const uniqueEmails = [...new Set(siteUserEmails.filter(Boolean))];

                const entryId = entries[0]?.id;
                const meta = { entity_type: 'MISDailyEntry', entity_id: entryId ? String(entryId) : null };
                if (!entryCreated) {
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_not_created' } });
                    const subject = template?.subject || `MIS Entry Missing for ${entryDate}`;
                    for (const email of uniqueEmails) {
                        const body = template ? await emailService.replaceTemplateVariables(template.body, { date: entryDate })
                            : `<p>Hello,</p><p>The MIS entry for ${entryDate} has NOT been created yet. Please create it (data for this date is available from the next day).</p>`;
                        const ok = await this.sendScheduledEmailWithRetry(email, subject, body, meta, 'mis_creation_check_not_created');
                        if (!ok) console.error('MIS not-created email failed after retries for', email);
                    }
                } else if (!entrySubmitted) {
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_not_submitted' } });
                    const subject = template?.subject || `MIS Entry Draft for ${entryDate}`;
                    for (const email of uniqueEmails) {
                        const body = template ? await emailService.replaceTemplateVariables(template.body, { date: entryDate })
                            : `<p>Hello,</p><p>The MIS entry for ${entryDate} is created but NOT submitted. Please submit it immediately.</p>`;
                        const ok = await this.sendScheduledEmailWithRetry(email, subject, body, meta, 'mis_creation_check_not_submitted');
                        if (!ok) console.error('MIS not-submitted email failed after retries for', email);
                    }
                }

            } else if (scheduler.job_type === 'mis_escalation_check') {
                // Escalation check: Entry for previous day submitted? Use only config emails when set.
                const entries = await MISDailyEntry.findAll({ where: { date: entryDate } });
                const entrySubmitted = entries.some(e => ['submitted', 'approved', 'under_review'].includes(e.status));

                if (!entrySubmitted) {
                    let managerEmails = null;
                    try {
                        const configRow = await MISEmailConfig.findByPk(1) || await MISEmailConfig.findOne({ order: [['id', 'ASC']] });
                        const parse = (s) => {
                            if (s === null || s === undefined) return null;
                            try {
                                const a = JSON.parse(s);
                                return Array.isArray(a) ? a : [s];
                            } catch {
                                return String(s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
                            }
                        };
                        if (configRow && configRow.escalation_notify_emails != null) {
                            managerEmails = parse(configRow.escalation_notify_emails) || [];
                        }
                    } catch (_) { }
                    if (managerEmails === null) {
                        const managerRole = await Role.findOne({ where: { name: 'Manager' } });
                        managerEmails = managerRole ? (await User.findAll({ where: { role_id: managerRole.id, is_active: true } })).map(u => u.email).filter(Boolean) : [];
                    }
                    const uniqueEmails = [...new Set(managerEmails.filter(Boolean))];

                    const meta = { entity_type: 'MISDailyEntry', entity_id: null };
                    const template = await EmailTemplate.findOne({ where: { name: 'mis_escalation' } });
                    const subject = template?.subject || `ESCALATION: MIS Entry Missing/Draft for ${entryDate}`;
                    for (const email of uniqueEmails) {
                        const body = template ? await emailService.replaceTemplateVariables(template.body, { date: entryDate })
                            : `<p>Hello Manager,</p><p>The MIS entry for ${entryDate} is overdue (not submitted). Please check with the team.</p>`;
                        const ok = await this.sendScheduledEmailWithRetry(email, subject, body, meta, 'mis_escalation_check');
                        if (!ok) console.error('MIS escalation email failed after retries for', email);
                    }
                }
            }
        } catch (error) {
            console.error('Error executing job:', error);
        }
    }

    async refresh() {
        // Clear all existing jobs properly
        for (const job of this.jobs.values()) {
            job.stop();
        }
        this.jobs.clear();
        if (this.finalMISReportHourlyJob) {
            this.finalMISReportHourlyJob.stop();
            this.finalMISReportHourlyJob = null;
        }
        // Refresh reminder scheduler too
        try {
            await reminderScheduler.refresh();
        } catch (e) {
            console.error('Failed to refresh reminder scheduler:', e);
        }
        await this.init();
    }
    async runFinalMISReportCheck() {
        if (this._finalMISReportRunLock) return;
        this._finalMISReportRunLock = true;
        try {
            const { FinalMISReportConfig } = require('../models');
            const row = await FinalMISReportConfig.findByPk(1);
            if (!row || !row.is_active || !row.to_emails) return;

            const config = {
                schedule_type: row.schedule_type,
                schedule_time: row.schedule_time,
                cron_expression: row.cron_expression,
            };

            const dateRange = finalMISReportEmailService.getDateRangeForSchedule(config.schedule_type, config.schedule_time);
            if (!dateRange) return;

            const { startDate, endDate } = dateRange;

            const due = finalMISReportEmailService.isScheduledFinalMISAttemptDue(config.schedule_type, config.schedule_time);
            if (!due) return;

            const periodEnd = String(endDate || '').trim();
            const storedEnd = row.last_successful_period_end;
            const storedYmd =
                storedEnd instanceof Date && !Number.isNaN(storedEnd.getTime())
                    ? finalMISReportEmailService.toLocalYMD(storedEnd)
                    : String(storedEnd || '')
                          .trim()
                          .slice(0, 10);
            const alreadySent = storedYmd && storedYmd === periodEnd;
            if (alreadySent) return;

            const toList = parseReportEmails(row.to_emails);
            if (!toList.length) return;

            const replacements = {
                '{{report_period}}': `${startDate} to ${endDate}`,
                '{{from_date}}': startDate,
                '{{to_date}}': endDate,
                '{{generated_datetime}}': new Date().toLocaleString()
            };
            const replacePlaceholders = (text, map) => {
                if (!text) return '';
                let result = text;
                for (const [key, value] of Object.entries(map)) {
                    result = result.replace(new RegExp(key, 'g'), value);
                    result = result.replace(new RegExp(`{{\\s*${key.replace(/{|}/g, '')}\\s*}}`, 'g'), value);
                }
                return result.replace(/{{\s*(\w+)\s*}}/g, (match, key) => map[`{{${key}}}`] || map[key] || match);
            };

            const subject = replacePlaceholders(row.subject || 'Final MIS Report for {{report_period}}', replacements);
            const customBody = replacePlaceholders(row.body || '', replacements);

            const html = await finalMISReportEmailService.buildReportHtmlForRange(startDate, endDate, customBody);

            const meta = {
                entity_type: 'FinalMISReportConfig',
                entity_id: row.id ? String(row.id) : null,
                report_period: `${startDate} to ${endDate}`,
            };
            let ok = false;
            let lastErr = 'Send failed';
            for (let attempt = 1; attempt <= FINAL_MIS_SMTP_ATTEMPTS; attempt++) {
                const r = await emailService.sendEmailToMany(toList, subject, html, meta);
                ok = r.ok;
                if (!r.ok && r.error) lastErr = r.error;
                if (ok) break;
                if (attempt < FINAL_MIS_SMTP_ATTEMPTS) {
                    console.warn(
                        `Final MIS Report SMTP attempt ${attempt}/${FINAL_MIS_SMTP_ATTEMPTS} failed; retrying in ${FINAL_MIS_SMTP_RETRY_DELAY_MS / 1000}s…`
                    );
                    await sleep(FINAL_MIS_SMTP_RETRY_DELAY_MS);
                }
            }
            if (ok) {
                // Persist idempotency first. If a later migration (failure-tracking columns) is missing,
                // a single wide UPDATE would throw after SMTP succeeded — then every 15m cron resends.
                await row.update({
                    last_sent_at: new Date(),
                    last_successful_period_end: periodEnd,
                });
                try {
                    await row.update({
                        schedule_failure_period_end: null,
                        schedule_failure_summary: null,
                        schedule_failure_last_attempt_at: null,
                        delivery_alert_sent_for_period: null,
                    });
                } catch (clearErr) {
                    console.error(
                        'Final MIS: could not clear schedule failure fields (run DB migrations if columns missing):',
                        clearErr.message || clearErr
                    );
                }
                console.log(`Final MIS Report sent to ${toList.length} recipient(s), period end ${periodEnd}.`);
            } else {
                const summary = String(lastErr).slice(0, 500);
                await row.update({
                    schedule_failure_period_end: periodEnd,
                    schedule_failure_summary: summary,
                    schedule_failure_last_attempt_at: new Date(),
                });
                console.error(
                    `Final MIS Report email failed after ${FINAL_MIS_SMTP_ATTEMPTS} attempts (period end ${periodEnd}). Will retry on next cron tick.`
                );
                try {
                    await sendScheduledFinalMISFailureAlert(periodEnd, summary);
                } catch (e) {
                    console.error('sendScheduledFinalMISFailureAlert:', e);
                }
            }

        } catch (error) {
            console.error('runFinalMISReportCheck Error:', error);
        } finally {
            this._finalMISReportRunLock = false;
        }
    }
}

module.exports = new SchedulerService();
