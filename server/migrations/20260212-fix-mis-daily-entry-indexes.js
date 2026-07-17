'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = 'mis_daily_entries';
    const desiredName = 'ux_mis_daily_entries_date_shift';
    const { QueryTypes } = require('sequelize');
    // Resolve sequelize instance
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : require('../models').sequelize;

    // Query INFORMATION_SCHEMA for indexes on this table
    const sql = `
      SELECT INDEX_NAME as index_name, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as cols
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table
      GROUP BY INDEX_NAME
    `;
    const results = await sequelizeInstance.query(sql, { replacements: { table }, type: QueryTypes.SELECT });
    const indexes = Array.isArray(results) ? results : (results ? [results] : []);

    // Remove duplicate indexes that cover date+shift but are not the desired name
    for (const idx of indexes) {
      const colNames = (idx.cols || '').split(',').map(s => s.trim()).filter(Boolean);
      if (colNames.length === 2 && colNames.includes('date') && colNames.includes('shift') && idx.index_name !== desiredName) {
        try {
          await sequelizeInstance.query('ALTER TABLE `' + table + '` DROP INDEX `' + idx.index_name + '`');
          console.log(`Removed duplicate index ${idx.index_name} from ${table}`);
        } catch (e) {
          console.warn(`Failed to remove index ${idx.index_name}:`, e.message || e);
        }
      }
    }

    // Ensure the desired named unique index exists
    const existsSql = `
      SELECT COUNT(1) as cnt
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :indexName
    `;
    const existsRows = await sequelizeInstance.query(existsSql, { replacements: { table, indexName: desiredName }, type: QueryTypes.SELECT });
    const existsRow = Array.isArray(existsRows) ? existsRows[0] : existsRows;
    const exists = existsRow && (existsRow.cnt || existsRow.CNT || existsRow.count || existsRow['COUNT(1)']) > 0;
    if (!exists) {
      try {
        await sequelizeInstance.query('ALTER TABLE `' + table + '` ADD UNIQUE INDEX `' + desiredName + '` (`date`,`shift`)');
        console.log(`Created index ${desiredName} on ${table}(date,shift)`);
      } catch (e) {
        console.error(`Failed to create index ${desiredName} on ${table}:`, e.message || e);
        throw e;
      }
    } else {
      console.log(`Index ${desiredName} already exists on ${table}`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = 'mis_daily_entries';
    const desiredName = 'ux_mis_daily_entries_date_shift';
    // Use raw DROP INDEX to be compatible with different contexts
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : require('../models').sequelize;
    try {
      await sequelizeInstance.query('ALTER TABLE `' + table + '` DROP INDEX `' + desiredName + '`');
    } catch (e) {
      console.warn(`Could not remove index ${desiredName} from ${table}:`, e.message || e);
    }
  }
};

