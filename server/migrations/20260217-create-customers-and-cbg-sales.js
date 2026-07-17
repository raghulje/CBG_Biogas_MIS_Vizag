'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
    up: async ({ context: queryInterface }) => {
        // 1. Create Customers Table if not exists
        const tableNames = await queryInterface.showAllTables();

        if (!tableNames.includes('customers')) {
            await queryInterface.createTable('customers', {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false
                },
                // ... exactly same fields as models/Customer.js
                name: { type: DataTypes.STRING, allowNull: false },
                type: { type: DataTypes.STRING, allowNull: true },
                email: { type: DataTypes.STRING, allowNull: true },
                phone: { type: DataTypes.STRING, allowNull: true },
                address: { type: DataTypes.TEXT, allowNull: true },
                gst_number: { type: DataTypes.STRING, allowNull: true },
                pan_number: { type: DataTypes.STRING, allowNull: true },
                status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
                created_at: { type: DataTypes.DATE, allowNull: false },
                updated_at: { type: DataTypes.DATE, allowNull: false },
                deleted_at: { type: DataTypes.DATE, allowNull: true }
            });
        }

        // 2. Create CBG Sales Table if not exists
        if (!tableNames.includes('mis_cbg_sales')) {
            await queryInterface.createTable('mis_cbg_sales', {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false
                },
                entry_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'mis_daily_entries', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                customer_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: { model: 'customers', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                quantity: {
                    type: DataTypes.FLOAT,
                    allowNull: false,
                    defaultValue: 0
                },
                created_at: { type: DataTypes.DATE, allowNull: false },
                updated_at: { type: DataTypes.DATE, allowNull: false }
            });

            await queryInterface.addIndex('mis_cbg_sales', ['entry_id']);
            await queryInterface.addIndex('mis_cbg_sales', ['customer_id']);
        }
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('mis_cbg_sales');
        await queryInterface.dropTable('customers');
    }
};
