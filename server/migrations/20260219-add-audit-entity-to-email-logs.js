'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const Seq = queryInterface.sequelize?.constructor || Sequelize;

    const tableInfo = await qi.describeTable('email_logs');
    if (!tableInfo.audit_log_id) {
      await qi.addColumn('email_logs', 'audit_log_id', {
        type: Seq.INTEGER,
        allowNull: true,
        references: { model: 'audit_logs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!tableInfo.entity_type) {
      await qi.addColumn('email_logs', 'entity_type', {
        type: Seq.STRING(64),
        allowNull: true,
        comment: 'e.g. MISDailyEntry'
      });
    }
    if (!tableInfo.entity_id) {
      await qi.addColumn('email_logs', 'entity_id', {
        type: Seq.STRING(64),
        allowNull: true,
        comment: 'ID of related entity (e.g. MIS entry id)'
      });
    }
  },

  down: async (queryInterface) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    await qi.removeColumn('email_logs', 'entity_id');
    await qi.removeColumn('email_logs', 'entity_type');
    await qi.removeColumn('email_logs', 'audit_log_id');
  }
};
