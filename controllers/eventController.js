
const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin only - TODO: Add Auth Middleware)
exports.createEvent = async (req, res) => {
    try {
        const { name, description, location, date, capacity, imageUrl, startTime, endTime } = req.body;

        // TODO: Get user ID from JWT token (req.user.id)
        // For now, passing organizerId in body for testing or default
        const organizer = req.body.organizer || '000000000000000000000000'; // Placeholder

        const event = await Event.create({
            name,
            description,
            location,
            date,
            capacity,
            imageUrl,
            startTime,
            endTime,
            organizer,
            status: 'upcoming'
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
