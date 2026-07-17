'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use the connected sequelize instance and its QueryInterface directly to be robust
    const sequelizeInstance = require('../models').sequelize;
    const qi = sequelizeInstance.getQueryInterface();
    const Seq = sequelizeInstance.constructor || require('sequelize');

    // Add name and target_role columns to support multiple schedules (only if missing)
    const colCheckSql = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :col
    `;
    const nameExistsRows = await sequelizeInstance.query(colCheckSql, { replacements: { table: 'notification_schedules', col: 'name' }, type: Seq.QueryTypes.SELECT });
    const nameExists = Array.isArray(nameExistsRows) ? nameExistsRows.length > 0 : !!nameExistsRows;
    if (!nameExists) {
      await qi.addColumn('notification_schedules', 'name', {
        type: Seq.STRING(100),
        allowNull: false,
        defaultValue: 'Reminder'
      });
      console.log('Added column notification_schedules.name');
    } else {
      console.log('Column notification_schedules.name already exists; skipping addColumn');
    }

    const targetRoleExistsRows = await sequelizeInstance.query(colCheckSql, { replacements: { table: 'notification_schedules', col: 'target_role' }, type: Seq.QueryTypes.SELECT });
    const targetRoleExists = Array.isArray(targetRoleExistsRows) ? targetRoleExistsRows.length > 0 : !!targetRoleExistsRows;
    if (!targetRoleExists) {
      await qi.addColumn('notification_schedules', 'target_role', {
        type: Seq.STRING(50),
        allowNull: true,
        defaultValue: null
      });
      console.log('Added column notification_schedules.target_role');
    } else {
      console.log('Column notification_schedules.target_role already exists; skipping addColumn');
    }

    // Backfill existing rows with a friendly name if present
    try {
      await queryInterface.sequelize.query(
        "UPDATE notification_schedules SET name = 'Default Reminder' WHERE name = 'Reminder' OR name IS NULL"
      );
    } catch (e) {
      // ignore
      console.warn('Backfill notification_schedules name failed:', e.message || e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const qi = (queryInterface && typeof queryInterface.removeColumn === 'function') ? queryInterface : (queryInterface && queryInterface.sequelize ? queryInterface.sequelize.getQueryInterface() : require('../models').sequelize.getQueryInterface());
    await qi.removeColumn('notification_schedules', 'target_role');
    await qi.removeColumn('notification_schedules', 'name');
  }
};

