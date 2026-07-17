'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISPowerData extends Model {
        static associate(models) {
            MISPowerData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
        }
    }
    MISPowerData.init({
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        equipment_name: DataTypes.STRING,
        start_time: DataTypes.TIME,
        end_time: DataTypes.TIME,
        total_hours: DataTypes.FLOAT,
        energy_consumed: DataTypes.FLOAT, // kWh
        remarks: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'MISPowerData',
        tableName: 'mis_power_data',
        underscored: true
    });
    return MISPowerData;
};
