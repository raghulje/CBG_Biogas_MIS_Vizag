const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const misRoutes = require('./misRoutes');
const adminRoutes = require('./adminRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const adminController = require('../controllers/adminController');
const misControllerExtensions = require('../controllers/misControllerExtensions');
const appController = require('../controllers/appController');

// Health check endpoint for Docker/monitoring
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'BioGas MIS API'
    });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/customers', require('./customerRoutes'));

// Public app config (theme) - used on app load
router.get('/app-config/theme', appController.getTheme);

// MIS export & import-template at top level so they are never matched as /mis-entries/:id
router.get('/mis-entries/export', authMiddleware, permissionMiddleware('mis_entry', 'read'), misControllerExtensions.exportEntries);
router.get('/mis-entries/import-template', authMiddleware, permissionMiddleware('mis_entry', 'read'), misControllerExtensions.getImportTemplate);

router.use('/', misRoutes);

// Single form-config endpoint (roles, permissions, smtp, schedulers) - uses Promise.all
router.get('/mis/form-config', authMiddleware, permissionMiddleware('config', 'read'), adminController.getFormConfig);

// Import template (legacy path) - downloadable Excel (GET /api/mis/import-template)
router.get('/mis/import-template', authMiddleware, permissionMiddleware('mis_entry', 'read'), misControllerExtensions.getImportTemplate);

// Sync routes
router.get('/sync/preview', (req, res) => res.json({ message: 'Sync Preview' }));
router.post('/sync/confirm', (req, res) => res.json({ message: 'Sync Confirmed' }));

module.exports = router;
