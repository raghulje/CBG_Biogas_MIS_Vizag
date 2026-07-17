'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class RolePermission extends Model {
        static associate(models) {
            // Associations define properties on the model instances
        }
    }
    RolePermission.init({
        role_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'roles',
                key: 'id'
            }
        },
        permission_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'permissions',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'RolePermission',
        tableName: 'role_permissions',
        underscored: true,
        timestamps: false,
        indexes: [{ fields: ['role_id', 'permission_id'] }]
    });
    return RolePermission;
};
