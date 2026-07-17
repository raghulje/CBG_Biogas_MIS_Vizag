'use strict';

/**
 * Migration: ensure FK constraints referencing mis_daily_entries(entry_id) use ON DELETE CASCADE / ON UPDATE CASCADE.
 * - Finds existing foreign key constraints on entry_id referencing mis_daily_entries and removes them
 * - Adds a named FK constraint fk_<table>_entry_id with cascade rules
 *
 * Safe / idempotent: queries INFORMATION_SCHEMA for existing constraints and handles absence gracefully.
 */

const CHILD_TABLES = [
  'mis_digester_data',
  'mis_biogas_data',
  'mis_feed_data',
  'mis_power_data',
  'mis_compressed_biogas',
  'mis_compressors',
  'mis_feed_mixing_tank',
  'mis_fertilizer_data',
  'mis_manpower_data',
  'mis_hse_data',
  'mis_plant_availability',
  'mis_raw_biogas',
  'mis_raw_biogas_quality',
  'mis_raw_materials',
  'mis_sls_data',
  'mis_utilities',
  'mis_biogas_data' // duplicate safe
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sequelize = queryInterface.sequelize;
    const dbNameResult = await sequelize.query('SELECT DATABASE() AS db', { type: Sequelize.QueryTypes.SELECT });
    const dbName = dbNameResult && dbNameResult[0] && dbNameResult[0].db ? dbNameResult[0].db : null;

    for (const table of CHILD_TABLES) {
      try {
        // Find constraint(s) on this table.column referencing mis_daily_entries.id
        const sql = `
          SELECT CONSTRAINT_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = :table
            AND COLUMN_NAME = 'entry_id'
            AND REFERENCED_TABLE_NAME = 'mis_daily_entries'
        `;
        const results = await sequelize.query(sql, {
          replacements: { table },
          type: Sequelize.QueryTypes.SELECT
        });

        // Remove existing constraints found
        for (const row of results || []) {
          const cname = row.CONSTRAINT_NAME || row.constraint_name;
          if (!cname) continue;
          try {
            await queryInterface.removeConstraint(table, cname);
            console.log(`Removed existing FK constraint ${cname} on ${table}.`);
          } catch (e) {
            console.warn(`Could not remove constraint ${cname} on ${table}:`, e.message || e);
          }
        }

        // Add new named constraint
        const fkName = `fk_${table}_entry_id`;
        // Check if constraint already exists by name
        const exists = await sequelize.query(
          `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :cname`,
          { replacements: { table, cname: fkName }, type: Sequelize.QueryTypes.SELECT }
        );
        if (!(exists && exists.length)) {
          await queryInterface.addConstraint(table, {
            fields: ['entry_id'],
            type: 'foreign key',
            name: fkName,
            references: {
              table: 'mis_daily_entries',
              field: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          });
          console.log(`Added FK ${fkName} on ${table}(entry_id) -> mis_daily_entries(id) CASCADE`);
        } else {
          console.log(`FK ${fkName} already exists on ${table}`);
        }
      } catch (err) {
        console.error(`Error processing table ${table}:`, err && err.message ? err.message : err);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const table of CHILD_TABLES) {
      const fkName = `fk_${table}_entry_id`;
      try {
        await queryInterface.removeConstraint(table, fkName);
        console.log(`Removed FK ${fkName} from ${table}`);
      } catch (e) {
        // ignore if not exists
      }
    }
  }
};

