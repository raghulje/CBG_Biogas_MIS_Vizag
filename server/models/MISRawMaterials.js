const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISRawMaterials = sequelize.define('MISRawMaterials', {
        entry_id: { type: DataTypes.INTEGER, allowNull: false },
        cow_dung_purchased: DataTypes.FLOAT,
        cow_dung_stock: DataTypes.FLOAT,
        old_press_mud_opening_balance: DataTypes.FLOAT,
        old_press_mud_purchased: DataTypes.FLOAT,
        old_press_mud_degradation_loss: DataTypes.FLOAT,
        old_press_mud_closing_stock: DataTypes.FLOAT,
        new_press_mud_purchased: DataTypes.FLOAT,
        press_mud_used: DataTypes.FLOAT,
        total_press_mud_stock: DataTypes.FLOAT,
        audit_note: DataTypes.TEXT
    }, {
        tableName: 'mis_raw_materials',
        underscored: true,
        indexes: [{ fields: ['entry_id'] }]
    });

    MISRawMaterials.associate = (models) => {
        MISRawMaterials.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', onDelete: 'CASCADE' });
    };

    return MISRawMaterials;
};
