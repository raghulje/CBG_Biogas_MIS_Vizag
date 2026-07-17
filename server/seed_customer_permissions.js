const { Permission, sequelize } = require('./models');

async function seedCustomerPermissions() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const actions = ['create', 'read', 'update', 'delete'];
        for (const action of actions) {
            const [perm, created] = await Permission.findOrCreate({
                where: { resource: 'customer', action },
                defaults: { resource: 'customer', action }
            });
            console.log(`Permission customer:${action} ${created ? 'CREATED' : 'already exists'} (id=${perm.id})`);
        }

        console.log('Customer permissions seeded.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding permissions:', error);
        process.exit(1);
    }
}

seedCustomerPermissions();
