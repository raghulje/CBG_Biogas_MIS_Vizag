const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISFeedMixingTank = sequelize.define('MISFeedMixingTank', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },

        // Cow Dung Feed
        cow_dung_qty: DataTypes.FLOAT,
        cow_dung_ts: DataTypes.FLOAT,
        cow_dung_vs: DataTypes.FLOAT,

        // Pressmud Feed
        pressmud_qty: DataTypes.FLOAT,
        pressmud_ts: DataTypes.FLOAT,
        pressmud_vs: DataTypes.FLOAT,

        // Permeate Feed
        permeate_qty: DataTypes.FLOAT,
        permeate_ts: DataTypes.FLOAT,
        permeate_vs: DataTypes.FLOAT,

        // Water
        water_qty: DataTypes.FLOAT,
        water_ts: DataTypes.FLOAT,
        water_vs: DataTypes.FLOAT,

        // Pulp
        pulp_qty: DataTypes.FLOAT,
        pulp_ts: DataTypes.FLOAT,
        pulp_vs: DataTypes.FLOAT,

        // Maggie
        maggie_qty: DataTypes.FLOAT,
        maggie_ts: DataTypes.FLOAT,
        maggie_vs: DataTypes.FLOAT,

        // Other Feed Substrate
        other_feed_substrate_qty: DataTypes.FLOAT,
        other_feed_substrate_ts: DataTypes.FLOAT,
        other_feed_substrate_vs: DataTypes.FLOAT,

        // Slurry
        slurry_total: DataTypes.FLOAT,
        slurry_ts: DataTypes.FLOAT,
        slurry_vs: DataTypes.FLOAT,
        slurry_ph: DataTypes.FLOAT

    }, {
        tableName: 'mis_feed_mixing_tank',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISFeedMixingTank.associate = (models) => {
        MISFeedMixingTank.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISFeedMixingTank;
};
