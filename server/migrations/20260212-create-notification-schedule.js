'use strict';

module.exports = {
  up: async (queryInterface /*, Sequelize */) => {
    // Resolve a usable QueryInterface implementation
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : (require('../models').sequelize);
    const qi = (queryInterface && typeof queryInterface.createTable === 'function') ? queryInterface : sequelizeInstance.getQueryInterface();
    const Seq = sequelizeInstance.constructor || require('sequelize');

    await qi.createTable('notification_schedules', {
      id: {
        type: Seq.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      mis_start_time: { type: Seq.TIME, allowNull: false },
      mis_end_time: { type: Seq.TIME, allowNull: false },
      reminder_start_time: { type: Seq.TIME, allowNull: false },
      reminder_interval_minutes: { type: Seq.INTEGER, allowNull: false, defaultValue: 60 },
      reminder_count: { type: Seq.INTEGER, allowNull: false, defaultValue: 4 },
      is_active: { type: Seq.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Seq.DATE, allowNull: false, defaultValue: Seq.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Seq.DATE, allowNull: false, defaultValue: Seq.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  down: async (queryInterface /*, Sequelize */) => {
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : (require('../models').sequelize);
    const qi = (queryInterface && typeof queryInterface.dropTable === 'function') ? queryInterface : sequelizeInstance.getQueryInterface();
    await qi.dropTable('notification_schedules');
  }
};

