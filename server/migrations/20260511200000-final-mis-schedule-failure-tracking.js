'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const Seq = queryInterface.sequelize?.constructor || Sequelize;

    const tableInfo = await qi.describeTable('final_mis_report_config');
    if (!tableInfo.schedule_failure_period_end) {
      await qi.addColumn('final_mis_report_config', 'schedule_failure_period_end', {
        type: Seq.STRING(10),
        allowNull: true,
        comment: 'Report period end (YYYY-MM-DD) last failed scheduled delivery',
      });
    }
    if (!tableInfo.schedule_failure_summary) {
      await qi.addColumn('final_mis_report_config', 'schedule_failure_summary', {
        type: Seq.STRING(512),
        allowNull: true,
      });
    }
    if (!tableInfo.schedule_failure_last_attempt_at) {
      await qi.addColumn('final_mis_report_config', 'schedule_failure_last_attempt_at', {
        type: Seq.DATE,
        allowNull: true,
      });
    }
    if (!tableInfo.delivery_alert_sent_for_period) {
      await qi.addColumn('final_mis_report_config', 'delivery_alert_sent_for_period', {
        type: Seq.STRING(10),
        allowNull: true,
        comment: 'Period end for which a one-time failure alert email was sent',
      });
    }
  },

  down: async (queryInterface) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const tableInfo = await qi.describeTable('final_mis_report_config');
    if (tableInfo.delivery_alert_sent_for_period) {
      await qi.removeColumn('final_mis_report_config', 'delivery_alert_sent_for_period');
    }
    if (tableInfo.schedule_failure_last_attempt_at) {
      await qi.removeColumn('final_mis_report_config', 'schedule_failure_last_attempt_at');
    }
    if (tableInfo.schedule_failure_summary) {
      await qi.removeColumn('final_mis_report_config', 'schedule_failure_summary');
    }
    if (tableInfo.schedule_failure_period_end) {
      await qi.removeColumn('final_mis_report_config', 'schedule_failure_period_end');
    }
  },
};
