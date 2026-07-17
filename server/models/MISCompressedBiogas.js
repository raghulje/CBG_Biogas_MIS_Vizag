const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISCompressedBiogas = sequelize.define('MISCompressedBiogas', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        produced: DataTypes.FLOAT,
        ch4: DataTypes.FLOAT,
        co2: DataTypes.FLOAT,
        h2s: DataTypes.FLOAT,
        o2: DataTypes.FLOAT,
        n2: DataTypes.FLOAT,
        conversion_ratio: DataTypes.FLOAT,
        ch4_slippage: DataTypes.FLOAT,
        cbg_stock: DataTypes.FLOAT,
        cbg_sold: DataTypes.FLOAT
    }, {
        tableName: 'mis_compressed_biogas',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISCompressedBiogas.associate = (models) => {
        MISCompressedBiogas.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISCompressedBiogas;
};
