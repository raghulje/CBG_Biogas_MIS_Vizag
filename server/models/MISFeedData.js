'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISFeedData extends Model {
        static associate(models) {
            MISFeedData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
        }
    }
    MISFeedData.init({
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        feed_type: DataTypes.STRING,
        quantity: DataTypes.FLOAT,
        time: DataTypes.TIME,
        remarks: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'MISFeedData',
        tableName: 'mis_feed_data',
        underscored: true
    });
    return MISFeedData;
};
