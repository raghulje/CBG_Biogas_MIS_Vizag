'use strict';

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
  'mis_utilities'
];

async function run() {
  const db = require('../models');
  const sequelize = db.sequelize;
  for (const table of CHILD_TABLES) {
    try {
      const keySql = `
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table
          AND COLUMN_NAME = 'entry_id'
          AND REFERENCED_TABLE_NAME = 'mis_daily_entries'
      `;
      const keys = await sequelize.query(keySql, { replacements: { table }, type: sequelize.QueryTypes.SELECT });
      if (!keys || keys.length === 0) {
        console.log(`${table}: NO foreign key to mis_daily_entries(entry_id) found`);
        continue;
      }
      for (const k of keys) {
        const cname = k.CONSTRAINT_NAME || k.constraint_name;
        const refSql = `
          SELECT UPDATE_RULE, DELETE_RULE
          FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
          WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND CONSTRAINT_NAME = :cname
        `;
        const refs = await sequelize.query(refSql, { replacements: { cname }, type: sequelize.QueryTypes.SELECT });
        if (!refs || refs.length === 0) {
          console.log(`${table}: constraint ${cname} exists but referential rules not found`);
          continue;
        }
        const rule = refs[0];
        console.log(`${table}: constraint=${cname} UPDATE=${rule.UPDATE_RULE} DELETE=${rule.DELETE_RULE}`);
      }
    } catch (e) {
      console.error(`Error checking ${table}:`, e && e.message ? e.message : e);
    }
  }
  process.exit(0);
}

run().catch(e => {
  console.error('check_mis_constraints failed:', e);
  process.exit(1);
});

