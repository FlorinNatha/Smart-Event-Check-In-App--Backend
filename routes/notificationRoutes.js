const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getUserNotifications, 
    markAsRead, 
    clearAll 
} = require('../controllers/notificationController');

// All notification routes are private
router.get('/', protect, getUserNotifications);
router.patch('/:id/read', protect, markAsRead);
router.delete('/', protect, clearAll);

module.exports = router;

