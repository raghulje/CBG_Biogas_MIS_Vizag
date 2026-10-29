'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../models');

const qi = db.sequelize.getQueryInterface();
const gen = qi.queryGenerator;
const lines = [];
const fkAlters = [];

lines.push('-- Full schema for biogas_mis_vizag, generated from Sequelize models.');
lines.push('-- Import into the empty production database. This drops and recreates every app table.');
lines.push('SET NAMES utf8mb4;');
lines.push('SET FOREIGN_KEY_CHECKS = 0;');
lines.push('');

const migrationFiles = fs
  .readdirSync(path.join(__dirname, '..', 'migrations'))
  .filter((f) => f.endsWith('.js'))
  .sort();

for (const name of Object.keys(db)) {
  if (name === 'sequelize' || name === 'Sequelize') continue;
  const model = db[name];
  const table = model.getTableName();
  const attrs = {};
  for (const [col, attr] of Object.entries(model.rawAttributes)) {
    attrs[attr.field || col] = attr;
  }
  const sqlAttrs = gen.attributesToSQL(attrs, { context: 'createTable' });
  let sql = gen.createTableQuery(table, sqlAttrs, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
  });
  if (sql && sql.query) sql = sql.query;
  let createSql = String(sql).trim().replace(/;?\s*$/, '');
  createSql = createSql.replace(/ DEFAULT true/gi, ' DEFAULT 1').replace(/ DEFAULT false/gi, ' DEFAULT 0');
  const fkRe = /, FOREIGN KEY \((`[^`]+`)\) REFERENCES (`[^`]+`) \((`[^`]+`)\)( ON DELETE (?:CASCADE|SET NULL|NO ACTION|RESTRICT))?( ON UPDATE (?:CASCADE|SET NULL|NO ACTION|RESTRICT))?/g;
  let fkMatch;
  let fkIndex = 0;
  while ((fkMatch = fkRe.exec(createSql)) !== null) {
    fkIndex += 1;
    const col = fkMatch[1].replace(/`/g, '');
    const onDelete = fkMatch[4] || ' ON DELETE NO ACTION';
    const onUpdate = fkMatch[5] || ' ON UPDATE CASCADE';
    fkAlters.push(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`fk_${table}_${col}_${fkIndex}\` FOREIGN KEY (${fkMatch[1]}) REFERENCES ${fkMatch[2]} (${fkMatch[3]})${onDelete}${onUpdate};`
    );
  }
  fkRe.lastIndex = 0;
  createSql = createSql.replace(fkRe, '');
  lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
  lines.push(`${createSql};`);
  lines.push('');

  const indexes = (model.options && model.options.indexes) || [];
  for (const idx of indexes) {
    const fields = (idx.fields || [])
      .map((f) => (typeof f === 'string' ? f : f.attribute || f.name))
      .filter(Boolean);
    if (!fields.length || !idx.name) continue;
    const cols = fields.map((f) => `\`${f}\``).join(', ');
    const unique = idx.unique ? 'UNIQUE ' : '';
    lines.push(`CREATE ${unique}INDEX \`${idx.name}\` ON \`${table}\` (${cols});`);
  }
  if (indexes.length) lines.push('');
}

lines.push(...fkAlters);
lines.push('');

const extraIndexes = [
  ['customers', 'idx_customers_status', '`status`'],
  ['customers', 'idx_customers_type', '`type`'],
  ['customers', 'idx_customers_name', '`name`'],
  ['mis_compressors', 'idx_mis_compressors_entry_id', '`entry_id`'],
  ['mis_manpower_data', 'idx_mis_manpower_entry_id', '`entry_id`'],
  ['mis_raw_biogas_quality', 'idx_mis_raw_biogas_quality_entry_id', '`entry_id`'],
  ['email_logs', 'idx_email_logs_sent_at', '`sent_at`'],
  ['email_logs', 'idx_email_logs_entity_type', '`entity_type`'],
  ['user_activity_logs', 'idx_user_activity_logs_user_id', '`user_id`'],
  ['user_activity_logs', 'idx_user_activity_logs_created_at', '`created_at`'],
  ['audit_logs', 'idx_audit_logs_user_id', '`user_id`'],
  ['audit_logs', 'idx_audit_logs_action', '`action`'],
];
for (const [table, indexName, cols] of extraIndexes) {
  lines.push(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${cols});`);
}
lines.push('');

lines.push('CREATE TABLE IF NOT EXISTS `SequelizeMeta` (');
lines.push('  `name` VARCHAR(255) NOT NULL,');
lines.push('  PRIMARY KEY (`name`),');
lines.push('  UNIQUE KEY `name` (`name`)');
lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
lines.push('');
for (const file of migrationFiles) {
  lines.push(`INSERT IGNORE INTO \`SequelizeMeta\` (\`name\`) VALUES ('${file.replace(/'/g, "''")}');`);
}
lines.push('');

