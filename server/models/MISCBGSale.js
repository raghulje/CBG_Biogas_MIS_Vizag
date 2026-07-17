const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISCBGSale = sequelize.define('MISCBGSale', {
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'customers',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'mis_cbg_sales',
        underscored: true,
        timestamps: true
    });

    MISCBGSale.associate = (models) => {
        MISCBGSale.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', as: 'dailyEntry' });
        MISCBGSale.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    };

    return MISCBGSale;
};
