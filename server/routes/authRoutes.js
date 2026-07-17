const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/create-user', authMiddleware, authController.createUser); // Admin/Manager can create
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
