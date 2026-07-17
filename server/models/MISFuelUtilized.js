const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MISFuelUtilized = sequelize.define('MISFuelUtilized', {
        entry_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mis_daily_entries',
                key: 'id'
            }
        },
        fuel_type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Petrol or Diesel'
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
        tableName: 'mis_fuel_utilized',
        underscored: true,
        timestamps: true
    });

    MISFuelUtilized.associate = (models) => {
        MISFuelUtilized.belongsTo(models.MISDailyEntry, { foreignKey: 'entry_id', as: 'dailyEntry' });
        MISFuelUtilized.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    };

    return MISFuelUtilized;
};
