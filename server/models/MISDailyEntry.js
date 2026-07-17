'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISDailyEntry extends Model {
        static associate(models) {
            MISDailyEntry.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

            // New Associations
            MISDailyEntry.hasOne(models.MISRawMaterials, { foreignKey: 'entry_id', as: 'rawMaterials', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISFeedMixingTank, { foreignKey: 'entry_id', as: 'feedMixingTank', onDelete: 'CASCADE' });
            MISDailyEntry.hasMany(models.MISDigesterData, { foreignKey: 'entry_id', as: 'digesters', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISSLSData, { foreignKey: 'entry_id', as: 'slsMachine', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISRawBiogas, { foreignKey: 'entry_id', as: 'rawBiogas', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISRawBiogasQuality, { foreignKey: 'entry_id', as: 'rawBiogasQuality', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISCompressedBiogas, { foreignKey: 'entry_id', as: 'compressedBiogas', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISCompressors, { foreignKey: 'entry_id', as: 'compressors', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISFertilizerData, { foreignKey: 'entry_id', as: 'fertilizer', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISUtilities, { foreignKey: 'entry_id', as: 'utilities', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISManpowerData, { foreignKey: 'entry_id', as: 'manpower', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISPlantAvailability, { foreignKey: 'entry_id', as: 'plantAvailability', onDelete: 'CASCADE' });
            MISDailyEntry.hasOne(models.MISHSEData, { foreignKey: 'entry_id', as: 'hse', onDelete: 'CASCADE' });
            MISDailyEntry.hasMany(models.MISCBGSale, { foreignKey: 'entry_id', as: 'cbgSales', onDelete: 'CASCADE' });
            MISDailyEntry.hasMany(models.MISFuelUtilized, { foreignKey: 'entry_id', as: 'fuelUtilized', onDelete: 'CASCADE' });
        }
    }
    MISDailyEntry.init({
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        shift: {
            type: DataTypes.ENUM('Shift-1', 'Shift-2', 'General'),
            defaultValue: 'General'
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'deleted'),
            defaultValue: 'draft'
        },
        review_comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'MISDailyEntry',
        tableName: 'mis_daily_entries',
        underscored: true,
        indexes: [
            { name: 'ux_mis_daily_entries_date_shift', unique: true, fields: ['date', 'shift'] },
            { name: 'idx_mis_daily_entries_date', fields: ['date'] },
            { name: 'idx_mis_daily_entries_status', fields: ['status'] },
            { name: 'idx_mis_daily_entries_created_by', fields: ['created_by'] }
        ]
    });
    return MISDailyEntry;
};
