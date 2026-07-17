'use strict';

/**
 * Baseline migration: creates all tables according to current models.
 *
 * Strategy:
 * 1) Require models to access model.rawAttributes and model.options.indexes
 * 2) Create tables without foreign key constraints (strip references)
 * 3) After all tables created, add foreign key constraints
 * 4) Add indexes with explicit names
 *
 * Note: run this once on an empty database to bring schema under migrations.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const path = require('path');
    const db = require(path.join('..', 'models'));
    // Ensure we have a sequelize instance and a real QueryInterface
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : db.sequelize;
    const qi = sequelizeInstance.getQueryInterface();

    const createdTables = [];

    // Helper to clone column definition removing references
    const makeColumnDef = (attr) => {
      const col = {};
      if (attr.type) col.type = attr.type;
      if (attr.allowNull !== undefined) col.allowNull = attr.allowNull;
      if (attr.defaultValue !== undefined) col.defaultValue = attr.defaultValue;
      if (attr.primaryKey) col.primaryKey = true;
      if (attr.autoIncrement) col.autoIncrement = true;
      if (attr.unique) col.unique = attr.unique;
      if (attr.comment) col.comment = attr.comment;
      // Do NOT include attr.references here; add constraints in second pass
      return col;
    };

    // 1) Create tables without FK constraints
    for (const name of Object.keys(db)) {
      if (name === 'sequelize' || name === 'Sequelize') continue;
      const model = db[name];
      const tableName = model.getTableName();
      const attributes = model.rawAttributes || model.tableAttributes || {};
      const columns = {};
      for (const [colName, attr] of Object.entries(attributes)) {
        columns[attr.field || colName] = makeColumnDef(attr);
      }
      // Add timestamps if model.options.timestamps is true and not present
      const opts = model.options || {};
      const timestamps = opts.timestamps !== false;
      if (timestamps) {
        if (!columns.created_at) columns.created_at = { type: Sequelize.DATE, allowNull: true };
        if (!columns.updated_at) columns.updated_at = { type: Sequelize.DATE, allowNull: true };
      }

      // Create table if not exists
      await qi.createTable(tableName, columns, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
      createdTables.push(tableName);
      console.log(`Created table ${tableName}`);
    }

    // 2) Add foreign key constraints
    for (const name of Object.keys(db)) {
      if (name === 'sequelize' || name === 'Sequelize') continue;
      const model = db[name];
      const tableName = model.getTableName();
      const attributes = model.rawAttributes || model.tableAttributes || {};
      for (const [colName, attr] of Object.entries(attributes)) {
        if (attr.references && attr.references.model) {
          const field = attr.field || colName;
          const refTable = attr.references.model;
          const refField = attr.references.key || attr.references.key || 'id';
          const constraintName = `fk_${tableName}_${field}`;
          // Add FK constraint
            try {
            await qi.addConstraint(tableName, {
              fields: [field],
              type: 'foreign key',
              name: constraintName,
              references: { table: refTable, field: refField },
              onDelete: attr.onDelete || 'CASCADE',
              onUpdate: attr.onUpdate || 'CASCADE'
            });
            console.log(`Added FK ${constraintName} on ${tableName}(${field}) -> ${refTable}(${refField})`);
          } catch (e) {
            console.warn(`Could not add FK ${constraintName} on ${tableName}:`, e.message || e);
          }
        }
      }
    }

    // 3) Add indexes defined in models (ensure explicit names exist)
    for (const name of Object.keys(db)) {
      if (name === 'sequelize' || name === 'Sequelize') continue;
      const model = db[name];
      const tableName = model.getTableName();
      const indexes = (model.options && model.options.indexes) || [];
      for (const idx of indexes) {
        const fields = idx.fields.map(f => (typeof f === 'string' ? f : (f.attribute || f.name || f.columnName)));
        const opts = {
          name: idx.name || (`idx_${tableName}_${fields.join('_')}`),
          unique: !!idx.unique
        };
        try {
          await qi.addIndex(tableName, fields, opts);
          console.log(`Added index ${opts.name} on ${tableName}(${fields.join(',')})`);
        } catch (e) {
          console.warn(`Failed to add index ${opts.name} on ${tableName}:`, e.message || e);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const path = require('path');
    const db = require(path.join('..', 'models'));
    const sequelizeInstance = (queryInterface && queryInterface.sequelize) ? queryInterface.sequelize : db.sequelize;
    const qi = sequelizeInstance.getQueryInterface();
    // Drop tables in reverse order
    const tables = Object.keys(db)
      .filter(n => n !== 'sequelize' && n !== 'Sequelize')
      .map(n => db[n].getTableName())
      .reverse();
    for (const t of tables) {
      try {
        await qi.dropTable(t);
        console.log(`Dropped table ${t}`);
      } catch (e) {
        console.warn(`Could not drop table ${t}:`, e.message || e);
      }
    }
  }
};

