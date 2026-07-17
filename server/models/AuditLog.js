'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AuditLog extends Model {
        static associate(models) {
            AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'actor' });
        }
    }
    AuditLog.init({
        user_id: DataTypes.INTEGER,
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        resource_type: DataTypes.STRING,
        resource_id: DataTypes.STRING,
        old_values: DataTypes.JSON,
        new_values: DataTypes.JSON,
        ip_address: DataTypes.STRING,
        user_agent: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'AuditLog',
        tableName: 'audit_logs',
        underscored: true,
        indexes: [{ fields: ['created_at'] }]
    });
    return AuditLog;
};