const adminHash = bcrypt.hashSync('Admin@123', 10);
const userHash = bcrypt.hashSync('User@123', 10);
const permissions = [
  ['mis_entry:create', 'mis_entry', 'create'],
  ['mis_entry:read', 'mis_entry', 'read'],
  ['mis_entry:update', 'mis_entry', 'update'],
  ['mis_entry:delete', 'mis_entry', 'delete'],
  ['mis_entry:submit', 'mis_entry', 'submit'],
  ['mis_entry:approve', 'mis_entry', 'approve'],
  ['mis_entry:import', 'mis_entry', 'import'],
  ['mis_entry:export', 'mis_entry', 'export'],
  ['user:read', 'user', 'read'],
  ['user:create', 'user', 'create'],
  ['user:update', 'user', 'update'],
  ['user:delete', 'user', 'delete'],
  ['role:read', 'role', 'read'],
  ['role:create', 'role', 'create'],
  ['role:update', 'role', 'update'],
  ['role:delete', 'role', 'delete'],
  ['config:read', 'config', 'read'],
  ['config:create', 'config', 'create'],
  ['config:update', 'config', 'update'],
  ['config:delete', 'config', 'delete'],
  ['audit:read', 'audit', 'read'],
];

lines.push('-- Starter roles, permissions, and login users. Change these passwords after first login.');
lines.push("INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES");
lines.push("(1, 'Admin', 'System Administrator', NOW(), NOW()),");
lines.push("(2, 'Manager', 'Plant Manager', NOW(), NOW()),");
lines.push("(3, 'Operator', 'Data Entry Operator', NOW(), NOW());");
lines.push('');
lines.push('INSERT INTO `permissions` (`name`, `resource`, `action`, `created_at`, `updated_at`) VALUES');
lines.push(permissions.map(([name, resource, action]) => `('${name}', '${resource}', '${action}', NOW(), NOW())`).join(',\n') + ';');
lines.push('');
lines.push('INSERT INTO `role_permissions` (`role_id`, `permission_id`)');
lines.push('SELECT 1, `id` FROM `permissions`;');
lines.push('INSERT INTO `role_permissions` (`role_id`, `permission_id`)');
lines.push("SELECT 2, `id` FROM `permissions` WHERE `resource` IN ('mis_entry', 'audit');");
lines.push('INSERT INTO `role_permissions` (`role_id`, `permission_id`)');
lines.push("SELECT 3, `id` FROM `permissions` WHERE `resource` = 'mis_entry' AND `action` IN ('create', 'read', 'update', 'submit');");
lines.push('');
lines.push('INSERT INTO `users` (`name`, `email`, `password`, `role_id`, `is_active`, `is_custom_perm`, `created_at`, `updated_at`) VALUES');
lines.push(`('Super Admin', 'admin@biogas.com', '${adminHash}', 1, 1, 0, NOW(), NOW()),`);
lines.push(`('Jane Manager', 'manager@biogas.com', '${userHash}', 2, 1, 0, NOW(), NOW()),`);
lines.push(`('John Operator', 'operator@biogas.com', '${userHash}', 3, 1, 0, NOW(), NOW());`);
lines.push('');
lines.push('INSERT INTO `email_schedulers` (`name`, `cron_expression`, `is_active`, `job_type`, `created_at`, `updated_at`) VALUES');
lines.push("('MIS Entry Creation Check', '45 16 * * *', 1, 'mis_creation_check', NOW(), NOW()),");
lines.push("('MIS Escalation Check', '30 17 * * *', 1, 'mis_escalation_check', NOW(), NOW());");
lines.push('');
lines.push('SET FOREIGN_KEY_CHECKS = 1;');
lines.push('');

const out = path.join(__dirname, 'biogas_mis_vizag_schema.sql');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`Wrote ${out} (${lines.length} lines)`);
db.sequelize.close();
