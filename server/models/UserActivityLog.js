'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserActivityLog extends Model {
        static associate(models) {
            UserActivityLog.belongsTo(models.User, { foreignKey: 'user_id' });
        }
    }
    UserActivityLog.init({
        user_id: DataTypes.INTEGER,
        activity_type: {
            type: DataTypes.STRING, // e.g., 'LOGIN', 'LOGOUT', 'VIEW_PAGE'
            allowNull: false
        },
        description: DataTypes.TEXT,
        metadata: DataTypes.JSON,
        ip_address: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'UserActivityLog',
        tableName: 'user_activity_logs',
        underscored: true
    });
    return UserActivityLog;
};
