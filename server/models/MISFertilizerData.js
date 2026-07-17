const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISFertilizerData = sequelize.define('MISFertilizerData', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        fom_produced: DataTypes.FLOAT,
        inventory: DataTypes.FLOAT,
        sold: DataTypes.FLOAT,
        weighted_average: DataTypes.FLOAT,
        revenue_1: DataTypes.FLOAT,
        lagoon_liquid_sold: DataTypes.FLOAT,
        revenue_2: DataTypes.FLOAT,
        loose_fom_sold: DataTypes.FLOAT,
        revenue_3: DataTypes.FLOAT
    }, {
        tableName: 'mis_fertilizer_data',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISFertilizerData.associate = (models) => {
        MISFertilizerData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISFertilizerData;
};
