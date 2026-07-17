const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISHSEData = sequelize.define('MISHSEData', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        safety_lti: DataTypes.INTEGER,
        near_misses: DataTypes.INTEGER,
        first_aid: DataTypes.INTEGER,
        reportable_incidents: DataTypes.INTEGER,
        mti: DataTypes.INTEGER,
        other_incidents: DataTypes.INTEGER,
        fatalities: DataTypes.INTEGER
    }, {
        tableName: 'mis_hse_data',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISHSEData.associate = (models) => {
        MISHSEData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISHSEData;
};
