const { User, Role, Permission } = require('../models');
const auditService = require('../services/auditService');
const permissionMiddleware = require('../middleware/permissionMiddleware');

// Create User
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role_id, is_active } = req.body;

        // Validation
        if (!name || !email || !password || !role_id) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        const exists = await User.findOne({ where: { email } });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        const user = await User.create({ name, email, password, role_id, is_active: is_active ?? true });

        // Sync user-level permissions (primary: admin assigns per user)
        if (req.body.permissions && Array.isArray(req.body.permissions)) {
            await syncUserPermissions(user.id, req.body.permissions);
            await user.update({ is_custom_perm: true });
        }

        permissionMiddleware.invalidateUserPermissions(user.id);
        await auditService.log(req.user.id, 'CREATE_USER', 'User', user.id, null, { name, email, role_id }, req);

        res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id }
        });
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// Get User by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            include: [
                { model: Role, as: 'role', attributes: ['id', 'name'] },
                { model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['id', 'name', 'resource', 'action'] }
            ],
            attributes: { exclude: ['password'] }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Map UI page names to backend resources — EACH PAGE HAS A UNIQUE RESOURCE
// This prevents cross-page permission bleed (e.g. Dashboard no longer shares 'config' with Admin Panel)
const UI_PAGE_TO_RESOURCE = {
    'Dashboard': 'dashboard',
    'MIS Entry': 'mis_entry',
    'Consolidated MIS View': 'consolidated_mis',
    'User Management': 'user',
    'Roles & Permissions': 'role',
    'Admin Panel': 'config',
    'Audit Logs': 'audit',
    'Import Data': 'import_data',
    'Customer': 'customer'
};

/** Convert UI permission matrix to DB permission records and set on user (user_permissions). */
const syncUserPermissions = async (userId, uiPermissions) => {
    if (!uiPermissions || !Array.isArray(uiPermissions)) return;

    const user = await User.findByPk(userId);
    if (!user) return;

    const dbPermissions = [];
    for (const perm of uiPermissions) {
        const pageName = perm.page || perm.name;
        const resource = pageName ? UI_PAGE_TO_RESOURCE[pageName] : null;
        if (!resource) continue;

        // Save exactly what the admin toggled — no implicit bundling
        if (perm.read) dbPermissions.push({ resource, action: 'read' });
        if (perm.create) dbPermissions.push({ resource, action: 'create' });
        if (perm.update) dbPermissions.push({ resource, action: 'update' });
        if (perm.delete) dbPermissions.push({ resource, action: 'delete' });
        if (resource === 'mis_entry' && perm.approve) dbPermissions.push({ resource: 'mis_entry', action: 'approve' });
    }

    // Also add legacy MIS permissions for API-level enforcement
    // If user has mis_entry create, also grant submit/import on mis_entry
    const hasMisCreate = dbPermissions.some(p => p.resource === 'mis_entry' && p.action === 'create');
    const hasMisUpdate = dbPermissions.some(p => p.resource === 'mis_entry' && p.action === 'update');
    const hasImportCreate = dbPermissions.some(p => p.resource === 'import_data' && p.action === 'create');
    if (hasMisCreate) {
        dbPermissions.push({ resource: 'mis_entry', action: 'submit' });
    }
    if (hasImportCreate || hasMisCreate) {
        dbPermissions.push({ resource: 'mis_entry', action: 'import' });
    }
    if (hasMisUpdate) {
        dbPermissions.push({ resource: 'mis_entry', action: 'export' });
    }
    // If user has consolidated_mis read, also grant mis_entry read for API access
    const hasConsolidatedRead = dbPermissions.some(p => p.resource === 'consolidated_mis' && p.action === 'read');
    if (hasConsolidatedRead) {
        dbPermissions.push({ resource: 'mis_entry', action: 'read' });
    }
    // If user has import_data read, also grant mis_entry read for API access
    const hasImportRead = dbPermissions.some(p => p.resource === 'import_data' && p.action === 'read');
    if (hasImportRead) {
        dbPermissions.push({ resource: 'mis_entry', action: 'read' });
    }
    // If user has dashboard read, also grant config read for API access to configs needed by dashboard
    const hasDashboardRead = dbPermissions.some(p => p.resource === 'dashboard' && p.action === 'read');
    if (hasDashboardRead) {
        dbPermissions.push({ resource: 'config', action: 'read' });
    }

    const seen = new Set();
    const unique = dbPermissions.filter(p => {
        const key = `${p.resource}:${p.action}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const allPerms = await Permission.findAll({ attributes: ['id', 'resource', 'action'] });
    const permByKey = new Map(allPerms.map(p => [`${p.resource}:${p.action}`, p]));
    const permissionRecords = [];
    for (const p of unique) {
        const rec = permByKey.get(`${p.resource}:${p.action}`);
        if (rec) permissionRecords.push(rec);
    }

    await user.setPermissions(permissionRecords);
    permissionMiddleware.invalidateUserPermissions(userId);
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role_id, is_active, permissions } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Store old values for audit
        const oldValues = user.toJSON();

        // Check email uniqueness if changed
        if (email && email !== user.email) {
            const exists = await User.findOne({ where: { email } });
            if (exists) return res.status(400).json({ message: 'Email already in use' });
        }

        await user.update({ name, email, role_id, is_active });

        // Sync user-level permissions (primary: admin assigns per user)
        if (permissions && Array.isArray(permissions)) {
            await syncUserPermissions(user.id, permissions);
            await user.update({ is_custom_perm: true });
        }

        permissionMiddleware.invalidateUserPermissions(id);
        await auditService.log(req.user.id, 'UPDATE_USER', 'User', id, oldValues, { name, email, role_id, is_active }, req);

        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role_id: user.role_id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Delete/Deactivate User (Soft Delete)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent deleting yourself
        if (Number(user.id) === Number(req.user.id)) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const oldValues = user.toJSON();

        // Soft delete - deactivate
        await user.update({ is_active: false });
        await auditService.log(req.user.id, 'DEACTIVATE_USER', 'User', id, oldValues, { is_active: false }, req);

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Error deactivating user', error: error.message });
    }
};

// Activate User
exports.activateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({ is_active: true });
        await auditService.log(req.user.id, 'ACTIVATE_USER', 'User', id, null, { is_active: true }, req);

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Activate User Error:', error);
        res.status(500).json({ message: 'Error activating user', error: error.message });
    }
};

// Change User Password (Admin)
exports.changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.update({ password: newPassword }); // Model hook will hash
        await auditService.log(req.user.id, 'CHANGE_USER_PASSWORD', 'User', id, null, null, req);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// Bulk User Operations
exports.bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, updates } = req.body; // updates: { role_id, is_active }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'User IDs array is required' });
        }

        const result = await User.update(updates, {
            where: { id: userIds }
        });

        userIds.forEach((id) => permissionMiddleware.invalidateUserPermissions(id));
        await auditService.log(req.user.id, 'BULK_UPDATE_USERS', 'User', null, null, { userIds, updates }, req);

        res.json({ message: `${result[0]} users updated successfully` });
    } catch (error) {
        console.error('Bulk Update Error:', error);
        res.status(500).json({ message: 'Error updating users', error: error.message });
    }
};

// Get User Activity Logs
exports.getUserActivityLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { UserActivityLog } = require('../models');

        const logs = await UserActivityLog.findAll({
            where: { user_id: id },
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.json(logs);
    } catch (error) {
        console.error('Get Activity Logs Error:', error);
        res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
    }
};

module.exports = exports;
