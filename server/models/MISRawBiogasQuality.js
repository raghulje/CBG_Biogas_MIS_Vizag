const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISRawBiogasQuality = sequelize.define('MISRawBiogasQuality', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        ch4: DataTypes.FLOAT,
        co2: DataTypes.FLOAT,
        h2s: DataTypes.FLOAT,
        o2: DataTypes.FLOAT,
        n2: DataTypes.FLOAT
    }, { tableName: 'mis_raw_biogas_quality', underscored: true });

    MISRawBiogasQuality.associate = (models) => {
        MISRawBiogasQuality.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISRawBiogasQuality;
};
