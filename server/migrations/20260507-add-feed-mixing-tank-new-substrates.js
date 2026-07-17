'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    const Seq = queryInterface.sequelize?.constructor || Sequelize;

    const tableInfo = await qi.describeTable('mis_feed_mixing_tank');

    async function addCol(name, def) {
      if (!tableInfo[name]) {
        await qi.addColumn('mis_feed_mixing_tank', name, def);
      }
    }

    // Water TS/VS
    await addCol('water_ts', { type: Seq.FLOAT, allowNull: true });
    await addCol('water_vs', { type: Seq.FLOAT, allowNull: true });

    // Pulp
    await addCol('pulp_qty', { type: Seq.FLOAT, allowNull: true });
    await addCol('pulp_ts', { type: Seq.FLOAT, allowNull: true });
    await addCol('pulp_vs', { type: Seq.FLOAT, allowNull: true });

    // Maggie
    await addCol('maggie_qty', { type: Seq.FLOAT, allowNull: true });
    await addCol('maggie_ts', { type: Seq.FLOAT, allowNull: true });
    await addCol('maggie_vs', { type: Seq.FLOAT, allowNull: true });

    // Other feed substrate
    await addCol('other_feed_substrate_qty', { type: Seq.FLOAT, allowNull: true });
    await addCol('other_feed_substrate_ts', { type: Seq.FLOAT, allowNull: true });
    await addCol('other_feed_substrate_vs', { type: Seq.FLOAT, allowNull: true });
  },

  down: async (queryInterface) => {
    const qi = queryInterface.sequelize
      ? queryInterface.sequelize.getQueryInterface()
      : queryInterface;
    await qi.removeColumn('mis_feed_mixing_tank', 'other_feed_substrate_vs');
    await qi.removeColumn('mis_feed_mixing_tank', 'other_feed_substrate_ts');
    await qi.removeColumn('mis_feed_mixing_tank', 'other_feed_substrate_qty');
    await qi.removeColumn('mis_feed_mixing_tank', 'maggie_vs');
    await qi.removeColumn('mis_feed_mixing_tank', 'maggie_ts');
    await qi.removeColumn('mis_feed_mixing_tank', 'maggie_qty');
    await qi.removeColumn('mis_feed_mixing_tank', 'pulp_vs');
    await qi.removeColumn('mis_feed_mixing_tank', 'pulp_ts');
    await qi.removeColumn('mis_feed_mixing_tank', 'pulp_qty');
    await qi.removeColumn('mis_feed_mixing_tank', 'water_vs');
    await qi.removeColumn('mis_feed_mixing_tank', 'water_ts');
  }
};

