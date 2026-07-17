const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISUtilities = sequelize.define('MISUtilities', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        electricity_consumption: DataTypes.FLOAT,
        specific_power_consumption: DataTypes.FLOAT
    }, {
        tableName: 'mis_utilities',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISUtilities.associate = (models) => {
        MISUtilities.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISUtilities;
};
