#!/usr/bin/env node
/**
 * Cleanup script: remove admin/audit/import permissions from non-Admin roles.
 *
 * Usage: node server/scripts/cleanup_role_permissions.js
 *
 * This will:
 *  - find Permission ids for resources: 'config','audit','import_data'
 *  - remove RolePermission rows where role.name !== 'Admin' and permission_id in that set
 *
 * Run this during maintenance window. It's idempotent.
 */
const path = require('path');
async function main() {
  try {
    const db = require(path.join('..', 'models'));
    const { Permission, Role, RolePermission, sequelize } = db;
    await sequelize.authenticate();

    const resources = ['config', 'audit', 'import_data'];
    const perms = await Permission.findAll({ where: { resource: resources }, attributes: ['id', 'resource', 'name'] });
    if (!perms || perms.length === 0) {
      console.log('No permissions found for resources:', resources);
      process.exit(0);
    }
    const permIds = perms.map(p => p.id);
    console.log('Target permission ids to clean:', permIds);

    const roles = await Role.findAll({ where: { name: { [db.Sequelize.Op.ne]: 'Admin' } }, attributes: ['id', 'name'] });
    if (!roles || roles.length === 0) {
      console.log('No non-Admin roles found. Nothing to do.');
      process.exit(0);
    }
    const roleIds = roles.map(r => r.id);
    console.log('Non-admin role ids:', roleIds);

    const deleted = await RolePermission.destroy({ where: { role_id: roleIds, permission_id: permIds } });
    console.log(`Deleted ${deleted} role-permission entries.`);
    process.exit(0);
  } catch (err) {
    console.error('cleanup_role_permissions failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

