'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper to ensure unique index with stable name, removing conflicting duplicates
    async function ensureUniqueIndex(table, columns, desiredName) {
      // Ensure we have a sequelize instance (some Umzug contexts only expose queryInterface)
      const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : require('../models').sequelize;

      // Query INFORMATION_SCHEMA to list indexes and their columns for the current database
      const sql = `
        SELECT INDEX_NAME as index_name, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as cols
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table
        GROUP BY INDEX_NAME
      `;
      const results = await sequelizeInstance.query(sql, { replacements: { table }, type: QueryTypes.SELECT });
      const indexes = Array.isArray(results) ? results : (results ? [results] : []);

      // Remove other indexes covering same columns but different name
      for (const idx of indexes) {
        const colNames = (idx.cols || '').split(',').map(s => s.trim()).filter(Boolean);
        const sameCols = colNames.length === columns.length && columns.every(c => colNames.includes(c));
        if (sameCols && idx.index_name !== desiredName) {
          try {
            // Use raw ALTER TABLE DROP INDEX for compatibility with QueryInterface-less contexts
            await sequelizeInstance.query('ALTER TABLE `' + table + '` DROP INDEX `' + idx.index_name + '`');
            console.log(`Removed duplicate index ${idx.index_name} on ${table}`);
          } catch (e) {
            console.warn(`Failed to remove index ${idx.index_name} on ${table}:`, e.message || e);
          }
        }
      }

      // Check if desired index exists
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
          const colsSql = columns.map(c => '`' + c + '`').join(',');
          await sequelizeInstance.query('ALTER TABLE `' + table + '` ADD UNIQUE INDEX `' + desiredName + '` (' + colsSql + ')');
          console.log(`Created index ${desiredName} on ${table}(${columns.join(',')})`);
        } catch (e) {
          console.error(`Failed to create index ${desiredName} on ${table}:`, e.message || e);
          throw e;
        }
      } else {
        console.log(`Index ${desiredName} already exists on ${table}`);
      }
    }

    await ensureUniqueIndex('users', ['email'], 'ux_users_email');
    await ensureUniqueIndex('permissions', ['name'], 'ux_permissions_name');
    await ensureUniqueIndex('roles', ['name'], 'ux_roles_name');
    await ensureUniqueIndex('email_templates', ['name'], 'ux_email_templates_name');
    await ensureUniqueIndex('password_reset_tokens', ['token'], 'ux_password_reset_tokens_token');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'ux_users_email');
    await queryInterface.removeIndex('permissions', 'ux_permissions_name');
    await queryInterface.removeIndex('roles', 'ux_roles_name');
    await queryInterface.removeIndex('email_templates', 'ux_email_templates_name');
    await queryInterface.removeIndex('password_reset_tokens', 'ux_password_reset_tokens_token');
  }
};

