'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Permission extends Model {
        static associate(models) {
            Permission.belongsToMany(models.Role, {
                through: 'RolePermission',
                foreignKey: 'permission_id',
                as: 'roles'
            });
            Permission.belongsToMany(models.User, {
                through: models.UserPermission,
                foreignKey: 'permission_id',
                otherKey: 'user_id',
                as: 'users'
            });
        }
    }
    Permission.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'e.g., mis_entry:create, report:view'
        },
        description: DataTypes.STRING,
        resource: {
            type: DataTypes.STRING,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        underscored: true,
        indexes: [
            { name: 'ux_permissions_name', unique: true, fields: ['name'] }
        ]
    });
    return Permission;
};
