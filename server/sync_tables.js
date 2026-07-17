const { sequelize, Customer, MISCBGSale, MISFuelUtilized } = require('./models');

async function syncTables() {
    try {
        console.log('Authenticating database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Syncing Customer model...');
        await Customer.sync({ alter: true });
        console.log('Customer table synced.');

        console.log('Syncing MISCBGSale model...');
        await MISCBGSale.sync({ alter: true });
        console.log('MISCBGSale table synced.');

        console.log('Syncing MISFuelUtilized model...');
        await MISFuelUtilized.sync({ alter: true });
        console.log('MISFuelUtilized table synced.');

        console.log('All done.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing tables:', error);
        process.exit(1);
    }
}

syncTables();
