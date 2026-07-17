const { AuditLog } = require('../models');

function buildFieldChanges(oldValues, newValues) {
    if (!oldValues || !newValues || typeof oldValues !== 'object' || typeof newValues !== 'object') return null;
    const changes = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    for (const key of allKeys) {
        const oldVal = oldValues[key];
        const newVal = newValues[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field: key, old_value: oldVal, new_value: newVal });
        }
    }
    return changes.length ? changes : null;
}

const auditService = {
    /**
     * @returns {Promise<Object|null>} The created AuditLog record, or null on error
     */
    log: async (userId, action, resourceType, resourceId, oldValues, newValues, req) => {
        try {
            const field_changes = buildFieldChanges(
                oldValues && typeof oldValues === 'object' ? oldValues : null,
                newValues && typeof newValues === 'object' ? newValues : null
            );
            const record = await AuditLog.create({
                user_id: userId,
                action,
                resource_type: resourceType,
                resource_id: resourceId ? String(resourceId) : null,
                old_values: oldValues,
                new_values: newValues,
                ip_address: req ? (req.ip || req.connection?.remoteAddress) : null,
                user_agent: req ? req.get('User-Agent') : null
            });
            return record;
        } catch (error) {
            console.error('Audit Log Error:', error);
            return null;
        }
    },
    buildFieldChanges
};

module.exports = auditService;
