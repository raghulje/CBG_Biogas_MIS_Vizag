'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISBiogasData extends Model {
        static associate(models) {
            MISBiogasData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
        }
    }
    MISBiogasData.init({
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        parameter: DataTypes.STRING, // e.g., CH4, CO2, H2S
        value: DataTypes.FLOAT,
        unit: DataTypes.STRING,
        time: DataTypes.TIME,
        remarks: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'MISBiogasData',
        tableName: 'mis_biogas_data',
        underscored: true
    });
    return MISBiogasData;
};
