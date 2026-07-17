const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISSLSData = sequelize.define('MISSLSData', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        water_consumption: DataTypes.FLOAT,
        poly_electrolyte: DataTypes.FLOAT,
        solution: DataTypes.FLOAT,
        slurry_feed: DataTypes.FLOAT,
        wet_cake_prod: DataTypes.FLOAT,
        wet_cake_ts: DataTypes.FLOAT,
        wet_cake_vs: DataTypes.FLOAT,
        liquid_produced: DataTypes.FLOAT,
        liquid_ts: DataTypes.FLOAT,
        liquid_vs: DataTypes.FLOAT,
        liquid_sent_to_lagoon: DataTypes.FLOAT
    }, {
        tableName: 'mis_sls_data',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISSLSData.associate = (models) => {
        MISSLSData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISSLSData;
};
