const express = require('express');
const router = express.Router();
const misController = require('../controllers/misController');
const misExtensions = require('../controllers/misControllerExtensions');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024, // 10 MB default
    files: 1
  }
});

// Middleware applied to all MIS routes
router.use(authMiddleware);

// Daily Entries - CRUD (static paths BEFORE /:id so they are not matched as id)
router.post('/mis-entries', permissionMiddleware('mis_entry', 'create'), misController.createEntry);
router.get('/mis-entries/consolidated', permissionMiddleware('mis_entry', 'read'), misExtensions.getConsolidatedData);
router.get('/mis-entries/for-report', permissionMiddleware('mis_entry', 'read'), misController.getEntriesForReport);
router.get('/mis-entries/import-template', permissionMiddleware('mis_entry', 'read'), misExtensions.getImportTemplate);
router.post('/mis-entries/import', permissionMiddleware('mis_entry', 'import'), upload.single('file'), misExtensions.importEntries);
router.get('/mis-entries/export', permissionMiddleware('mis_entry', 'read'), misExtensions.exportEntries);
router.get('/mis-entries', permissionMiddleware('mis_entry', 'read'), misController.getEntries);
router.get('/mis-entries/:id/final-report', permissionMiddleware('mis_entry', 'read'), misExtensions.downloadEntryFinalMisReport);
router.get('/mis-entries/:id', permissionMiddleware('mis_entry', 'read'), misController.getEntryById);
router.put('/mis-entries/:id', permissionMiddleware('mis_entry', 'update'), misExtensions.updateEntry);
router.delete('/mis-entries/:id', permissionMiddleware('mis_entry', 'delete'), misExtensions.deleteEntry);
// Hard delete (permanent) - admin only (controller will enforce role check)
router.delete('/mis-entries/:id/hard', permissionMiddleware('mis_entry', 'delete'), misExtensions.hardDeleteEntry);

// Workflow
router.post('/mis-entries/:id/submit', permissionMiddleware('mis_entry', 'submit'), misController.submitEntry);
router.post('/mis-entries/:id/review', permissionMiddleware('mis_entry', 'approve'), misController.reviewEntry);
router.post('/mis-entries/:id/approve', permissionMiddleware('mis_entry', 'approve'), misController.approveEntry);
router.post('/mis-entries/:id/reject', permissionMiddleware('mis_entry', 'approve'), misController.rejectEntry);

// Dashboard
router.get('/dashboard/daily', misExtensions.getDashboardData);
router.get('/dashboard/cbg-sales', misExtensions.getCBGSalesBreakdown);

module.exports = router;
