 'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      PasswordResetToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  PasswordResetToken.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'password_reset_tokens',
      underscored: true,
      indexes: [
        { name: 'ux_password_reset_tokens_token', unique: true, fields: ['token'] }
      ],
    }
  );
  return PasswordResetToken;
};
