const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const emailTemplateController = require('../controllers/emailTemplateController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

router.use(authMiddleware);

// User Management
router.get('/users', permissionMiddleware('user', 'read'), adminController.getAllUsers);
router.post('/users', permissionMiddleware('user', 'create'), userController.createUser);
router.get('/users/:id', permissionMiddleware('user', 'read'), userController.getUserById);
router.put('/users/:id', permissionMiddleware('user', 'update'), userController.updateUser);
router.delete('/users/:id', permissionMiddleware('user', 'delete'), userController.deleteUser);
router.post('/users/:id/activate', permissionMiddleware('user', 'update'), userController.activateUser);
router.post('/users/:id/change-password', permissionMiddleware('user', 'update'), userController.changeUserPassword);
router.post('/users/bulk-update', permissionMiddleware('user', 'update'), userController.bulkUpdateUsers);
router.get('/users/:id/activity-logs', permissionMiddleware('user', 'read'), userController.getUserActivityLogs);

// Role Management - DISABLED
// Role-based permissions are deprecated in favor of user-level permissions only.
// The following routes are intentionally disabled to enforce user-based permission model.
/*
router.get('/roles', permissionMiddleware('role', 'read'), adminController.getRoles);
router.post('/roles', permissionMiddleware('role', 'create'), adminController.createRole);
router.post('/roles/assign-permissions', permissionMiddleware('role', 'update'), adminController.assignPermissions);
router.put('/roles/:id/permissions', permissionMiddleware('role', 'update'), adminController.updateRolePermissions);
*/

// SMTP Configuration
router.get('/smtp-config', permissionMiddleware('config', 'read'), adminController.getSMTPConfig);
router.post('/smtp-config', permissionMiddleware('config', 'update'), adminController.createSMTPConfig);
router.put('/smtp-config/:id', permissionMiddleware('config', 'update'), adminController.updateSMTPConfig);
router.post('/smtp-config/test', permissionMiddleware('config', 'update'), adminController.testSMTPConfig);

// MIS Entry email recipients (submit + no-entry reminder)
router.get('/mis-email-config', permissionMiddleware('config', 'read'), adminController.getMISEmailConfig);
router.put('/mis-email-config', permissionMiddleware('config', 'update'), adminController.saveMISEmailConfig);

// Final MIS Report email (recipients, subject, body, schedule)
router.get('/final-mis-report-config', permissionMiddleware('config', 'read'), adminController.getFinalMISReportConfig);
router.put('/final-mis-report-config', permissionMiddleware('config', 'update'), adminController.saveFinalMISReportConfig);
router.post('/final-mis-report-config/send-test', permissionMiddleware('config', 'update'), adminController.sendTestFinalMISReport);

// App config (theme) - admin update
router.put('/app-config/theme', permissionMiddleware('config', 'update'), adminController.saveAppTheme);

// Email Schedulers
router.get('/schedulers', permissionMiddleware('config', 'read'), adminController.getSchedulers);
router.post('/schedulers', permissionMiddleware('config', 'create'), adminController.createScheduler);
router.put('/schedulers/:id', permissionMiddleware('config', 'update'), adminController.updateScheduler);

// Notification Schedule (MIS filling window + reminders)
router.get('/notification-schedule', permissionMiddleware('config', 'read'), adminController.getNotificationSchedule);
router.put('/notification-schedule', permissionMiddleware('config', 'update'), adminController.saveNotificationSchedule);

// Multi-schedule CRUD
router.get('/notification-schedules', permissionMiddleware('config', 'read'), adminController.getNotificationSchedulesList);
router.post('/notification-schedules', permissionMiddleware('config', 'create'), adminController.createNotificationSchedule);
router.put('/notification-schedules/:id', permissionMiddleware('config', 'update'), adminController.updateNotificationScheduleById);
router.delete('/notification-schedules/:id', permissionMiddleware('config', 'delete'), adminController.deleteNotificationScheduleById);

// Email Templates
router.get('/email-templates', permissionMiddleware('config', 'read'), emailTemplateController.getTemplates);
router.get('/email-templates/:id', permissionMiddleware('config', 'read'), emailTemplateController.getTemplateById);
router.post('/email-templates', permissionMiddleware('config', 'create'), emailTemplateController.createTemplate);
router.put('/email-templates/:id', permissionMiddleware('config', 'update'), emailTemplateController.updateTemplate);
router.delete('/email-templates/:id', permissionMiddleware('config', 'delete'), emailTemplateController.deleteTemplate);
router.post('/email-templates/test', permissionMiddleware('config', 'update'), emailTemplateController.testEmail);
router.post('/email-templates/:id/preview', permissionMiddleware('config', 'read'), emailTemplateController.previewTemplate);
router.get('/email-templates/:id/variables', permissionMiddleware('config', 'read'), emailTemplateController.getTemplateVariables);

// Audit Logs & Sessions
router.get('/audit-logs', permissionMiddleware('audit', 'read'), adminController.getAuditLogs);
router.get('/sessions', permissionMiddleware('audit', 'read'), adminController.getSessions);

// Outbound email delivery logs (SMTP)
router.get('/email-logs', permissionMiddleware('config', 'read'), adminController.getEmailLogs);

module.exports = router;
