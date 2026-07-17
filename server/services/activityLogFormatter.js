const FIELD_MAPPING = {
    created_by: 'Created By',
    entry_date: 'Entry Date',
    status: 'Status',
    shift: 'Shift',
    review_comment: 'Review Comment',
    template_name: 'Email Template Name',
    subject: 'Email Subject',
    body: 'Email Body',
    host: 'SMTP Host',
    port: 'SMTP Port',
    auth_user: 'SMTP Username',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    permissions: 'Permissions',
    is_active: 'Active',
    schedule_time: 'Schedule Time',
    schedule_type: 'Schedule Type',
    to_emails: 'Recipients',
    cron_expression: 'Cron Expression',
    // Add more as needed
};

const ENTITY_MAPPING = {
    MISDailyEntry: 'MIS Entry',
    User: 'User',
    EmailTemplate: 'Email Template',
    SMTPConfig: 'SMTP Configuration',
    Role: 'Role',
    Permission: 'Permission',
    EmailScheduler: 'Email Scheduler',
    FinalMISReportConfig: 'Final MIS Report Config',
    FinalMISReportDeliveryAlert: 'Final MIS delivery alert',
    MISEmailConfig: 'MIS Email Config'
};

const ACTION_MAPPING = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    SUBMIT: 'Submitted',
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    IMPORT: 'Imported',
    LOGIN: 'Logged In',
    LOGOUT: 'Logged Out'
};

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDatetime(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format a single audit log entry
 * @param {Object} log - The raw audit log entry from DB
 * @returns {Object} Formatted log entry
 */
function formatLog(log) {
    try {
        const user = log.actor ? log.actor.name : (log.user_id ? `User ${log.user_id}` : 'System');
        const actionRaw = log.action || 'UNKNOWN';
        const action = ACTION_MAPPING[actionRaw] || actionRaw;
        const entityRaw = log.resource_type || 'Unknown Entity';
        const entity = ENTITY_MAPPING[entityRaw] || entityRaw;
        const timestamp = log.created_at || log.createdAt || new Date();
        const formattedTimestamp = formatDatetime(timestamp);

        let oldValues = log.old_values;
        let newValues = log.new_values;

        // Parse JSON if stored as string (though Sequelize usually handles this)
        if (typeof oldValues === 'string') {
            try { oldValues = JSON.parse(oldValues); } catch (e) { }
        }
        if (typeof newValues === 'string') {
            try { newValues = JSON.parse(newValues); } catch (e) { }
        }

        const changes = [];
        let description = `${user} ${action.toLowerCase()} ${entity}`;

        // Specific description enhancements based on entity
        if (entity === 'MIS Entry' && (newValues?.entry_date || oldValues?.entry_date)) {
            const date = newValues?.entry_date || oldValues?.entry_date;
            description += ` for ${formatDate(date)}`;
        } else if (entity === 'User' && (newValues?.name || oldValues?.name)) {
            const name = newValues?.name || oldValues?.name;
            description += ` (${name})`;
        }

        // Compare values to detect changes
        if (actionRaw === 'UPDATE' && oldValues && newValues) {
            const allKeys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);

            allKeys.forEach(key => {
                const oldVal = oldValues ? oldValues[key] : undefined;
                const newVal = newValues ? newValues[key] : undefined;

                // Simple equality check (convert to string to handle mixed types safely)
                if (String(oldVal) !== String(newVal)) {
                    // Ignore internal fields or timestamps update if not relevant
                    if (['updated_at', 'created_at', 'id'].includes(key)) return;

                    const fieldName = FIELD_MAPPING[key] || key;
                    const from = (oldVal === null || oldVal === undefined) ? 'Empty' : oldVal;
                    const to = (newVal === null || newVal === undefined) ? 'Empty' : newVal;

                    changes.push({
                        field: fieldName,
                        from: String(from),
                        to: String(to)
                    });
                }
            });
        } else if (actionRaw === 'CREATE' && newValues) {
            // For create, we might not want to list every single field as a "change" from Empty, 
            // but if requested, we can. The prompt implied "changes" list.
            // Usually for create, we just say "Created X".
            // But if we want to show initial values:
            Object.entries(newValues).forEach(([key, val]) => {
                if (['updated_at', 'created_at', 'id'].includes(key)) return;
                const fieldName = FIELD_MAPPING[key] || key;
                changes.push({
                    field: fieldName,
                    from: 'Empty',
                    to: val === null ? 'Empty' : String(val)
                });
            });
        }

        // Generate readable sentence from changes
        let changeSentences = [];
        changes.forEach(change => {
            // Truncate long text
            let from = change.from;
            if (from.length > 50) from = from.substring(0, 50) + '...';
            let to = change.to;
            if (to.length > 50) to = to.substring(0, 50) + '...';

            changeSentences.push(`Changed ${change.field} from "${from}" to "${to}"`);
        });

        let formattedDescription = description;
        if (changeSentences.length > 0) {
            formattedDescription += '. ' + changeSentences.join('. ') + '.';
        }

        return {
            id: log.id,
            user,
            action,
            entity,
            description,
            changes,
            formatted_description: formattedDescription,
            timestamp: formattedTimestamp,
            original_timestamp: timestamp // Keep for sorting if needed
        };

    } catch (error) {
        console.error('Error formatting log:', error);
        return {
            id: log.id,
            user: 'Unknown',
            action: 'Error',
            description: 'Error formatting log',
            changes: [],
            formatted_description: 'Error formatting log',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    formatLog
};
