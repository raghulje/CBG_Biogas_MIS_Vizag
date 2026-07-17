const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/', permissionMiddleware('customer', 'create'), customerController.createCustomer);
router.get('/', permissionMiddleware('customer', 'read'), customerController.getCustomers);
router.get('/:id', permissionMiddleware('customer', 'read'), customerController.getCustomerById);
router.put('/:id', permissionMiddleware('customer', 'update'), customerController.updateCustomer);
router.delete('/:id', permissionMiddleware('customer', 'delete'), customerController.deleteCustomer);

module.exports = router;
