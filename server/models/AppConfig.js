'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AppConfig extends Model {
    static associate(models) {}
  }
  AppConfig.init(
    {
      key: { type: DataTypes.STRING, allowNull: false, unique: true },
      value: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'AppConfig',
      tableName: 'app_config',
      underscored: true,
    }
  );
  return AppConfig;
};
