'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class EmailTemplate extends Model {
        static associate(models) { }
    }
    EmailTemplate.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        body: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Supports variables {{user_name}}, {{entry_date}}, etc.'
        }
    }, {
        sequelize,
        modelName: 'EmailTemplate',
        tableName: 'email_templates',
        underscored: true,
        indexes: [
            { name: 'ux_email_templates_name', unique: true, fields: ['name'] }
        ]
    });
    return EmailTemplate;
};
