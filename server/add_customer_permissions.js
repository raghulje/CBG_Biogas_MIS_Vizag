const db = require('./models');

const addPermissions = async () => {
    try {
        const permissions = [
            { name: 'customer:create', resource: 'customer', action: 'create' },
            { name: 'customer:read', resource: 'customer', action: 'read' },
            { name: 'customer:update', resource: 'customer', action: 'update' },
            { name: 'customer:delete', resource: 'customer', action: 'delete' },
        ];

        for (const p of permissions) {
            const [perm, created] = await db.Permission.findOrCreate({
                where: { name: p.name },
                defaults: p
            });
            if (created) {
                console.log(`Created permission: ${p.name}`);
            } else {
                console.log(`Permission already exists: ${p.name}`);
            }
        }

        // Assign to Admin role
        const adminRole = await db.Role.findOne({ where: { name: 'Admin' } });
        if (adminRole) {
            const allPerms = await db.Permission.findAll({
                where: { resource: 'customer' }
            });
            await adminRole.addPermissions(allPerms);
            console.log('Assigned customer permissions to Admin role');
        }

        console.log('Done');
        process.exit(0);
    } catch (error) {
        console.error('Error adding permissions:', error);
        process.exit(1);
    }
};

addPermissions();
