'use strict';

/** Idempotency + retry: last report period end (YYYY-MM-DD) successfully emailed by the scheduler (not test sends). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const Seq = queryInterface.sequelize?.constructor || Sequelize;

    const tableInfo = await qi.describeTable('final_mis_report_config');
    if (!tableInfo.last_successful_period_end) {
      await qi.addColumn('final_mis_report_config', 'last_successful_period_end', {
        type: Seq.STRING(10),
        allowNull: true,
        comment: 'YYYY-MM-DD end of report period last delivered by scheduler',
      });
    }
  },

  down: async (queryInterface) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const tableInfo = await qi.describeTable('final_mis_report_config');
    if (tableInfo.last_successful_period_end) {
      await qi.removeColumn('final_mis_report_config', 'last_successful_period_end');
    }
  },
};
