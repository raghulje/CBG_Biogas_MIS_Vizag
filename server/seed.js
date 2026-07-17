const db = require('./models');
const bcrypt = require('bcrypt');

const seed = async () => {
    try {
        // Safety: force sync is destructive. Require explicit env var to run.
        if (process.env.ALLOW_FORCE_SYNC !== 'true') {
            console.error('Refusing to run force sync. Set ALLOW_FORCE_SYNC=true in environment to allow destructive operations.');
            process.exit(1);
        }

        // Disable foreign key checks to allow dropping tables
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

        await db.sequelize.sync({ force: true });
        console.log('Database cleared and synced (force)');

        // Re-enable foreign key checks
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

        // 1. Roles
        const adminRole = await db.Role.create({ name: 'Admin', description: 'System Administrator' });
        const managerRole = await db.Role.create({ name: 'Manager', description: 'Plant Manager' });
        const operatorRole = await db.Role.create({ name: 'Operator', description: 'Data Entry Operator' });

        // 2. Permissions
        const permissions = [
            // MIS Entry Permissions
            { name: 'mis_entry:create', resource: 'mis_entry', action: 'create' },
            { name: 'mis_entry:read', resource: 'mis_entry', action: 'read' },
            { name: 'mis_entry:update', resource: 'mis_entry', action: 'update' },
            { name: 'mis_entry:delete', resource: 'mis_entry', action: 'delete' },
            { name: 'mis_entry:submit', resource: 'mis_entry', action: 'submit' },
            { name: 'mis_entry:approve', resource: 'mis_entry', action: 'approve' },
            { name: 'mis_entry:import', resource: 'mis_entry', action: 'import' },
            { name: 'mis_entry:export', resource: 'mis_entry', action: 'export' },
            // User Permissions
            { name: 'user:read', resource: 'user', action: 'read' },
            { name: 'user:create', resource: 'user', action: 'create' },
            { name: 'user:update', resource: 'user', action: 'update' },
            { name: 'user:delete', resource: 'user', action: 'delete' },
            // Role Permissions
            { name: 'role:read', resource: 'role', action: 'read' },
            { name: 'role:create', resource: 'role', action: 'create' },
            { name: 'role:update', resource: 'role', action: 'update' },
            { name: 'role:delete', resource: 'role', action: 'delete' },
            // Config Permissions
            { name: 'config:read', resource: 'config', action: 'read' },
            { name: 'config:create', resource: 'config', action: 'create' },
            { name: 'config:update', resource: 'config', action: 'update' },
            { name: 'config:delete', resource: 'config', action: 'delete' },
            // Audit Permissions
            { name: 'audit:read', resource: 'audit', action: 'read' },
        ];


        const createdPerms = await db.Permission.bulkCreate(permissions);

        // 3. Assign Permissions

        // Operator: Create/Read/Update/Submit Entry
        const opPerms = createdPerms.filter(p => ['create', 'read', 'update', 'submit'].includes(p.action) && p.resource === 'mis_entry');
        await operatorRole.addPermissions(opPerms);

        // Manager: Read/Approve Entry + Config Read + Audit Read
        const mgrPerms = createdPerms.filter(p =>
            (p.resource === 'mis_entry') ||
            (p.resource === 'audit')
        );
        await managerRole.addPermissions(mgrPerms);

        // Admin gets everything implicitly via middleware check or we can assign all
        // Let's assign all just in case
        await adminRole.addPermissions(createdPerms);

        // 4. Create Users
        // Hash passwords manually here to ensure consistency if hooks don't fire on bulkCreate (though we use create here)
        // We rely on the model hook for hashing

        await db.User.create({
            name: 'Super Admin',
            email: 'admin@biogas.com',
            password: 'Admin@123',
            role_id: adminRole.id,
            is_active: true
        });

        await db.User.create({
            name: 'John Operator',
            email: 'operator@biogas.com',
            password: 'User@123',
            role_id: operatorRole.id,
            is_active: true
        });

        await db.User.create({
            name: 'Jane Manager',
            email: 'manager@biogas.com',
            password: 'User@123',
            role_id: managerRole.id,
            is_active: true
        });

        console.log('Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        if (error.original) console.error('Original Error:', error.original);
        process.exit(1);
    }
};

seed();
