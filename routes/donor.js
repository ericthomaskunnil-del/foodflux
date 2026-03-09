/**
 * Donor Routes
 * Dashboard, CRUD food listings
 */

const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { isDonor } = require('../middleware/auth');

// All donor routes require donor role
router.get('/', isDonor, donorController.getDashboard);
router.get('/add', isDonor, donorController.getAddListing);
router.post('/add', isDonor, donorController.postAddListing);
router.get('/edit/:id', isDonor, donorController.getEditListing);
router.post('/edit/:id', isDonor, donorController.postEditListing);
router.post('/delete/:id', isDonor, donorController.deleteListing);

module.exports = router;
