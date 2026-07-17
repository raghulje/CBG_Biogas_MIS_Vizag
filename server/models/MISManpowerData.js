const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISManpowerData = sequelize.define('MISManpowerData', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        refex_srel_staff: DataTypes.INTEGER,
        third_party_staff: DataTypes.INTEGER
    }, { tableName: 'mis_manpower_data', underscored: true });

    MISManpowerData.associate = (models) => {
        MISManpowerData.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISManpowerData;
};
