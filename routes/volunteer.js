/**
 * Volunteer Routes
 * Dashboard, accept pickups, mark collected
 */

const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { isVolunteer } = require('../middleware/auth');

// All volunteer routes require volunteer role
router.get('/', isVolunteer, volunteerController.getDashboard);
router.get('/directory', isVolunteer, volunteerController.getDirectory);
router.post('/accept/:id', isVolunteer, volunteerController.acceptPickup);
router.post('/collect/:id', isVolunteer, volunteerController.markCollected);

// Rating routes
router.get('/rate/:transactionId', isVolunteer, volunteerController.showRateDonor);
router.post('/rate/:transactionId', isVolunteer, volunteerController.submitRating);


module.exports = router;
