require('dotenv').config();
const { EmailScheduler, EmailTemplate, Role, MISEmailConfig, sequelize } = require('../models');
const migrationRunner = require('../services/migrationRunner');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        // Run pending migrations instead of sync in production
        await migrationRunner.runPendingMigrations();
        console.log('Migrations checked/applied (if any).');

        // 1. Ensure Roles
        const [siteUserRole] = await Role.findOrCreate({ where: { name: 'Site User' } });
        console.log('Role "Site User" ensured.');

        // 2. Ensure Email Templates
        await EmailTemplate.findOrCreate({
            where: { name: 'mis_not_created' },
            defaults: {
                subject: 'MIS Entry Missing for {{date}}',
                body: '<p>Hello,</p><p>The MIS entry for {{date}} has NOT been created yet. Please create it immediately.</p>'
            }
        });
        await EmailTemplate.findOrCreate({
            where: { name: 'mis_not_submitted' },
            defaults: {
                subject: 'MIS Entry Pending Submission for {{date}}',
                body: '<p>Hello,</p><p>The MIS entry for {{date}} is created but NOT submitted. Please submit it immediately.</p>'
            }
        });
        await EmailTemplate.findOrCreate({
            where: { name: 'mis_escalation' },
            defaults: {
                subject: 'ESCALATION: MIS Entry Overdue for {{date}}',
                body: '<p>Hello Manager,</p><p>The MIS entry for {{date}} has not been submitted by the deadline. Please investigate.</p>'
            }
        });
        console.log('Email Templates ensured.');

        // 3. Ensure Email Schedulers
        // 16:45 (4:45 PM)
        await EmailScheduler.findOrCreate({
            where: { name: 'MIS Entry Creation Check' },
            defaults: {
                cron_expression: '45 16 * * *',
                is_active: true,
                job_type: 'mis_creation_check'
            }
        });
        // 17:30 (5:30 PM)
        await EmailScheduler.findOrCreate({
            where: { name: 'MIS Escalation Check' },
            defaults: {
                cron_expression: '30 17 * * *',
                is_active: true,
                job_type: 'mis_escalation_check'
            }
        });
        console.log('Email Schedulers ensured.');

        // 4. Ensure MISEmailConfig exists
        await MISEmailConfig.findOrCreate({ where: { id: 1 }, defaults: {} });
        console.log('MISEmailConfig ensured.');

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
