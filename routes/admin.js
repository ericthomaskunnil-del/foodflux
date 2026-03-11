/**
 * Admin Routes
 * Dashboard, user/listing management, analytics
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// All admin routes require admin role
router.get('/', isAdmin, adminController.getDashboard);
router.post('/approve/:id', isAdmin, adminController.approveListing);
router.post('/listing/delete/:id', isAdmin, adminController.deleteListing);
router.post('/user/delete/:id', isAdmin, adminController.deleteUser);
router.get('/analytics', isAdmin, adminController.getAnalytics);
router.post('/verify-volunteer/:userId', isAdmin, adminController.reviewVerification);

module.exports = router;
