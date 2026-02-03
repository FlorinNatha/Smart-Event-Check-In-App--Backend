
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getDashboardStats,
    getEventStats,
    getEventRegistrations
} = require('../controllers/eventController');
const { registerForEvent } = require('../controllers/registrationController');

router.get('/', getEvents);
router.post('/', protect, admin, createEvent);

// Admin Stats Routes (Must be before /:id)
router.get('/admin/stats', protect, admin, getDashboardStats);

router.get('/:id', getEventById);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

// Attendee Routes
router.post('/:id/register', protect, registerForEvent);

router.get('/:id/stats', protect, admin, getEventStats);
router.get('/:id/registrations', protect, admin, getEventRegistrations);

module.exports = router;
