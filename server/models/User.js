'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
            User.hasMany(models.MISDailyEntry, { foreignKey: 'created_by', as: 'entries' });
            // User-level permissions (primary): admin assigns per user via Create/Edit User
            User.belongsToMany(models.Permission, {
                through: models.UserPermission,
                foreignKey: 'user_id',
                otherKey: 'permission_id',
                as: 'permissions'
            });
        }

        async validatePassword(password) {
            return await bcrypt.compare(password, this.password);
        }
    }
    User.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        is_custom_perm: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
        indexes: [
            { name: 'ux_users_email', unique: true, fields: ['email'] },
            { name: 'idx_users_role_id', fields: ['role_id'] }
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });
    return User;
};
