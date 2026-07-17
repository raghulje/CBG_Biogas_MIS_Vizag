'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
    up: async ({ context: queryInterface }) => {
        const tableNames = await queryInterface.showAllTables();
        if (tableNames.includes('mis_fuel_utilized')) return;

        await queryInterface.createTable('mis_fuel_utilized', {
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
            fuel_type: {
                type: DataTypes.STRING,
                allowNull: false
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
        await queryInterface.addIndex('mis_fuel_utilized', ['entry_id']);
        await queryInterface.addIndex('mis_fuel_utilized', ['customer_id']);
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('mis_fuel_utilized');
    }
};
