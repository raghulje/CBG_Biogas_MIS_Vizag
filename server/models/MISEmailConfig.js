'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class MISEmailConfig extends Model {
        static associate(models) { }
    }
    MISEmailConfig.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // JSON array of emails to notify when an MIS entry is submitted
        submit_notify_emails: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of email addresses'
        },
        // JSON array of emails to notify when no entry is created for the day (scheduled check)
        entry_not_created_emails: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of email addresses'
        },
        // JSON array of emails to notify when entry exists but not submitted (scheduled check)
        not_submitted_notify_emails: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of email addresses'
        },
        // JSON array of emails to notify when entry is missing or not submitted at escalation time
        escalation_notify_emails: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON array of email addresses'
        }
    }, {
        sequelize,
        modelName: 'MISEmailConfig',
        tableName: 'mis_email_config',
        underscored: true,
        timestamps: false
    });
    return MISEmailConfig;
};
