#!/usr/bin/env node
/**
 * remove_role_system_cleanup.js
 *
 * Safely remove role/permission data from the database after creating a backup.
 * - Backs up roles, permissions, role_permissions, user_permissions and affected users to server/backups/
 * - In a transaction:
 *    - nullify users.role_id
 *    - delete RolePermission rows
 *    - delete UserPermission rows
 *    - delete Permission rows
 *    - delete Role rows
 *
 * Usage (run from repo root):
 *   node server/scripts/remove_role_system_cleanup.js
 *
 * IMPORTANT:
 * - Run during maintenance window
 * - This is destructive and irreversible unless you restore from the backup JSON files
 */
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    const db = require(path.join('..', 'models'));
    const { Role, Permission, RolePermission, UserPermission, User, sequelize } = db;

    await sequelize.authenticate();
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `roles_permissions_backup_${ts}.json`);

    console.log('Creating backup of role/permission data...');
    const [roles, permissions, rolePermissions, userPermissions, usersWithRole] = await Promise.all([
      Role.findAll({ raw: true }),
      Permission.findAll({ raw: true }),
      RolePermission.findAll({ raw: true }),
      UserPermission ? UserPermission.findAll({ raw: true }) : Promise.resolve([]),
      User.findAll({ where: { role_id: { [db.Sequelize.Op.not]: null } }, attributes: ['id', 'email', 'role_id'], raw: true })
    ]);

    const backup = { meta: { created_at: new Date().toISOString() }, roles, permissions, rolePermissions, userPermissions, usersWithRole };
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
    console.log('Backup saved to', backupFile);

    console.log('Starting destructive cleanup (in transaction)...');
    await sequelize.transaction(async (t) => {
      // 1) Nullify users.role_id
      const [updatedUsers] = await sequelize.query('UPDATE users SET role_id = NULL WHERE role_id IS NOT NULL', { transaction: t });
      console.log('Users role_id nulled (raw result):', updatedUsers);

      // 2) Delete RolePermission entries
      const delRolePerm = await RolePermission.destroy({ where: {}, transaction: t });
      console.log('Deleted RolePermission rows:', delRolePerm);

      // 3) Delete UserPermission entries (if model exists)
      if (UserPermission) {
        const delUserPerm = await UserPermission.destroy({ where: {}, transaction: t });
        console.log('Deleted UserPermission rows:', delUserPerm);
      } else {
        console.log('UserPermission model not found; skipping.');
      }

      // 4) Delete Permission rows
      const delPerm = await Permission.destroy({ where: {}, transaction: t });
      console.log('Deleted Permission rows:', delPerm);

      // 5) Delete Role rows
      const delRoles = await Role.destroy({ where: {}, transaction: t });
      console.log('Deleted Role rows:', delRoles);
    });

    console.log('Cleanup completed successfully.');
    console.log('If you need to restore, inspect the backup file and re-create rows carefully.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

if (require.main === module) main();

