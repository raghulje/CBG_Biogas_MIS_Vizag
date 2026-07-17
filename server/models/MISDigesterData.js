'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISDigesterData extends Model {
        static associate(models) {
            MISDigesterData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
        }
    }
    MISDigesterData.init({
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        digester_name: DataTypes.STRING,
        // Feeding
        feeding_slurry: DataTypes.FLOAT,
        feeding_ts_percent: DataTypes.FLOAT,
        feeding_vs_percent: DataTypes.FLOAT,
        // Discharge
        discharge_slurry: DataTypes.FLOAT,
        discharge_ts_percent: DataTypes.FLOAT,
        discharge_vs_percent: DataTypes.FLOAT,
        // Characteristics
        temp: DataTypes.FLOAT,
        ph: DataTypes.FLOAT,
        pressure: DataTypes.FLOAT,
        lignin: DataTypes.FLOAT,
        vfa: DataTypes.FLOAT,
        alkalinity: DataTypes.FLOAT,
        vfa_alk_ratio: DataTypes.FLOAT,
        ash: DataTypes.FLOAT,
        density: DataTypes.FLOAT,
        slurry_level: DataTypes.FLOAT,
        // Health
        agitator_runtime: DataTypes.INTEGER,
        agitator_condition: DataTypes.STRING,
        hrt: DataTypes.FLOAT,
        vs_destruction: DataTypes.FLOAT,
        olr: DataTypes.FLOAT,
        balloon_level: DataTypes.FLOAT,
        foaming_level: DataTypes.FLOAT,

        remarks: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'MISDigesterData',
        tableName: 'mis_digester_data',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });
    return MISDigesterData;
};
