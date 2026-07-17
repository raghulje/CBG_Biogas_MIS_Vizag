const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISCompressors = sequelize.define('MISCompressors', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        compressor_1_hours: DataTypes.FLOAT,
        compressor_2_hours: DataTypes.FLOAT,
        total_hours: DataTypes.FLOAT
    }, { tableName: 'mis_compressors', underscored: true });

    MISCompressors.associate = (models) => {
        MISCompressors.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISCompressors;
};
