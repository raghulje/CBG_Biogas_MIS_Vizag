'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationSchedule extends Model {
    static associate(models) {}
  }

  NotificationSchedule.init({
    name: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Reminder' },
    mis_start_time: { type: DataTypes.TIME, allowNull: false },
    mis_end_time: { type: DataTypes.TIME, allowNull: false },
    reminder_start_time: { type: DataTypes.TIME, allowNull: false },
    reminder_interval_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    reminder_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    target_role: { type: DataTypes.STRING(50), allowNull: true }
  }, {
    sequelize,
    modelName: 'NotificationSchedule',
    tableName: 'notification_schedules',
    underscored: true,
    timestamps: true
  });

  return NotificationSchedule;
};

