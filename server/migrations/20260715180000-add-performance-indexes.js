'use strict';

/**
 * Add indexes on frequently filtered / joined columns.
 * Safe: only creates indexes if missing; does not alter data.
 */
module.exports = {
  async up(queryInterface) {
    const addIndexSafe = async (table, fields, options) => {
      try {
        await queryInterface.addIndex(table, fields, options);
      } catch (e) {
        // Index may already exist
        if (!/Duplicate|exists|ER_DUP_KEYNAME/i.test(String(e.message || e))) {
          console.warn(`Index skip/warn ${table}:`, e.message);
        }
      }
    };

    await addIndexSafe('customers', ['status'], { name: 'idx_customers_status' });
    await addIndexSafe('customers', ['type'], { name: 'idx_customers_type' });
    await addIndexSafe('customers', ['name'], { name: 'idx_customers_name' });
    await addIndexSafe('mis_compressors', ['entry_id'], { name: 'idx_mis_compressors_entry_id' });
    await addIndexSafe('mis_manpower_data', ['entry_id'], { name: 'idx_mis_manpower_entry_id' });
    await addIndexSafe('mis_raw_biogas_quality', ['entry_id'], { name: 'idx_mis_raw_biogas_quality_entry_id' });
    await addIndexSafe('email_logs', ['sent_at'], { name: 'idx_email_logs_sent_at' });
    await addIndexSafe('email_logs', ['entity_type'], { name: 'idx_email_logs_entity_type' });
    await addIndexSafe('user_activity_logs', ['user_id'], { name: 'idx_user_activity_logs_user_id' });
    await addIndexSafe('user_activity_logs', ['created_at'], { name: 'idx_user_activity_logs_created_at' });
    await addIndexSafe('audit_logs', ['user_id'], { name: 'idx_audit_logs_user_id' });
    await addIndexSafe('audit_logs', ['action'], { name: 'idx_audit_logs_action' });
  },

  async down(queryInterface) {
    const dropSafe = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch (_e) { /* ignore */ }
    };
    await dropSafe('customers', 'idx_customers_status');
    await dropSafe('customers', 'idx_customers_type');
    await dropSafe('customers', 'idx_customers_name');
    await dropSafe('mis_compressors', 'idx_mis_compressors_entry_id');
    await dropSafe('mis_manpower_data', 'idx_mis_manpower_entry_id');
    await dropSafe('mis_raw_biogas_quality', 'idx_mis_raw_biogas_quality_entry_id');
    await dropSafe('email_logs', 'idx_email_logs_sent_at');
    await dropSafe('email_logs', 'idx_email_logs_entity_type');
    await dropSafe('user_activity_logs', 'idx_user_activity_logs_user_id');
    await dropSafe('user_activity_logs', 'idx_user_activity_logs_created_at');
    await dropSafe('audit_logs', 'idx_audit_logs_user_id');
    await dropSafe('audit_logs', 'idx_audit_logs_action');
  }
};
