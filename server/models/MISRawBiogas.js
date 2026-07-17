const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISRawBiogas = sequelize.define('MISRawBiogas', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        digester_01_gas: DataTypes.FLOAT,
        digester_02_gas: DataTypes.FLOAT,
        digester_03_gas: DataTypes.FLOAT,
        total_raw_biogas: DataTypes.FLOAT,
        rbg_flared: DataTypes.FLOAT,
        gas_yield: DataTypes.FLOAT
    }, {
        tableName: 'mis_raw_biogas',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISRawBiogas.associate = (models) => {
        MISRawBiogas.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISRawBiogas;
};
