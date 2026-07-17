/**
 * Fix Permissions: Add unique per-page resources so that pages no longer
 * share the same resource (which caused cross-page permission bleed).
 *
 * New resources added: dashboard, consolidated_mis, import_data
 * (customer already exists)
 *
 * Run: node fix_permissions.js
 */
const db = require('./models');

const newPermissions = [
    // Dashboard — was sharing 'config' with Admin Panel
    { name: 'dashboard:read', resource: 'dashboard', action: 'read' },
    { name: 'dashboard:create', resource: 'dashboard', action: 'create' },
    { name: 'dashboard:update', resource: 'dashboard', action: 'update' },
    { name: 'dashboard:delete', resource: 'dashboard', action: 'delete' },

    // Consolidated MIS View — was sharing 'mis_entry' with MIS Entry
    { name: 'consolidated_mis:read', resource: 'consolidated_mis', action: 'read' },
    { name: 'consolidated_mis:create', resource: 'consolidated_mis', action: 'create' },
    { name: 'consolidated_mis:update', resource: 'consolidated_mis', action: 'update' },
    { name: 'consolidated_mis:delete', resource: 'consolidated_mis', action: 'delete' },

    // Import Data — was sharing 'mis_entry' with MIS Entry
    { name: 'import_data:read', resource: 'import_data', action: 'read' },
    { name: 'import_data:create', resource: 'import_data', action: 'create' },
    { name: 'import_data:update', resource: 'import_data', action: 'update' },
    { name: 'import_data:delete', resource: 'import_data', action: 'delete' },

    // Customer — ensure these exist (they should already from seed)
    { name: 'customer:create', resource: 'customer', action: 'create' },
    { name: 'customer:read', resource: 'customer', action: 'read' },
    { name: 'customer:update', resource: 'customer', action: 'update' },
    { name: 'customer:delete', resource: 'customer', action: 'delete' },
];

async function run() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connected.');

        let created = 0;
        let existed = 0;
        for (const p of newPermissions) {
            const [perm, wasCreated] = await db.Permission.findOrCreate({
                where: { name: p.name },
                defaults: p,
            });
            if (wasCreated) {
                console.log(`  ✅ Created: ${p.name} (id=${perm.id})`);
                created++;
            } else {
                console.log(`  ⏭️  Already exists: ${p.name} (id=${perm.id})`);
                existed++;
            }
        }

        // Also ensure Admin role (id=1) has ALL permissions
        const adminRole = await db.Role.findOne({ where: { name: 'Admin' } });
        if (adminRole) {
            const allPerms = await db.Permission.findAll();
            await adminRole.setPermissions(allPerms);
            console.log(`\n✅ Assigned ALL ${allPerms.length} permissions to Admin role.`);
        }

        console.log(`\n🎉 Done. Created: ${created}, Already existed: ${existed}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

run();
