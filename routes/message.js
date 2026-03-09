/**
 * Message Routes
 * APIs and Views for real-time polling chat system
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isAuthenticated } = require('../middleware/auth');

// Note: Ensure users are authenticated for all message routes
router.use(isAuthenticated);

// Render main UI
router.get('/', messageController.getMessagesPage);

// API Endpoints
router.get('/api/threads', messageController.getThreads);
router.get('/api/thread/:userId', messageController.getMessages);
router.post('/api/send', messageController.sendMessage);

module.exports = router;
