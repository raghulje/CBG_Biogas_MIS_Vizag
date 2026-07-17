const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Customer = sequelize.define('Customer', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Type of customer (e.g., Industrial, Commercial, Residential)'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        gst_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pan_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'customers',
        underscored: true,
        paranoid: true, // Soft delete
        timestamps: true
    });

    return Customer;
};
