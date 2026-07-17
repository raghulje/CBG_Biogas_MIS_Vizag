const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISPlantAvailability = sequelize.define('MISPlantAvailability', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        working_hours: DataTypes.FLOAT,
        scheduled_downtime: DataTypes.FLOAT,
        unscheduled_downtime: DataTypes.FLOAT,
        total_availability: DataTypes.FLOAT
    }, {
        tableName: 'mis_plant_availability',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISPlantAvailability.associate = (models) => {
        MISPlantAvailability.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISPlantAvailability;
};
