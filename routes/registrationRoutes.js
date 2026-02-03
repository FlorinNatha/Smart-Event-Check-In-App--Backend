const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerForEvent,
    getMyRegistrations,
    getTicketById,
    cancelRegistration,
    validateTicket,
    getStaffScanHistory
} = require('../controllers/registrationController');

router.post('/validate', protect, validateTicket);
router.get('/staff/history', protect, getStaffScanHistory);
router.post('/:eventId', protect, registerForEvent);
router.get('/my-tickets', protect, getMyRegistrations);
router.get('/:id', protect, getTicketById);
router.delete('/:id', protect, cancelRegistration);

module.exports = router;
