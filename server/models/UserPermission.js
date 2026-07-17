'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserPermission extends Model {
        static associate(models) {
            // Join table only; associations on User and Permission
        }
    }
    UserPermission.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'permissions',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        sequelize,
        modelName: 'UserPermission',
        tableName: 'user_permissions',
        underscored: true,
        timestamps: false,
        indexes: [
            { name: 'ux_user_permissions_user_id_permission_id', unique: true, fields: ['user_id', 'permission_id'] },
            { name: 'idx_user_permissions_user_id', fields: ['user_id'] }
        ]
    });
    return UserPermission;
};
