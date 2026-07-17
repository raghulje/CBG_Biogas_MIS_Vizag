'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ImportLog extends Model {
        static associate(models) {
            ImportLog.belongsTo(models.User, { foreignKey: 'imported_by', as: 'user' });
        }
    }
    ImportLog.init({
        filename: DataTypes.STRING,
        status: {
            type: DataTypes.ENUM('success', 'failed', 'partial'),
            allowNull: false
        },
        records_processed: DataTypes.INTEGER,
        records_failed: DataTypes.INTEGER,
        error_log: DataTypes.JSON,
        imported_by: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ImportLog',
        tableName: 'import_logs',
        underscored: true
    });
    return ImportLog;
};
